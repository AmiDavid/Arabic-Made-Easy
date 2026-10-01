import { generateJSON } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabase';

export type Level = 'easy' | 'medium' | 'hard';

const LEVELS: Record<Level, string> = {
  easy: 'Short sentences (4-7 words), present tense, simple structures like "I want…", "Where is…", "This is…".',
  medium:
    'Medium sentences (7-12 words): past and future tense, comparatives (أَكبَر مِن…), possessives, questions.',
  hard:
    'Longer sentences (12-18 words): connectors like قَبِل مَا / بَعد مَا / زَي مَا / عَشَان, relative clauses with اللِي, negation, mixed tenses.',
};

const SCHEMA = {
  type: 'object',
  properties: {
    sentences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          english: { type: 'string' },
          arabic: { type: 'string' },
          transliteration: { type: 'string' },
          words_used: {
            type: 'array',
            items: {
              type: 'object',
              properties: { arabic: { type: 'string' }, english: { type: 'string' } },
              required: ['arabic', 'english'],
            },
          },
          grammar_note: { type: 'string' },
        },
        required: ['english', 'arabic', 'transliteration', 'words_used', 'grammar_note'],
      },
    },
  },
  required: ['sentences'],
};

export class SentenceError extends Error {
  constructor(message: string, public debug?: string, public status = 502) {
    super(message);
  }
}

export async function generateSentences(opts: {
  topicId?: string;
  topicName?: string;
  level?: Level;
  count?: number;
}) {
  const level: Level = opts.level && LEVELS[opts.level] ? opts.level : 'easy';
  const n = Math.min(Math.max(Number(opts.count) || 5, 1), 10);
  const admin = supabaseAdmin();

  // A varied sample of the learner's vocabulary
  let pool: { arabic: string; english: string }[] = [];
  if (opts.topicId) {
    const { data } = await admin
      .from('entries')
      .select('arabic, english')
      .eq('topic_id', opts.topicId)
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
      .order('id')
      .range(offset, offset + 299);
    pool = data || [];
  }
  const sample = pool
    .filter((e) => e.arabic.length < 30 && e.english.length < 40)
    .sort(() => Math.random() - 0.5)
    .slice(0, 30);

  if (sample.length < 3) {
    throw new SentenceError('Not enough vocabulary in this topic yet.', undefined, 400);
  }

  const system = `You create translation exercises for a learner of Palestinian Arabic (Jerusalem / Bethlehem / West Bank dialect) who studies with Basil Zboun's "Arabic Made Easy" method.

Write ${n} natural English sentences for the learner to translate into Palestinian Arabic.
- Each sentence must use 1 to 3 words from the learner's vocabulary list below.
- Level: ${LEVELS[level]}
- Make the sentences feel like real life in Palestine: family, the market, Jerusalem, Bethlehem, work, food, the news${opts.topicName ? `, with a focus on the topic "${opts.topicName}"` : ''}.
- Vary the subjects (I, you m/f, he, she, we, they) so the learner practises conjugation.
- The reference translation must be colloquial Palestinian (not MSA), with full tashkeel.

Learner's vocabulary: ${sample.map((e) => `${e.arabic} = ${e.english}`).join('; ')}

Return the sentences through the respond tool. For each sentence give: english (the sentence to translate), arabic (Palestinian translation with tashkeel), transliteration (Latin-letter pronunciation), words_used (the vocabulary words it uses), grammar_note (one short line about the grammar it practises).`;

  const { data, raw, model } = await generateJSON<{ sentences: any[] }>({
    system,
    messages: [{ role: 'user', content: `Generate ${n} sentences.` }],
    schema: SCHEMA,
    tier: 'smart',
    maxTokens: 4000,
  });
  const sentences = (data?.sentences || []).filter((s: any) => s?.english && s?.arabic);
  if (!sentences.length) {
    throw new SentenceError('Could not generate sentences, try again.', raw.slice(0, 300));
  }
  return { sentences: sentences.slice(0, n), model };
}
