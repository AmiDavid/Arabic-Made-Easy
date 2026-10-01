import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * Speech-to-text via Whisper.
 * Retries once on transient errors (OpenAI's Node SDK often throws "Connection
 * error" even when the next call succeeds).
 */

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25_000, maxRetries: 2 });

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get('audio') as File | null;
    if (!audio) return NextResponse.json({ error: 'audio required' }, { status: 400 });

    // Skip tiny blobs (likely silence/no speech)
    const audioSize = (audio as any).size || 0;
    if (audioSize < 2000) {
      return NextResponse.json({ text: '', note: 'audio too short' });
    }

    const callWhisper = () =>
      openai.audio.transcriptions.create({
        file: audio,
        model: 'whisper-1',
        language: 'ar',
        response_format: 'json',
      });

    let transcription;
    try {
      transcription = await callWhisper();
    } catch (err: any) {
      // One manual retry on "Connection error" or network glitches
      await new Promise((r) => setTimeout(r, 500));
      transcription = await callWhisper();
    }

    return NextResponse.json({ text: (transcription as any).text || '' });
  } catch (err: any) {
    console.error('STT error:', err);
    return NextResponse.json({
      error: err?.message || 'STT failed',
      hint: 'If this keeps happening, your OpenAI key may be out of credits or OpenAI is having an outage.',
    }, { status: 500 });
  }
}
