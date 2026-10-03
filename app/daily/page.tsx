'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Entry } from '@/types';
import { cn } from '@/lib/utils';
import { WordWithForms } from '@/components/word-forms';
import { GRAMMAR } from '@/lib/grammar-content';
import {
  Deck, answerText, buildOptions, cleanEnglish, fetchPool, mainArabic, markDailyDone,
  readDaily, recordResult, shuffle, todayKey, type Direction,
} from '@/lib/practice';
import { Check, X, Loader2, Flame, ArrowRight, Send, Mic, SkipForward, Sparkles } from 'lucide-react';

/**
 * Daily practice — about 5 minutes:
 *  1. Words      6 quick multiple-choice (your weak words first)
 *  2. Match      4 pairs
 *  3. Concept    one grammar rule from the notebook + a check
 *  4. Write      translate 2 short sentences (AI-graded)
 *  5. Talk       optional short chat with the teacher
 */

const STEPS = ['Words', 'Match', 'Concept', 'Write', 'Talk'] as const;
type Step = 0 | 1 | 2 | 3 | 4 | 5; // 5 = done

type Sentence = { english: string; arabic: string };

export default function DailyPage() {
  const [pool, setPool] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [sentences, setSentences] = useState<Sentence[] | null>(null);
  const [sentErr, setSentErr] = useState(false);
  const [daily, setDaily] = useState({ last: null as string | null, streak: 0, best: 0, total: 0 });
  const deck = useRef<Deck | null>(null);

  useEffect(() => {
    setDaily(readDaily());
    fetchPool(null)
      .then((p) => {
        deck.current = new Deck(p);
        setPool(p);
      })
      .catch((e) => setError(e?.message || 'Could not load words'))
      .finally(() => setLoading(false));
    // prepare the writing step in the background
    fetch('/api/sentences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'easy', count: 2 }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => (d.sentences?.length ? setSentences(d.sentences.slice(0, 2)) : setSentErr(true)))
      .catch(() => setSentErr(true));
  }, []);

  // words for the first two steps — chosen once
  const words = useMemo(() => {
    if (!deck.current || pool.length < 10) return null;
    const list: Entry[] = [];
    for (let i = 0; i < 10; i++) {
      const e = deck.current.next();
      if (e) list.push(e);
    }
    return { quiz: list.slice(0, 6), match: list.slice(6, 10) };
  }, [pool]);

  const tally = (ok: boolean) => setScore((s) => ({ right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1) }));

  function go(next: Step) {
    if (next === 5) setDaily(markDailyDone());
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  const doneToday = daily.last === todayKey();

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold">Daily practice</h1>
          <div className="arabic text-gold-500/70 text-sm">تَمرِين اليُوم</div>
        </div>
        <div className="flex items-center gap-1 text-gold-500 text-sm">
          <Flame className="w-4 h-4" /> {daily.streak} day{daily.streak === 1 ? '' : 's'}
        </div>
      </div>

      {step < 5 && (
        <div className="flex gap-1 mb-5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={cn('h-1.5 rounded-full', i < step ? 'bg-gold-500' : i === step ? 'bg-gold-500/60' : 'bg-white/10')} />
              <div className={cn('text-[10px] mt-1 text-center', i === step ? 'text-gold-500' : 'text-stone-200/40')}>
                {s}{i === 4 ? '*' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center text-stone-200/60 py-20 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Getting today's words…
        </div>
      ) : error || !words ? (
        <div className="text-center text-rose-300 py-20 text-sm">{error || 'Not enough words to practise.'}</div>
      ) : step === 0 ? (
        <QuizStep key="q" words={words.quiz} pool={pool} onAnswer={tally} onDone={() => go(1)} />
      ) : step === 1 ? (
        <MatchStep key="m" words={words.match} onAnswer={tally} onDone={() => go(2)} />
      ) : step === 2 ? (
        <ConceptStep onAnswer={tally} onDone={() => go(3)} />
      ) : step === 3 ? (
        <WriteStep sentences={sentences} failed={sentErr} onAnswer={tally} onDone={() => go(4)} />
      ) : step === 4 ? (
        <TalkStep onDone={() => go(5)} />
      ) : (
        <div className="text-center py-10 pop">
          <div className="text-5xl mb-3">🌿</div>
          <div className="display text-2xl text-gold-500">يَعطِيك العَافيِة!</div>
          <div className="text-stone-200/70 mt-1 text-sm">Done for today.</div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat label="Right" value={score.right} className="text-olive-300" />
            <Stat label="To review" value={score.wrong} className="text-rose-300" />
            <Stat label="Streak" value={daily.streak} className="text-gold-500" />
          </div>
          <p className="text-xs text-stone-200/50 mt-4">Words you missed will come up first next time.</p>
          <div className="flex gap-2 justify-center mt-6">
            <Link href="/" className="bg-white/5 border hairline rounded-xl px-4 py-2 text-sm">Home</Link>
            <Link href="/quiz" className="bg-gold-500 text-night-900 rounded-xl px-4 py-2 text-sm font-semibold">Keep going in Quiz</Link>
          </div>
        </div>
      )}

      {step === 0 && doneToday && !loading && (
        <p className="text-center text-[11px] text-stone-200/50 mt-4">You already practised today — this round is a bonus.</p>
      )}
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-xl border hairline bg-white/[0.03] py-3">
      <div className={cn('text-2xl font-semibold', className)}>{value}</div>
      <div className="text-[10px] text-stone-200/50">{label}</div>
    </div>
  );
}

function NextButton({ onClick, label = 'Next', disabled }: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="w-full mt-4 bg-gold-500 hover:bg-gold-600 text-night-900 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-40">
      {label} <ArrowRight className="w-4 h-4" />
    </button>
  );
}

