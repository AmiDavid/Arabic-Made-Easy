import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { providers } from '@/lib/providers';

/**
 * POST /api/scan  — OCR + categorization of a handwritten notebook page.
 * Uses Claude Vision if ANTHROPIC_API_KEY is set, else GPT-4o vision.
 */

const SYSTEM = `You are an OCR + categorization assistant for a Palestinian Arabic vocabulary notebook.

The user photographs a handwritten notebook page. Your job:
1. Extract every Arabic word/phrase and its English translation from the page. Preserve diacritics (tashkeel) exactly as written. If multiple English words are separated by / or comma, keep them together.
2. Flag any reading you're unsure about by appending [?] to the English.
3. Skip page headers/titles and grammar tables that aren't vocabulary pairs (note the page title in "title").
4. Suggest one topic slug from:
   time, colors, numbers-grammar, verbs-special, comparatives, market, house, clothing, body-meat, question-words, imperative, politics, elections, appliances, general

Respond with ONLY valid JSON, no prose:
{
  "title": "short page title in English if visible",
  "suggested_topic_slug": "one-of-the-slugs-above",
  "entries": [
    { "arabic": "بَيت", "english": "house", "uncertain": false }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });

    const b64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mediaType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    const dataUrl = `data:${mediaType};base64,${b64}`;

    let text: string;

    if (providers.vision === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const resp = await anthropic.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 4096,
        system: SYSTEM,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: b64 } },
            { type: 'text', text: 'Extract vocabulary from this notebook page.' },
          ],
        }],
      });
      text = resp.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
    } else {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract vocabulary from this notebook page.' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      });
      text = resp.choices[0].message.content || '';
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'Could not parse response', raw: text }, { status: 500 });
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err: any) {
    console.error('scan error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
