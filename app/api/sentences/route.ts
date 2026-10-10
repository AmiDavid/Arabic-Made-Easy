import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-server';
import { generateSentences, SentenceError } from '@/lib/sentences';

export const maxDuration = 60;

/**
 * POST /api/sentences
 * Body: { topicId?: string, topicName?: string, level: 'easy'|'medium'|'hard', count: number }
 * Generates English sentences built from the learner's own vocabulary,
 * each with a reference Palestinian Arabic translation.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  try {
    const body = await req.json();
    const { sentences } = await generateSentences(body);
    return NextResponse.json({ sentences });
  } catch (err: any) {
    console.error('sentences error:', err);
    if (err instanceof SentenceError) {
      return NextResponse.json({ error: err.message, debug: err.debug }, { status: err.status });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
