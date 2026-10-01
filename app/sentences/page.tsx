'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Topic } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, Volume2, Lightbulb, Eye, EyeOff, Plus, Check, ArrowRight, Keyboard, NotebookPen } from 'lucide-react';

type Sentence = {
  english: string;
  arabic: string;
  transliteration?: string;
  words_used?: { arabic: string; english: string }[];
  grammar_note?: string;
};

type Grade = {
  verdict: 'correct' | 'almost' | 'wrong';
  corrected: string;
  feedback: string;
  issues?: { theirs: string; better: string; why: string }[];
};

type Level = 'easy' | 'medium' | 'hard';
type Mode = 'type' | 'notebook';

export default function SentencesPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string>('');
  const [level, setLevel] = useState<Level>('easy');
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState<Mode>('type');

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // type-mode state
  const [idx, setIdx] = useState(0);
  const [attempt, setAttempt] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [checking, setChecking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, almost: 0, wrong: 0 });
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  // notebook-mode state
  const [shown, setShown] = useState<Record<number, boolean>>({});

  useEffect(() => {
    supabase
      .from('topics')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setTopics((data as Topic[]) || []));
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    setSentences([]);
    setIdx(0);
    setAttempt('');
    setGrade(null);
    setShowHint(false);
    setRevealed(false);
    setScore({ correct: 0, almost: 0, wrong: 0 });
    setSaved({});
    setShown({});
    try {
      const topic = topics.find((t) => t.id === topicId);
      const resp = await fetch('/api/sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topicId || undefined, topicName: topic?.name_en, level, count }),
      });
      const json = await resp.json().catch(() => ({ error: `Server error (HTTP ${resp.status})` }));
      if (json.error) throw new Error(json.debug ? `${json.error} — details: ${json.debug}` : json.error);
      setSentences(json.sentences);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function check() {
    const s = sentences[idx];
    if (!s || !attempt.trim()) return;
    setChecking(true);
    setError(null);
    try {
      const resp = await fetch('/api/check-translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ english: s.english, reference: s.arabic, attempt }),
      });
      const json = await resp.json();
      if (json.error) throw new Error(json.error);
      setGrade(json);
      setScore((sc) => ({ ...sc, [json.verdict]: sc[json.verdict as keyof typeof sc] + 1 }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setChecking(false);
    }
  }

  function next() {
    setIdx((i) => i + 1);
    setAttempt('');
    setGrade(null);
    setShowHint(false);
    setRevealed(false);
  }

  async function speak(text: string) {
    const resp = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!resp.ok) return;
    const buf = await resp.arrayBuffer();
    new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }))).play();
  }

  async function saveSentence(i: number) {
    const s = sentences[i];
    const resp = await fetch('/api/vocab/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ arabic: s.arabic, english: s.english, notes: s.grammar_note }],
        source: 'sentences',
        entryType: 'phrase',
      }),
    });
    if (resp.ok) setSaved((m) => ({ ...m, [i]: true }));
  }

  const current = sentences[idx];
  const finished = sentences.length > 0 && idx >= sentences.length;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">Translate sentences</h1>
      <p className="text-sm text-stone-200/70 mb-4">
        Fresh sentences built from your own vocabulary. Translate them into Palestinian Arabic, in the app or in your notebook.
      </p>

      {/* Settings */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm"
          >
            <option value="">All my vocabulary</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name_en}
              </option>
            ))}
          </select>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="bg-white/5 border hairline rounded-xl px-3 py-2 text-sm"
          >
            <option value={5}>5 sentences</option>
            <option value={10}>10 sentences</option>
          </select>
        </div>
        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as Level[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={cn(
                'flex-1 rounded-xl py-2 text-sm border capitalize transition',
                level === l ? 'bg-gold-500/15 border-gold-500/60 text-gold-400' : 'bg-white/5 hairline text-stone-200/70'
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('type')}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm border flex items-center justify-center gap-1.5 transition',
              mode === 'type' ? 'bg-olive-500/20 border-olive-500/60 text-olive-100' : 'bg-white/5 hairline text-stone-200/70'
            )}
          >
            <Keyboard className="w-4 h-4" /> Type in the app
          </button>
          <button
            onClick={() => setMode('notebook')}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm border flex items-center justify-center gap-1.5 transition',
              mode === 'notebook' ? 'bg-olive-500/20 border-olive-500/60 text-olive-100' : 'bg-white/5 hairline text-stone-200/70'
            )}
          >
            <NotebookPen className="w-4 h-4" /> Write in notebook
          </button>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-gold-500 hover:bg-gold-600 text-night-900 rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Writing sentences…' : sentences.length ? 'New sentences' : 'Generate sentences'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200 text-sm">{error}</div>
      )}

      {/* ---------- NOTEBOOK MODE ---------- */}
      {mode === 'notebook' && sentences.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-200/60">
            <span>Write your translations in your notebook, then check each one.</span>
            <button
              onClick={() => {
                const all = Object.keys(shown).length === sentences.length && Object.values(shown).every(Boolean);
                setShown(Object.fromEntries(sentences.map((_, i) => [i, !all])));
              }}
              className="text-gold-500 hover:text-gold-400 shrink-0 ml-2"
            >
              Show / hide all
            </button>
          </div>
          <ol className="space-y-3">
            {sentences.map((s, i) => (
              <li key={i} className="rounded-xl border hairline bg-white/[0.03] p-3">
                <div className="flex gap-3">
                  <span className="text-gold-500 font-semibold">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="text-stone-50">{s.english}</div>
                    {shown[i] ? (
                      <div className="mt-2 pt-2 border-t hairline pop">
                        <div className="arabic text-right text-gold-400">{s.arabic}</div>
                        {s.transliteration && <div className="text-xs text-stone-200/60 italic mt-1">{s.transliteration}</div>}
                        {s.grammar_note && <div className="text-xs text-olive-300 mt-1">{s.grammar_note}</div>}
                        <div className="flex gap-3 mt-2">
                          <button onClick={() => speak(s.arabic)} className="text-xs text-gold-500 flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Listen
                          </button>
                          <button
                            onClick={() => saveSentence(i)}
                            disabled={saved[i]}
                            className="text-xs text-gold-500 flex items-center gap-1 disabled:text-olive-300"
                          >
                            {saved[i] ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            {saved[i] ? 'Saved' : 'Save to my vocab'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShown((m) => ({ ...m, [i]: true }))}
                        className="mt-2 text-xs text-stone-200/60 hover:text-gold-400 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Show answer
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ---------- TYPE MODE ---------- */}
      {mode === 'type' && current && (
        <div className="pop" key={idx}>
          <div className="flex items-center justify-between text-xs text-stone-200/60 mb-2">
            <span>
              Sentence {idx + 1} of {sentences.length}
            </span>
            <span>
              <span className="text-olive-300">✓ {score.correct}</span> · <span className="text-gold-400">~ {score.almost}</span> ·{' '}
              <span className="text-rose-400">✗ {score.wrong}</span>
            </span>
          </div>

          <div className="rounded-3xl border hairline bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 text-center">
            <div className="text-xl font-semibold text-stone-50">{current.english}</div>
          </div>

          <div className="flex gap-3 mt-3 text-xs">
            <button onClick={() => setShowHint((h) => !h)} className="text-gold-500 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" /> {showHint ? 'Hide hint' : 'Hint: words to use'}
            </button>
          </div>
          {showHint && current.words_used?.length ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {current.words_used.map((w, i) => (
                <span key={i} className="text-xs bg-white/5 border hairline rounded-full px-2.5 py-1">
                  <span className="arabic text-[1.1em]">{w.arabic}</span> <span className="text-stone-200/60">= {w.english}</span>
                </span>
              ))}
            </div>
          ) : null}

          <textarea
            value={attempt}
            onChange={(e) => setAttempt(e.target.value)}
            dir="rtl"
            rows={2}
            placeholder="اكتب الترجمة بالعربي…"
            disabled={!!grade}
            className="arabic w-full mt-3 bg-white/5 border hairline rounded-2xl px-4 py-3 text-right text-xl focus:outline-none focus:ring-2 focus:ring-gold-500/40 disabled:opacity-80"
          />

          {!grade ? (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => setRevealed(true)}
                className="bg-white/5 hover:bg-white/10 border hairline rounded-xl py-3 text-sm flex items-center justify-center gap-1.5"
              >
                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} Show answer
              </button>
              <button
                onClick={check}
                disabled={checking || !attempt.trim()}
                className="bg-gold-500 hover:bg-gold-600 text-night-900 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Check
              </button>
            </div>
          ) : (
            <div
              className={cn(
                'mt-3 rounded-2xl p-4 border pop',
                grade.verdict === 'correct' && 'bg-olive-500/15 border-olive-500/50',
                grade.verdict === 'almost' && 'bg-gold-500/10 border-gold-500/50',
                grade.verdict === 'wrong' && 'bg-rose-500/10 border-rose-500/50'
              )}
            >
              <div className="font-semibold mb-1">
                {grade.verdict === 'correct' ? 'Correct' : grade.verdict === 'almost' ? 'Almost there' : 'Not quite'}
              </div>
              <div className="text-sm text-stone-200/90">{grade.feedback}</div>
              {grade.issues?.map((iss, i) => (
                <div key={i} className="text-sm mt-2">
                  <span className="arabic line-through text-rose-300/80">{iss.theirs}</span>
                  <span className="mx-2 text-stone-200/50">→</span>
                  <span className="arabic text-olive-200">{iss.better}</span>
                  <div className="text-xs text-stone-200/60">{iss.why}</div>
                </div>
              ))}
              {grade.verdict !== 'correct' && (
                <div className="mt-3 pt-3 border-t hairline">
                  <div className="text-xs text-stone-200/60 mb-1">Your sentence, corrected:</div>
                  <div className="arabic text-right text-gold-400">{grade.corrected}</div>
                </div>
              )}
            </div>
          )}

          {(revealed || grade) && (
            <div className="mt-3 rounded-2xl p-4 bg-white/[0.03] border hairline pop">
              <div className="text-xs text-stone-200/60 mb-1">Reference translation:</div>
              <div className="arabic text-right text-lg">{current.arabic}</div>
              {current.transliteration && <div className="text-xs text-stone-200/60 italic mt-1">{current.transliteration}</div>}
              {current.grammar_note && <div className="text-xs text-olive-300 mt-2">{current.grammar_note}</div>}
              <div className="flex gap-4 mt-3">
                <button onClick={() => speak(current.arabic)} className="text-xs text-gold-500 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> Listen
                </button>
                <button
                  onClick={() => saveSentence(idx)}
                  disabled={saved[idx]}
                  className="text-xs text-gold-500 flex items-center gap-1 disabled:text-olive-300"
                >
                  {saved[idx] ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {saved[idx] ? 'Saved to vocab' : 'Save to my vocab'}
                </button>
              </div>
            </div>
          )}

          {(revealed || grade) && (
            <button
              onClick={next}
              className="w-full mt-3 bg-white/5 hover:bg-white/10 border hairline rounded-xl py-3 text-sm flex items-center justify-center gap-1.5"
            >
              {idx + 1 < sentences.length ? 'Next sentence' : 'See results'} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {mode === 'type' && finished && (
        <div className="rounded-3xl border hairline bg-white/[0.04] p-6 text-center pop">
          <div className="display text-3xl text-gold-500 mb-1">
            {score.correct}/{sentences.length}
          </div>
          <div className="text-sm text-stone-200/70">
            {score.correct} correct · {score.almost} almost · {score.wrong} to review
          </div>
          <button
            onClick={generate}
            className="mt-4 bg-gold-500 hover:bg-gold-600 text-night-900 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            New sentences
          </button>
        </div>
      )}
    </div>
  );
}
