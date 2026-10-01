'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Entry, Topic } from '@/types';
import { cn } from '@/lib/utils';
import { Play, Trophy } from 'lucide-react';

type Card = { id: string; entryId: string; side: 'ar' | 'en'; text: string; matched: boolean };

const PAIRS = 8;

export default function MatchPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string | 'all'>('all');
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<[string, string] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('topics').select('*').order('sort_order').then(({ data }) => setTopics((data as Topic[]) || []));
    const stored = localStorage.getItem('match-best');
    if (stored) setBest(parseInt(stored, 10));
  }, []);

  useEffect(() => {
    if (!running) return;
    const int = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(int);
  }, [running]);

  const allMatched = cards.length > 0 && cards.every((c) => c.matched);
  useEffect(() => {
    if (allMatched && running) {
      setRunning(false);
      if (!best || elapsed < best) {
        localStorage.setItem('match-best', String(elapsed));
        setBest(elapsed);
      }
    }
  }, [allMatched, running]);

  async function startGame() {
    let q = supabase.from('entries').select('*').limit(200);
    if (topicId !== 'all') q = q.eq('topic_id', topicId);
    const { data } = await q;
    const pool = ((data as Entry[]) || []).filter((e) => e.arabic.length < 25 && e.english.length < 30);
    const picked = pool.sort(() => Math.random() - 0.5).slice(0, PAIRS);
    const c: Card[] = [];
    picked.forEach((e) => {
      c.push({ id: `${e.id}-ar`, entryId: e.id, side: 'ar', text: e.arabic, matched: false });
      c.push({ id: `${e.id}-en`, entryId: e.id, side: 'en', text: e.english.replace('[?]', '').trim(), matched: false });
    });
    setCards(c.sort(() => Math.random() - 0.5));
    setSelected(null);
    setElapsed(0);
    setRunning(true);
  }

  function pick(id: string) {
    const c = cards.find((x) => x.id === id);
    if (!c || c.matched) return;
    if (!selected) return setSelected(id);
    if (selected === id) return setSelected(null);
    const first = cards.find((x) => x.id === selected)!;
    if (first.entryId === c.entryId && first.side !== c.side) {
      setCards((cs) => cs.map((x) => (x.entryId === c.entryId ? { ...x, matched: true } : x)));
      setSelected(null);
    } else {
      setWrong([selected, id]);
      setTimeout(() => { setWrong(null); setSelected(null); }, 550);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Matching</h1>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-gray-400">⏱ {elapsed}s</div>
          {best && <div className="text-brand-500 flex items-center gap-1"><Trophy className="w-4 h-4" /> {best}s</div>}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm">
          <option value="all">All topics</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
        </select>
        <button onClick={startGame} className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1">
          <Play className="w-4 h-4" /> {cards.length ? 'Restart' : 'Start'}
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center text-gray-500 py-20">Pick a topic and hit Start</div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {cards.map((c) => {
            const sel = selected === c.id;
            const bad = wrong?.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => pick(c.id)}
                disabled={c.matched}
                className={cn(
                  'aspect-[3/4] rounded-xl border hairline text-center flex items-center justify-center p-2 text-sm transition',
                  c.matched && 'opacity-25 pointer-events-none',
                  sel && 'ring-2 ring-brand-500 bg-brand-500/10',
                  bad && 'ring-2 ring-rose-500 bg-rose-500/20 animate-pulse',
                  !c.matched && !sel && !bad && 'bg-white/[0.03] hover:bg-white/[0.06]'
                )}
              >
                <span className={cn(c.side === 'ar' && 'arabic')}>{c.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {allMatched && (
        <div className="mt-6 text-center pop">
          <div className="text-2xl font-bold text-brand-500">🎉 {elapsed}s</div>
          <div className="text-sm text-gray-400 mt-1">Nice.</div>
        </div>
      )}
    </div>
  );
}
