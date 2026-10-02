'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronRight, ImageIcon, RefreshCw } from 'lucide-react';
import type { GrammarRule } from '@/types';
import { cn } from '@/lib/utils';
import { GRAMMAR } from '@/lib/grammar-content';
import { notebookPageImage } from '@/lib/notebook-images';

// Rules written in the app's code are always the newest version, so they replace
// any older copy saved in the database. Rules added by scanning stay as they are.
function mergeRules(dbRules: GrammarRule[]): GrammarRule[] {
  const codeSlugs = new Set(GRAMMAR.map((g) => g.slug));
  const dbIds = new Map(dbRules.map((r) => [r.slug, r.id]));
  const fromCode: GrammarRule[] = GRAMMAR.map((g) => ({ ...g, id: dbIds.get(g.slug) || g.slug }));
  const scanned = dbRules.filter((r) => !codeSlugs.has(r.slug));
  return [...fromCode, ...scanned].sort((a, b) => a.sort_order - b.sort_order);
}

export default function GrammarPage() {
  const [rules, setRules] = useState<GrammarRule[]>(() => mergeRules([]));
  const [open, setOpen] = useState<string | null>(null);
  const [viewPage, setViewPage] = useState<{ page: number; scanned: boolean } | null>(null);
  const [pageMap, setPageMap] = useState<Record<number, string>>({});
  const [reseeding, setReseeding] = useState(false);

  async function loadRules() {
    const { data } = await supabase.from('grammar_rules').select('*').order('sort_order');
    setRules(mergeRules((data as GrammarRule[]) || []));
    const { data: pages } = await supabase.from('notebook_pages').select('page, image_path');
    const m: Record<number, string> = {};
    for (const p of pages || []) m[p.page] = p.image_path;
    setPageMap(m);
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function reseedGrammar() {
    if (!confirm('Reload grammar rules from the latest content? This replaces existing rules.')) return;
    setReseeding(true);
    try {
      const resp = await fetch('/api/admin/reseed-grammar', { method: 'POST' });
      const json = await resp.json();
      if (json.error) alert('Error: ' + json.error);
      else {
        alert(`Reseeded ${json.count} grammar rules.`);
        await loadRules();
      }
    } finally {
      setReseeding(false);
    }
  }

  function imageFor(v: { page: number; scanned: boolean }) {
    return v.scanned ? pageMap[v.page] || null : notebookPageImage(v.page) || pageMap[v.page] || null;
  }

  const byCategory = rules.reduce<Record<string, GrammarRule[]>>((acc, r) => {
    (acc[r.category] = acc[r.category] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Grammar</h1>
        <button
          onClick={reseedGrammar}
          disabled={reseeding}
          className="text-xs text-gray-400 hover:text-brand-500 flex items-center gap-1 disabled:opacity-50"
          title="Reload grammar rules from latest app content"
        >
          <RefreshCw className={cn('w-3 h-3', reseeding && 'animate-spin')} />
          {reseeding ? 'Updating…' : 'Refresh'}
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-4">Rules & patterns from your notebook, with pronunciation and examples.</p>

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
                  {open === r.id ? <ChevronDown className="w-4 h-4 mt-1 text-gray-500 shrink-0" /> : <ChevronRight className="w-4 h-4 mt-1 text-gray-500 shrink-0" />}
                  <div className="flex-1">
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.summary}</div>
                  </div>
                </button>
                {open === r.id && (
                  <div className="px-3 pb-4 pt-1 pop">
                    <div
                      className="text-sm text-gray-200 leading-relaxed grammar-body"
                      dangerouslySetInnerHTML={{ __html: renderMd(r.content_md) }}
                    />
                    {r.examples.length > 0 && (
                      <div className="mt-4">
                        <div className="text-[10px] uppercase tracking-widest text-brand-500 font-semibold mb-2">Examples</div>
                        <div className="space-y-1.5">
                          {r.examples.map((ex, i) => (
                            <div key={i} className="flex items-baseline gap-3 border-l-2 border-brand-500/40 pl-3">
                              <div className="arabic flex-1 text-right">{ex.ar}</div>
                              <div className="text-sm text-gray-300 flex-1">{ex.en}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {r.source_pages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.source_pages.map((p) => (
                          <button
                            key={p}
                            onClick={() => setViewPage({ page: p, scanned: r.slug.startsWith('scan-') })}
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
            {imageFor(viewPage) ? (
              <img src={imageFor(viewPage)!} alt={`Notebook page ${viewPage.page}`} className="max-h-[85vh] max-w-full rounded-lg" />
            ) : (
              <div className="text-gray-400">Page image not found.</div>
            )}
            <div className="text-center mt-2 text-xs text-gray-400">tap anywhere to close</div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .grammar-body h2 { font-size: 1.1em; font-weight: 600; margin-top: 1em; margin-bottom: 0.4em; color: #e5e7eb; }
        .grammar-body h3 { font-size: 1em; font-weight: 600; margin-top: 0.8em; margin-bottom: 0.3em; color: #d1d5db; }
        .grammar-body p { margin: 0.5em 0; }
        .grammar-body ul { margin: 0.5em 0; padding-left: 1.25rem; list-style: disc; }
        .grammar-body li { margin: 0.15em 0; }
        .grammar-body strong { color: #c4b5fd; font-weight: 600; }
        .grammar-body table { width: 100%; border-collapse: collapse; margin: 0.8em 0; font-size: 0.9em; }
        .grammar-body th { text-align: left; padding: 6px 10px; background: rgba(124,58,237,0.1); border: 1px solid rgba(255,255,255,0.08); font-weight: 600; color: #c4b5fd; }
        .grammar-body td { padding: 6px 10px; border: 1px solid rgba(255,255,255,0.06); vertical-align: top; }
        .grammar-body bdi.ar { font-size: 1.12em; }
        .grammar-body code { background: rgba(255,255,255,0.05); padding: 1px 5px; border-radius: 4px; font-size: 0.85em; }
      `}</style>
    </div>
  );
}

// Richer markdown-to-HTML with tables, headings, code, and lists.
function renderMd(md: string): string {
  // Escape HTML first
  let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Process tables (markdown pipe tables)
  html = html.replace(/((?:^\|.*\|\s*\n)+)/gm, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 2) return match;
    const headers = lines[0].split('|').slice(1, -1).map((h) => h.trim());
    // lines[1] is the separator |---|---|
    const bodyRows = lines.slice(2);
    const headerHtml = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>`;
    const bodyHtml = `<tbody>${bodyRows.map((r) => {
      const cells = r.split('|').slice(1, -1).map((c) => c.trim());
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    }).join('')}</tbody>`;
    return `<table>${headerHtml}${bodyHtml}</table>`;
  });

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');

  // Inline bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Lists
  html = html.replace(/^(?:- (.+)\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map((l) => l.replace(/^- /, ''));
    return `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
  });

  // Paragraphs: split on blank lines, wrap non-block content in <p>
  const parts = html.split(/\n\n+/);
  html = parts.map((p) => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    if (/^<(h\d|table|ul|ol|p|div)/.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  // Isolate each run of Arabic so mixed lines ("ى → ي", "حكى → حكيت") read
  // left-to-right in the English sentence instead of being flipped by the browser.
  html = html.replace(
    /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+(?:[ ،][؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+)*/g,
    (m) => `<bdi class="ar">${m}</bdi>`
  );

  return html;
}
