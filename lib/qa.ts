/**
 * Small helpers for checking and fixing vocabulary from inside the app.
 * "Checked" marks are kept as lines in the entry's notes field, e.g.
 *   checked: duplicate   (you looked at it and want to keep both entries)
 *   checked: ok          (you confirmed the word is right)
 * so nothing needs a database change.
 */
import { supabase } from './supabase';
import type { Entry } from '@/types';

export type CheckKind = 'ok' | 'duplicate' | 'ai';

export function isChecked(notes: string | null | undefined, kind: CheckKind) {
  return new RegExp(`^checked: ${kind}$`, 'm').test(notes || '');
}

export function withChecked(notes: string | null | undefined, kind: CheckKind) {
  if (isChecked(notes, kind)) return notes || '';
  return [notes?.trim(), `checked: ${kind}`].filter(Boolean).join('\n');
}

/** remove a "present (suggested): …" line once the real present is written into the word */
export function withoutSuggestion(notes: string | null | undefined) {
  return (notes || '').replace(/^present \(suggested\):.*$/m, '').trim() || null;
}

export async function updateEntry(id: string, patch: Partial<Entry>) {
  const { data, error } = await supabase.from('entries').update(patch).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data as Entry;
}

export async function deleteEntry(id: string) {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Load every entry (Supabase returns at most 1000 rows per request). */
export async function loadAllEntries(): Promise<Entry[]> {
  const all: Entry[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...(data as Entry[]));
    if (data.length < 1000) break;
  }
  const byId = new Map(all.map((e) => [e.id, e]));
  return Array.from(byId.values());
}
