import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/conversations  — save/update a conversation
 * Body: { id?: string, messages: [...] }
 * - If id provided, updates the existing row (upsert)
 * - If no id, creates a new row and returns its id
 *
 * GET /api/conversations — list the signed-in user's past conversations (newest first)
 */

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  try {
    const { id, messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const now = new Date().toISOString();

    if (id) {
      // Update existing
      const { error } = await admin
        .from('conversations')
        .update({ messages, updated_at: now })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      return NextResponse.json({ id });
    } else {
      // Create new
      const { data, error } = await admin
        .from('conversations')
        .insert({ messages, user_id: user.id, created_at: now, updated_at: now })
        .select('id')
        .single();
      if (error) throw error;
      return NextResponse.json({ id: data.id });
    }
  } catch (err: any) {
    console.error('conversations POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from('conversations')
      .select('id, messages, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ conversations: data || [] });
  } catch (err: any) {
    console.error('conversations GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
