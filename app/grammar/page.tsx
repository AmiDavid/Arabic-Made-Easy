'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronRight, ImageIcon } from 'lucide-react';
import type { GrammarRule } from '@/types';
import { cn } from '@/lib/utils';

export default function GrammarPage() {
  const [rules, setRules] = useState<GrammarRule[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [viewPage, setViewPage] = useState<number | null>(null);
  const [pageMap, setPageMap] = useState<Record<number, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('grammar_rules').select('*').order('sort_order');
      setRules((data as GrammarRule[]) || []);
      const { data: pages } = await supabase.from('notebook_pages').select('page, image_path');
      const m: Record<number, string> = {};
      for (const p of pages || []) m[p.page] = p.image_path;
      setPageMap(m);
    })();
  }, []);

  const byCategory = rules.reduce<Record<string, GrammarRule[]>>((acc, r) => {
    (acc[r.category] = acc[r.category] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">Grammar</h1>
      <p className="text-sm text-gray-400 mb-4">Rules & patterns from your notebook</p>

      {Object.entries(byCategory).map(([cat, list]) => (
        <section key={cat} className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-brand-500 font-semibold mb-2">{cat}</h2>
          <div className="border hairline rounded-2xl overflow-hidden divide-y hairline bg-white/[0.02]">
            {list.map((r) => (
              <div key={r.id}>
                <button
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                  className="w-full flex items-start gap-2 p-3 hover:bg-white/[0.03] text-left"
                >
                  {open === r.id ? <ChevronDown className="w-4 h-4 mt-1 text-gray-500" /> : <ChevronRight className="w-4 h-4 mt-1 text-gray-500" />}
                  <div className="flex-1">
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.summary}</div>
                  </div>
                </button>
                {open === r.id && (
                  <div className="px-3 pb-4 pt-1 pop">
                    <div
                      className="prose prose-invert prose-sm max-w-none text-gray-200"
                      dangerouslySetInnerHTML={{ __html: renderMd(r.content_md) }}
                    />
                    {r.examples.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {r.examples.map((ex, i) => (
                          <div key={i} className="flex items-baseline gap-3 border-l-2 border-brand-500/40 pl-3">
                            <div className="arabic flex-1 text-right">{ex.ar}</div>
                            <div className="text-sm text-gray-300 flex-1">{ex.en}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {r.source_pages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.source_pages.map((p) => (
                          <button
                            key={p}
                            onClick={() => setViewPage(p)}
                            className="text-xs bg-white/5 hover:bg-white/10 border hairline rounded-full px-3 py-1 flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" /> p.{p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {viewPage !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center p-4"
          onClick={() => setViewPage(null)}
        >
          <div className="max-w-full max-h-full">
            {pageMap[viewPage] ? (
              <img src={pageMap[viewPage]} alt={`Page ${viewPage}`} className="max-h-[85vh] rounded-lg" />
            ) : (
              <div className="text-gray-400">Page image not found.</div>
            )}
            <div className="text-center mt-2 text-xs text-gray-400">tap anywhere to close</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ultra-minimal markdown-to-HTML for the rule bodies (no external deps).
function renderMd(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="list-disc pl-5 my-2">$1</ul>')
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/^([^<].+)/gm, '<p class="my-1">$1</p>');
}
