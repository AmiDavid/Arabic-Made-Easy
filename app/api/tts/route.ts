import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * POST /api/tts  { text } → audio/mpeg
 * Tries ElevenLabs (best Arabic), then OpenAI TTS. If both fail, returns 503
 * with the reasons so the client can fall back to the phone's built-in voice.
 * To use a cloned Bethlehem voice, set ELEVENLABS_VOICE_ID.
 */

async function elevenlabs(text: string): Promise<ArrayBuffer> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('no ElevenLabs key');
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pMsXgVXv3BLzUgSXRplE';
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=3`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': key, Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: AbortSignal.timeout(25_000),
    }
  );
  if (!resp.ok) throw new Error(`ElevenLabs ${resp.status}: ${(await resp.text()).slice(0, 180)}`);
  return resp.arrayBuffer();
}

async function openaiTts(text: string): Promise<ArrayBuffer> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('no OpenAI key');
  const resp = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice: 'nova', input: text, response_format: 'mp3' }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!resp.ok) throw new Error(`OpenAI ${resp.status}: ${(await resp.text()).slice(0, 180)}`);
  return resp.arrayBuffer();
}

export async function POST(req: NextRequest) {
  const { text } = await req.json().catch(() => ({}));
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

  const failures: string[] = [];
  for (const [name, fn] of [
    ['elevenlabs', elevenlabs],
    ['openai', openaiTts],
  ] as const) {
    try {
      const audio = await fn(text);
      return new NextResponse(audio, {
        headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Provider': name, 'Cache-Control': 'no-store' },
      });
    } catch (err: any) {
      failures.push(String(err?.message || err));
    }
  }
  console.error('TTS failed:', failures);
  return NextResponse.json({ error: 'No cloud voice available', details: failures }, { status: 503 });
}
