import { NextRequest, NextResponse } from 'next/server';
import { generateText, parseJSON } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/sentences
 * Body: { topicId?: string, topicName?: string, level: 'easy'|'medium'|'hard', count: number }
 * Generates English sentences built from the learner's own vocabulary,
 * each with a reference Palestinian Arabic translation.
 */

const LEVELS = {
  easy: 'Short sentences (4-7 words), present tense, simple structures like "I want…", "Where is…", "This is…".',
  medium:
    'Medium sentences (7-12 words): past and future tense, comparatives (أَكبَر مِن…), possessives, questions.',
  hard:
    'Longer sentences (12-18 words): connectors like قَبِل مَا / بَعد مَا / زَي مَا / عَشَان, relative clauses with اللِي, negation, mixed tenses.',
} as const;

export async function POST(req: NextRequest) {
  try {
    const { topicId, topicName, level = 'easy', count = 5 } = await req.json();
    const n = Math.min(Math.max(Number(count) || 5, 1), 10);
    const admin = supabaseAdmin();

    // Pull a varied sample of the learner's vocabulary
    let pool: { arabic: string; english: string }[] = [];
    if (topicId) {
      const { data } = await admin
        .from('entries')
        .select('arabic, english')
        .eq('topic_id', topicId)
        .eq('uncertain', false)
        .limit(400);
      pool = data || [];
    } else {
      const { count: total } = await admin.from('entries').select('id', { count: 'exact', head: true });
      const offset = Math.floor(Math.random() * Math.max(1, (total || 0) - 300));
      const { data } = await admin
        .from('entries')
        .select('arabic, english')
        .eq('uncertain', false)
        .range(offset, offset + 299);
      pool = data || [];
    }
    const sample = pool
      .filter((e) => e.arabic.length < 30 && e.english.length < 40)
      .sort(() => Math.random() - 0.5)
      .slice(0, 30);

    if (sample.length < 3) {
      return NextResponse.json({ error: 'Not enough vocabulary in this topic yet.' }, { status: 400 });
    }

    const system = `You create translation exercises for a learner of Palestinian Arabic (Jerusalem / Bethlehem / West Bank dialect) who studies with Basil Zboun's "Arabic Made Easy" method.

Write ${n} natural English sentences for the learner to translate into Palestinian Arabic.
- Each sentence must use 1 to 3 words from the learner's vocabulary list below.
- Level: ${LEVELS[level as keyof typeof LEVELS] || LEVELS.easy}
- Make the sentences feel like real life in Palestine: family, the market, Jerusalem, Bethlehem, work, food, the news${topicName ? `, with a focus on the topic "${topicName}"` : ''}.
- Vary the subjects (I, you m/f, he, she, we, they) so the learner practises conjugation.
- The reference translation must be colloquial Palestinian (not MSA), with full tashkeel.

Learner's vocabulary: ${sample.map((e) => `${e.arabic} = ${e.english}`).join('; ')}

Reply with ONLY this JSON:
{
  "sentences": [
    {
      "english": "the sentence to translate",
      "arabic": "Palestinian Arabic translation with tashkeel",
      "transliteration": "Latin-letter pronunciation",
      "words_used": [{ "arabic": "...", "english": "..." }],
      "grammar_note": "one short line about the grammar point this sentence practises"
    }
  ]
}`;

    const text = await generateText({
      system,
      messages: [{ role: 'user', content: `Generate ${n} sentences.` }],
      tier: 'smart',
      maxTokens: 3000,
      json: true,
    });
    const parsed = parseJSON<{ sentences: any[] }>(text);
    if (!parsed?.sentences?.length) {
      return NextResponse.json({ error: 'Could not generate sentences, try again.' }, { status: 500 });
    }
    return NextResponse.json({ sentences: parsed.sentences.slice(0, n) });
  } catch (err: any) {
    console.error('sentences error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
