'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Topic } from '@/types';
import { Camera, Loader2, Save, Trash2 } from 'lucide-react';

type Extracted = {
  arabic: string;
  english: string;
  uncertain: boolean;
  keep: boolean;
};

export default function ScanPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<Extracted[]>([]);
  const [suggestedSlug, setSuggestedSlug] = useState<string>('general');
  const [topicId, setTopicId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [nextPage, setNextPage] = useState<number>(44);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('topics').select('*').order('sort_order');
      setTopics((data as Topic[]) || []);
      // find highest existing page in Notebook 3 → suggest next
      const { data: last } = await supabase
        .from('entries')
        .select('page')
        .eq('notebook', 'Notebook 3')
        .order('page', { ascending: false })
        .limit(1);
      if (last && last[0]?.page) setNextPage(last[0].page + 1);
    })();
  }, []);

  async function handleFile(f: File) {
    setLoading(true);
    setSaved(false);
    setEntries([]);
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
      setEntries((json.entries || []).map((e: any) => ({ ...e, keep: true })));
      setSuggestedSlug(json.suggested_topic_slug || 'general');
      setTitle(json.title || '');
      setLoading(false);
    };
    reader.readAsDataURL(f);
  }

  useEffect(() => {
    if (suggestedSlug && topics.length) {
      const t = topics.find((x) => x.slug === suggestedSlug);
      if (t) setTopicId(t.id);
    }
  }, [suggestedSlug, topics]);

  async function saveAll() {
    const rows = entries
      .filter((e) => e.keep && e.arabic && e.english)
      .map((e) => ({
        arabic: e.arabic,
        english: e.uncertain ? `${e.english} [?]` : e.english,
        topic_id: topicId,
        notebook: 'Notebook 3',
        page: nextPage,
        page_label: `Notebook 3, p.${nextPage}`,
        entry_type: 'vocab',
        uncertain: e.uncertain,
      }));
    if (!rows.length) return;
    const { error } = await supabase.from('entries').insert(rows);
    if (error) return alert('Save failed: ' + error.message);
    setSaved(true);
    setEntries([]);
    setImgUrl(null);
    setNextPage(nextPage + 1);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">Scan a notebook page</h1>
      <p className="text-sm text-gray-400 mb-4">Take or upload a photo — AI extracts the vocab, you confirm.</p>

      {!imgUrl && (
        <label className="block border-2 border-dashed hairline rounded-2xl p-10 text-center cursor-pointer hover:bg-white/[0.02]">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Camera className="w-10 h-10 text-brand-500 mx-auto mb-2" />
          <div className="font-semibold">Take or choose photo</div>
          <div className="text-xs text-gray-500 mt-1">on phone: uses your camera</div>
        </label>
      )}

      {imgUrl && (
        <div className="mb-4">
          <img src={imgUrl} alt="scan" className="rounded-xl max-h-64 mx-auto border hairline" />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-8">
          <Loader2 className="w-5 h-5 animate-spin" /> Reading page…
        </div>
      )}

      {entries.length > 0 && (
        <>
          {title && <div className="text-sm text-gray-400 mb-2">Detected title: <span className="text-gray-200">{title}</span></div>}
          <div className="flex gap-2 mb-3">
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="flex-1 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm">
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
            </select>
            <input
              type="number"
              value={nextPage}
              onChange={(e) => setNextPage(parseInt(e.target.value, 10))}
              className="w-24 bg-white/5 border hairline rounded-xl px-3 py-2 text-sm"
              placeholder="page"
            />
          </div>

          <ul className="space-y-1 border hairline rounded-xl overflow-hidden bg-white/[0.02] mb-4">
            {entries.map((e, i) => (
              <li key={i} className={`flex items-center gap-3 p-2 ${!e.keep ? 'opacity-40' : ''}`}>
                <input
                  type="checkbox"
                  checked={e.keep}
                  onChange={(ev) => setEntries((arr) => arr.map((x, j) => j === i ? { ...x, keep: ev.target.checked } : x))}
                  className="accent-brand-500"
                />
                <input
                  value={e.arabic}
                  onChange={(ev) => setEntries((arr) => arr.map((x, j) => j === i ? { ...x, arabic: ev.target.value } : x))}
                  className="arabic flex-1 bg-transparent focus:bg-white/5 rounded px-2 py-1 text-right"
                />
                <input
                  value={e.english}
                  onChange={(ev) => setEntries((arr) => arr.map((x, j) => j === i ? { ...x, english: ev.target.value } : x))}
                  className="flex-1 bg-transparent focus:bg-white/5 rounded px-2 py-1 text-sm"
                />
                {e.uncertain && <span className="text-amber-400 text-xs">?</span>}
                <button onClick={() => setEntries((arr) => arr.filter((_, j) => j !== i))} className="text-gray-500 hover:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>

          <button onClick={saveAll} className="w-full bg-brand-500 hover:bg-brand-600 rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Save {entries.filter((e) => e.keep).length} entries to page {nextPage}
          </button>
        </>
      )}

      {saved && (
        <div className="mt-4 text-center text-emerald-400 pop">✓ Saved!</div>
      )}
    </div>
  );
}
