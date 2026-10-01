import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { ANTHROPIC_MODELS, generateJSON, skippedModels } from '@/lib/ai';
import { transcribe } from '@/lib/stt';
import { generateSentences } from '@/lib/sentences';

/**
 * GET /api/health          — quick checks (keys present, DB, model availability)
 * GET /api/health?deep=1   — also runs a real TTS → Whisper round trip and a
 *                            structured-output test (costs a fraction of a cent)
 * Never returns secrets; error messages are truncated.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const short = (e: any) => String(e?.message || e).slice(0, 220);

async function timed<T>(fn: () => Promise<T>) {
  const t = Date.now();
  try {
    const value = await fn();
    return { ok: true, ms: Date.now() - t, value };
  } catch (e) {
    return { ok: false, ms: Date.now() - t, error: short(e) };
  }
}

export async function GET(req: NextRequest) {
  const deep = req.nextUrl.searchParams.get('deep') === '1';
  const only = req.nextUrl.searchParams.get('only');
  const out: Record<string, any> = {};

  // ?only=ai — just the AI generation checks (small response, easy to read)
  if (only === 'ai') {
    out.sentences = await timed(async () => {
      const { sentences, model } = await generateSentences({ level: 'easy', count: 2 });
      return { model, first: sentences[0]?.english, arabic: sentences[0]?.arabic, n: sentences.length };
    });
    out.chat_model = await timed(async () => {
      const { data, model } = await generateJSON<{ arabic: string; english: string }>({
        system: 'You are a Palestinian Arabic teacher. Reply in one short Palestinian sentence.',
        messages: [{ role: 'user', content: 'مرحبا، كيف حالك؟' }],
        schema: {
          type: 'object',
          properties: { arabic: { type: 'string' }, english: { type: 'string' } },
          required: ['arabic', 'english'],
        },
        tier: 'fast',
        maxTokens: 200,
      });
      if (!data?.arabic) throw new Error('no reply');
      return { model, ...data };
    });
    out.skipped_models = skippedModels;
    return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
  }

  out.env = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    elevenlabs_voice_id: process.env.ELEVENLABS_VOICE_ID || null,
  };

  // Supabase
  out.supabase = await timed(async () => {
    const admin = supabaseAdmin();
    const count = async (table: string) => {
      const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true });
      if (error) throw new Error(`${table}: ${error.message}`);
      return count;
    };
    return {
      entries: await count('entries'),
      topics: await count('topics'),
      grammar_rules: await count('grammar_rules'),
      conversations: await count('conversations'),
    };
  });

  // Anthropic: which model ids work for this key
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const models: Record<string, any> = {};
    for (const m of [...ANTHROPIC_MODELS.fast, ...ANTHROPIC_MODELS.smart]) {
      models[m] = await timed(async () => {
        const r = await anthropic.messages.create({
          model: m,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Reply with: ok' }],
        });
        return r.content.map((b: any) => b.text || '').join('');
      });
    }
    out.anthropic_models = models;
  }

  // OpenAI key validity (cheap: list models)
  if (process.env.OPENAI_API_KEY) {
    out.openai = await timed(async () => {
      const r = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        signal: AbortSignal.timeout(15000),
      });
      const body = await r.text();
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${body.slice(0, 160)}`);
      const ids: string[] = JSON.parse(body).data.map((d: any) => d.id);
      return { whisper: ids.includes('whisper-1'), tts: ids.includes('tts-1'), gpt4o_mini: ids.includes('gpt-4o-mini') };
    });
  }

  // ElevenLabs subscription + voice
  if (process.env.ELEVENLABS_API_KEY) {
    out.elevenlabs = await timed(async () => {
      const h = { 'xi-api-key': process.env.ELEVENLABS_API_KEY! };
      const s = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: h });
      const sb = await s.text();
      if (!s.ok) throw new Error(`subscription HTTP ${s.status}: ${sb.slice(0, 160)}`);
      const sub = JSON.parse(sb);
      const vid = process.env.ELEVENLABS_VOICE_ID || 'pMsXgVXv3BLzUgSXRplE';
      const v = await fetch(`https://api.elevenlabs.io/v1/voices/${vid}`, { headers: h });
      const vb = await v.text();
      return {
        tier: sub.tier,
        characters_used: sub.character_count,
        character_limit: sub.character_limit,
        can_clone: sub.can_use_instant_voice_cloning,
        voice: v.ok ? JSON.parse(vb).name : `HTTP ${v.status}: ${vb.slice(0, 120)}`,
      };
    });
  }

  if (deep) {
    // ElevenLabs TTS (the same call the app makes)
    if (process.env.ELEVENLABS_API_KEY) {
      out.tts_elevenlabs = await timed(async () => {
        const vid = process.env.ELEVENLABS_VOICE_ID || 'pMsXgVXv3BLzUgSXRplE';
        const r = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${vid}/stream?optimize_streaming_latency=3`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': process.env.ELEVENLABS_API_KEY!,
              Accept: 'audio/mpeg',
            },
            body: JSON.stringify({ text: 'مَرحَبَا', model_id: 'eleven_turbo_v2_5' }),
          }
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 160)}`);
        return { bytes: (await r.arrayBuffer()).byteLength };
      });
    }

    // Speech round trip: OpenAI TTS → Whisper (same code path as /api/stt)
    if (process.env.OPENAI_API_KEY) {
      out.stt_roundtrip = await timed(async () => {
        const r = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'tts-1', voice: 'nova', input: 'مرحبا، كيف حالك اليوم؟', response_format: 'mp3' }),
          signal: AbortSignal.timeout(20000),
        });
        if (!r.ok) throw new Error(`TTS HTTP ${r.status}: ${(await r.text()).slice(0, 160)}`);
        const audio = new Blob([await r.arrayBuffer()], { type: 'audio/mpeg' });
        const text = await transcribe(audio, 'test.mp3');
        return { heard: text };
      });
    }

    // Structured output (what chat + sentences rely on)
    out.structured_output = await timed(async () => {
      const { data, raw, model } = await generateJSON<{ arabic: string; english: string }>({
        system: 'You are a Palestinian Arabic teacher.',
        messages: [{ role: 'user', content: 'Give me one short Palestinian sentence about coffee.' }],
        schema: {
          type: 'object',
          properties: { arabic: { type: 'string' }, english: { type: 'string' } },
          required: ['arabic', 'english'],
        },
        tier: 'smart',
        maxTokens: 300,
      });
      if (!data?.arabic) throw new Error(`no data; raw=${raw.slice(0, 160)}`);
      return { model, ...data };
    });

    // The real sentence generator, end to end (2 easy sentences)
    out.sentences = await timed(async () => {
      const { sentences, model } = await generateSentences({ level: 'easy', count: 2 });
      return { model, first: sentences[0]?.english, arabic: sentences[0]?.arabic, n: sentences.length };
    });

    // The teacher's fast model with the chat-style schema
    out.chat_model = await timed(async () => {
      const { data, model } = await generateJSON<{ arabic: string; english: string }>({
        system: 'You are a Palestinian Arabic teacher. Reply in one short Palestinian sentence.',
        messages: [{ role: 'user', content: 'مرحبا، كيف حالك؟' }],
        schema: {
          type: 'object',
          properties: { arabic: { type: 'string' }, english: { type: 'string' } },
          required: ['arabic', 'english'],
        },
        tier: 'fast',
        maxTokens: 200,
      });
      if (!data?.arabic) throw new Error('no reply');
      return { model, ...data };
    });
  }

  out.skipped_models = skippedModels;
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
