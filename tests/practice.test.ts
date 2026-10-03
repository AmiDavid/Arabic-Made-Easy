process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'x';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Entry } from '../types';

const mk = (i: number): Entry => ({
  id: `e${i}`, arabic: `كَلِمَة${i}`, english: `word ${i}`, topic_id: null, notebook: null, page: null,
  page_label: null, entry_type: 'vocab', uncertain: false, notes: null, created_at: '',
});

test('deck deals every word once before repeating', async () => {
  const { Deck } = await import('../lib/practice');
  const pool = Array.from({ length: 30 }, (_, i) => mk(i));
  const d = new Deck(pool);
  const seen = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const e = d.next()!;
    assert.ok(!seen.has(e.id), `repeat of ${e.id} at ${i}`);
    seen.add(e.id);
  }
  assert.equal(d.next(), null);
});

test('missed word comes back, but not immediately', async () => {
  const { Deck } = await import('../lib/practice');
  const pool = Array.from({ length: 20 }, (_, i) => mk(i));
  const d = new Deck(pool);
  const first = d.next()!;
  d.requeue(first);
  const order = Array.from({ length: 20 }, () => d.next()!.id);
  const at = order.indexOf(first.id);
  assert.ok(at >= 3, `came back too soon (${at})`);
});

test('options are 4 distinct answers including the correct one', async () => {
  const { buildOptions } = await import('../lib/practice');
  const pool = [mk(1), mk(2), { ...mk(3), english: 'word 1' }, mk(4), mk(5)];
  for (let k = 0; k < 50; k++) {
    const o = buildOptions(pool[0], pool, 'ar-to-en');
    assert.equal(o.length, 4);
    assert.equal(new Set(o).size, 4);
    assert.ok(o.includes('word 1'));
  }
});
