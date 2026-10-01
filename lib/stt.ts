/**
 * Whisper speech-to-text via a direct HTTPS call (native fetch + FormData).
 * Bypasses the OpenAI Node SDK, whose v4 multipart upload of web File objects
 * from Next.js route handlers fails with a misleading "Connection error".
 */
export async function transcribe(audio: Blob, filename: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');

  const form = new FormData();
  form.append('file', audio, filename);
  form.append('model', 'whisper-1');
  form.append('language', 'ar');
  form.append('response_format', 'json');

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}` },
        body: form,
        signal: AbortSignal.timeout(25_000),
      });
      const bodyText = await resp.text();
      if (!resp.ok) {
        // 4xx = our problem (bad key, no credit, bad file) — don't retry
        const msg = safeError(bodyText) || `HTTP ${resp.status}`;
        if (resp.status < 500) throw new FatalError(`OpenAI Whisper ${resp.status}: ${msg}`);
        throw new Error(`OpenAI Whisper ${resp.status}: ${msg}`);
      }
      const json = JSON.parse(bodyText);
      return String(json.text || '');
    } catch (err) {
      if (err instanceof FatalError) throw err;
      lastErr = err;
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

class FatalError extends Error {}

function safeError(body: string): string {
  try {
    const j = JSON.parse(body);
    return j?.error?.message || j?.error || '';
  } catch {
    return body.slice(0, 200);
  }
}
