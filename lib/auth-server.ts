/**
 * Server-side check of who is calling an API route.
 * The browser sends the Supabase session as "Authorization: Bearer <token>"
 * (components/auth-gate.tsx adds it to every /api call). We verify the token
 * with Supabase and look the email up in public.allowed_users (the invite list).
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase';

export type Role = 'owner' | 'editor' | 'viewer';
export type AppUser = { id: string; email: string; role: Role; name: string | null };

const RANK: Record<Role, number> = { viewer: 1, editor: 2, owner: 3 };

export async function getAppUser(req: Request): Promise<AppUser | null> {
  const h = req.headers.get('authorization') || '';
  const token = h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : '';
  if (!token) return null;
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return null;
  const { data: row } = await admin.from('allowed_users').select('role, display_name').eq('email', email).maybeSingle();
  if (!row) return null;
  return { id: data.user!.id, email, role: row.role as Role, name: row.display_name ?? null };
}

/**
 * Use at the top of a route:
 *   const user = await requireUser(req);            // any invited user
 *   const user = await requireUser(req, 'editor');   // can change the vocabulary
 *   if (user instanceof NextResponse) return user;
 */
export async function requireUser(req: Request, min: Role = 'viewer'): Promise<AppUser | NextResponse> {
  const u = await getAppUser(req);
  if (!u) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
  if (RANK[u.role] < RANK[min]) return NextResponse.json({ error: 'Your account can’t do this' }, { status: 403 });
  return u;
}
