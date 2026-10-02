'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Topic } from '@/types';
import {
  Camera,
  Loader2,
  Save,
  Trash2,
  Image as ImageIcon,
  BookMarked,
  Check,
  X,
  RotateCw,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn, stripDiacritics } from '@/lib/utils';

type Extracted = {
  arabic: string;
  english: string;
  uncertain: boolean;
  suggested_present?: string;
  keep: boolean;
  already_known: string | boolean;
};

type ScanResponse = {
  page_type: 'vocab' | 'grammar' | 'mixed';
  title?: string;
  suggested_topic_slug: string;
  grammar?: { title?: string; summary?: string; section?: string; content?: string; examples?: { ar: string; en: string }[] };
  entries: Extracted[];
};

type PageItem = {
  id: string;
  dataUrl: string;
  status: 'waiting' | 'reading' | 'done' | 'error';
  error?: string;
  result?: ScanResponse;
  entries: Extracted[];
  topicId: string;
  pageNo: number;
  keepGrammar: boolean;
  open: boolean;
};

type SavedSummary = { words: number; pages: number; grammar: { slug: string; title: string }[] };

const MAX_PARALLEL = 2;
const firstFormKey = (ar: string) => stripDiacritics(ar.split('،')[0]).trim();

/** Shrink a phone photo (often 4–8 MB) to ~2000px JPEG so it uploads fast and fits the server limit. */
async function shrinkImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not open the image'));
      i.src = url;
    });
    const MAX = 2000;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ScanPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [firstPageNo, setFirstPageNo] = useState<number>(44);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SavedSummary | null>(null);
  const pagesRef = useRef<PageItem[]>([]);
  pagesRef.current = pages;
  const running = useRef(new Set<string>());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('topics').select('*').order('sort_order');
      setTopics((data as Topic[]) || []);
      const { data: last } = await supabase
        .from('entries')
        .select('page')
        .eq('notebook', 'Notebook 3')
        .order('page', { ascending: false })
        .limit(1);
      if (last && last[0]?.page) setFirstPageNo(last[0].page + 1);
    })();
  }, []);

  const update = useCallback((id: string, patch: Partial<PageItem> | ((p: PageItem) => Partial<PageItem>)) => {
    setPages((list) => list.map((p) => (p.id === id ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p)));
  }, []);

  // ---------- reading queue: up to MAX_PARALLEL pages at a time ----------
  const readPage = useCallback(
    async (page: PageItem) => {
      running.current.add(page.id);
      update(page.id, { status: 'reading', error: undefined });
      try {
        const resp = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: page.dataUrl }),
        });
        const json = await resp.json().catch(() => ({ error: `Server error (${resp.status})` }));
        if (!resp.ok || json.error) throw new Error(json.error || `HTTP ${resp.status}`);
        const result = json as ScanResponse;
        // words already found on an earlier page of this batch count as known too
        const earlier = new Map<string, number>();
        for (const p of pagesRef.current) {
          if (p.id === page.id) break;
          for (const e of p.entries) earlier.set(firstFormKey(e.arabic), p.pageNo);
        }
        const entries = (result.entries || []).map((e) => {
          const inBatch = earlier.get(firstFormKey(e.arabic));
          const known = e.already_known || (inBatch ? `p.${inBatch} (this scan)` : false);
          return { ...e, already_known: known, keep: !known };
        });
        const topic = topics.find((t) => t.slug === result.suggested_topic_slug);
        update(page.id, (p) => ({
          status: 'done',
          result,
          entries,
          topicId: topic?.id || p.topicId,
          keepGrammar: !!result.grammar?.title && result.page_type !== 'vocab',
        }));
      } catch (e: any) {
        update(page.id, { status: 'error', error: e.message || 'Could not read this page' });
      } finally {
        running.current.delete(page.id);
      }
    },
    [topics, update]
  );

  useEffect(() => {
    const free = MAX_PARALLEL - running.current.size;
    if (free <= 0) return;
    pages
      .filter((p) => p.status === 'waiting' && !running.current.has(p.id))
      .slice(0, free)
      .forEach((p) => readPage(p));
  }, [pages, readPage]);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setSaved(null);
    const list = Array.from(files);
    const startNo = pagesRef.current.length ? Math.max(...pagesRef.current.map((p) => p.pageNo)) + 1 : firstPageNo;
    const newPages: PageItem[] = [];
    for (let i = 0; i < list.length; i++) {
      const dataUrl = await shrinkImage(list[i]);
      newPages.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        dataUrl,
        status: 'waiting',
        entries: [],
        topicId: topics[0]?.id || '',
        pageNo: startNo + i,
        keepGrammar: false,
        open: list.length === 1 && pagesRef.current.length === 0,
      });
    }
    setPages((p) => [...p, ...newPages]);
  }

  function removePage(id: string) {
    setPages((list) => list.filter((p) => p.id !== id));
  }

  const done = pages.filter((p) => p.status === 'done');
  const busy = pages.filter((p) => p.status === 'waiting' || p.status === 'reading').length;
  const wordsToSave = done.reduce((n, p) => n + p.entries.filter((e) => e.keep && e.arabic && e.english).length, 0);
  const grammarToSave = done.filter((p) => p.keepGrammar && p.result?.grammar?.title).length;

  async function saveAll() {
    setSaving(true);
    const summary: SavedSummary = { words: 0, pages: 0, grammar: [] };
    try {
      for (const p of done) {
        const rows = p.entries
          .filter((e) => e.keep && e.arabic && e.english)
          .map((e) => ({
            arabic: e.arabic,
            english: e.uncertain ? `${e.english} [?]` : e.english,
            topic_id: p.topicId || null,
            notebook: 'Notebook 3',
            page: p.pageNo,
            page_label: `Notebook 3, p.${p.pageNo}`,
            entry_type: 'vocab' as const,
            uncertain: e.uncertain,
            notes: e.suggested_present ? `present (suggested): ${e.suggested_present}` : null,
          }));
        if (rows.length) {
          const { error } = await supabase.from('entries').insert(rows);
          if (error) throw new Error(`Page ${p.pageNo}: ${error.message}`);
          summary.words += rows.length;
        }
        const g = p.result?.grammar;
        if (p.keepGrammar && g?.title) {
          const slug = `scan-${p.pageNo}-${g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
          const { error } = await supabase.from('grammar_rules').upsert(
            {
              slug,
              title: g.title,
              category: g.section ? `section:${g.section}` : p.result?.suggested_topic_slug || 'misc',
              summary: g.summary || '',
              content_md: g.content || '',
              examples: Array.isArray(g.examples) ? g.examples.filter((x) => x?.ar && x?.en) : [],
              source_pages: [p.pageNo],
              sort_order: 999,
            },
            { onConflict: 'slug' }
          );
          if (error) throw new Error(`Grammar on page ${p.pageNo}: ${error.message}`);
          summary.grammar.push({ slug, title: g.title });
        }
        summary.pages++;
        removePage(p.id); // saved pages leave the list, so a retry won't save them twice
      }
      setSaved(summary);
      setFirstPageNo((n) => Math.max(n, ...done.map((p) => p.pageNo + 1)));
    } catch (e: any) {
      alert('Save stopped: ' + e.message + (summary.pages ? `\n\n${summary.pages} page(s) were already saved.` : ''));
      if (summary.pages) setSaved(summary);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn('max-w-2xl mx-auto px-4 pt-6', pages.length > 0 && 'pb-28')}>
      <h1 className="text-2xl font-bold mb-1">Scan notebook pages</h1>
      <p className="text-sm text-stone-200/60 mb-4">
        Photograph one page or many. The app reads them while you keep going, then you check and save them all at once.
      </p>

      {pages.length === 0 && (
        <details open={!saved} className="mb-5 rounded-2xl border hairline bg-white/[0.03] p-4 text-sm group">
          <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
            How it works
            <span className="text-xs text-stone-200/50 group-open:hidden">show</span>
          </summary>
          <ol className="mt-3 space-y-2.5 text-stone-200/80">
            <li>
              <b className="text-gold-300">1. Add pages.</b> Take photos one after another, or pick several from your
              gallery. Each page is read as soon as it's added, two at a time.
            </li>
            <li>
              <b className="text-gold-300">2. Grammar becomes a new card in the Grammar tab.</b> It doesn't just copy the
              page: it explains the rule the way Basil teaches it (suf / pre, the ★ exception people, S.C. cases), with
              full past / present / future / command tables, pronunciation and example sentences.
            </li>
            <li>
              <b className="text-gold-300">3. Words go into your vocabulary</b> under the matching topic, keeping both
              forms (singular، plural · past، present). Verbs are sorted into their case (S.C.3, S.C.4, S.C.5…), and a
              verb written with one form gets a suggested present ✦.
            </li>
            <li>
              <b className="text-gold-300">4. No duplicates.</b> Words you already have, or that appear on an earlier
              page of the same scan, are flagged and left unticked.
            </li>
            <li>
              <b className="text-gold-300">5. You check, then save.</b> Fix any word, untick what you don't want, and
              tap Save all. Nothing is added until you do.
            </li>
          </ol>
        </details>
      )}

      <AddButtons onFiles={addFiles} compact={pages.length > 0} />

      {pages.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-stone-200/70">
          <span>Pages are numbered from</span>
          <input
            type="number"
            value={pages[0].pageNo}
            onChange={(e) => {
              const start = parseInt(e.target.value, 10);
              if (!isNaN(start)) setPages((list) => list.map((p, i) => ({ ...p, pageNo: start + i })));
            }}
            className="w-16 bg-white/5 border hairline rounded-lg px-2 py-1"
          />
          <span>in your notebook (you can change each page below).</span>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {pages.map((p) => (
          <PageCard
            key={p.id}
            page={p}
            topics={topics}
            onChange={(patch) => update(p.id, patch)}
            onRemove={() => removePage(p.id)}
            onRetry={() => update(p.id, { status: 'waiting', error: undefined })}
          />
        ))}
      </div>

      {saved && (
        <div className="mt-4 p-4 rounded-2xl border border-olive-500/40 bg-olive-500/10 pop text-sm">
          <div className="font-semibold text-olive-300 mb-1">
            ✓ Saved {saved.pages} page{saved.pages === 1 ? '' : 's'}
          </div>
          {saved.words > 0 && (
            <div>
              {saved.words} word{saved.words === 1 ? '' : 's'} added to your vocabulary ·{' '}
              <a href="/catalog" className="text-gold-300 underline underline-offset-2">
                see Words
              </a>
            </div>
          )}
          {saved.grammar.map((g) => (
            <div key={g.slug} className="mt-1">
              New grammar card: <b>{g.title}</b> ·{' '}
              <a href={`/grammar?open=${g.slug}`} className="text-gold-300 underline underline-offset-2">
                open it
              </a>
            </div>
          ))}
          <div className="mt-2 text-xs text-stone-200/60">Ready for the next pages.</div>
        </div>
      )}

      {pages.length > 0 && (
        <div className="fixed inset-x-0 bottom-[70px] z-[45] px-4 pb-2 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto rounded-2xl border hairline bg-night-900/95 backdrop-blur p-3 shadow-2xl flex items-center gap-3">
            <div className="flex-1 text-xs text-stone-200/80">
              {busy > 0 ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading {busy} page{busy === 1 ? '' : 's'}… you can
                  keep adding
                </span>
              ) : (
                <span>
                  {done.length} page{done.length === 1 ? '' : 's'} ready
                </span>
              )}
            </div>
            <button
              onClick={saveAll}
              disabled={saving || !done.length || (!wordsToSave && !grammarToSave)}
              className="bg-gold-500 hover:bg-gold-600 text-night-900 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save all · {wordsToSave} word{wordsToSave === 1 ? '' : 's'}
              {grammarToSave > 0 && ` + ${grammarToSave} grammar`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddButtons({ onFiles, compact }: { onFiles: (f: FileList | null) => void; compact: boolean }) {
  const reset = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiles(e.target.files);
    e.target.value = ''; // allow the same photo again
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <label
        className={cn(
          'block border-2 border-dashed hairline rounded-2xl text-center cursor-pointer hover:bg-white/[0.02]',
          compact ? 'p-3' : 'p-6'
        )}
      >
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={reset} />
        {compact ? (
          <div className="flex items-center justify-center gap-2 font-semibold text-sm">
            <Camera className="w-5 h-5 text-gold-500" /> <Plus className="w-3.5 h-3.5 -ml-1.5" /> Take another
          </div>
        ) : (
          <>
            <Camera className="w-8 h-8 text-gold-500 mx-auto mb-2" />
            <div className="font-semibold">Take photos</div>
            <div className="text-xs text-stone-200/50 mt-1">one page at a time</div>
          </>
        )}
      </label>
      <label
        className={cn(
          'block border-2 border-dashed hairline rounded-2xl text-center cursor-pointer hover:bg-white/[0.02]',
          compact ? 'p-3' : 'p-6'
        )}
      >
        <input type="file" accept="image/*" multiple className="hidden" onChange={reset} />
        {compact ? (
          <div className="flex items-center justify-center gap-2 font-semibold text-sm">
            <ImageIcon className="w-5 h-5 text-gold-500" /> <Plus className="w-3.5 h-3.5 -ml-1.5" /> From gallery
          </div>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 text-gold-500 mx-auto mb-2" />
            <div className="font-semibold">Choose from gallery</div>
            <div className="text-xs text-stone-200/50 mt-1">select several pages</div>
          </>
        )}
      </label>
    </div>
  );
}

function PageCard({
  page,
  topics,
  onChange,
  onRemove,
  onRetry,
}: {
  page: PageItem;
  topics: Topic[];
  onChange: (patch: Partial<PageItem>) => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const r = page.result;
  const keep = page.entries.filter((e) => e.keep).length;
  const known = page.entries.filter((e) => e.already_known).length;
  const setEntries = (fn: (arr: Extracted[]) => Extracted[]) => onChange({ entries: fn(page.entries) });

  return (
    <div className="rounded-2xl border hairline bg-night-800/60 overflow-hidden">
      <div className="flex items-center gap-3 p-2.5">
        <img src={page.dataUrl} alt={`Page ${page.pageNo}`} className="w-14 h-14 object-cover rounded-lg border hairline" />
        <button
          className="flex-1 text-left min-w-0"
          onClick={() => page.status === 'done' && onChange({ open: !page.open })}
        >
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            {page.status === 'done' &&
              (page.open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />)}
            Page {page.pageNo}
            {r?.title && <span className="font-normal text-stone-200/60 truncate">· {r.title}</span>}
          </div>
          <div className="text-xs text-stone-200/60 mt-0.5">
            {page.status === 'waiting' && 'Waiting…'}
            {page.status === 'reading' && (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Reading the page…
              </span>
            )}
            {page.status === 'error' && <span className="text-rose-300">{page.error}</span>}
            {page.status === 'done' && (
              <>
                {r?.page_type === 'grammar' ? '📖 Grammar' : r?.page_type === 'mixed' ? '📖+📝 Mixed' : '📝 Words'} ·{' '}
                {keep} new word{keep === 1 ? '' : 's'}
                {known > 0 && ` · ${known} already known`}
                {page.keepGrammar && ' · grammar card'}
              </>
            )}
          </div>
        </button>
        {page.status === 'error' && (
          <button onClick={onRetry} aria-label="Try again" className="p-2 rounded-lg hover:bg-white/10">
            <RotateCw className="w-4 h-4" />
          </button>
        )}
        <button onClick={onRemove} aria-label="Remove page" className="p-2 rounded-lg hover:bg-white/10 text-stone-200/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      {page.status === 'done' && page.open && r && (
        <div className="px-3 pb-3 pt-1 border-t hairline">
          {r.grammar?.title && (
            <label className="mt-2 mb-3 p-3 rounded-xl bg-olive-900/30 border border-olive-700/50 flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={page.keepGrammar}
                onChange={(e) => onChange({ keepGrammar: e.target.checked })}
                className="accent-olive-500 mt-1 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2 text-xs text-olive-300 mb-1">
                  <BookMarked className="w-3.5 h-3.5" />
                  <span className="font-semibold">New grammar card</span>
                </div>
                <div className="font-semibold text-stone-50">{r.grammar.title}</div>
                {r.grammar.summary && <div className="text-sm text-stone-200/70 mt-1">{r.grammar.summary}</div>}
              </div>
            </label>
          )}

          <div className="flex gap-2 my-3">
            <select
              value={page.topicId}
              onChange={(e) => onChange({ topicId: e.target.value })}
              className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name_en}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={page.pageNo}
              onChange={(e) => onChange({ pageNo: parseInt(e.target.value, 10) || page.pageNo })}
              className="w-20 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm"
              aria-label="Page number"
            />
          </div>

          {page.entries.length > 0 ? (
            <ul className="space-y-1 border hairline rounded-xl overflow-hidden bg-white/[0.02]">
              {page.entries.map((e, i) => (
                <li key={i} className={cn('flex items-center gap-2 p-2', !e.keep && 'opacity-40')}>
                  <input
                    type="checkbox"
                    checked={e.keep}
                    onChange={(ev) => setEntries((arr) => arr.map((x, j) => (j === i ? { ...x, keep: ev.target.checked } : x)))}
                    className="accent-gold-500 shrink-0"
                  />
                  <input
                    value={e.arabic}
                    onChange={(ev) => setEntries((arr) => arr.map((x, j) => (j === i ? { ...x, arabic: ev.target.value } : x)))}
                    className="arabic flex-1 bg-transparent focus:bg-white/5 rounded px-2 py-1 text-right min-w-0"
                  />
                  <input
                    value={e.english}
                    onChange={(ev) => setEntries((arr) => arr.map((x, j) => (j === i ? { ...x, english: ev.target.value } : x)))}
                    className="flex-1 bg-transparent focus:bg-white/5 rounded px-2 py-1 text-sm min-w-0"
                  />
                  {e.already_known && (
                    <span
                      className="text-[10px] text-gold-500/80 bg-gold-500/10 px-1.5 py-0.5 rounded shrink-0"
                      title={typeof e.already_known === 'string' ? `Already on ${e.already_known}` : 'Already saved'}
                    >
                      <Check className="w-3 h-3 inline" /> known
                    </span>
                  )}
                  {e.uncertain && <span className="text-amber-400 text-xs shrink-0">?</span>}
                  <button
                    onClick={() => setEntries((arr) => arr.filter((_, j) => j !== i))}
                    className="text-stone-200/50 hover:text-rose-400 shrink-0"
                    aria-label="Remove word"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-200/60">No words on this page.</p>
          )}
        </div>
      )}
    </div>
  );
}
