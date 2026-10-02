'use client';
import { parseForms } from '@/lib/forms';
import { WordWithForms } from '@/components/word-forms';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Entry, Topic } from '@/types';
import { cn, stripDiacritics } from '@/lib/utils';
import { Check, X, Loader2, SkipForward, Keyboard } from 'lucide-react';

/**
 * Typing practice: see English, type the Arabic yourself.
 * Diacritics-forgiving check. Shows the correct answer with full tashkeel on reveal.
 */

export default function WritePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string | 'all'>('all');
  const [pool, setPool] = useState<Entry[]>([]);
  const [current, setCurrent] = useState<Entry | null>(null);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'typing' | 'correct' | 'wrong' | 'revealed'>('typing');
  const [stats, setStats] = useState({ right: 0, wrong: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('topics').select('*').order('sort_order').then(({ data }) => setTopics((data as Topic[]) || []));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from('entries').select('*').limit(200);
      if (topicId !== 'all') q = q.eq('topic_id', topicId);
      const { data } = await q;
      const clean = ((data as Entry[]) || []).filter(
        (e) => !e.uncertain && e.english && e.english.length < 30 && parseForms(e.arabic || '', e.english).main.length < 20
      );
      setPool(clean.sort(() => Math.random() - 0.5));
      setLoading(false);
    })();
  }, [topicId]);

  useEffect(() => {
    if (pool.length > 0 && !current) next();
  }, [pool]);

  function next() {
    if (!pool.length) return;
    const remaining = pool.filter((e) => e.id !== current?.id);
    const pick = remaining[Math.floor(Math.random() * remaining.length)] || pool[0];
    setCurrent(pick);
    setInput('');
    setStatus('typing');
  }

  function check() {
    if (!current || !input.trim()) return;
    const user = stripDiacritics(input).trim();
    // accept the first form (singular / past), any spelling of it, or both forms as written
    const f = parseForms(current.arabic, current.english);
    const accepted = [f.raw, f.main, ...f.main.split(' / ')].map((x) => stripDiacritics(x).trim());
    const correct = accepted.includes(user);
    setStatus(correct ? 'correct' : 'wrong');
    setStats((s) => correct ? { ...s, right: s.right + 1 } : { ...s, wrong: s.wrong + 1 });
    if (correct) setTimeout(() => next(), 900);
  }

  function reveal() {
    setStatus('revealed');
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (status === 'typing') check();
      else next();
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Write it</h1>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-olive-300">✓ {stats.right}</span>
          <span className="text-rose-400">✗ {stats.wrong}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm">
          <option value="all">All topics</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-stone-200/60 py-20 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : !current ? (
        <div className="text-center text-stone-200/60 py-20">No entries available.</div>
      ) : (
        <>
          <div className="min-h-[100px] rounded-3xl border hairline bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 flex items-center justify-center text-center pop">
            <div>
              <div className="text-2xl font-semibold">{current.english.replace('[?]', '').trim()}</div>
              {parseForms(current.arabic, current.english).second && (
                <div className="mt-1 text-xs text-stone-200/60">
                  Type the {parseForms(current.arabic, current.english).kind === 'plural' ? 'singular' : 'past (he)'} form
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="اكتب بالعربي…"
              autoFocus
              dir="rtl"
              className={cn(
                'arabic w-full bg-white/5 border rounded-2xl px-4 py-4 text-right text-2xl focus:outline-none focus:ring-2 transition',
                status === 'typing' && 'hairline focus:ring-gold-500/40',
                status === 'correct' && 'border-olive-500/60 bg-olive-500/10 focus:ring-olive-500/40',
                status === 'wrong' && 'border-rose-500/60 bg-rose-500/10 focus:ring-rose-500/40',
                status === 'revealed' && 'border-stone-500/60 bg-stone-500/10'
              )}
            />
            <p className="text-[10px] text-stone-200/50 mt-2 text-center">
              <Keyboard className="w-3 h-3 inline mr-1" />
              Tashkeel (short vowels) is optional — we accept both.
              {typeof navigator !== 'undefined' && !/Android|iPhone|iPad/.test(navigator.userAgent) && (
                <span> Enable Arabic keyboard in your OS, or use an online Arabic keyboard.</span>
              )}
            </p>
          </div>

          {status === 'revealed' && (
            <div className="mt-4 p-4 rounded-xl bg-stone-800/40 border hairline">
              <div className="text-xs text-stone-200/60 mb-2">Correct answer:</div>
              <WordWithForms arabic={current.arabic} english={current.english} size="lg" className="text-gold-500" />
            </div>
          )}

          {status === 'wrong' && (
            <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/40">
              <div className="text-xs text-rose-300 mb-2">Not quite. Correct:</div>
              <WordWithForms arabic={current.arabic} english={current.english} size="lg" className="text-gold-500" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4">
            <button onClick={reveal} disabled={status !== 'typing'} className="bg-white/5 hover:bg-white/10 border hairline rounded-xl py-3 text-sm disabled:opacity-40">
              Show
            </button>
            <button onClick={check} disabled={status !== 'typing' || !input.trim()} className="bg-gold-500 hover:bg-gold-600 text-night-900 rounded-xl py-3 text-sm font-semibold disabled:opacity-40 col-span-1">
              Check
            </button>
            <button onClick={next} className="bg-white/5 hover:bg-white/10 border hairline rounded-xl py-3 text-sm flex items-center justify-center gap-1">
              <SkipForward className="w-3.5 h-3.5" /> Next
            </button>
          </div>

          <div className="text-center text-xs text-stone-200/50 mt-4">
            {current.page_label || ''}
          </div>
        </>
      )}
    </div>
  );
}
