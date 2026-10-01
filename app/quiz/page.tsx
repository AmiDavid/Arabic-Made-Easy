'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Entry, Topic } from '@/types';
import { cn } from '@/lib/utils';
import { Check, X, Zap, Loader2 } from 'lucide-react';

/**
 * Multiple-choice quiz: see an Arabic word, pick the correct English translation
 * from 4 options. Score tracked for the session.
 */

type Question = {
  entry: Entry;
  options: string[];
  correct: string;
};

export default function QuizPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string | 'all'>('all');
  const [direction, setDirection] = useState<'ar-to-en' | 'en-to-ar'>('ar-to-en');
  const [pool, setPool] = useState<Entry[]>([]);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [stats, setStats] = useState({ right: 0, wrong: 0, streak: 0, bestStreak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('topics').select('*').order('sort_order').then(({ data }) => setTopics((data as Topic[]) || []));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from('entries').select('*').limit(300);
      if (topicId !== 'all') query = query.eq('topic_id', topicId);
      const { data } = await query;
      // Filter: no uncertain, no super long, has both ar/en
      const clean = ((data as Entry[]) || []).filter(
        (e) => !e.uncertain && e.arabic?.length < 25 && e.english && e.english.length < 40
      );
      setPool(clean);
      setLoading(false);
    })();
  }, [topicId]);

  useEffect(() => {
    if (pool.length >= 4 && !q) nextQ();
  }, [pool]);

  function nextQ() {
    if (pool.length < 4) return;
    const correctEntry = pool[Math.floor(Math.random() * pool.length)];
    const otherPool = pool.filter((e) => e.id !== correctEntry.id);
    const distractors = otherPool.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [correctEntry, ...distractors]
      .map((e) => direction === 'ar-to-en' ? e.english.replace('[?]', '').trim() : e.arabic)
      .sort(() => Math.random() - 0.5);
    setQ({
      entry: correctEntry,
      options,
      correct: direction === 'ar-to-en' ? correctEntry.english.replace('[?]', '').trim() : correctEntry.arabic,
    });
    setPicked(null);
  }

  function pick(opt: string) {
    if (picked) return;
    setPicked(opt);
    const correct = opt === q!.correct;
    setStats((s) => {
      const streak = correct ? s.streak + 1 : 0;
      return {
        right: s.right + (correct ? 1 : 0),
        wrong: s.wrong + (correct ? 0 : 1),
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
      };
    });
    // auto-advance after a beat
    setTimeout(() => nextQ(), correct ? 700 : 1500);
  }

  const prompt = q && (direction === 'ar-to-en' ? q.entry.arabic : q.entry.english.replace('[?]', '').trim());

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

      <div className="flex gap-2 mb-4">
        <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm">
          <option value="all">All topics</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
        </select>
        <button onClick={() => { setDirection(direction === 'ar-to-en' ? 'en-to-ar' : 'ar-to-en'); setQ(null); }} className="bg-white/5 border hairline rounded-xl px-3 py-2 text-sm">
          {direction === 'ar-to-en' ? 'AR → EN' : 'EN → AR'}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-stone-200/60 py-20 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : pool.length < 4 ? (
        <div className="text-center text-stone-200/60 py-20">
          Not enough entries in this topic. Pick another.
        </div>
      ) : !q ? (
        <div className="text-center text-stone-200/60 py-20">Loading question…</div>
      ) : (
        <>
          <div className="min-h-[120px] rounded-3xl border hairline bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 flex items-center justify-center text-center pop">
            <div className={cn(direction === 'ar-to-en' && 'arabic', 'text-3xl font-semibold')}>
              {prompt}
            </div>
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

          <div className="text-center text-xs text-stone-200/50 mt-4">
            {q.entry.page_label || ''}
          </div>
        </>
      )}
    </div>
  );
}
