'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Topic } from '@/types';
import { Camera, Loader2, Save, Trash2, Image as ImageIcon, BookMarked, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Extracted = {
  arabic: string;
  english: string;
  uncertain: boolean;
  keep: boolean;
  already_known: string | boolean;
};

type ScanResponse = {
  page_type: 'vocab' | 'grammar' | 'mixed';
  title?: string;
  suggested_topic_slug: string;
  grammar?: { title?: string; summary?: string; content?: string };
  entries: Extracted[];
};

export default function ScanPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [entries, setEntries] = useState<Extracted[]>([]);
  const [topicId, setTopicId] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [nextPage, setNextPage] = useState<number>(44);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('topics').select('*').order('sort_order');
      setTopics((data as Topic[]) || []);
      const { data: last } = await supabase
        .from('entries').select('page').eq('notebook', 'Notebook 3').order('page', { ascending: false }).limit(1);
      if (last && last[0]?.page) setNextPage(last[0].page + 1);
    })();
  }, []);

  async function handleFile(f: File) {
    setLoading(true);
    setSaved(false);
    setEntries([]);
    setScanResult(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImgUrl(dataUrl);
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      const json = await resp.json();
      if (json.error) {
        alert('Scan failed: ' + json.error);
        setLoading(false);
        return;
      }
      setScanResult(json as ScanResponse);
      setEntries(((json.entries as Extracted[]) || []).map((e) => ({
        ...e,
        keep: !e.already_known,  // default: unchecked if already known
      })));
      setLoading(false);
    };
    reader.readAsDataURL(f);
  }

  useEffect(() => {
    if (scanResult?.suggested_topic_slug && topics.length) {
      const t = topics.find((x) => x.slug === scanResult.suggested_topic_slug);
      if (t) setTopicId(t.id);
    }
  }, [scanResult, topics]);

  async function saveAll() {
    const toSave = entries.filter((e) => e.keep && e.arabic && e.english);
    const grammar = scanResult?.grammar;
    const anyGrammar = scanResult?.page_type !== 'vocab' && grammar?.title;

    const results: string[] = [];

    if (toSave.length) {
      const rows = toSave.map((e) => ({
        arabic: e.arabic,
        english: e.uncertain ? `${e.english} [?]` : e.english,
        topic_id: topicId,
        notebook: 'Notebook 3',
        page: nextPage,
        page_label: `Notebook 3, p.${nextPage}`,
        entry_type: 'vocab' as const,
        uncertain: e.uncertain,
      }));
      const { error } = await supabase.from('entries').insert(rows);
      if (error) return alert('Save failed: ' + error.message);
      results.push(`${rows.length} vocab entries saved`);
    }

    if (anyGrammar && grammar) {
      const slug = `scan-${nextPage}-${(grammar.title || 'rule').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
      const { error } = await supabase.from('grammar_rules').upsert({
        slug,
        title: grammar.title!,
        category: scanResult?.suggested_topic_slug || 'misc',
        summary: grammar.summary || '',
        content_md: grammar.content || '',
        examples: [],
        source_pages: [nextPage],
        sort_order: 999,
      }, { onConflict: 'slug' });
      if (error) return alert('Grammar save failed: ' + error.message);
      results.push('grammar rule saved');
    }

    if (!results.length) return alert('Nothing to save');
    setSaved(true);
    setEntries([]);
    setScanResult(null);
    setImgUrl(null);
    setNextPage(nextPage + 1);
    setTimeout(() => setSaved(false), 3000);
  }

  const knownCount = entries.filter((e) => e.already_known).length;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">Scan a notebook page</h1>
      <p className="text-sm text-stone-200/60 mb-4">
        Take or upload a photo — AI extracts vocabulary and grammar rules. You confirm what to save.
      </p>

      {!imgUrl && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block border-2 border-dashed hairline rounded-2xl p-6 text-center cursor-pointer hover:bg-white/[0.02]">
            <input type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Camera className="w-8 h-8 text-gold-500 mx-auto mb-2" />
            <div className="font-semibold">Take photo</div>
            <div className="text-xs text-stone-200/50 mt-1">opens camera</div>
          </label>
          <label className="block border-2 border-dashed hairline rounded-2xl p-6 text-center cursor-pointer hover:bg-white/[0.02]">
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <ImageIcon className="w-8 h-8 text-gold-500 mx-auto mb-2" />
            <div className="font-semibold">Choose from gallery</div>
            <div className="text-xs text-stone-200/50 mt-1">pick existing image</div>
          </label>
        </div>
      )}

      {imgUrl && (
        <div className="mb-4">
          <img src={imgUrl} alt="scan" className="rounded-xl max-h-64 mx-auto border hairline" />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-stone-200/70 py-8">
          <Loader2 className="w-5 h-5 animate-spin" /> Reading page…
        </div>
      )}

      {scanResult && (
        <>
          {/* Page-type banner */}
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className={cn(
              'px-2 py-1 rounded-full font-semibold',
              scanResult.page_type === 'grammar' ? 'bg-olive-500/20 text-olive-300' :
              scanResult.page_type === 'mixed' ? 'bg-gold-500/20 text-gold-500' :
              'bg-stone-500/20 text-stone-200'
            )}>
              {scanResult.page_type === 'grammar' ? '📖 Grammar page' :
               scanResult.page_type === 'mixed' ? '📖+📝 Mixed' : '📝 Vocab page'}
            </span>
            {scanResult.title && <span className="text-stone-200/70">{scanResult.title}</span>}
            {knownCount > 0 && (
              <span className="ml-auto px-2 py-1 rounded-full bg-night-500/40 text-stone-200/70">
                {knownCount} already known
              </span>
            )}
          </div>

          {/* Grammar preview */}
          {scanResult.grammar?.title && (
            <div className="mb-4 p-3 rounded-xl bg-olive-900/30 border border-olive-700/50">
              <div className="flex items-center gap-2 text-xs text-olive-300 mb-1">
                <BookMarked className="w-3.5 h-3.5" />
                <span className="font-semibold">New grammar rule detected</span>
              </div>
              <div className="font-semibold text-stone-50">{scanResult.grammar.title}</div>
              {scanResult.grammar.summary && (
                <div className="text-sm text-stone-200/70 mt-1">{scanResult.grammar.summary}</div>
              )}
              <div className="text-[10px] text-olive-300/70 mt-2">Will be saved to Grammar on confirm.</div>
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm">
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
            </select>
            <input type="number" value={nextPage} onChange={(e) => setNextPage(parseInt(e.target.value, 10))}
              className="w-24 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm" placeholder="page" />
          </div>

          <ul className="space-y-1 border hairline rounded-xl overflow-hidden bg-white/[0.02] mb-4">
            {entries.map((e, i) => (
              <li key={i} className={cn('flex items-center gap-2 p-2', !e.keep && 'opacity-40')}>
                <input type="checkbox" checked={e.keep}
                  onChange={(ev) => setEntries((arr) => arr.map((x, j) => j === i ? { ...x, keep: ev.target.checked } : x))}
                  className="accent-gold-500 shrink-0" />
                <input value={e.arabic}
                  onChange={(ev) => setEntries((arr) => arr.map((x, j) => j === i ? { ...x, arabic: ev.target.value } : x))}
                  className="arabic flex-1 bg-transparent focus:bg-white/5 rounded px-2 py-1 text-right min-w-0" />
                <input value={e.english}
                  onChange={(ev) => setEntries((arr) => arr.map((x, j) => j === i ? { ...x, english: ev.target.value } : x))}
                  className="flex-1 bg-transparent focus:bg-white/5 rounded px-2 py-1 text-sm min-w-0" />
                {e.already_known && (
                  <span className="text-[10px] text-gold-500/80 bg-gold-500/10 px-1.5 py-0.5 rounded shrink-0" title={typeof e.already_known === 'string' ? `Already on ${e.already_known}` : 'Already in DB'}>
                    <Check className="w-3 h-3 inline" /> known
                  </span>
                )}
                {e.uncertain && <span className="text-amber-400 text-xs shrink-0">?</span>}
                <button onClick={() => setEntries((arr) => arr.filter((_, j) => j !== i))} className="text-stone-200/50 hover:text-rose-400 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>

          <button onClick={saveAll} className="w-full bg-gold-500 hover:bg-gold-600 text-night-900 rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Save {entries.filter((e) => e.keep).length} new entries
            {scanResult.grammar?.title && ' + grammar rule'}
          </button>
        </>
      )}

      {saved && (
        <div className="mt-4 text-center text-olive-300 pop">✓ Saved!</div>
      )}
    </div>
  );
}
