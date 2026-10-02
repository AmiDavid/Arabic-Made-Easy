import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, type ChatTurn } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/chat
 * Body: {
 *   messages: [{ role, content }],
 *   conversationId?: string,   // current conversation (excluded from memory)
 *   topicId?: string,          // optional conversation topic
 *   topicName?: string
 * }
 * Returns: { arabic, english, corrections: [...], new_words: [...] }
 */

type Correction = { wrong: string; right: string; explanation: string };
type NewWord = { arabic: string; english: string };

const BASE_SYSTEM = `You are a warm, patient teacher of Palestinian Arabic (Jerusalem / Bethlehem / West Bank dialect), having a spoken conversation with a learner. The learner studies with the "Arabic Made Easy" method by Basil Zboun.

How to talk:
- Reply ONLY in Palestinian colloquial Arabic (not MSA/Fusha). Everyday spoken words: هَلَّأ، شُو، كِيف، بِدِّي، مِنِيح، كَتِير، عَشَان، لِسَّا.
- 1 to 3 short sentences. This is a conversation, not a lecture. End with a question most of the time, to keep it going.
- Put full tashkeel on every word so the learner can pronounce it.
- If the learner speaks English, understand it, and answer in Palestinian Arabic anyway.
- Prefer words from the learner's notebook (listed below) so they practise what they know, and introduce at most 1-2 new words per reply.
- Be warm and encouraging.

Correcting mistakes:
- Look only at the learner's LAST message. If it has a grammar, vocabulary or dialect mistake (including MSA where Palestinian is expected), add an item to "corrections": what they said, the correct Palestinian form, and a one-line English explanation.
- Don't correct speech-recognition noise or tiny spelling variations. If there are no real mistakes, return an empty list.

Answer through the respond tool:
- arabic: your reply in Palestinian Arabic with tashkeel
- english: literal English translation of your reply
- corrections: mistakes in the learner's last message (empty list if none)
- new_words: words in YOUR reply the learner probably doesn't know yet (max 3, empty list if none). Write each word the way the learner's notebook does, with both forms separated by "، ": nouns as singular، plural (بَيت، بُيُوت), verbs as past، present (حَكَى، بِيحكِي), and English for verbs starting with "to".`;

const SCHEMA = {
  type: 'object',
  properties: {
    arabic: { type: 'string' },
    english: { type: 'string' },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          wrong: { type: 'string' },
          right: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['wrong', 'right', 'explanation'],
      },
    },
    new_words: {
      type: 'array',
      items: {
        type: 'object',
        properties: { arabic: { type: 'string' }, english: { type: 'string' } },
        required: ['arabic', 'english'],
      },
    },
  },
  required: ['arabic', 'english', 'corrections', 'new_words'],
};

export const maxDuration = 60;

async function buildContext(conversationId?: string, topicId?: string, topicName?: string) {
  const admin = supabaseAdmin();
  const parts: string[] = [];

  // 1. Memory: the last few previous conversations
  try {
    let q = admin
      .from('conversations')
      .select('id, messages, updated_at')
      .order('updated_at', { ascending: false })
      .limit(4);
    const { data } = await q;
    const previous = (data || []).filter((c: any) => c.id !== conversationId).slice(0, 3);
    if (previous.length) {
      const lines: string[] = [];
      for (const c of previous) {
        const msgs = (c.messages || []).slice(-8);
        const date = new Date(c.updated_at).toLocaleDateString('en-GB');
        lines.push(`— Session on ${date}:`);
        for (const m of msgs) {
          lines.push(`  ${m.role === 'user' ? 'Learner' : 'You'}: ${m.ar}`);
          for (const corr of m.corrections || []) {
            lines.push(`    (corrected: "${corr.wrong}" → "${corr.right}")`);
          }
        }
      }
      parts.push(
        `Earlier sessions with this learner (use them for continuity: refer back to topics they mentioned, and re-use words they got wrong before so they practise them):\n${lines.join('\n')}`
      );
    }
  } catch {
    /* memory is best-effort */
  }

  // 2. The learner's notebook vocabulary (topic-specific if a topic was chosen)
  try {
    let q = admin.from('entries').select('arabic, english').eq('uncertain', false);
    if (topicId) q = q.eq('topic_id', topicId);
    const { count } = await admin.from('entries').select('id', { count: 'exact', head: true });
    const offset = topicId ? 0 : Math.max(0, Math.floor(Math.random() * Math.max(0, (count || 0) - 60)));
    const { data } = await q.range(offset, offset + 59);
    if (data?.length) {
      const sample = data
        .sort(() => Math.random() - 0.5)
        .slice(0, 40)
        .map((e: any) => `${e.arabic} = ${e.english}`)
        .join('; ');
      parts.push(`Words from the learner's notebook: ${sample}`);
    }
  } catch {
    /* best-effort */
  }

  if (topicName) {
    parts.push(
      `Conversation topic chosen by the learner: ${topicName}. Steer the conversation toward this topic and use its vocabulary.`
    );
  }

  return parts.join('\n\n');
}

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId, topicId, topicName } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const context = await buildContext(conversationId, topicId, topicName);
    const system = context ? `${BASE_SYSTEM}\n\n${context}` : BASE_SYSTEM;

    const turns: ChatTurn[] = messages.map((m: any) => ({
      role: m.role,
      content: m.content_ar || m.content || '',
    }));

    const { data: parsed, raw } = await generateJSON<{
      arabic?: string;
      english?: string;
      corrections?: Correction[];
      new_words?: NewWord[];
    }>({ system, messages: turns, schema: SCHEMA, tier: 'fast', maxTokens: 900 });

    if (!parsed?.arabic) {
      console.error('chat: no structured reply', raw);
      return NextResponse.json({ error: 'The teacher did not answer properly, please say that again.' }, { status: 502 });
    }

    return NextResponse.json({
      arabic: parsed.arabic,
      english: parsed.english || '',
      corrections: Array.isArray(parsed.corrections) ? parsed.corrections.filter((c) => c?.right) : [],
      new_words: Array.isArray(parsed.new_words) ? parsed.new_words.filter((w) => w?.arabic) : [],
    });
  } catch (err: any) {
    console.error('chat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