// ---------------- 1. quick quiz ----------------

function QuizStep({ words, pool, onAnswer, onDone }: { words: Entry[]; pool: Entry[]; onAnswer: (ok: boolean) => void; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const entry = words[i];
  const dir: Direction = i % 2 === 0 ? 'ar-to-en' : 'en-to-ar';
  const options = useMemo(() => buildOptions(entry, pool, dir), [entry, pool, dir]);
  const correct = answerText(entry, dir);

  function pick(o: string) {
    if (picked) return;
    setPicked(o);
    const ok = o === correct;
    recordResult(entry.id, ok);
    onAnswer(ok);
  }

  function next() {
    if (i + 1 >= words.length) return onDone();
    setI(i + 1);
    setPicked(null);
  }

  return (
    <div>
      <div className="text-xs text-stone-200/50 mb-2">Word {i + 1} of {words.length} · {dir === 'ar-to-en' ? 'what does it mean?' : 'how do you say it?'}</div>
      <div className="min-h-[110px] rounded-3xl border hairline bg-white/[0.03] p-6 flex items-center justify-center text-center pop" key={entry.id}>
        {dir === 'ar-to-en'
          ? <WordWithForms arabic={entry.arabic} english={entry.english} size="xl" align="center" />
          : <div className="text-2xl font-semibold">{cleanEnglish(entry)}</div>}
      </div>
      <div className="grid gap-2 mt-4">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => pick(o)}
            disabled={!!picked}
            className={cn(
              'text-left p-3.5 rounded-xl border transition flex items-center justify-between',
              !picked && 'bg-white/[0.03] hover:bg-white/[0.07] hairline',
              picked && o === correct && 'bg-olive-500/20 border-olive-500/60 text-olive-200',
              picked && o === picked && o !== correct && 'bg-rose-500/20 border-rose-500/60 text-rose-200',
              picked && o !== correct && o !== picked && 'opacity-40 hairline'
            )}
          >
            <span className={cn(dir === 'en-to-ar' && 'arabic')}>{o}</span>
            {picked && o === correct && <Check className="w-5 h-5 text-olive-300" />}
            {picked && o === picked && o !== correct && <X className="w-5 h-5 text-rose-300" />}
          </button>
        ))}
      </div>
      {picked && <NextButton onClick={next} label={i + 1 >= words.length ? 'On to matching' : 'Next'} />}
    </div>
  );
}

// ---------------- 2. match ----------------

type Tile = { id: string; entry: Entry; side: 'ar' | 'en'; text: string };

