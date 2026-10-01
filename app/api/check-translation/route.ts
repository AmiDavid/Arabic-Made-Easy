import { NextRequest, NextResponse } from 'next/server';
import { generateText, parseJSON } from '@/lib/ai';

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

Reply with ONLY this JSON:
{
  "verdict": "correct" | "almost" | "wrong",
  "corrected": "the best version of THEIR sentence in Palestinian Arabic with tashkeel (keep their wording where it was fine)",
  "feedback": "1-2 short sentences in English: what was good, and the main thing to fix",
  "issues": [{ "theirs": "...", "better": "...", "why": "short English reason" }]
}`;

export async function POST(req: NextRequest) {
  try {
    const { english, reference, attempt } = await req.json();
    if (!english || !attempt) {
      return NextResponse.json({ error: 'english and attempt required' }, { status: 400 });
    }
    const text = await generateText({
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `English sentence: ${english}\nReference translation: ${reference || '(none)'}\nLearner's translation: ${attempt}`,
        },
      ],
      tier: 'smart',
      maxTokens: 800,
      json: true,
    });
    const parsed = parseJSON(text);
    if (!parsed?.verdict) {
      return NextResponse.json({ error: 'Could not grade this one, try again.' }, { status: 500 });
    }
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('check-translation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
