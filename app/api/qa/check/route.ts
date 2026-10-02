import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';

export const maxDuration = 60;

/**
 * POST /api/qa/check  { topicName?, entries: [{ id, arabic, english }] }
 * An AI "second pair of eyes" over a batch of notebook words. Returns only
 * likely mistakes, each with a proposed fix the learner can accept or ignore.
 */

const SYSTEM = `You are a Palestinian Arabic teacher (Jerusalem / Bethlehem) proof-reading a learner's vocabulary list.
The list was typed from a handwritten notebook written in class with teacher Basil Zboun, so most of it is right.
Typical format: "singular، plural" for nouns ("بَيت، بُيُوت", or a short ending "كَاسَة، ات"), "past، present" for verbs ("طَلَب، بُطلُب"). "/" separates alternatives. "[?]" in English means the reading was unclear.

Find ONLY real problems:
- a misread or mistyped letter (the Arabic isn't a real word, or doesn't match the English)
- a wrong or misleading English translation
- a wrong plural or present form
- clearly wrong tashkeel that changes the word
Do NOT flag: Palestinian/colloquial words or spellings (they are intended, not MSA mistakes), missing tashkeel, shorthand endings like ات, style, or English wording you'd merely phrase differently.

For each problem return: id, problem (one short sentence in English), fixed_arabic (the whole corrected Arabic, same format), fixed_english (the whole corrected English, or the original if it was fine), confidence ("high" or "medium").
Return an empty list if everything looks right. At most 15 findings.`;

const SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          problem: { type: 'string' },
          fixed_arabic: { type: 'string' },
          fixed_english: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium'] },
        },
        required: ['id', 'problem', 'fixed_arabic', 'fixed_english', 'confidence'],
      },
    },
  },
  required: ['findings'],
};

export async function POST(req: NextRequest) {
  try {
    const { entries, topicName } = await req.json();
    if (!Array.isArray(entries) || !entries.length) {
      return NextResponse.json({ error: 'entries required' }, { status: 400 });
    }
    const batch = entries.slice(0, 60);
    const list = batch.map((e: any) => `${e.id} | ${e.arabic} | ${e.english}`).join('\n');
    const { data } = await generateJSON<{ findings: any[] }>({
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Topic: ${topicName || 'mixed'}\nEach line: id | Arabic | English\n\n${list}`,
        },
      ],
      schema: SCHEMA,
      tier: 'smart',
      maxTokens: 3000,
    });
    const ids = new Set(batch.map((e: any) => String(e.id)));
    const findings = (data?.findings || []).filter((f) => f && ids.has(String(f.id)));
    return NextResponse.json({ findings, checked: batch.length });
  } catch (err: any) {
    console.error('qa check error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
