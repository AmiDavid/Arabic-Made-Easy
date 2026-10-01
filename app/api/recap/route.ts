import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripDiacritics } from '@/lib/utils';

/**
 * GET /api/recap — what happened in the last 7 days:
 * conversations held, new words the teacher used, corrections received,
 * and entries added to the vocabulary (scans, practice).
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = supabaseAdmin();
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const { data: convos } = await admin
      .from('conversations')
      .select('messages, updated_at')
      .gte('updated_at', since)
      .order('updated_at', { ascending: false });

    const wordMap = new Map<string, { arabic: string; english: string }>();
    const corrMap = new Map<string, { wrong: string; right: string; explanation: string }>();
    let learnerMessages = 0;

    for (const c of convos || []) {
      for (const m of c.messages || []) {
        if (m.role === 'user') learnerMessages++;
        for (const w of m.new_words || []) {
          const k = stripDiacritics(String(w.arabic || '')).trim();
          if (k && !wordMap.has(k)) wordMap.set(k, { arabic: w.arabic, english: w.english });
        }
        for (const corr of m.corrections || []) {
          const k = stripDiacritics(String(corr.right || '')).trim();
          if (k && !corrMap.has(k)) corrMap.set(k, corr);
        }
      }
    }

    const { data: added, count: addedCount } = await admin
      .from('entries')
      .select('arabic, english, page_label', { count: 'exact' })
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(40);

    return NextResponse.json({
      conversations: convos?.length || 0,
      learnerMessages,
      newWords: Array.from(wordMap.values()),
      corrections: Array.from(corrMap.values()),
      addedEntries: added || [],
      addedCount: addedCount || 0,
    });
  } catch (err: any) {
    console.error('recap error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
