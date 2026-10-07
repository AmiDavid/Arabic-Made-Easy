import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripDiacritics } from '@/lib/utils';
import { BATCH as POLITICS_2026_10_07 } from '@/lib/batches/politics-2026-10-07';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/import/<batch> — adds a fixed, checked-in batch of notebook words.
 * Safe to call twice: a word is skipped if the same word (same first form, same
 * kind — verb or not) is already saved.
 */
const BATCHES: Record<string, typeof POLITICS_2026_10_07> = {
  'politics-2026-10-07': POLITICS_2026_10_07,
};

const isVerb = (en: string) => /^\s*to\s/i.test(en);
const keyOf = (ar: string, en: string) =>
  stripDiacritics(ar.split('،')[0]).replace(/ّ/g, '').trim() + (isVerb(en) ? '|v' : '|n');

export async function GET(_req: NextRequest, ctx: { params: Promise<{ batch: string }> }) {
  const { batch } = await ctx.params;
  const b = BATCHES[batch];
  if (!b) return NextResponse.json({ error: 'unknown batch' }, { status: 404 });
  const admin = supabaseAdmin();

  const { data: topic } = await admin.from('topics').select('id').eq('slug', b.topicSlug).maybeSingle();

  const existing = new Map<string, string>();
  for (let i = 0; i < 20000; i += 1000) {
    const { data } = await admin.from('entries').select('arabic, english, page_label').order('id').range(i, i + 999);
    if (!data?.length) break;
    for (const e of data) existing.set(keyOf(String(e.arabic), String(e.english)), `${e.arabic} (${e.page_label || '—'})`);
    if (data.length < 1000) break;
  }

  const added: string[] = [];
  const skipped: string[] = [];
  const rows: any[] = [];
  for (const p of b.pages) {
    for (const [arabic, english] of p.words) {
      const k = keyOf(arabic, english);
      if (existing.has(k)) {
        skipped.push(`${arabic} — already have ${existing.get(k)}`);
        continue;
      }
      existing.set(k, arabic);
      rows.push({
        arabic,
        english,
        topic_id: topic?.id ?? null,
        notebook: 'Notebook 3',
        page: p.page,
        page_label: `Notebook 3, p.${p.page}`,
        entry_type: 'vocab',
        uncertain: false,
      });
      added.push(`${arabic} = ${english} (p.${p.page})`);
    }
  }
  if (rows.length) {
    const { error } = await admin.from('entries').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ topic: topic ? b.topicSlug : 'none', added, skipped });
}
