import { NextRequest, NextResponse } from "next/server";
export const maxDuration = 60;
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { providers } from "@/lib/providers";
import { supabaseAdmin } from "@/lib/supabase";
import { stripDiacritics } from "@/lib/utils";

/**
 * POST /api/scan — OCR + categorization of a notebook page.
 * Also detects whether the page is grammar or vocabulary.
 * Flags entries that are already in the database.
 */

const SYSTEM = `You are an OCR + categorization assistant for a Palestinian Arabic vocabulary notebook.

The user photographs a handwritten notebook page. First decide what kind of page this is:
- "vocab" = a list of Arabic/English word pairs
- "grammar" = a rule explanation with a verb table, conjugation examples, or a grammatical pattern
- "mixed" = both

Then extract everything:
1. Vocabulary pairs: every Arabic word/phrase and its English translation. Preserve diacritics (tashkeel) exactly as written. Keep multi-word English like "to walk / hike" together as one entry.
2. For grammar pages, TEACH the rule — don't just summarise it. The notebook follows teacher Basil Zboun's method; keep his notation and logic:
   - "suf" = suffix (ending), "pre" = prefix. Special cases are named S.C.1, S.C.2, S.C.3… — keep those names.
   - Exceptions are usually written "(مش لـ: هيّا & همّا)" for the past and "(إنتي، إنتو & همّا)" for the present — explain them and mark those people with ★.
   - In "content" (markdown) write: what the rule is (in plain English, 1–3 short paragraphs), the steps exactly as the page gives them (① past, ② present & future, imperative…), then for verbs a FULL conjugation table with the columns | Person | Past (ماضي) | Present (مضارع) | Future (مستقبل) | and one row per person in this order: أنا، إنتا، إنتي، هوّ، هيّا، إحنا، إنتو، همّا. Each cell: **Arabic** + transliteration (e.g. **بحكي** baḥki). Then the imperative: إنتا / إنتي / إنتو. Then a table of every verb or word listed on the page with its meaning.
   - Palestinian (Jerusalem / Bethlehem) dialect: present with بـ (بحكي، بتحكي، بيحكي، منحكي), future with رح, ق pronounced as ʔ.
   - Use only "## " headings, **bold**, "- " lists and pipe tables (no HTML, no "|" inside cells).
   - In "examples" give 4–6 natural Palestinian sentences that use the rule, each with English + transliteration.
3. Flag any uncertain reading with uncertain: true (don't put [?] in the text itself — just set the flag).
4. Suggest ONE topic slug from this list, best match:
   time, colors, numbers-grammar, verbs-special, comparatives, market, house, clothing, body-meat, question-words, imperative, politics, elections, appliances, general

Respond with ONLY valid JSON:
{
  "page_type": "vocab" | "grammar" | "mixed",
  "title": "short page title in English if visible",
  "suggested_topic_slug": "one-of-the-slugs-above",
  "grammar": {
    "title": "if grammar page: short English title",
    "summary": "if grammar page: one sentence rule description",
    "content": "if grammar page: full teaching explanation in markdown (see rules above)",
    "examples": [{ "ar": "حكيت مع صاحبي", "en": "I spoke with my friend (ḥakēt maʕ ṣāḥbi)" }]
  },
  "entries": [
    { "arabic": "بَيت", "english": "house", "uncertain": false },
    ...
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64)
      return NextResponse.json(
        { error: "imageBase64 required" },
        { status: 400 },
      );

    const b64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mediaType =
      imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
    const dataUrl = `data:${mediaType};base64,${b64}`;

    let text: string;
    if (providers.vision === "anthropic") {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      let resp: any;
      let lastErr: any;
      // Fast, strong vision model first (must finish within the 60s limit); fall back if an id isn't available on this key
      for (const model of [
        "claude-sonnet-5-5",
        "claude-sonnet-4-5",
        "claude-opus-4-7",
      ]) {
        try {
          resp = await anthropic.messages.create({
            model,
            max_tokens: 6000,
            system: SYSTEM,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: mediaType as any,
                      data: b64,
                    },
                  },
                  {
                    type: "text",
                    text: "Extract everything from this notebook page.",
                  },
                ],
              },
            ],
          });
          break;
        } catch (err: any) {
          lastErr = err;
          if (err?.status !== 404 && !/model/i.test(String(err?.message)))
            throw err;
        }
      }
      if (!resp) throw lastErr;
      text = resp.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");
    } else {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const resp = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 6000,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract everything from this notebook page.",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      });
      text = resp.choices[0].message.content || "";
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
      return NextResponse.json(
        { error: "Could not parse response", raw: text },
        { status: 500 },
      );
    const parsed = JSON.parse(jsonMatch[0]);

    // --- Duplicate detection: mark entries that already exist ---
    const entries: Array<{
      arabic: string;
      english: string;
      uncertain: boolean;
    }> = parsed.entries || [];
    if (entries.length) {
      const admin = supabaseAdmin();
      // Fetch ALL existing entries (Supabase caps a request at 1000 rows → page through)
      const existing: {
        arabic: string;
        english: string;
        page_label: string | null;
      }[] = [];
      for (let from = 0; from <= 20000; from += 1000) {
        const { data } = await admin
          .from("entries")
          .select("arabic, english, page_label")
          .order("id")
          .range(from, from + 999);
        if (!data?.length) break;
        existing.push(...data);
        if (data.length < 1000) break;
      }
      const existingByBare = new Map<
        string,
        { english: string; page_label: string | null }[]
      >();
      for (const e of existing) {
        const key = stripDiacritics(String(e.arabic)).trim();
        if (!existingByBare.has(key)) existingByBare.set(key, []);
        existingByBare
          .get(key)!
          .push({ english: e.english, page_label: e.page_label });
      }
      parsed.entries = entries.map((e) => {
        const key = stripDiacritics(e.arabic).trim();
        const matches = existingByBare.get(key);
        return {
          ...e,
          already_known: matches
            ? matches
                .map((m) => m.page_label)
                .filter(Boolean)
                .join(", ") || true
            : false,
        };
      });
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("scan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
