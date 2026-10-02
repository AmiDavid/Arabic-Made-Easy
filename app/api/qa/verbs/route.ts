import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { conjugate } from '@/lib/conjugate';
import { VERB_CASES } from '@/lib/verbs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/qa/verbs[?q=sleep][&from=0&n=150] — read-only audit of every verb:
 * how it's classified and its key forms, as plain text (one verb per line).
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').toLowerCase();
  const from = Number(req.nextUrl.searchParams.get('from') || 0);
  const n = Number(req.nextUrl.searchParams.get('n') || 150);
  const admin = supabaseAdmin();
  const all: any[] = [];
  for (let i = 0; i < 20000; i += 1000) {
    const { data, error } = await admin.from('entries').select('arabic, english, notes, page_label').order('id').range(i, i + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  const lines: string[] = [];
  for (const e of all) {
    if (q && !`${e.english} ${e.arabic}`.toLowerCase().includes(q)) continue;
    const c = conjugate(e.arabic, e.english, e.notes);
    if (!c) continue;
    lines.push(
      [
        e.arabic,
        e.english,
        e.page_label || '-',
        VERB_CASES[c.verbCase].label + (c.presentSuggested ? ' ✦' : ''),
        `past: ${c.past[0]} / ${c.past[4]} / ${c.past[7]}`,
        `pres: ${c.present?.[0] ?? '—'} / ${c.present?.[6] ?? '—'}`,
        `imp: ${c.imperative?.join(' ') ?? '—'}`,
      ].join(' | ')
    );
  }
  const total = lines.length;
  const body = `${total} verbs (showing ${from}–${Math.min(total, from + n)})\n` + lines.slice(from, from + n).join('\n');
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
