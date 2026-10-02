'use client';
import { useEffect, useState } from 'react';
import { X, Loader2, Trash2, ImageIcon } from 'lucide-react';
import type { Entry, Topic } from '@/types';
import { updateEntry, deleteEntry, withChecked, withoutSuggestion } from '@/lib/qa';
import { notebookPageImage } from '@/lib/notebook-images';
import { supabase } from '@/lib/supabase';

/** Fix a word: both forms, English, topic, "unclear" flag — or delete it. */
export function EditEntrySheet({
  entry,
  onClose,
  onSaved,
  onDeleted,
  presetSecond,
}: {
  entry: Entry;
  /** prefill the second form (e.g. the app's suggested present) */
  presetSecond?: string;
  onClose: () => void;
  onSaved: (e: Entry) => void;
  onDeleted: (id: string) => void;
}) {
  const [first, ...rest] = entry.arabic.split('،');
  const [main, setMain] = useState(first.trim());
  const [second, setSecond] = useState(rest.join('،').trim() || presetSecond || '');
  const [english, setEnglish] = useState(entry.english.replace(/\s*\[\?\]\s*/g, ' ').trim());
  const [topicId, setTopicId] = useState(entry.topic_id || '');
  const [uncertain, setUncertain] = useState(entry.uncertain);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPage, setShowPage] = useState(false);

  const photo = entry.notebook === 'Notebook 3' && entry.page && entry.page <= 38 ? notebookPageImage(entry.page) : null;

  useEffect(() => {
    supabase
      .from('topics')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setTopics((data as Topic[]) || []));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save() {
    if (!main.trim() || !english.trim()) return setError('Arabic and English are both needed.');
    setBusy(true);
    setError(null);
    try {
      const arabic = second.trim() ? `${main.trim()}، ${second.trim()}` : main.trim();
      const updated = await updateEntry(entry.id, {
        arabic,
        english: uncertain ? `${english.trim()} [?]` : english.trim(),
        topic_id: topicId || null,
        uncertain,
        notes: withChecked(second.trim() ? withoutSuggestion(entry.notes) : entry.notes, 'ok'),
      });
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${entry.arabic}" (${entry.english})? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteEntry(entry.id);
      onDeleted(entry.id);
      onClose();
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  const input =
    'w-full bg-white/5 border hairline rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold-500/50';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-night-900 border hairline shadow-2xl pop">
        <div className="sticky top-0 bg-night-900/95 backdrop-blur px-4 pt-4 pb-3 border-b hairline flex items-center">
          <h2 className="flex-1 font-semibold">Fix this word</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 -m-1 rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4 pb-10">
          <label className="block">
            <span className="text-xs text-stone-200/70">Arabic: singular / past form</span>
            <input dir="rtl" value={main} onChange={(e) => setMain(e.target.value)} className={`${input} arabic text-xl text-right mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs text-stone-200/70">
              Second form: plural (nouns) or present (verbs). Leave empty if there isn't one. Short endings like ات are fine.
            </span>
            <input dir="rtl" value={second} onChange={(e) => setSecond(e.target.value)} className={`${input} arabic text-xl text-right mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs text-stone-200/70">English</span>
            <input value={english} onChange={(e) => setEnglish(e.target.value)} className={`${input} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs text-stone-200/70">Topic</span>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={`${input} mt-1`}>
              <option value="">(no topic)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name_en}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={uncertain} onChange={(e) => setUncertain(e.target.checked)} className="w-4 h-4 accent-amber-500" />
            Still unclear (keep the ? mark)
          </label>

          <div className="text-xs text-stone-200/50 flex items-center gap-3">
            <span>From: {entry.page_label || '—'}</span>
            {photo && (
              <button onClick={() => setShowPage(!showPage)} className="text-gold-300 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> {showPage ? 'hide' : 'see'} the notebook page
              </button>
            )}
          </div>
          {showPage && photo && <img src={photo} alt={`Notebook page ${entry.page}`} className="rounded-xl w-full" />}

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              onClick={save}
              disabled={busy}
              className="flex-1 rounded-xl bg-gold-500/25 border border-gold-500/50 text-gold-100 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 px-4 flex items-center gap-1.5 disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
