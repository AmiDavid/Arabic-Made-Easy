import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { providers } from '@/lib/providers';

/**
 * TTS. Uses ElevenLabs if configured (much better Arabic), else OpenAI TTS.
 * To swap to a cloned Bethlehem voice, set ELEVENLABS_VOICE_ID.
 */

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

    let audioBuffer: ArrayBuffer;

    if (providers.tts === 'elevenlabs') {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pMsXgVXv3BLzUgSXRplE';
      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });
      if (!resp.ok) return NextResponse.json({ error: `ElevenLabs: ${await resp.text()}` }, { status: 500 });
      audioBuffer = await resp.arrayBuffer();
    } else {
      // OpenAI TTS — works with Arabic but sounds fairly generic.
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const resp = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova',   // nova/shimmer handle Arabic best
        input: text,
      });
      audioBuffer = await resp.arrayBuffer();
    }

    return new NextResponse(audioBuffer, { headers: { 'Content-Type': 'audio/mpeg' } });
  } catch (err: any) {
    console.error('TTS error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
