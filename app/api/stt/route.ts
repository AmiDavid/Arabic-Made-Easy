import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Speech-to-text via Whisper. Accepts multipart/form-data with an "audio" field.

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get('audio') as File | null;
    if (!audio) return NextResponse.json({ error: 'audio required' }, { status: 400 });

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'ar',       // Arabic — Whisper handles Levantine reasonably
      response_format: 'json',
    });

    return NextResponse.json({ text: (transcription as any).text || '' });
  } catch (err: any) {
    console.error('STT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
