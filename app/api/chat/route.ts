import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { providers } from '@/lib/providers';

const SYSTEM = `You are a friendly conversation partner helping someone practice Palestinian Arabic (Bethlehem-area dialect).

Rules:
- Reply in Palestinian Arabic (Levantine, colloquial, NOT MSA/Fusha). Use everyday spoken vocabulary.
- Keep replies short — 1 to 3 short sentences max. This is chat, not a lecture.
- Include tashkeel (short vowels) on every word so the learner can pronounce it.
- After your Arabic reply, on a new line, provide a literal English translation prefixed with "EN: ".
- If the user says something in English, understand it and reply in Palestinian Arabic anyway.
- If the user makes a grammar mistake in Arabic, gently correct it in your English gloss but don't lecture.
- Be warm and encouraging. Use colloquial fillers like "يَعنِي", "طَيِّب", "شُو رَأيَك" occasionally.

Format every reply exactly like this:
<arabic reply with tashkeel>
EN: <literal translation>`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    let text: string;

    if (providers.chat === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const resp = await anthropic.messages.create({
        // Haiku is dramatically faster than Opus for short chat replies;
        // Palestinian dialect quality stays good at this length.
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        system: SYSTEM,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content_ar || m.content || '' })),
      });
      text = resp.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
    } else {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const resp = await openai.chat.completions.create({
        // gpt-4o-mini: faster + cheaper than gpt-4o, still good at Levantine
        model: 'gpt-4o-mini',
        max_tokens: 400,
        messages: [
          { role: 'system', content: SYSTEM },
          ...messages.map((m: any) => ({ role: m.role, content: m.content_ar || m.content || '' })),
        ],
      });
      text = resp.choices[0].message.content || '';
    }

    const enMatch = text.match(/EN:\s*(.+)$/s);
    const arabic = text.replace(/EN:.*$/s, '').trim();
    const english = enMatch ? enMatch[1].trim() : '';

    return NextResponse.json({ arabic, english });
  } catch (err: any) {
    console.error('chat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
