'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Check, Pencil, Trash2, Sparkles, ShieldCheck } from 'lucide-react';
import type { Entry, Topic } from '@/types';
import { supabase } from '@/lib/supabase';
import { loadAllEntries, updateEntry, deleteEntry, withChecked, isChecked, withoutSuggestion } from '@/lib/qa';
import { parseForms } from '@/lib/forms';
import { verbInfo } from '@/lib/verbs';
import { stripDiacritics, cn } from '@/lib/utils';
import { WordWithForms } from '@/components/word-forms';
import { EditEntrySheet } from '@/components/edit-entry-sheet';

type Tab = 'unclear' | 'suggested' | 'twice' | 'ai';
type Finding = { id: string; problem: string; fixed_arabic: string; fixed_english: string; confidence: string };

const TABS: { id: Tab; label: string; help: string }[] = [
  {
    id: 'unclear',
    label: 'Unclear',
    help: 'Words marked ? because the handwriting was hard to read. Check them against the notebook page.',
  },
  {
    id: 'suggested',
    label: 'Suggested ✦',
    help: 'Verbs where your notebook has only the past form, so the app suggested the present. Confirm or fix it: the conjugation tables are built from it.',
  },
  {
    id: 'twice',
    label: 'Twice',
    help: 'The same word saved more than once. Delete the extra copy, or keep both if they are different meanings or pages.',
  },
  {
    id: 'ai',
    label: 'AI check',
    help: 'An AI teacher proof-reads a topic and points out likely typos, wrong translations or wrong plural/present forms. You decide what to apply.',
  },
];

