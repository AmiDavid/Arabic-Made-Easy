import { NextRequest, NextResponse } from 'next/server';
import { transcribe } from '@/lib/stt';

export const maxDuration = 60;

/** POST /api/stt — multipart/form-data with an "audio" field → { text } */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get('audio') as File | null;
    if (!audio) return NextResponse.json({ error: 'audio required' }, { status: 400 });

    // Very small recordings are silence / clicks — skip them
    if ((audio.size || 0) < 2000) return NextResponse.json({ text: '', note: 'audio too short' });

    const name = audio.name || `audio.${audio.type.includes('mp4') ? 'mp4' : 'webm'}`;
    const text = await transcribe(audio, name);
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('STT error:', err);
    return NextResponse.json({ error: err?.message || 'STT failed' }, { status: 500 });
  }
}
