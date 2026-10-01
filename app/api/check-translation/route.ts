import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';

export const maxDuration = 60;

/**
 * POST /api/check-translation
 * Body: { english, reference, attempt }
 * Grades the learner's Palestinian Arabic translation.
 * Returns { verdict: 'correct'|'almost'|'wrong', corrected, feedback, issues: [] }
 */

const SYSTEM = `You grade a learner's translation from English into Palestinian colloquial Arabic (Jerusalem / Bethlehem / West Bank dialect).

Be fair and encouraging:
- Accept any natural Palestinian way of saying it, not only the reference answer.
- Ignore missing tashkeel (short vowels), missing hamza, and small spelling variants (ة/ه, ى/ي, أ/ا).
- If they used MSA/Fusha where Palestinian speakers would say it differently, the verdict is "almost" and you explain the Palestinian form.
- "correct" = a native speaker would say this. "almost" = understandable but with a small grammar, word-choice or dialect issue. "wrong" = the meaning is lost or the structure is broken.

Answer through the respond tool:
- verdict
- corrected: the best version of THEIR sentence in Palestinian Arabic with tashkeel (keep their wording where it was fine)
- feedback: 1-2 short sentences in English: what was good, and the main thing to fix
- issues: each specific problem (their words, a better version, a short English reason); empty list if none`;

const SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['correct', 'almost', 'wrong'] },
    corrected: { type: 'string' },
    feedback: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: { theirs: { type: 'string' }, better: { type: 'string' }, why: { type: 'string' } },
        required: ['theirs', 'better', 'why'],
      },
    },
  },
  required: ['verdict', 'corrected', 'feedback', 'issues'],
};

export async function POST(req: NextRequest) {
  try {
    const { english, reference, attempt } = await req.json();
    if (!english || !attempt) {
      return NextResponse.json({ error: 'english and attempt required' }, { status: 400 });
    }
    const { data, raw } = await generateJSON({
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `English sentence: ${english}\nReference translation: ${reference || '(none)'}\nLearner's translation: ${attempt}`,
        },
      ],
      schema: SCHEMA,
      tier: 'smart',
      maxTokens: 1000,
    });
    if (!data?.verdict) {
      console.error('check-translation: bad output', raw);
      return NextResponse.json({ error: 'Could not grade this one, try again.' }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('check-translation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
