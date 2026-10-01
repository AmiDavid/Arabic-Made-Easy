'use client';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, MessageCircle, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SavedConvo = {
  id: string;
  messages: { role: 'user' | 'assistant'; ar: string; en?: string; ts?: string }[];
  created_at: string;
  updated_at: string;
};

export default function HistoryPage() {
  const [convos, setConvos] = useState<SavedConvo[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const resp = await fetch('/api/conversations');
      const json = await resp.json();
      setConvos(json.conversations || []);
      setLoading(false);
    })();
  }, []);

  function fmtDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / 3600000;
    if (diffH < 1) return 'just now';
    if (diffH < 24) return `${Math.round(diffH)}h ago`;
    if (diffH < 24 * 7) return `${Math.round(diffH / 24)}d ago`;
    return d.toLocaleDateString();
  }

  async function speak(text: string) {
    const resp = await fetch('/api/tts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!resp.ok) return;
    const buf = await resp.arrayBuffer();
    const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
    new Audio(url).play();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">Conversation history</h1>
      <p className="text-sm text-stone-200/70 mb-4">
        Every voice chat you have is saved here. Review past exchanges, replay audio, learn from mistakes.
      </p>

      {loading ? (
        <div className="text-center text-stone-200/60 py-12 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : convos.length === 0 ? (
        <div className="text-center text-stone-200/50 py-16">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
          No conversations yet. Head to Voice chat and start one.
        </div>
      ) : (
        <ul className="space-y-2">
          {convos.map((c) => {
            const firstUser = c.messages.find((m) => m.role === 'user');
            const preview = firstUser?.ar || c.messages[0]?.ar || '(empty)';
            const isOpen = open === c.id;
            return (
              <li key={c.id} className="rounded-xl border hairline bg-white/[0.03] overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  className="w-full flex items-start gap-2 p-3 text-left hover:bg-white/[0.04]"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 mt-1 text-stone-200/50 shrink-0" /> : <ChevronRight className="w-4 h-4 mt-1 text-stone-200/50 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="arabic text-right text-base truncate">{preview}</div>
                    <div className="flex items-center justify-between text-[10px] text-stone-200/50 mt-1">
                      <span>{c.messages.length} messages</span>
                      <span>{fmtDate(c.updated_at)}</span>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t hairline p-3 space-y-2 pop">
                    {c.messages.map((m, i) => (
                      <div
                        key={i}
                        className={cn(
                          'rounded-xl p-2.5',
                          m.role === 'user' ? 'bg-gold-500/10 ml-6' : 'bg-white/[0.03] mr-6'
                        )}
                      >
                        <div className="text-[9px] uppercase tracking-widest text-stone-200/50 mb-1">
                          {m.role === 'user' ? 'You' : 'Teacher'}
                        </div>
                        <div className="arabic text-right text-sm">{m.ar}</div>
                        {m.en && <div className="text-xs text-stone-200/60 mt-1.5 border-t hairline pt-1.5">{m.en}</div>}
                        {m.role === 'assistant' && (
                          <button onClick={() => speak(m.ar)} className="mt-1.5 text-[10px] text-gold-500 hover:text-gold-400 flex items-center gap-1">
                            <Volume2 className="w-2.5 h-2.5" /> Play
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
    </div>
  );
}
