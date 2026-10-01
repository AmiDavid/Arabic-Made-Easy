import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * Shared LLM helper used by chat, sentence generation and translation checking.
 * - Uses Anthropic when ANTHROPIC_API_KEY is set, else OpenAI.
 * - Normalises the message list (Anthropic requires the first message to be
 *   from the user and roles to alternate).
 * - Falls back to an older model id if the preferred one isn't available.
 * - Parses a JSON object out of the reply.
 */

export type ChatTurn = { role: 'user' | 'assistant'; content: string };
type Tier = 'fast' | 'smart';

const ANTHROPIC_MODELS: Record<Tier, string[]> = {
  fast: ['claude-haiku-4-5', 'claude-haiku-4-5-20251001'],
  smart: ['claude-sonnet-5-5', 'claude-sonnet-4-5'],
};
const OPENAI_MODELS: Record<Tier, string> = {
  fast: 'gpt-4o-mini',
  smart: 'gpt-4o',
};

function normalise(turns: ChatTurn[]): ChatTurn[] {
  const cleaned = turns
    .filter((t) => t && typeof t.content === 'string' && t.content.trim())
    .map((t) => ({ role: t.role, content: t.content.trim() }));
  // Drop leading assistant turns (Anthropic rejects them)
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();
  // Merge consecutive same-role turns
  const merged: ChatTurn[] = [];
  for (const t of cleaned) {
    const last = merged[merged.length - 1];
    if (last && last.role === t.role) last.content += '\n' + t.content;
    else merged.push({ ...t });
  }
  return merged;
}

export async function generateText(opts: {
  system: string;
  messages: ChatTurn[];
  tier?: Tier;
  maxTokens?: number;
  json?: boolean;
}): Promise<string> {
  const tier = opts.tier || 'fast';
  const maxTokens = opts.maxTokens || 800;
  const messages = normalise(opts.messages);
  if (!messages.length) messages.push({ role: 'user', content: '(start)' });

  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    let lastErr: any;
    for (const model of ANTHROPIC_MODELS[tier]) {
      try {
        const resp = await anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          system: opts.system,
          messages,
        });
        return resp.content
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text)
          .join('\n');
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || '');
        const isModelProblem = err?.status === 404 || /model/i.test(msg);
        if (!isModelProblem) throw err;
      }
    }
    throw lastErr;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp = await openai.chat.completions.create({
    model: OPENAI_MODELS[tier],
    max_tokens: maxTokens,
    ...(opts.json ? { response_format: { type: 'json_object' as const } } : {}),
    messages: [{ role: 'system', content: opts.system }, ...messages],
  });
  return resp.choices[0].message.content || '';
}

export function parseJSON<T = any>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}
