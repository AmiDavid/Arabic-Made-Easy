import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';
import { GRAMMAR } from '@/lib/grammar-content';

/**
 * POST /api/admin/reseed-grammar
 * Replaces (upserts) grammar_rules from the latest GRAMMAR constant in the code.
 * Used after updating lib/grammar-content.ts so the DB reflects the new rules.
 */

export async function POST(req: Request) {
  const user = await requireUser(req, 'owner');
  if (user instanceof NextResponse) return user;
  try {
    const admin = supabaseAdmin();
    let count = 0;
    for (const g of GRAMMAR) {
      const { error } = await admin.from('grammar_rules').upsert(g, { onConflict: 'slug' });
      if (error) {
        return NextResponse.json({ error: `${g.slug}: ${error.message}` }, { status: 500 });
      }
      count++;
    }
    return NextResponse.json({ ok: true, count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
