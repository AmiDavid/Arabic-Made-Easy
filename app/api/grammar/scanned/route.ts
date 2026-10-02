import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** GET /api/grammar/scanned[?slug=…] — grammar cards created by scanning (read-only). */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  let q = supabaseAdmin()
    .from('grammar_rules')
    .select(slug ? 'slug, title, category, summary, content_md, examples, source_pages' : 'slug, title, category, summary, source_pages')
    .like('slug', 'scan-%')
    .order('created_at');
  if (slug) q = q.eq('slug', slug);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
