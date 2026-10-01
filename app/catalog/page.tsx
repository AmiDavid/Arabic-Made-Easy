'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter } from 'lucide-react';
import { stripDiacritics } from '@/lib/utils';
import type { Entry, Topic } from '@/types';

export default function CatalogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [q, setQ] = useState('');
  const [topicId, setTopicId] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: e }] = await Promise.all([
        supabase.from('topics').select('*').order('sort_order'),
        supabase.from('entries').select('*').order('created_at', { ascending: false }).limit(3000),
      ]);
      setTopics((t as Topic[]) || []);
      setEntries((e as Entry[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = entries;
    if (topicId !== 'all') list = list.filter((e) => e.topic_id === topicId);
    if (q.trim()) {
      const bare = stripDiacritics(q.toLowerCase());
      list = list.filter(
        (e) =>
          stripDiacritics(e.arabic).toLowerCase().includes(bare) ||
          e.english.toLowerCase().includes(bare)
      );
    }
    return list.slice(0, 500);
  }, [entries, q, topicId]);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">Vocabulary</h1>
      <p className="text-sm text-gray-400 mb-4">{entries.length.toLocaleString()} entries</p>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Arabic or English…"
            className="w-full bg-white/5 border hairline rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="bg-white/5 border hairline rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name_en}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No matches.</div>
      ) : (
        <ul className="divide-y hairline border hairline rounded-2xl overflow-hidden bg-white/[0.02]">
          {filtered.map((e) => (
            <li key={e.id} className="p-3 flex items-baseline gap-4 hover:bg-white/[0.03]">
              <div className="arabic flex-1 text-right">{e.arabic}</div>
              <div className="flex-1 text-sm">
                <div>{e.english.replace('[?]', '')}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{e.page_label || '—'}</div>
              </div>
              {e.uncertain && <span className="text-[10px] text-amber-400">?</span>}
            </li>
          ))}
        </ul>
      )}
      {filtered.length === 500 && (
        <div className="text-xs text-gray-500 text-center mt-3">Showing first 500 — refine search to see more.</div>
      )}
    </div>
  );
}