export default function CheckPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('unclear');
  const [edit, setEdit] = useState<{ entry: Entry; presetSecond?: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [all, t] = await Promise.all([
          loadAllEntries(),
          supabase.from('topics').select('*').order('sort_order'),
        ]);
        setEntries(all);
        setTopics((t.data as Topic[]) || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const replace = useCallback((u: Entry) => setEntries((l) => l.map((x) => (x.id === u.id ? u : x))), []);
  const remove = useCallback((id: string) => setEntries((l) => l.filter((x) => x.id !== id)), []);

  async function run(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  // ---------- queues ----------
  const unclear = useMemo(() => entries.filter((e) => e.uncertain || /\[\?\]/.test(e.english)), [entries]);

  const suggested = useMemo(
    () =>
      entries
        .map((e) => ({ e, v: verbInfo(e.arabic, e.english, e.notes) }))
        .filter((x) => x.v?.presentSuggested && x.v.present),
    [entries]
  );

  const twice = useMemo(() => {
    const groups = new Map<string, Entry[]>();
    for (const e of entries) {
      const key = stripDiacritics(parseForms(e.arabic, e.english).main.split(' / ')[0]).trim();
      if (!key) continue;
      groups.set(key, [...(groups.get(key) || []), e]);
    }
    return Array.from(groups.values()).filter(
      (g) => g.length > 1 && !g.every((e) => isChecked(e.notes, 'duplicate'))
    );
  }, [entries]);

  const counts: Record<Tab, number | null> = {
    unclear: unclear.length,
    suggested: suggested.length,
    twice: twice.length,
    ai: null,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-gold-400" /> Check & fix
      </h1>
      <p className="text-sm text-stone-200/70 mt-1 mb-4">
        Go through what might be wrong, one item at a time. You can also fix any word from the Words list (✎) or any
        verb from its conjugation table.
      </p>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 mb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-sm border transition',
              tab === t.id ? 'bg-gold-500/20 border-gold-500/50 text-gold-100' : 'bg-white/5 border-white/10 text-stone-200/70'
            )}
          >
            {t.label}
            {counts[t.id] !== null && !loading && <span className="ml-1.5 text-xs opacity-70">{counts[t.id]}</span>}
          </button>
        ))}
      </div>
      <p className="text-xs text-stone-200/60 mb-4">{TABS.find((t) => t.id === tab)!.help}</p>
      {error && <p className="text-sm text-rose-300 mb-3">{error}</p>}

      {loading ? (
        <div className="py-16 text-center text-stone-200/60 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your words…
        </div>
      ) : tab === 'unclear' ? (
        <Queue empty="Nothing unclear left. 🎉">
          {unclear.map((e) => (
            <Card key={e.id} entry={e}>
              <Btn
                kind="ok"
                busy={busyId === e.id}
                onClick={() =>
                  run(e.id, async () =>
                    replace(
                      await updateEntry(e.id, {
                        uncertain: false,
                        english: e.english.replace(/\s*\[\?\]\s*/g, ' ').trim(),
                        notes: withChecked(e.notes, 'ok'),
                      })
                    )
                  )
                }
              >
                It's right
              </Btn>
              <Btn kind="edit" onClick={() => setEdit({ entry: e })}>Fix</Btn>
              <Btn kind="delete" busy={busyId === e.id} onClick={() => confirmDelete(e, () => run(e.id, async () => { await deleteEntry(e.id); remove(e.id); }))} />
            </Card>
          ))}
        </Queue>
      ) : tab === 'suggested' ? (
        <Queue empty="Every verb has its present form confirmed. 🎉">
          {suggested.map(({ e, v }) => (
            <Card key={e.id} entry={e} showSuggestion>
              <Btn
                kind="ok"
                busy={busyId === e.id}
                onClick={() =>
                  run(e.id, async () =>
                    replace(
                      await updateEntry(e.id, {
                        arabic: `${e.arabic.split('،')[0].trim()}، ${v!.present}`,
                        notes: withChecked(withoutSuggestion(e.notes), 'ok'),
                      })
                    )
                  )
                }
              >
                Present is right
              </Btn>
              <Btn kind="edit" onClick={() => setEdit({ entry: e, presetSecond: v!.present! })}>Fix</Btn>
            </Card>
          ))}
        </Queue>
      ) : tab === 'twice' ? (
        <Queue empty="No words saved twice. 🎉">
          {twice.slice(0, 60).map((g) => (
            <div key={g[0].id} className="rounded-2xl border hairline bg-night-800/60 overflow-hidden">
              {g.map((e) => (
                <div key={e.id} className="p-3 flex items-start gap-3 border-b hairline last:border-b-0">
                  <WordWithForms arabic={e.arabic} english={e.english} notes={e.notes} className="flex-1" size="sm" />
                  <div className="flex-1 text-sm">
                    <div>{e.english}</div>
                    <div className="text-[11px] text-stone-200/50">{e.page_label || '—'}</div>
                  </div>
                  <div className="flex gap-1">
                    <Btn kind="edit" small onClick={() => setEdit({ entry: e })} />
                    <Btn
                      kind="delete"
                      small
                      busy={busyId === e.id}
                      onClick={() => confirmDelete(e, () => run(e.id, async () => { await deleteEntry(e.id); remove(e.id); }))}
                    />
                  </div>
                </div>
              ))}
              <div className="p-2 bg-white/[0.02] flex justify-end">
                <Btn
                  kind="ok"
                  busy={busyId === g[0].id}
                  onClick={() =>
                    run(g[0].id, async () => {
                      for (const e of g) replace(await updateEntry(e.id, { notes: withChecked(e.notes, 'duplicate') }));
                    })
                  }
                >
                  Keep all ({g.length})
                </Btn>
              </div>
            </div>
          ))}
          {twice.length > 60 && (
            <p className="text-xs text-stone-200/60 text-center">Showing 60 of {twice.length}. More appear as you clear these.</p>
          )}
        </Queue>
      ) : (
        <AiCheck entries={entries} topics={topics} onApplied={replace} />
      )}

      {edit && (
        <EditEntrySheet
          entry={edit.entry}
          presetSecond={edit.presetSecond}
          onClose={() => setEdit(null)}
          onSaved={replace}
          onDeleted={remove}
        />
      )}
    </div>
  );
}

function confirmDelete(e: Entry, go: () => void) {
  if (confirm(`Delete "${e.arabic}" (${e.english})? This can't be undone.`)) go();
}

function Queue({ children, empty }: { children: React.ReactNode; empty: string }) {
  const list = Array.isArray(children) ? children.flat().filter(Boolean) : children ? [children] : [];
  if (!list.length) return <div className="py-16 text-center text-stone-200/70">{empty}</div>;
  return <div className="space-y-3">{children}</div>;
}

function Card({ entry, children, showSuggestion }: { entry: Entry; children: React.ReactNode; showSuggestion?: boolean }) {
  return (
    <div className="rounded-2xl border hairline bg-night-800/60 p-3">
      <div className="flex items-start gap-3">
        <WordWithForms
          arabic={entry.arabic}
          english={entry.english}
          notes={entry.notes}
          showVerbCase={showSuggestion}
          className="flex-1"
        />
        <div className="flex-1 text-sm">
          <div>{entry.english}</div>
          <div className="text-[11px] text-stone-200/50 mt-0.5">{entry.page_label || '—'}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 justify-end">{children}</div>
    </div>
  );
}