function MatchStep({ words, onAnswer, onDone }: { words: Entry[]; onAnswer: (ok: boolean) => void; onDone: () => void }) {
  const tiles = useMemo(() => {
    const ar = shuffle(words.map((e) => ({ id: e.id + 'ar', entry: e, side: 'ar' as const, text: mainArabic(e) })));
    const en = shuffle(words.map((e) => ({ id: e.id + 'en', entry: e, side: 'en' as const, text: cleanEnglish(e) })));
    return { ar, en };
  }, [words]);
  const [sel, setSel] = useState<Tile | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [bad, setBad] = useState<string[]>([]);
  const missed = useRef<Set<string>>(new Set());

  function tap(t: Tile) {
    if (matched.has(t.entry.id)) return;
    if (!sel || sel.side === t.side) return setSel(sel?.id === t.id ? null : t);
    if (sel.entry.id === t.entry.id) {
      const m = new Set(matched).add(t.entry.id);
      setMatched(m);
      const firstTry = !missed.current.has(t.entry.id);
      recordResult(t.entry.id, firstTry);
      onAnswer(firstTry);
      setSel(null);
    } else {
      missed.current.add(sel.entry.id);
      setBad([sel.id, t.id]);
      setTimeout(() => { setBad([]); setSel(null); }, 500);
    }
  }

  const all = matched.size === words.length;
  const col = (list: Tile[]) => (
    <div className="grid gap-2">
      {list.map((t) => (
        <button
          key={t.id}
          onClick={() => tap(t)}
          className={cn(
            'rounded-xl border hairline p-3 min-h-[56px] text-sm transition',
            matched.has(t.entry.id) && 'opacity-25 pointer-events-none bg-olive-500/10',
            sel?.id === t.id && 'ring-2 ring-gold-500 bg-gold-500/10',
            bad.includes(t.id) && 'ring-2 ring-rose-500 bg-rose-500/20',
            !matched.has(t.entry.id) && sel?.id !== t.id && !bad.includes(t.id) && 'bg-white/[0.03]'
          )}
        >
          <span className={cn(t.side === 'ar' && 'arabic text-lg')}>{t.text}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="text-xs text-stone-200/50 mb-2">Tap a word, then its meaning</div>
      <div className="grid grid-cols-2 gap-2">
        {col(tiles.ar)}
        {col(tiles.en)}
      </div>
      {all && <NextButton onClick={onDone} label="On to today's concept" />}
    </div>
  );
}

// ---------------- 3. concept ----------------

function ConceptStep({ onAnswer, onDone }: { onAnswer: (ok: boolean) => void; onDone: () => void }) {
  const { rule, example, options } = useMemo(() => {
    const withEx = GRAMMAR.filter((g) => g.examples?.length);
    // rotate through the rules day by day
    const day = Math.floor(Date.now() / 86_400_000);
    const rule = withEx[day % withEx.length];
    const example = rule.examples[Math.floor(Math.random() * rule.examples.length)];
    const others = shuffle(
      withEx.flatMap((g) => g.examples).filter((x) => x.en && x.en !== example.en)
    );
    const seen = new Set([example.en]);
    const opts = [example.en];
    // prefer distractors from the same rule (harder), then other rules
    for (const x of [...shuffle(rule.examples), ...others]) {
      if (opts.length === 3) break;
      if (!seen.has(x.en)) { seen.add(x.en); opts.push(x.en); }
    }
    return { rule, example, options: shuffle(opts) };
  }, []);
  const [phase, setPhase] = useState<'learn' | 'check'>('learn');
  const [picked, setPicked] = useState<string | null>(null);

  if (phase === 'learn') {
    return (
      <div className="pop">
        <div className="text-xs text-stone-200/50 mb-2">Today's concept</div>
        <div className="rounded-3xl border hairline bg-white/[0.03] p-5">
          <div className="font-semibold text-lg text-stone-50">{rule.title}</div>
          <p className="text-sm text-stone-200/80 mt-2">{rule.summary}</p>
          <div className="mt-4 space-y-2">
            {rule.examples.slice(0, 4).map((x, i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] border hairline px-3 py-2">
                <div className="arabic text-right text-lg text-gold-500">{x.ar}</div>
                <div className="text-xs text-stone-200/70">{x.en}{x.note ? ` — ${x.note}` : ''}</div>
              </div>
            ))}
          </div>
          <Link href="/grammar" className="text-[11px] text-stone-200/50 underline mt-3 inline-block">Full rule in Grammar</Link>
        </div>
        <NextButton onClick={() => setPhase('check')} label="Quick check" />
      </div>
    );
  }

  return (
    <div className="pop">
      <div className="text-xs text-stone-200/50 mb-2">What does this mean?</div>
      <div className="rounded-3xl border hairline bg-white/[0.03] p-6 text-center">
        <div className="arabic text-2xl text-stone-50">{example.ar}</div>
      </div>
      <div className="grid gap-2 mt-4">
        {options.map((o) => (
          <button
            key={o}
            disabled={!!picked}
            onClick={() => { setPicked(o); onAnswer(o === example.en); }}
            className={cn(
              'text-left p-3.5 rounded-xl border text-sm transition',
              !picked && 'bg-white/[0.03] hover:bg-white/[0.07] hairline',
              picked && o === example.en && 'bg-olive-500/20 border-olive-500/60 text-olive-200',
              picked && o === picked && o !== example.en && 'bg-rose-500/20 border-rose-500/60 text-rose-200',
              picked && o !== example.en && o !== picked && 'opacity-40 hairline'
            )}
          >
            {o}
          </button>
        ))}
      </div>
      {picked && <NextButton onClick={onDone} label="On to writing" />}
    </div>
  );
}

// ---------------- 4. write ----------------

type Grade = { verdict: 'correct' | 'almost' | 'wrong'; corrected: string; feedback: string };

function WriteStep({ sentences, failed, onAnswer, onDone }: { sentences: Sentence[] | null; failed: boolean; onAnswer: (ok: boolean) => void; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (failed) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-stone-200/70">Couldn't prepare today's sentences (the AI didn't answer).</p>
        <NextButton onClick={onDone} label="Skip to conversation" />
      </div>
    );
  }
  if (!sentences) {
    return (
      <div className="text-center text-stone-200/60 py-16 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Preparing sentences from your words…
      </div>
    );
  }

  const s = sentences[i];

  async function check() {
    if (!text.trim()) return;
    setChecking(true);
    setErr(null);
    try {
      const r = await fetch('/api/check-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ english: s.english, reference: s.arabic, attempt: text }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not check');
      setGrade(d);
      onAnswer(d.verdict === 'correct');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setChecking(false);
    }
  }

  function next() {
    if (i + 1 >= sentences!.length) return onDone();
    setI(i + 1);
    setText('');
    setGrade(null);
  }

  return (
    <div className="pop" key={i}>
      <div className="text-xs text-stone-200/50 mb-2">Sentence {i + 1} of {sentences.length} · write it in Arabic</div>
      <div className="rounded-3xl border hairline bg-white/[0.03] p-5 text-center text-lg font-semibold">{s.english}</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!!grade}
        dir="rtl"
        rows={2}
        placeholder="اكتب بالعربي…"
        className="arabic w-full mt-3 bg-white/5 border hairline rounded-2xl px-4 py-3 text-right text-xl focus:outline-none focus:ring-2 focus:ring-gold-500/40"
      />
      {err && <p className="text-xs text-rose-300 mt-2">{err}</p>}
      {grade && (
        <div className={cn(
          'mt-3 rounded-xl border p-3',
          grade.verdict === 'correct' ? 'border-olive-500/50 bg-olive-500/10' : grade.verdict === 'almost' ? 'border-gold-500/50 bg-gold-500/10' : 'border-rose-500/50 bg-rose-500/10'
        )}>
          <div className="text-sm font-semibold">{grade.verdict === 'correct' ? 'مِنِيح! Correct' : grade.verdict === 'almost' ? 'Almost' : 'Not quite'}</div>
          <div className="arabic text-right text-lg text-gold-500 mt-1">{grade.corrected}</div>
          <div className="text-xs text-stone-200/70 mt-1">{grade.feedback}</div>
        </div>
      )}
      {!grade ? (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button onClick={() => { setGrade({ verdict: 'wrong', corrected: s.arabic, feedback: 'Here is one way to say it.' }); onAnswer(false); }} className="bg-white/5 border hairline rounded-xl py-3 text-sm">
            Show
          </button>
          <button onClick={check} disabled={!text.trim() || checking} className="col-span-2 bg-gold-500 text-night-900 rounded-xl py-3 text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
          </button>
        </div>
      ) : (
        <NextButton onClick={next} label={i + 1 >= sentences.length ? 'On to conversation' : 'Next sentence'} />
      )}
    </div>
  );
}

