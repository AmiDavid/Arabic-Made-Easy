/**
 * Shared practice engine for Quiz and Daily practice.
 *
 *  - fetchPool(): loads ALL usable entries for a topic (Supabase caps a select at
 *    1,000 rows, and the old code took only the first 300 — always the same ones).
 *  - Deck: a shuffled deck that deals every word once before any word repeats.
 *    A word you miss comes back a few cards later, so you get a second go.
 *  - Long-term memory (this device): how often each word was seen and missed,
 *    so new sessions favour words you've seen least or got wrong.
 */
import { supabase } from '@/lib/supabase';
import { parseForms } from '@/lib/forms';
import type { Entry } from '@/types';

export function cleanEnglish(e: Entry) {
  return (e.english || '').replace('[?]', '').trim();
}

export function mainArabic(e: Entry) {
  return parseForms(e.arabic, e.english).main;
}

export function usable(e: Entry) {
  return !e.uncertain && !!e.arabic && !!e.english && e.arabic.length < 25 && e.english.length < 40;
}

const PAGE = 1000;

export async function fetchPool(topicId?: string | null): Promise<Entry[]> {
  const out: Entry[] = [];
  for (let from = 0; from < 10_000; from += PAGE) {
    let q = supabase.from('entries').select('*').order('id').range(from, from + PAGE - 1);
    if (topicId) q = q.eq('topic_id', topicId);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data as Entry[]) || [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  // de-duplicate words that appear twice in the notebook (same Arabic)
  const seen = new Set<string>();
  return out.filter((e) => {
    if (!usable(e)) return false;
    const k = mainArabic(e);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- long-term memory (localStorage) ----------

type Mem = Record<string, { s: number; m: number; t: number }>; // seen, missed, last time
const MEM_KEY = 'practice-memory-v1';

function readMem(): Mem {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(MEM_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeMem(m: Mem) {
  try {
    localStorage.setItem(MEM_KEY, JSON.stringify(m));
  } catch {}
}

export function recordResult(entryId: string, correct: boolean) {
  const mem = readMem();
  const r = mem[entryId] || { s: 0, m: 0, t: 0 };
  r.s += 1;
  if (!correct) r.m += 1;
  else if (r.m > 0) r.m -= 0.5; // getting it right slowly clears the "weak" mark
  r.t = Date.now();
  mem[entryId] = r;
  writeMem(mem);
}

/** Words missed before and not yet fixed, most-missed first. */
export function weakIds(): string[] {
  return Object.entries(readMem())
    .filter(([, r]) => r.m > 0)
    .sort((a, b) => b[1].m - a[1].m)
    .map(([id]) => id);
}

/**
 * Orders a pool for a new session: unseen and weak words first, then the rest
 * from least- to most-recently seen. Random within each band, so it never
 * feels like a fixed list.
 */
export function prioritise(pool: Entry[]): Entry[] {
  const mem = readMem();
  const scored = pool.map((e) => {
    const r = mem[e.id];
    let band: number;
    if (r && r.m > 0) band = 0; // weak
    else if (!r) band = 1; // never seen
    else band = 2;
    return { e, band, t: r?.t || 0, rnd: Math.random() };
  });
  scored.sort((a, b) => a.band - b.band || (a.band === 2 ? a.t - b.t : 0) || a.rnd - b.rnd);
  // light shuffle inside windows of 20 so weak words don't all come in a row
  const ordered = scored.map((s) => s.e);
  const out: Entry[] = [];
  for (let i = 0; i < ordered.length; i += 20) out.push(...shuffle(ordered.slice(i, i + 20)));
  return out;
}

// ---------- deck ----------

export class Deck {
  private queue: Entry[];
  private recent: string[] = [];
  readonly size: number;
  dealt = 0;

  constructor(pool: Entry[]) {
    this.queue = prioritise(pool);
    this.size = pool.length;
  }

  next(): Entry | null {
    if (!this.queue.length) return null;
    // avoid showing something we showed in the last few cards (e.g. a re-queued miss)
    let i = this.queue.findIndex((e) => !this.recent.includes(e.id));
    if (i < 0) i = 0;
    const [e] = this.queue.splice(i, 1);
    this.recent = [e.id, ...this.recent].slice(0, Math.min(5, Math.max(1, this.size - 1)));
    this.dealt += 1;
    return e;
  }

  /** a missed word comes back 4–7 cards later */
  requeue(e: Entry) {
    const at = Math.min(this.queue.length, 4 + Math.floor(Math.random() * 4));
    this.queue.splice(at, 0, e);
  }

  get remaining() {
    return this.queue.length;
  }

  refill(pool: Entry[]) {
    this.queue = prioritise(pool);
  }
}

// ---------- multiple-choice options ----------

export type Direction = 'ar-to-en' | 'en-to-ar';

export function answerText(e: Entry, dir: Direction) {
  return dir === 'ar-to-en' ? cleanEnglish(e) : mainArabic(e);
}

/** 4 options, all different from each other (no two identical answers). */
export function buildOptions(correct: Entry, pool: Entry[], dir: Direction): string[] {
  const right = answerText(correct, dir);
  const norm = (s: string) => s.toLowerCase().replace(/[ً-ْٰ]/g, '').trim();
  const used = new Set([norm(right)]);
  const opts = [right];
  for (const e of shuffle(pool)) {
    if (opts.length === 4) break;
    if (e.id === correct.id) continue;
    const t = answerText(e, dir);
    if (!t || used.has(norm(t))) continue;
    used.add(norm(t));
    opts.push(t);
  }
  return shuffle(opts);
}

// ---------- daily streak ----------

const DAILY_KEY = 'daily-practice-v1';
type DailyState = { last: string | null; streak: number; best: number; total: number };

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function readDaily(): DailyState {
  const empty = { last: null, streak: 0, best: 0, total: 0 };
  if (typeof window === 'undefined') return empty;
  try {
    const s = { ...empty, ...JSON.parse(localStorage.getItem(DAILY_KEY) || '{}') } as DailyState;
    // streak is broken if the last session was before yesterday
    const y = new Date();
    y.setDate(y.getDate() - 1);
    if (s.last && s.last !== todayKey() && s.last !== todayKey(y)) s.streak = 0;
    return s;
  } catch {
    return empty;
  }
}

export function markDailyDone(): DailyState {
  const s = readDaily();
  if (s.last !== todayKey()) {
    s.streak += 1;
    s.total += 1;
    s.last = todayKey();
    s.best = Math.max(s.best, s.streak);
  }
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(s));
  } catch {}
  return s;
}