function Btn({
  kind,
  children,
  onClick,
  busy,
  small,
}: {
  kind: 'ok' | 'edit' | 'delete';
  children?: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
  small?: boolean;
}) {
  const style = {
    ok: 'bg-olive-500/20 border-olive-500/40 text-olive-100',
    edit: 'bg-white/5 border-white/10 text-stone-100',
    delete: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
  }[kind];
  const Icon = { ok: Check, edit: Pencil, delete: Trash2 }[kind];
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn(
        'rounded-xl border flex items-center gap-1.5 disabled:opacity-60',
        small ? 'p-1.5' : 'px-3 py-1.5 text-sm',
        style
      )}
      aria-label={kind === 'delete' ? 'Delete' : kind === 'edit' ? 'Fix' : undefined}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

function AiCheck({ entries, topics, onApplied }: { entries: Entry[]; topics: Topic[]; onApplied: (e: Entry) => void }) {
  const [topicId, setTopicId] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, 'applied' | 'ignored'>>({});
  const [offset, setOffset] = useState(0);
  const BATCH = 50;

  const pool = useMemo(
    () => entries.filter((e) => (topicId ? e.topic_id === topicId : true)).sort((a, b) => a.id.localeCompare(b.id)),
    [entries, topicId]
  );
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);

  async function check() {
    const batch = pool.slice(offset, offset + BATCH);
    if (!batch.length) return;
    setRunning(true);
    setError(null);
    setFindings(null);
    setDone({});
    try {
      const resp = await fetch('/api/qa/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: topics.find((t) => t.id === topicId)?.name_en,
          entries: batch.map((e) => ({ id: e.id, arabic: e.arabic, english: e.english })),
        }),
      });
      const json = await resp.json();
      if (!resp.ok || json.error) throw new Error(json.error || `HTTP ${resp.status}`);
      setFindings(json.findings);
      setOffset(offset + batch.length);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  async function apply(f: Finding) {
    const e = byId.get(f.id);
    if (!e) return;
    try {
      const u = await updateEntry(e.id, {
        arabic: f.fixed_arabic.trim() || e.arabic,
        english: f.fixed_english.trim() || e.english,
        notes: withChecked(e.notes, 'ai'),
      });
      onApplied(u);
      setDone((d) => ({ ...d, [f.id]: 'applied' }));
    } catch (err: any) {
      setError(err.message);
    }
  }

  const remaining = Math.max(0, pool.length - offset);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <select
          value={topicId}
          onChange={(e) => {
            setTopicId(e.target.value);
            setOffset(0);
            setFindings(null);
          }}
          className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2.5 text-sm"
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name_en}
            </option>
          ))}
        </select>
        <button
          onClick={check}
          disabled={running || !remaining}
          className="rounded-xl bg-gold-500/25 border border-gold-500/50 text-gold-100 px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {offset === 0 ? `Check ${Math.min(BATCH, pool.length)} words` : `Check next ${Math.min(BATCH, remaining)}`}
        </button>
      </div>
      <p className="text-xs text-stone-200/50 mb-4">
        {offset > 0 ? `${offset} of ${pool.length} checked in this topic.` : `${pool.length} words in this topic.`} Takes
        about 20 seconds per batch.
      </p>
      {error && <p className="text-sm text-rose-300 mb-3">{error}</p>}

      {findings && findings.length === 0 && (
        <div className="py-10 text-center text-stone-200/70">No problems found in this batch. 👍</div>
      )}
      <div className="space-y-3">
        {findings?.map((f) => {
          const e = byId.get(f.id);
          if (!e) return null;
          const state = done[f.id];
          return (
            <div key={f.id} className={cn('rounded-2xl border hairline bg-night-800/60 p-3', state && 'opacity-50')}>
              <div className="text-sm text-amber-200 mb-2">
                {f.problem}{' '}
                {f.confidence === 'medium' && <span className="text-[11px] text-stone-200/50">(not sure)</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-stone-200/50 mb-1">Now</div>
                  <div className="arabic text-lg text-right">{e.arabic}</div>
                  <div className="text-stone-200/80">{e.english}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-olive-300/80 mb-1">Suggested fix</div>
                  <div className="arabic text-lg text-right text-olive-100">{f.fixed_arabic}</div>
                  <div className="text-olive-100/90">{f.fixed_english}</div>
                </div>
              </div>
              <div className="text-[11px] text-stone-200/50 mt-1">{e.page_label}</div>
              {!state ? (
                <div className="flex gap-2 justify-end mt-2">
                  <Btn kind="ok" onClick={() => apply(f)}>Apply fix</Btn>
                  <button
                    onClick={() => setDone((d) => ({ ...d, [f.id]: 'ignored' }))}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm"
                  >
                    Ignore
                  </button>
                </div>
              ) : (
                <div className="text-right text-xs mt-2 text-stone-200/70">{state === 'applied' ? '✓ Fixed' : 'Ignored'}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
