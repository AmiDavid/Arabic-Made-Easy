'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { NotebookPage } from '@/types';
import { X } from 'lucide-react';

export default function PagesViewerPage() {
  const [pages, setPages] = useState<NotebookPage[]>([]);
  const [selected, setSelected] = useState<NotebookPage | null>(null);

  useEffect(() => {
    supabase.from('notebook_pages').select('*').order('page').then(({ data }) => setPages((data as NotebookPage[]) || []));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">Notebook pages</h1>
      <p className="text-sm text-gray-400 mb-4">{pages.length} scanned pages — tap to enlarge</p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {pages.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="group aspect-[3/4] rounded-xl overflow-hidden border hairline bg-white/[0.02] relative"
          >
            <img src={p.image_path} alt={`Page ${p.page}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
              <div className="text-[10px] text-white">p.{p.page} · {p.entry_count} words</div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setSelected(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={selected.image_path} alt={`Page ${selected.page}`} className="max-h-[90vh] max-w-full rounded-lg" />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 rounded-full px-4 py-1.5">
            Page {selected.page} · {selected.entry_count} entries
          </div>
        </div>
      )}
    </div>
  );
}
