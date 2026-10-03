'use client';
import { WordWithForms } from '@/components/word-forms';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Entry, Topic } from '@/types';
import { cn } from '@/lib/utils';
import { Check, X, Zap, Loader2, RotateCcw } from 'lucide-react';
import { Deck, answerText, buildOptions, cleanEnglish, fetchPool, recordResult, type Direction } from '@/lib/practice';

/**
 * Multiple-choice quiz. Every word in the topic comes up once before anything
 * repeats; a word you miss comes back a few questions later; across sessions
 * the words you've seen least or got wrong come first.
 */

type Question = { entry: Entry; options: string[]; correct: string };

export default function QuizPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string | 'all'>('all');
  const [direction, setDirection] = useState<Direction>('ar-to-en');
  const [pool, setPool] = useState<Entry[]>([]);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [stats, setStats] = useState({ right: 0, wrong: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roundDone, setRoundDone] = useState(false);

  const deck = useRef<Deck | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirRef = useRef(direction);
  dirRef.current = direction;

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const deal = useCallback((p: Entry[], dir: Direction) => {
    clearTimer();
    setPicked(null);
    const d = deck.current;
    if (!d || p.length < 4) return setQ(null);
    const entry = d.next();
    if (!entry) {
      setRoundDone(true);
      return setQ(null);
    }
    setRoundDone(false);
    setQ({ entry, options: buildOptions(entry, p, dir), correct: answerText(entry, dir) });
  }, []);

  useEffect(() => {
    supabase.from('topics').select('*').order('sort_order').then(({ data }) => {
      const list = (data as Topic[]) || [];
      setTopics(list);
      // Support /quiz?topic=<slug> (e.g. from the weekly recap)
      const slug = new URLSearchParams(window.location.search).get('topic');
      const match = slug && list.find((t) => t.slug === slug);
      if (match) setTopicId(match.id);
    });
    return clearTimer;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      clearTimer();
      setLoading(true);
      setError(null);
      setQ(null);
      try {
        const p = await fetchPool(topicId === 'all' ? null : topicId);
        if (cancelled) return;
        deck.current = new Deck(p);
        setPool(p);
        deal(p, dirRef.current);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Could not load words');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topicId, deal]);

  function flipDirection() {
    const dir: Direction = direction === 'ar-to-en' ? 'en-to-ar' : 'ar-to-en';
    setDirection(dir);
    clearTimer();
    setPicked(null);
    // keep the same word, just ask it the other way round
    if (q) setQ({ entry: q.entry, options: buildOptions(q.entry, pool, dir), correct: answerText(q.entry, dir) });
    else deal(pool, dir);
  }

  function pick(opt: string) {
    if (picked || !q) return;
    setPicked(opt);
    const correct = opt === q.correct;
    recordResult(q.entry.id, correct);
    if (!correct) deck.current?.requeue(q.entry);
    setStats((s) => ({
      right: s.right + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
      streak: correct ? s.streak + 1 : 0,
    }));
    timer.current = setTimeout(() => deal(pool, dirRef.current), correct ? 700 : 1600);
  }

  function restart() {
    deck.current?.refill(pool);
    deal(pool, direction);
  }

  const d = deck.current;

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quiz</h1>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-olive-300">✓ {stats.right}</span>
          <span className="text-rose-400">✗ {stats.wrong}</span>
          {stats.streak >= 3 && (
            <span className="text-gold-500 flex items-center gap-0.5">
              <Zap className="w-3 h-3" /> {stats.streak}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm">
          <option value="all">All topics</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
        </select>
        <button onClick={flipDirection} className="bg-white/5 border hairline rounded-xl px-3 py-2 text-sm">
          {direction === 'ar-to-en' ? 'AR → EN' : 'EN → AR'}
        </button>
      </div>
      {d && pool.length >= 4 && !loading && (
        <div className="text-[10px] text-stone-200/50 mb-3 text-right">
          {Math.min(d.dealt, d.size)} / {d.size} words this round
        </div>
      )}

      {loading ? (
        <div className="text-center text-stone-200/60 py-20 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <div className="text-center text-rose-300 py-20 text-sm">{error}</div>
      ) : pool.length < 4 ? (
        <div className="text-center text-stone-200/60 py-20">Not enough words in this topic yet. Pick another.</div>
      ) : roundDone || !q ? (
        <div className="text-center py-16 pop">
          <div className="text-xl font-semibold text-gold-500">You went through every word here 🎉</div>
          <div className="text-sm text-stone-200/60 mt-1">✓ {stats.right} · ✗ {stats.wrong}</div>
          <button onClick={restart} className="mt-5 bg-gold-500 text-night-900 rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-1">
            <RotateCcw className="w-4 h-4" /> Go again
          </button>
        </div>
      ) : (
        <>
          <div className="min-h-[120px] rounded-3xl border hairline bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 flex items-center justify-center text-center pop">
            {direction === 'ar-to-en' ? (
              <WordWithForms arabic={q.entry.arabic} english={q.entry.english} size="xl" align="center" />
            ) : (
              <div className="text-3xl font-semibold">{cleanEnglish(q.entry)}</div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 mt-4">
            {q.options.map((opt) => {
              const isCorrect = opt === q.correct;
              const isPicked = opt === picked;
              const show = !!picked;
              return (
                <button
                  key={opt}
                  onClick={() => pick(opt)}
                  disabled={!!picked}
                  className={cn(
                    'text-left p-4 rounded-xl border transition flex items-center justify-between',
                    !show && 'bg-white/[0.03] hover:bg-white/[0.07] hairline',
                    show && isCorrect && 'bg-olive-500/20 border-olive-500/60 text-olive-200',
                    show && isPicked && !isCorrect && 'bg-rose-500/20 border-rose-500/60 text-rose-200',
                    show && !isCorrect && !isPicked && 'opacity-40 hairline'
                  )}
                >
                  <span className={cn(direction === 'en-to-ar' && 'arabic', 'text-base')}>{opt}</span>
                  {show && isCorrect && <Check className="w-5 h-5 text-olive-300" />}
                  {show && isPicked && !isCorrect && <X className="w-5 h-5 text-rose-300" />}
                </button>
              );
            })}
          </div>

          <div className="text-center text-xs text-stone-200/50 mt-4">{q.entry.page_label || ''}</div>
        </>
      )}
    </div>
  );
}
