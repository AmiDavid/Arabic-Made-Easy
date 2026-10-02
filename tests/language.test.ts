/**
 * Language tests — run with `npm test`.
 * They check the rules that build forms and conjugation tables against the
 * hand-written tables from the notebook (lib/grammar-verbs.ts) and against
 * known words, so a code change can't silently break them.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseForms } from '../lib/forms';
import { classifyVerb, verbInfo, letters } from '../lib/verbs';
import { conjugate } from '../lib/conjugate';
import { VERB_TABLES } from '../lib/grammar-verbs';

const bare = (s: string) => letters(s).replace(/ة/g, 'ه');

test('two forms: singular، plural with shorthand ات', () => {
  const f = parseForms('كَاسَة، ات', 'glass');
  assert.equal(bare(f.main), bare('كاسة'));
  assert.equal(bare(f.second!), bare('كاسات'));
  assert.equal(f.kind, 'plural');
});

test('two forms: past، present', () => {
  const f = parseForms('طَلَب، بُطلُب', 'to order, to ask');
  assert.equal(f.kind, 'present');
  assert.equal(bare(f.second!), 'بطلب');
});

test('feminine marker / ة', () => {
  const f = parseForms('سَايِح / ة، سُوَّاح', 'tourist');
  assert.equal(bare(f.feminine!), bare('سايحة'));
  assert.equal(bare(f.second!), 'سواح');
});

test('present in brackets', () => {
  const f = parseForms('فَتَح (يفتَح)', 'to open');
  assert.equal(bare(f.second!), 'يفتح');
});

test('verb cases follow the notebook', () => {
  const cases: [string, string][] = [
    ['حَبّ', 'sc3'], ['فَك', 'sc3'], ['حَكَى', 'sc4'], ['شَكَا', 'sc4'], ['إِشتَرَى', 'sc4'],
    ['بَاع', 'sc5'], ['نَام', 'sc5'], ['جَاب', 'sc5'], ['اِستَنَّى', 'keeps-a'], ['نِسِي', 'keeps-a'],
    ['أَجَى', 'irregular'], ['أَكَل', 'irregular'], ['كَتَب', 'regular'], ['سَأَل', 'regular'], ['قَرَأ', 'keeps-a'],
    ['جَاوَب', 'regular'], ['إِستَخدَم', 'sc1'], ['إِشتَغَل', 'sc1'], ['إِحتَاج', 'sc1'], ['أَرسَل', 'sc1'],
    ['رَاح', 'sc2'], ['قَال', 'sc2'], ['خَاف', 'sc2'], ['لَام', 'sc2'],
  ];
  for (const [verb, expected] of cases) assert.equal(verbInfo(verb, 'to x')?.verbCase ?? classifyVerb(verb), expected, verb);
});

test('non-verbs are not treated as verbs', () => {
  assert.equal(verbInfo('عَلَى', 'to a place / on'), null);
  assert.equal(verbInfo('بَيت، بُيُوت', 'house'), null);
});

test('رجّع (give back) is not confused with رجع (return)', () => {
  assert.equal(bare(verbInfo('رَجَّع', 'to give back')!.present!), bare('يرجّع'));
  assert.equal(bare(verbInfo('رِجِع', 'to return')!.present!), bare('يرجع'));
});

// Every hand-written table in the grammar chapter must match what the engine builds.
for (const [word, { english, table }] of Object.entries(VERB_TABLES)) {
  test(`conjugation matches the grammar table: ${word}`, () => {
    const c = conjugate(word, english);
    assert.ok(c, 'conjugates');
    const cmp = (name: string, got: string[] | null, want: [string, string][]) => {
      assert.ok(got, `${name} exists`);
      want.forEach(([ar], i) => assert.equal(bare(got![i]), bare(ar), `${name} #${i + 1}`));
    };
    cmp('past', c!.past, table.past);
    cmp('present', c!.present, table.pres);
    cmp('future', c!.future, table.fut);
    cmp('imperative', c!.imperative, table.imp);
  });
}

const nv = (s: string) => s.replace(/[\u064B-\u0652\u0670]/g, '');

test('conjugated examples saved as words are traced back to the verb', () => {
  const sleep = conjugate('أنام', 'I sleep / to sleep')!;
  assert.equal(nv(sleep.past[0]), 'نمت');
  assert.equal(nv(sleep.present![0]), 'بنام');
  const visit = conjugate('أَزوَر', 'to visit')!;
  assert.equal(visit.verbCase, 'sc2');
  assert.equal(nv(visit.past[0]), 'زرت');
  const live = conjugate('بسكنو', 'they live (from سَكَن, to live / reside)')!;
  assert.equal(nv(live.past[0]), 'سكنت');
  assert.equal(conjugate('يِشتَغلو', 'they work / to work [?]'), null);
  assert.equal(conjugate('بَدّ', 'to want [?]'), null);
});

test('verbs that keep ا / ى in the present (قرا، تلاقى)', () => {
  for (const w of ['قَرَا', 'قَرَأ']) {
    const c = conjugate(w, 'to read')!;
    assert.equal(c.verbCase, 'keeps-a', w);
    assert.equal(nv(c.past[0]), 'قريت', w);
    assert.deepEqual(c.imperative!.map(nv), ['إقرا', 'إقري', 'إقرو'], w);
  }
  const t = conjugate('تلَاقَى (يتلَاقَى)', 'to meet with')!;
  assert.equal(t.verbCase, 'keeps-a');
  assert.equal(nv(t.imperative![1]), 'تلاقي');
});

test('prefix spelling: no stray vowel, hamza kept', () => {
  const m = conjugate('مَنَع، مَنِع', 'to prevent')!;
  assert.equal(m.present![0], 'بمنِع');
  assert.equal(m.imperative![0], 'إمنِع');
  const a = conjugate('أَكَّد، بَأَكِّد', 'to confirm')!;
  assert.equal(nv(a.present![0]), 'بأكد');
  const q = conjugate('قَارَن، بِقَارِن', 'to compare')!;
  assert.equal(q.present![0], 'بقَارِن');
});
