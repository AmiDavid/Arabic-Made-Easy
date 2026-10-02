'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Entry, Topic } from '@/types';
import { RotateCcw, Check, X, Zap } from 'lucide-react';
import { grade, initialReview, type ReviewState } from '@/lib/srs';
import { WordWithForms, FormChip } from '@/components/word-forms';
import { parseForms, FORM_LABEL } from '@/lib/forms';

export default function FlashcardsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string | 'all'>('all');
  const [deck, setDeck] = useState<Entry[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [side, setSide] = useState<'ar-first' | 'en-first'>('ar-first');
  // 'meaning' = what does it mean; 'forms' = what's the plural / present form
  const [mode, setMode] = useState<'meaning' | 'forms'>('meaning');
  const [stats, setStats] = useState({ right: 0, wrong: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('topics').select('*').order('sort_order');
      setTopics((data as Topic[]) || []);
    })();
  }, []);

  async function loadDeck() {
    setLoaded(false);
    // count first, then take 50 from a random spot so every session is different
    let cq = supabase.from('entries').select('*', { count: 'exact', head: true });
    if (topicId !== 'all') cq = cq.eq('topic_id', topicId);
    if (mode === 'forms') cq = cq.like('arabic', '%،%');
    const { count } = await cq;
    const offset = Math.max(0, Math.floor(Math.random() * Math.max(0, (count || 0) - 50)));
    let q = supabase.from('entries').select('*').order('id').range(offset, offset + 49);
    if (topicId !== 'all') q = q.eq('topic_id', topicId);
    if (mode === 'forms') q = q.like('arabic', '%،%');
    const { data } = await q;
    let list = (data as Entry[]) || [];
    if (mode === 'forms') list = list.filter((e) => parseForms(e.arabic, e.english).second);
    const shuffled = list.sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setIdx(0);
    setShowBack(false);
    setStats({ right: 0, wrong: 0 });
    setLoaded(true);
  }

  useEffect(() => { loadDeck(); }, [topicId, mode]);

  const card = deck[idx];
  const forms = card ? parseForms(card.arabic, card.english) : null;
  const english = card ? card.english.replace('[?]', '').trim() : '';

  async function answer(quality: 0 | 1 | 2 | 3) {
    if (!card) return;
    // Fetch existing review state (or init)
    const { data } = await supabase.from('reviews').select('*').eq('entry_id', card.id).eq('user_id', 'me').single();
    const current: ReviewState = data ? {
      ease: data.ease, interval_days: data.interval_days, repetitions: data.repetitions, due_at: new Date(data.due_at),
    } : initialReview();
    const next = grade(current, quality);
    await supabase.from('reviews').upsert({
      entry_id: card.id,
      user_id: 'me',
      ease: next.ease,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      due_at: next.due_at.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    }, { onConflict: 'entry_id,user_id' });

    setStats((s) => quality >= 2 ? { ...s, right: s.right + 1 } : { ...s, wrong: s.wrong + 1 });
    if (idx + 1 >= deck.length) loadDeck();
    else { setIdx(idx + 1); setShowBack(false); }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Flashcards</h1>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="text-emerald-400">✓ {stats.right}</span>
          <span className="text-rose-400">✗ {stats.wrong}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 mb-3 bg-white/5 border hairline rounded-xl text-sm">
        {(['meaning', 'forms'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={
              'rounded-lg py-1.5 font-medium transition ' +
              (mode === m ? 'bg-gold-500/20 text-gold-300' : 'text-stone-200/70')
            }
          >
            {m === 'meaning' ? 'Meaning' : 'Plural / present form'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">All topics</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
        </select>
        {mode === 'meaning' && <button
          onClick={() => setSide(side === 'ar-first' ? 'en-first' : 'ar-first')}
          className="bg-white/5 border hairline rounded-xl px-3 py-2 text-sm flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {side === 'ar-first' ? 'AR → EN' : 'EN → AR'}
        </button>}
      </div>

      {!card ? (
        <div className="text-center text-gray-400 py-20">
          {!loaded ? 'Loading deck…' : mode === 'forms' ? 'No words with a second form in this topic yet.' : 'No words in this topic yet.'}
        </div>
      ) : (
        <>
          <div
            onClick={() => setShowBack(!showBack)}
            className="pop min-h-[280px] rounded-3xl border hairline bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none"
          >
            {mode === 'forms' && forms?.kind ? (
              <>
                <WordWithForms arabic={card.arabic} english={card.english} size="xl" align="center" hideSecond />
                <div className="mt-2 text-sm text-stone-200/70">{english}</div>
                <div className="mt-6 text-sm text-gold-300">
                  What's the {FORM_LABEL[forms.kind].long}?
                </div>
                {showBack && (
                  <div className="arabic mt-4 text-3xl pop">{forms.second}</div>
                )}
              </>
            ) : side === 'ar-first' ? (
              <>
                <WordWithForms arabic={card.arabic} english={card.english} size="xl" align="center" hideSecond />
                {showBack && (
                  <div className="pop mt-8">
                    <div className="text-xl text-gray-200">{english}</div>
                    {(forms?.second || forms?.feminine) && (
                      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                        {forms?.feminine && <FormChip label="f." text={forms.feminine} size="text-xl" />}
                        {forms?.second && forms.kind && (
                          <FormChip label={FORM_LABEL[forms.kind].short} text={forms.second} size="text-xl" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-2xl">{english}</div>
                {showBack && (
                  <div className="mt-8 pop">
                    <WordWithForms arabic={card.arabic} english={card.english} size="xl" align="center" />
                  </div>
                )}
              </>
            )}
            {!showBack && (
              <div className="mt-6 text-[11px] uppercase tracking-widest text-gray-500">tap to reveal</div>
            )}
          </div>

          {showBack && (
            <div className="pop grid grid-cols-4 gap-2 mt-4">
              <button onClick={() => answer(0)} className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl py-3 text-xs font-semibold flex flex-col items-center gap-1">
                <X className="w-4 h-4" /> Again
              </button>
              <button onClick={() => answer(1)} className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl py-3 text-xs font-semibold">Hard</button>
              <button onClick={() => answer(2)} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl py-3 text-xs font-semibold flex flex-col items-center gap-1">
                <Check className="w-4 h-4" /> Good
              </button>
              <button onClick={() => answer(3)} className="bg-brand-500/20 hover:bg-brand-500/30 text-brand-500 rounded-xl py-3 text-xs font-semibold flex flex-col items-center gap-1">
                <Zap className="w-4 h-4" /> Easy
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-xs text-gray-500">
            Card {idx + 1} of {deck.length} · {card.page_label || '—'}
          </div>
        </>
      )}
    </div>
  );
}
