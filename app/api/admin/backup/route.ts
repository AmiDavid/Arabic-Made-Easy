import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/admin/backup?token=…[&table=entries][&counts=1]
 * Server-side export of the Arabic app's tables, paged 1000 rows at a time with a
 * stable order. The token is checked against a hash in public.admin_tokens
 * (RLS on, no policies: only the service role can read it).
 * Without &table it returns every table in one JSON file.
 */
const TABLES: Record<string, string[]> = {
  topics: ['id'],
  entries: ['id'],
  grammar_rules: ['id'],
  notebook_pages: ['id'],
  reviews: ['entry_id', 'user_id'],
  scans: ['id'],
  conversations: ['id'],
};

async function authorized(token: string | null) {
  if (!token) return false;
  const { data } = await supabaseAdmin().from('admin_tokens').select('token_hash').eq('purpose', 'backup').maybeSingle();
  if (!data?.token_hash) return false;
  const a = Buffer.from(createHash('sha256').update(token).digest('hex'));
  const b = Buffer.from(String(data.token_hash));
  return a.length === b.length && timingSafeEqual(a, b);
}

async function dump(table: string) {
  const admin = supabaseAdmin();
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    let q = admin.from(table).select('*');
    for (const col of TABLES[table]) q = q.order(col, { ascending: true });
    const { data, error } = await q.range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (!(await authorized(p.get('token')))) return NextResponse.json({ error: 'not allowed' }, { status: 401 });
  const one = p.get('table');
  const names = one ? [one] : Object.keys(TABLES);
  if (one && !TABLES[one]) return NextResponse.json({ error: 'unknown table' }, { status: 400 });
  try {
    const out: Record<string, any[]> = {};
    for (const t of names) out[t] = await dump(t);
    const counts = Object.fromEntries(Object.entries(out).map(([t, r]) => [t, r.length]));
    if (p.get('counts')) return NextResponse.json({ counts }, { headers: { 'Cache-Control': 'no-store' } });
    const stamp = new Date().toISOString().slice(0, 10);
    const body = JSON.stringify(one ? out[one] : { exported_at: new Date().toISOString(), counts, tables: out }, null, 2);
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="arabic-made-easy-${one || 'all-tables'}-${stamp}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
