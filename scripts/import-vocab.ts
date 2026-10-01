/**
 * Import script: pushes Excel vocab + grammar rules + notebook page manifest to Supabase.
 *
 * Run once after schema.sql has been applied:
 *   npm run import-vocab -- ./data/arabic_vocabulary.xlsx
 */

import 'dotenv/config';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { GRAMMAR } from '../lib/grammar-content';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// -------- topic inference by Notebook 3 page ranges --------
// (based on how the notebook is actually organized)
function inferTopicSlug(pageLabel: string | null): string {
  if (!pageLabel) return 'general';

  // Existing Notebook 1/2 page numbers (from original spreadsheet) — general bucket
  const m3 = pageLabel.match(/Notebook 3, p\.(\d+)/);
  if (!m3) return 'general';
  const p = parseInt(m3[1], 10);

  if (p === 1) return 'time';
  if (p >= 2 && p <= 3) return 'colors';
  if (p >= 4 && p <= 6) return 'numbers-grammar';
  if (p >= 7 && p <= 16) return 'verbs-special';
  if (p >= 17 && p <= 22) return 'comparatives';
  if (p >= 23 && p <= 29) return 'market';
  if (p === 30) return 'question-words';
  if (p === 31) return 'time';
  if (p >= 32 && p <= 34) return 'imperative';
  if (p === 35 || p === 36) return 'house';
  if (p === 37 || p === 38) return 'appliances';
  if (p === 28 || p === 29) return 'clothing';
  if (p === 27 || p === 28) return 'body-meat';
  if (p >= 39 && p <= 42) return 'politics';
  if (p === 43) return 'elections';
  return 'general';
}

async function main() {
  const xlsxPath = process.argv[2] || './data/arabic_vocabulary.xlsx';
  if (!fs.existsSync(xlsxPath)) {
    console.error(`❌ File not found: ${xlsxPath}`);
    process.exit(1);
  }

  console.log('📖 Reading', xlsxPath);
  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);
  console.log(`   ${rows.length} rows`);

  // ------ Fetch topic slug -> id map ------
  const { data: topics, error: tErr } = await supabase.from('topics').select('id, slug');
  if (tErr || !topics) throw tErr;
  const topicIdBySlug = new Map(topics.map((t: any) => [t.slug, t.id]));

  // ------ Insert entries in batches ------
  const entries = rows.map((r) => {
    const pageLabel = r['Page(s)'] ? String(r['Page(s)']).trim() : null;
    let notebook: string | null = 'Notebook 1/2';
    let page: number | null = null;
    if (pageLabel) {
      const m = pageLabel.match(/^Notebook 3, p\.(\d+)$/);
      if (m) {
        notebook = 'Notebook 3';
        page = parseInt(m[1], 10);
      } else {
        // Older single-number page from original spreadsheet
        const p = parseInt(pageLabel.split(',')[0], 10);
        if (!isNaN(p)) page = p;
      }
    }
    const slug = inferTopicSlug(pageLabel);
    return {
      arabic: String(r['Arabic'] || '').trim(),
      english: String(r['English'] || '').trim(),
      topic_id: topicIdBySlug.get(slug) || topicIdBySlug.get('general'),
      notebook,
      page,
      page_label: pageLabel,
      entry_type: 'vocab',
      uncertain: String(r['English'] || '').includes('[?]'),
    };
  }).filter((e) => e.arabic && e.english);

  console.log(`💾 Inserting ${entries.length} entries…`);
  // Batch inserts (500 at a time) to avoid payload limits
  const batchSize = 500;
  for (let i = 0; i < entries.length; i += batchSize) {
    const chunk = entries.slice(i, i + batchSize);
    const { error } = await supabase.from('entries').insert(chunk);
    if (error) {
      console.error(`   Batch ${i} failed:`, error.message);
      throw error;
    }
    process.stdout.write(`   ${Math.min(i + batchSize, entries.length)}/${entries.length}\r`);
  }
  console.log(`\n✅ Entries imported`);

  // ------ Insert grammar rules ------
  console.log(`📚 Inserting ${GRAMMAR.length} grammar rules…`);
  for (const g of GRAMMAR) {
    const { error } = await supabase.from('grammar_rules').upsert(g, { onConflict: 'slug' });
    if (error) console.error(`   ${g.slug} failed:`, error.message);
  }
  console.log(`✅ Grammar imported`);

  // ------ Register notebook pages ------
  const pagesDir = path.join(process.cwd(), 'public', 'notebook-pages');
  if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f)).sort();
    console.log(`🖼  Registering ${files.length} notebook page images…`);
    const pageRecords = files.map((f, i) => ({
      notebook: 'Notebook 3',
      page: i + 1,
      image_path: `/notebook-pages/${f}`,
    }));
    // Group by page count for entries per page
    const { data: allEntries } = await supabase
      .from('entries')
      .select('page')
      .eq('notebook', 'Notebook 3');
    const counts = new Map<number, number>();
    for (const e of allEntries || []) {
      if (e.page) counts.set(e.page, (counts.get(e.page) || 0) + 1);
    }
    for (const r of pageRecords) (r as any).entry_count = counts.get(r.page) || 0;
    await supabase.from('notebook_pages').upsert(pageRecords, { onConflict: 'notebook,page' });
    console.log(`✅ Pages registered`);
  }

  console.log('\n🎉 All done. Open the app and browse /catalog');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
