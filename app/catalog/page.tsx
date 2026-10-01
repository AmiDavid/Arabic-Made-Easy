'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, RefreshCw } from 'lucide-react';
import { cn, stripDiacritics } from '@/lib/utils';
import type { Entry, Topic } from '@/types';

const PAGE_LIMIT = 500;

export default function CatalogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [q, setQ] = useState('');
  const [topicId, setTopicId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lastLoad = useRef(0);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    const { data: t } = await supabase.from('topics').select('*').order('sort_order');
    setTopics((t as Topic[]) || []);

    // Supabase caps each request at 1000 rows → fetch in pages.
    // Order by created_at AND id: many rows share the same created_at (bulk import),
    // and paging on a non-unique order returns duplicates and skips rows.
    const BATCH = 1000;
    const byId = new Map<string, Entry>();
    for (let from = 0; from <= 20000; from += BATCH) {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + BATCH - 1);
      if (error || !data?.length) break;
      for (const e of data as Entry[]) byId.set(e.id, e);
      if (data.length < BATCH) break;
    }
    setEntries(Array.from(byId.values()));
    lastLoad.current = Date.now();
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    // Reload when coming back to the app (e.g. after scanning a page elsewhere)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastLoad.current > 20_000) load(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const matching = useMemo(() => {
    let list = entries;
    if (topicId !== 'all') list = list.filter((e) => e.topic_id === topicId);
    if (q.trim()) {
      const bare = stripDiacritics(q.toLowerCase().trim());
      list = list.filter(
        (e) => stripDiacritics(e.arabic).toLowerCase().includes(bare) || e.english.toLowerCase().includes(bare)
      );
    }
    return list;
  }, [entries, q, topicId]);

  const shown = matching.slice(0, PAGE_LIMIT);
  const filtering = topicId !== 'all' || q.trim() !== '';

  function changeTopic(id: string) {
    setTopicId(id);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Vocabulary</h1>
        <button
          onClick={() => load(true)}
          className="text-xs text-stone-200/60 hover:text-gold-400 flex items-center gap-1"
          aria-label="Reload vocabulary"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} /> Reload
        </button>
      </div>
      <p className="text-sm text-stone-200/70 mb-4">
        {loading
          ? 'Loading…'
          : filtering
            ? `${matching.length.toLocaleString()} of ${entries.length.toLocaleString()} entries`
            : `${entries.length.toLocaleString()} entries`}
      </p>

      <div className="flex gap-2 mb-3 sticky top-0 z-10 bg-night-900/90 backdrop-blur py-2 -mx-4 px-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-200/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Arabic or English…"
            className="w-full bg-white/5 border hairline rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
        </div>
        <select
          value={topicId}
          onChange={(e) => changeTopic(e.target.value)}
          className="max-w-[45%] bg-white/5 border hairline rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          aria-label="Filter by topic"
        >
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name_en}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-stone-200/60 py-12">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="text-center text-stone-200/60 py-12">No matches.</div>
      ) : (
        <ul
          key={`${topicId}|${q}`}
          className="divide-y hairline border hairline rounded-2xl overflow-hidden bg-night-800/60"
        >
          {shown.map((e) => (
            <li key={e.id} className="p-3 flex items-baseline gap-4">
              <div className="arabic flex-1 text-right">{e.arabic}</div>
              <div className="flex-1 text-sm">
                <div>{e.english.replace('[?]', '')}</div>
                <div className="text-[11px] text-stone-200/50 mt-0.5">{e.page_label || '—'}</div>
              </div>
              {e.uncertain && <span className="text-[11px] text-amber-400" title="Uncertain reading">?</span>}
            </li>
          ))}
        </ul>
      )}
      {matching.length > PAGE_LIMIT && (
        <div className="text-xs text-stone-200/60 text-center mt-3">
          Showing the first {PAGE_LIMIT} of {matching.length.toLocaleString()} — search or pick a topic to narrow it down.
        </div>
      )}
    </div>
  );
}
