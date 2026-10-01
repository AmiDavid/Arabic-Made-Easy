import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/voice-clone
 * Clones a voice from uploaded audio samples via ElevenLabs Instant Voice Cloning.
 * Requires ElevenLabs Starter plan ($5/mo) or above — free tier can't clone.
 *
 * Body (multipart/form-data):
 *   name:  string
 *   description: string
 *   samples: File[]  (multiple audio files)
 */

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = form.get('name') as string;
    const description = form.get('description') as string;
    const samples = form.getAll('samples') as File[];

    if (!name || !samples.length) {
      return NextResponse.json({ error: 'name and samples required' }, { status: 400 });
    }

    // Forward to ElevenLabs
    const elForm = new FormData();
    elForm.append('name', name);
    elForm.append('description', description || '');
    for (const s of samples) elForm.append('files', s, s.name || 'sample.webm');

    const resp = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
      body: elForm,
    });

    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json({ error: `ElevenLabs: ${err}` }, { status: 500 });
    }

    const json = await resp.json();
    return NextResponse.json({ voice_id: json.voice_id, requires_update: true, instructions: `Add ELEVENLABS_VOICE_ID=${json.voice_id} to Vercel environment variables and redeploy.` });
  } catch (err: any) {
    console.error('voice-clone error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
