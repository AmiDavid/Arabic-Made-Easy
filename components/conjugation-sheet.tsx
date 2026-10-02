'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { X, Loader2 } from 'lucide-react';
import { conjugate, PERSONS, type Conjugation } from '@/lib/conjugate';
import { VERB_CASES } from '@/lib/verbs';
import { VerbCaseBadge } from '@/components/word-forms';
import { cn } from '@/lib/utils';

type Pron = { past: string[]; present: string[]; future: string[]; imperative: string[]; issues: string[] };

function loadCached(key: string): Pron | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Pron) : null;
  } catch {
    return null;
  }
}

/** Full conjugation table for one verb, as a sheet over the page. */
export function ConjugationSheet({
  arabic,
  english,
  notes,
  onClose,
}: {
  arabic: string;
  english: string;
  notes?: string | null;
  onClose: () => void;
}) {
  const c = useMemo(() => conjugate(arabic, english, notes), [arabic, english, notes]);
  const cacheKey = `conj:v1:${arabic}`;
  const [pron, setPron] = useState<Pron | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPron(loadCached(cacheKey));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [cacheKey, onClose]);

  async function addPronunciation() {
    if (!c) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/conjugate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verb: c.verb,
          english: c.english,
          verbCase: VERB_CASES[c.verbCase].long,
          past: c.past,
          present: c.present,
          future: c.future,
          imperative: c.imperative,
        }),
      });
      const json = await resp.json();
      if (!resp.ok || json.error) throw new Error(json.error || `HTTP ${resp.status}`);
      setPron(json);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(json));
      } catch {}
    } catch (e: any) {
      setError(e.message || 'Could not get the pronunciation');
    } finally {
      setLoading(false);
    }
  }

  function speak(text: string) {
    try {
      const u = new SpeechSynthesisUtterance(text.replace(/^رح /, 'رح '));
      u.lang = 'ar';
      const v = speechSynthesis.getVoices().find((x) => /^ar(-|_)(PS|JO|LB|SY)/i.test(x.lang)) ||
        speechSynthesis.getVoices().find((x) => x.lang.startsWith('ar'));
      if (v) u.voice = v;
      u.rate = 0.85;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-night-900 border hairline shadow-2xl pop">
        <div className="sticky top-0 z-10 bg-night-900/95 backdrop-blur px-4 pt-4 pb-3 border-b hairline flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="arabic text-3xl">{c?.verb || arabic}</span>
              {c && <VerbCaseBadge verbCase={c.verbCase} />}
            </div>
            <div className="text-sm text-stone-200/70 mt-0.5">{english.replace('[?]', '')}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 -m-1 rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!c ? (
          <div className="p-6 text-stone-200/70">This word isn't a verb I can conjugate.</div>
        ) : (
          <div className="px-4 pb-10 pt-3">
            {c.presentSuggested && (
              <p className="text-xs text-sky-300/80 mb-3">
                ✦ Your notebook only has the past form. The present (and everything built on it) is suggested by
                the app.
              </p>
            )}

            <Table c={c} pron={pron} onSpeak={speak} />

            {c.imperative && (
              <section className="mt-5">
                <h3 className="text-[11px] uppercase tracking-widest text-gold-400 font-semibold mb-2">
                  Imperative (أمر)
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {c.imperative.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => speak(f)}
                      className="rounded-xl border hairline bg-white/[0.03] p-2 text-center hover:bg-white/[0.06]"
                    >
                      <div className="text-[10px] text-stone-200/60">{['to a man', 'to a woman', 'to a group'][i]}</div>
                      <div className="arabic text-xl mt-0.5">{f}</div>
                      {pron?.imperative?.[i] && <div className="text-[11px] text-stone-200/60">{pron.imperative[i]}</div>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {c.future && (
              <section className="mt-5">
                <h3 className="text-[11px] uppercase tracking-widest text-gold-400 font-semibold mb-2">Saying "not"</h3>
                <ul className="text-sm space-y-1.5 text-stone-200/85">
                  <li>
                    Past: <bdi className="arabic text-lg">ما {c.past[0]}</bdi> <span className="text-stone-200/50">(I didn't)</span>
                  </li>
                  {c.present && (
                    <li>
                      Present: <bdi className="arabic text-lg">ما {c.present[0]}</bdi>{' '}
                      <span className="text-stone-200/50">(I don't)</span>
                    </li>
                  )}
                  <li>
                    Future: <bdi className="arabic text-lg">مش {c.future[0]}</bdi>{' '}
                    <span className="text-stone-200/50">(I won't)</span>
                  </li>
                  <li>
                    Don't…: <bdi className="arabic text-lg">ما {c.future[1].replace(/^رح /, '')}</bdi> ·{' '}
                    <bdi className="arabic text-lg">ما {c.future[2].replace(/^رح /, '')}</bdi> ·{' '}
                    <bdi className="arabic text-lg">ما {c.future[6].replace(/^رح /, '')}</bdi>{' '}
                    <span className="text-stone-200/50">(m / f / pl)</span>
                  </li>
                </ul>
              </section>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!pron && (
                <button
                  onClick={addPronunciation}
                  disabled={loading}
                  className="rounded-xl bg-gold-500/20 border border-gold-500/40 text-gold-200 px-4 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Adding pronunciation…' : 'Add pronunciation'}
                </button>
              )}
              <Link
                href={`/grammar?open=${VERB_CASES[c.verbCase].slug}`}
                className="text-sm text-gold-300 underline underline-offset-2"
              >
                How {VERB_CASES[c.verbCase].label === 'Regular' ? 'regular verbs work' : `${VERB_CASES[c.verbCase].label} works`} →
              </Link>
            </div>
            {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
            {pron?.issues?.length ? (
              <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <div className="font-semibold text-amber-200 mb-1">The AI teacher would say it differently:</div>
                <ul className="list-disc pl-5 space-y-0.5 text-stone-200/85">
                  {pron.issues.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-4 text-[11px] text-stone-200/50">
              Built from your notebook's rules. ★ = the people who don't follow the change (past: هيّا & همّا ·
              present: إنتي، إنتو & همّا). Tap a form to hear it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Table({ c, pron, onSpeak }: { c: Conjugation; pron: Pron | null; onSpeak: (t: string) => void }) {
  const cols: { title: string; forms: string[] | null; tr?: string[]; star: number[] }[] = [
    { title: 'Past', forms: c.past, tr: pron?.past, star: c.starPast },
    { title: 'Present', forms: c.present, tr: pron?.present, star: c.starPresent },
    { title: 'Future', forms: c.future, tr: pron?.future, star: c.starPresent },
  ];
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left font-semibold text-gold-300 py-2 pr-2 w-[22%]">Person</th>
            {cols.map((col) => (
              <th key={col.title} className="text-right font-semibold text-gold-300 py-2 px-1">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERSONS.map((p, i) => (
            <tr key={p.ar} className="border-t hairline align-top">
              <td className="py-2 pr-2">
                <div className="arabic text-base leading-tight text-left">{p.ar}</div>
                <div className="text-[10px] text-stone-200/50">{p.en}</div>
              </td>
              {cols.map((col) => (
                <td key={col.title} className="py-2 px-1 text-right">
                  {col.forms ? (
                    <button onClick={() => onSpeak(col.forms![i])} className="text-right w-full">
                      <span className={cn('arabic text-lg leading-tight', col.star.includes(i) && 'text-gold-200')}>
                        {col.forms[i]}
                      </span>
                      {col.star.includes(i) && <span className="text-gold-400 text-xs"> ★</span>}
                      {col.tr?.[i] && <div className="text-[11px] text-stone-200/60">{col.tr[i]}</div>}
                    </button>
                  ) : (
                    <span className="text-stone-200/40">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
