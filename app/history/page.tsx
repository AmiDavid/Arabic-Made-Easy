'use client';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, MessageCircle, Loader2, Volume2, Download, Plus, Check, PencilLine } from 'lucide-react';
import { cn } from '@/lib/utils';

type SavedMsg = {
  role: 'user' | 'assistant';
  ar: string;
  en?: string;
  ts?: string;
  topic?: string | null;
  corrections?: { wrong: string; right: string; explanation: string }[];
  new_words?: { arabic: string; english: string }[];
};

type SavedConvo = {
  id: string;
  messages: SavedMsg[];
  created_at: string;
  updated_at: string;
};

type Recap = {
  conversations: number;
  learnerMessages: number;
  newWords: { arabic: string; english: string }[];
  corrections: { wrong: string; right: string; explanation: string }[];
  addedEntries: { arabic: string; english: string; page_label: string | null }[];
  addedCount: number;
};

export default function HistoryPage() {
  const [convos, setConvos] = useState<SavedConvo[]>([]);
  const [recap, setRecap] = useState<Recap | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [c, r] = await Promise.all([
        fetch('/api/conversations').then((x) => x.json()).catch(() => ({})),
        fetch('/api/recap').then((x) => x.json()).catch(() => null),
      ]);
      setConvos(c.conversations || []);
      if (r && !r.error) setRecap(r);
      setLoading(false);
    })();
  }, []);

  function fmtDate(iso: string) {
    const d = new Date(iso);
    const diffH = (Date.now() - d.getTime()) / 3600000;
    if (diffH < 1) return 'just now';
    if (diffH < 24) return `${Math.round(diffH)}h ago`;
    if (diffH < 24 * 7) return `${Math.round(diffH / 24)}d ago`;
    return d.toLocaleDateString();
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

  function exportConvo(c: SavedConvo) {
    const date = new Date(c.created_at);
    const lines: string[] = [
      'Arabic Made Easy — conversation transcript',
      `Date: ${date.toLocaleString()}`,
      c.messages.find((m) => m.topic)?.topic ? `Topic: ${c.messages.find((m) => m.topic)!.topic}` : '',
      '',
    ].filter((l, i) => l !== '' || i === 3);
    for (const m of c.messages) {
      lines.push(`${m.role === 'user' ? 'You' : 'Teacher'}: ${m.ar}`);
      if (m.en) lines.push(`    (${m.en})`);
      for (const corr of m.corrections || []) {
        lines.push(`    Correction: ${corr.wrong} → ${corr.right} — ${corr.explanation}`);
      }
      for (const w of m.new_words || []) {
        lines.push(`    New word: ${w.arabic} = ${w.english}`);
      }
      lines.push('');
    }
    lines.push('Content & teaching method © Basil Zboun.');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `conversation-${date.toISOString().slice(0, 10)}.txt`;
    a.click();
  }

  async function addRecapToVocab() {
    if (!recap) return;
    setAdding(true);
    setAddResult(null);
    const items = [
      ...recap.newWords.map((w) => ({ arabic: w.arabic, english: w.english })),
      ...recap.corrections.map((c) => ({ arabic: c.right, english: c.explanation, notes: `You said: ${c.wrong}` })),
    ];
    try {
      const resp = await fetch('/api/vocab/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, source: 'recap' }),
      });
      const json = await resp.json();
      if (json.error) setAddResult(`Couldn't add: ${json.error}`);
      else setAddResult(`Added ${json.added} to your vocabulary${json.skipped ? ` (${json.skipped} were already there)` : ''}.`);
    } finally {
      setAdding(false);
    }
  }

  const hasRecapContent = recap && (recap.newWords.length || recap.corrections.length || recap.addedCount);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">History &amp; recap</h1>
      <p className="text-sm text-stone-200/70 mb-5">
        Your week in review, and every voice conversation you've had.
      </p>

      {loading ? (
        <div className="text-center text-stone-200/60 py-12 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* ---------- WEEKLY RECAP ---------- */}
          <section className="mb-8 rounded-2xl border border-gold-500/30 bg-night-800/70 p-4">
            <h2 className="display text-xl text-gold-400 mb-1">This week</h2>
            {!hasRecapContent ? (
              <p className="text-sm text-stone-200/70">
                Nothing yet this week. Have a voice conversation or scan a page and your recap fills up here.
              </p>
            ) : (
              <>
                <p className="text-sm text-stone-200/80 mb-3">
                  {recap!.conversations} conversation{recap!.conversations === 1 ? '' : 's'}, {recap!.learnerMessages} things
                  you said in Arabic, {recap!.addedCount} new entr{recap!.addedCount === 1 ? 'y' : 'ies'} in your vocabulary.
                </p>

                {recap!.newWords.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-stone-100 mb-1.5">Words the teacher used</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {recap!.newWords.map((w, i) => (
                        <span key={i} className="text-xs bg-white/5 border hairline rounded-full px-2.5 py-1">
                          <span className="arabic text-[1.05em]">{w.arabic}</span>{' '}
                          <span className="text-stone-200/60">{w.english}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {recap!.corrections.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-stone-100 mb-1.5">Your corrections</h3>
                    <ul className="space-y-1.5">
                      {recap!.corrections.map((c, i) => (
                        <li key={i} className="text-sm">
                          <span className="arabic line-through text-rose-300/80">{c.wrong}</span>
                          <span className="mx-2 text-stone-200/50">→</span>
                          <span className="arabic text-olive-200">{c.right}</span>
                          <div className="text-xs text-stone-200/60">{c.explanation}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recap!.addedEntries.length > 0 && (
                  <details className="mb-3">
                    <summary className="text-sm font-semibold text-stone-100 cursor-pointer">
                      Added to your vocabulary ({recap!.addedCount})
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {recap!.addedEntries.map((e, i) => (
                        <li key={i} className="flex items-baseline gap-3 text-sm">
                          <span className="arabic flex-1 text-right">{e.arabic}</span>
                          <span className="flex-1 text-stone-200/70">{e.english}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {(recap!.newWords.length > 0 || recap!.corrections.length > 0) && (
                    <button
                      onClick={addRecapToVocab}
                      disabled={adding}
                      className="bg-gold-500 hover:bg-gold-600 text-night-900 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add words &amp; corrections to my vocab
                    </button>
                  )}
                  <a
                    href="/quiz?topic=from-practice"
                    className="bg-white/5 hover:bg-white/10 border hairline rounded-xl px-4 py-2 text-sm"
                  >
                    Practise them in the quiz
                  </a>
                </div>
                {addResult && <p className="text-xs text-olive-200 mt-2">{addResult}</p>}
              </>
            )}
          </section>

          {/* ---------- CONVERSATIONS ---------- */}
          <h2 className="text-lg font-semibold mb-2">Conversations</h2>
          {convos.length === 0 ? (
            <div className="text-center text-stone-200/60 py-12">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              No conversations yet. Start one in Voice chat.
            </div>
          ) : (
            <ul className="space-y-2">
              {convos.map((c) => {
                const firstUser = c.messages.find((m) => m.role === 'user');
                const preview = firstUser?.ar || c.messages[0]?.ar || '(empty)';
                const topic = c.messages.find((m) => m.topic)?.topic;
                const nCorr = c.messages.reduce((n, m) => n + (m.corrections?.length || 0), 0);
                const isOpen = open === c.id;
                return (
                  <li key={c.id} className="rounded-xl border hairline bg-night-800/60 overflow-hidden">
                    <button
                      onClick={() => setOpen(isOpen ? null : c.id)}
                      className="w-full flex items-start gap-2 p-3 text-left hover:bg-white/[0.04]"
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 mt-1 text-stone-200/50 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mt-1 text-stone-200/50 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="arabic text-right text-base truncate">{preview}</div>
                        <div className="flex items-center justify-between text-[11px] text-stone-200/50 mt-1">
                          <span>
                            {c.messages.length} messages{topic ? ` · ${topic}` : ''}
                            {nCorr ? ` · ${nCorr} correction${nCorr === 1 ? '' : 's'}` : ''}
                          </span>
                          <span>{fmtDate(c.updated_at)}</span>
                        </div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t hairline p-3 space-y-2 pop">
                        <button
                          onClick={() => exportConvo(c)}
                          className="text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1 mb-1"
                        >
                          <Download className="w-3 h-3" /> Export transcript
                        </button>
                        {c.messages.map((m, i) => (
                          <div
                            key={i}
                            className={cn('rounded-xl p-2.5', m.role === 'user' ? 'bg-gold-500/10 ml-6' : 'bg-white/[0.03] mr-6')}
                          >
                            <div className="text-[10px] text-stone-200/50 mb-1">{m.role === 'user' ? 'You' : 'Teacher'}</div>
                            <div className="arabic text-right text-sm">{m.ar}</div>
                            {m.en && <div className="text-xs text-stone-200/60 mt-1.5 border-t hairline pt-1.5">{m.en}</div>}
                            {m.corrections?.map((corr, j) => (
                              <div key={j} className="mt-1.5 text-xs">
                                <PencilLine className="w-3 h-3 inline text-gold-400 mr-1" />
                                <span className="arabic line-through text-rose-300/80">{corr.wrong}</span>
                                <span className="mx-1.5 text-stone-200/50">→</span>
                                <span className="arabic text-olive-200">{corr.right}</span>
                                <div className="text-stone-200/60">{corr.explanation}</div>
                              </div>
                            ))}
                            {m.role === 'assistant' && (
                              <button
                                onClick={() => speak(m.ar)}
                                className="mt-1.5 text-[11px] text-gold-500 hover:text-gold-400 flex items-center gap-1"
                              >
                                <Volume2 className="w-3 h-3" /> Play
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