// ---------------- 5. talk (optional) ----------------

type Msg = { role: 'user' | 'assistant'; content: string; en?: string; fix?: string };
const MAX_TURNS = 3;
const OPENER = 'Start a short daily check-in conversation with me: greet me and ask ONE simple question about my day.';

function TalkStep({ onDone }: { onDone: () => void }) {
  const [started, setStarted] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showEn, setShowEn] = useState<number | null>(null);
  const userTurns = msgs.filter((m) => m.role === 'user').length;

  async function send(history: Msg[]) {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: OPENER }, ...history.map((m) => ({ role: m.role, content: m.content }))] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'The teacher did not answer');
      const fix = d.corrections?.[0] ? `${d.corrections[0].wrong} → ${d.corrections[0].right}: ${d.corrections[0].explanation}` : undefined;
      setMsgs((cur) => {
        const out = [...cur];
        if (fix) {
          for (let k = out.length - 1; k >= 0; k--) if (out[k].role === 'user') { out[k] = { ...out[k], fix }; break; }
        }
        return [...out, { role: 'assistant', content: d.arabic, en: d.english }];
      });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function start() {
    setStarted(true);
    send([]);
  }

  function reply() {
    if (!text.trim() || busy) return;
    const next = [...msgs, { role: 'user' as const, content: text.trim() }];
    setMsgs(next);
    setText('');
    send(next);
  }

  if (!started) {
    return (
      <div className="text-center py-6 pop">
        <Sparkles className="w-6 h-6 text-gold-500 mx-auto mb-2" />
        <div className="font-semibold">Short conversation <span className="text-stone-200/50 text-xs">(optional)</span></div>
        <p className="text-sm text-stone-200/70 mt-1">Three quick back-and-forths with the teacher, in writing.</p>
        <div className="grid gap-2 mt-5">
          <button onClick={start} className="bg-gold-500 text-night-900 rounded-xl py-3 text-sm font-semibold">Let's talk</button>
          <Link href="/voice" className="bg-white/5 border hairline rounded-xl py-3 text-sm flex items-center justify-center gap-1">
            <Mic className="w-4 h-4" /> Speak instead (voice chat)
          </Link>
          <button onClick={onDone} className="text-stone-200/60 text-sm py-2 flex items-center justify-center gap-1">
            <SkipForward className="w-4 h-4" /> Skip — finish for today
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {msgs.map((m, k) => (
          <div key={k} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[85%] rounded-2xl px-3 py-2', m.role === 'user' ? 'bg-gold-500/15 border border-gold-500/30' : 'bg-white/[0.05] border hairline')}>
              <div className="arabic text-right text-lg leading-relaxed" dir="rtl">{m.content}</div>
              {m.role === 'assistant' && m.en && (
                showEn === k
                  ? <div className="text-xs text-stone-200/60 mt-1">{m.en}</div>
                  : <button onClick={() => setShowEn(k)} className="text-[10px] text-stone-200/50 underline">English</button>
              )}
              {m.fix && <div className="text-[11px] text-gold-300 mt-1">✎ {m.fix}</div>}
            </div>
          </div>
        ))}
        {busy && <div className="text-stone-200/50 text-sm flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> …</div>}
        {err && <div className="text-rose-300 text-xs">{err} <button className="underline" onClick={() => send(msgs)}>retry</button></div>}
      </div>

      {userTurns < MAX_TURNS ? (
        <div className="flex gap-2 mt-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && reply()}
            dir="rtl"
            placeholder="جاوِب بالعربي…"
            className="arabic flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-right text-lg focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
          <button onClick={reply} disabled={busy || !text.trim()} className="bg-gold-500 text-night-900 rounded-xl px-3 disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : null}
      <NextButton onClick={onDone} label={userTurns >= MAX_TURNS ? 'Finish for today' : 'Finish now'} disabled={busy} />
    </div>
  );
}
