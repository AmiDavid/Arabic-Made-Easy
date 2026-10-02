import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * Shared LLM helper used by chat, sentence generation and translation checking.
 * - Uses Anthropic when ANTHROPIC_API_KEY is set, else OpenAI.
 * - Normalises the message list (Anthropic requires the first message to be
 *   from the user and roles to alternate).
 * - Falls back to an older model id if the preferred one isn't available.
 * - generateJSON() uses Anthropic tool use (forced tool) so the reply is
 *   always a valid, schema-shaped object — no fragile text parsing.
 */

export type ChatTurn = { role: 'user' | 'assistant'; content: string };
type Tier = 'fast' | 'smart';

export const ANTHROPIC_MODELS: Record<Tier, string[]> = {
  // current models only — retired ids (claude-3-5-haiku-latest, claude-sonnet-4-20250514) removed
  fast: ['claude-haiku-4-5', 'claude-haiku-4-5-20251001'],
  smart: ['claude-sonnet-5-5', 'claude-sonnet-4-5'],
};
const OPENAI_MODELS: Record<Tier, string> = {
  fast: 'gpt-4o-mini',
  smart: 'gpt-4o',
};

// Remember which model id worked, so we don't retry dead ones on every call
const workingModel: Partial<Record<Tier, string>> = {};
// Why a model id was skipped (exposed by /api/health for diagnosis)
export const skippedModels: Record<string, string> = {};

function normalise(turns: ChatTurn[]): ChatTurn[] {
  const cleaned = turns
    .filter((t) => t && typeof t.content === 'string' && t.content.trim())
    .map((t) => ({ role: t.role, content: t.content.trim() }));
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();
  const merged: ChatTurn[] = [];
  for (const t of cleaned) {
    const last = merged[merged.length - 1];
    if (last && last.role === t.role) last.content += '\n' + t.content;
    else merged.push({ ...t });
  }
  if (!merged.length) merged.push({ role: 'user', content: '(start)' });
  return merged;
}

function isModelProblem(err: any) {
  const msg = String(err?.message || '');
  return err?.status === 404 || /model/i.test(msg);
}

async function withAnthropicModel<T>(tier: Tier, fn: (model: string) => Promise<T>): Promise<T> {
  const candidates = workingModel[tier]
    ? [workingModel[tier]!, ...ANTHROPIC_MODELS[tier].filter((m) => m !== workingModel[tier])]
    : ANTHROPIC_MODELS[tier];
  let lastErr: any;
  for (const model of candidates) {
    try {
      const out = await fn(model);
      workingModel[tier] = model;
      return out;
    } catch (err: any) {
      lastErr = err;
      if (!isModelProblem(err)) throw err;
      skippedModels[model] = String(err?.message || err).slice(0, 200);
    }
  }
  throw lastErr;
}

export async function generateText(opts: {
  system: string;
  messages: ChatTurn[];
  tier?: Tier;
  maxTokens?: number;
}): Promise<string> {
  const tier = opts.tier || 'fast';
  const messages = normalise(opts.messages);

  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return withAnthropicModel(tier, async (model) => {
      const resp = await anthropic.messages.create({
        model,
        max_tokens: opts.maxTokens || 800,
        system: opts.system,
        messages,
      });
      return resp.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n');
    });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp = await openai.chat.completions.create({
    model: OPENAI_MODELS[tier],
    max_tokens: opts.maxTokens || 800,
    messages: [{ role: 'system', content: opts.system }, ...messages],
  });
  return resp.choices[0].message.content || '';
}

/**
 * Get a structured object back. `schema` is a JSON Schema for the object.
 * Returns { data, raw } — raw is kept for debugging when data is null.
 */
export async function generateJSON<T = any>(opts: {
  system: string;
  messages: ChatTurn[];
  schema: Record<string, any>;
  tier?: Tier;
  maxTokens?: number;
  toolName?: string;
}): Promise<{ data: T | null; raw: string; model?: string }> {
  const tier = opts.tier || 'fast';
  const messages = normalise(opts.messages);
  const toolName = opts.toolName || 'respond';

  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return withAnthropicModel(tier, async (model) => {
      const resp = await anthropic.messages.create({
        model,
        max_tokens: opts.maxTokens || 1500,
        system: opts.system,
        messages,
        tools: [
          {
            name: toolName,
            description: 'Return your answer through this tool.',
            input_schema: opts.schema as any,
          },
        ],
        tool_choice: { type: 'tool', name: toolName },
      });
      const toolBlock: any = resp.content.find((b: any) => b.type === 'tool_use');
      if (toolBlock?.input) {
        return { data: toolBlock.input as T, raw: JSON.stringify(toolBlock.input).slice(0, 500), model };
      }
      const text = resp.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n');
      return { data: parseJSON<T>(text), raw: `stop_reason=${resp.stop_reason}; ${text.slice(0, 400)}`, model };
    });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp = await openai.chat.completions.create({
    model: OPENAI_MODELS[tier],
    max_tokens: opts.maxTokens || 1500,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `${opts.system}\n\nReply with ONLY a JSON object matching this JSON Schema:\n${JSON.stringify(opts.schema)}`,
      },
      ...messages,
    ],
  });
  const text = resp.choices[0].message.content || '';
  return { data: parseJSON<T>(text), raw: text.slice(0, 500), model: OPENAI_MODELS[tier] };
}

export function parseJSON<T = any>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?/g, '');
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}
