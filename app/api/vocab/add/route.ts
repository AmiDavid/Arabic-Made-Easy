import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripDiacritics } from '@/lib/utils';

/**
 * POST /api/vocab/add
 * Body: {
 *   items: [{ arabic, english, notes? }],
 *   source: 'conversation' | 'sentences' | 'recap',
 *   entryType?: 'vocab' | 'phrase'
 * }
 * Adds items to the learner's vocabulary under the "From practice" topic,
 * skipping anything already in the DB (diacritics-insensitive).
 * Returns { added, skipped }.
 */

const TOPIC_SLUG = 'from-practice';

export async function POST(req: NextRequest) {
  try {
    const { items, source, entryType } = await req.json();
    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: 'items required' }, { status: 400 });
    }
    const admin = supabaseAdmin();

    // Make sure the topic exists
    let { data: topic } = await admin.from('topics').select('id').eq('slug', TOPIC_SLUG).maybeSingle();
    if (!topic) {
      const { data: created, error } = await admin
        .from('topics')
        .insert({ slug: TOPIC_SLUG, name_en: 'From practice', name_ar: 'مِن التَمرِين', sort_order: 130 })
        .select('id')
        .single();
      if (error) throw error;
      topic = created;
    }

    // Existing words (diacritics-insensitive) to avoid duplicates
    const existing = new Set<string>();
    let from = 0;
    while (true) {
      const { data } = await admin.from('entries').select('arabic').order('id').range(from, from + 999);
      if (!data?.length) break;
      for (const e of data) existing.add(stripDiacritics(String(e.arabic).split('،')[0]).trim());
      if (data.length < 1000) break;
      from += 1000;
    }

    const label =
      source === 'sentences' ? 'Sentence practice' : source === 'recap' ? 'Weekly recap' : 'Voice chat';

    const rows = [];
    let skipped = 0;
    for (const it of items) {
      const ar = String(it.arabic || '').trim();
      const en = String(it.english || '').trim();
      if (!ar || !en) continue;
      const key = stripDiacritics(ar.split('،')[0]).trim();
      if (existing.has(key)) {
        skipped++;
        continue;
      }
      existing.add(key);
      rows.push({
        arabic: ar,
        english: en,
        topic_id: topic!.id,
        notebook: 'Practice',
        page: null,
        page_label: label,
        entry_type: entryType || 'vocab',
        uncertain: false,
        notes: it.notes || null,
      });
    }

    if (rows.length) {
      const { error } = await admin.from('entries').insert(rows);
      if (error) throw error;
    }
    return NextResponse.json({ added: rows.length, skipped });
  } catch (err: any) {
    console.error('vocab/add error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
