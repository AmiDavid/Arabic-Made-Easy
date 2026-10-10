'use client';
/**
 * Invite-only sign-in (Supabase magic link).
 * - Shows the sign-in screen until there is a session for an invited email.
 * - Adds the session to every /api/… call, so server routes know who is calling.
 * - Viewers (e.g. Basil) automatically get guest mode: their chats stay out of
 *   Amichai's history and recap.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { Mail, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/lib/auth-server';

type Account = { id: string; email: string; role: Role; name: string | null };
const AccountContext = createContext<Account | null>(null);
export const useAccount = () => useContext(AccountContext);

// Attach the session to same-origin /api calls. Installed once, before any page renders.
if (typeof window !== 'undefined' && !(window as any).__authFetch) {
  (window as any).__authFetch = true;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const isApi = url.startsWith('/api/') || url.startsWith(`${window.location.origin}/api/`);
    if (!isApi) return original(input, init);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return original(input, init);
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('authorization')) headers.set('authorization', `Bearer ${token}`);
    return original(input, { ...init, headers });
  };
}

type State = { kind: 'loading' } | { kind: 'signed-out' } | { kind: 'not-invited'; email: string } | { kind: 'ok'; account: Account };

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    // a failed / expired magic link comes back as #error_description=…
    try {
      const h = new URLSearchParams(window.location.hash.slice(1));
      const err = h.get('error_description');
      if (err) {
        setLinkError(err.replace(/\+/g, ' '));
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {}

    let alive = true;
    async function load(session: any) {
      if (!session?.user) {
        if (alive) setState({ kind: 'signed-out' });
        return;
      }
      const email = String(session.user.email || '').toLowerCase();
      const { data: row } = await supabase.from('allowed_users').select('role, display_name').eq('email', email).maybeSingle();
      if (!alive) return;
      if (!row) return setState({ kind: 'not-invited', email });
      const account: Account = { id: session.user.id, email, role: row.role as Role, name: row.display_name ?? null };
      try {
        if (account.role === 'viewer') localStorage.setItem('guest-name', account.name || email.split('@')[0]);
      } catch {}
      setState({ kind: 'ok', account });
    }
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') load(session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state.kind === 'loading') {
    return <div className="min-h-[60vh] grid place-items-center text-stone-200/60 text-sm">Loading…</div>;
  }
  if (state.kind === 'signed-out') return <SignIn linkError={linkError} />;
  if (state.kind === 'not-invited') {
    return (
      <Screen>
        <p className="text-stone-200/85">
          <b>{state.email}</b> isn’t on the invite list yet. Ask Amichai to add you, then sign in again.
        </p>
        <button onClick={() => supabase.auth.signOut()} className="mt-4 rounded-xl border hairline px-4 py-2 text-sm">
          Use another email
        </button>
      </Screen>
    );
  }
  return <AccountContext.Provider value={state.account}>{children}</AccountContext.Provider>;
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-sm mx-auto px-4 pt-16">
      <div className="text-[10px] tracking-[0.3em] text-gold-500 font-semibold mb-2">ARABIC MADE EASY</div>
      <h1 className="display text-3xl font-semibold text-stone-50 mb-4">أَهلًا فِيك</h1>
      <div className="rounded-2xl border hairline bg-stone-900/40 p-5 text-sm">{children}</div>
    </div>
  );
}

function SignIn({ linkError }: { linkError: string | null }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(linkError ? `That link didn’t work (${linkError}). Send a new one.` : null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/auth/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Could not send the link.');
      setSent(email.trim().toLowerCase());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Screen>
        <Mail className="w-5 h-5 text-gold-500 mb-2" />
        <p className="text-stone-200/90">
          Check <b>{sent}</b> and tap the sign-in link. Open it on <b>this device, in this browser</b>.
        </p>
        <button onClick={() => setSent(null)} className="mt-4 text-xs text-stone-200/60 underline">
          Didn’t get it? Send again
        </button>
      </Screen>
    );
  }
  return (
    <Screen>
      <form onSubmit={send}>
        <label className="block text-stone-200/80 mb-2">Sign in with your email. We’ll send you a link, no password needed.</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl bg-night-900/60 border hairline px-3 py-2.5 text-stone-50 outline-none focus:border-gold-500/60"
        />
        <button
          disabled={busy}
          className="mt-3 w-full rounded-xl bg-gold-500 text-night-900 font-semibold py-2.5 disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Send me a sign-in link'}
        </button>
        {error && <p className="mt-3 text-terracotta-400">{error}</p>}
      </form>
    </Screen>
  );
}

/** "Signed in as … · Sign out" — shown on the home page. */
export function AccountLine() {
  const account = useAccount();
  if (!account) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-stone-200/55">
      <span>
        Signed in as {account.email}
        {account.role !== 'owner' ? ` (${account.role})` : ''}
      </span>
      <span>·</span>
      <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-1 underline hover:text-stone-200">
        <LogOut className="w-3 h-3" /> Sign out
      </button>
    </div>
  );
}
