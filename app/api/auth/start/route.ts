import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/auth/start { email }
 * Sends a Supabase magic link, but only to emails on the invite list
 * (public.allowed_users), so strangers can't create accounts from here.
 */
export async function POST(req: NextRequest) {
  let email = '';
  try {
    email = String((await req.json())?.email || '').trim().toLowerCase();
  } catch {}
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }
  const { data: row } = await supabaseAdmin().from('allowed_users').select('email').eq('email', email).maybeSingle();
  if (!row) {
    return NextResponse.json({ error: 'This email isn’t invited yet. Ask Amichai to add you.' }, { status: 403 });
  }
  // always come back to this site (never a redirect chosen by the caller)
  const origin = new URL(req.url).origin;
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'implicit' },
  });
  const { error } = await anon.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/`, shouldCreateUser: true },
  });
  if (error) {
    const wait = /rate|seconds|security purposes/i.test(error.message);
    return NextResponse.json(
      { error: wait ? 'Too many links sent. Wait a minute and try again.' : error.message },
      { status: wait ? 429 : 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
