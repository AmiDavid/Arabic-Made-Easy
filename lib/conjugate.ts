/**
 * Builds a full conjugation table (past / present / future / imperative, all
 * persons) for any verb in the vocabulary, using the rules from the notebook:
 *   past     = stem + suf      (S.C.3 adds ـيـ, S.C.4 ى→ي, S.C.5 drops ا — not for هيّا & همّا)
 *   present  = pre + stem      (S.C.4 drops ي for إنتي، إنتو & همّا)
 *   future   = رح + present without بـ
 *   command  = the imperative's 6 cases (p.32–34)
 * Arabic only — pronunciation is added on request by /api/conjugate.
 */
import { parseForms } from './forms';
import { verbInfo, letters, type VerbCase } from './verbs';

export const PERSONS = [
  { ar: 'أنا', en: 'I' },
  { ar: 'إنتا', en: 'you m' },
  { ar: 'إنتي', en: 'you f' },
  { ar: 'هوّ', en: 'he' },
  { ar: 'هيّا', en: 'she' },
  { ar: 'إحنا', en: 'we' },
  { ar: 'إنتو', en: 'you pl' },
  { ar: 'همّا', en: 'they' },
] as const;

export type Conjugation = {
  verb: string; // past "he" form, as written
  english: string;
  verbCase: VerbCase;
  past: string[];
  present: string[] | null;
  future: string[] | null;
  imperative: string[] | null; // to a man, to a woman, to a group
  presentSuggested: boolean;
  /** e.g. "Your notebook has أزور ("I" form); the table is for زار." */
  note?: string;
  /** ★ people for this case: indexes into PERSONS */
  starPast: number[];
  starPresent: number[];
};

const VOWELS = /[ً-ِْٰ]/g; // short vowels, not shadda
const FINAL_VOWEL = /[ً-ِْٰ]+$/;
const noVowels = (s: string) => s.replace(VOWELS, '');
const dropFinalVowel = (s: string) => s.replace(FINAL_VOWEL, '');

/** Remove the present prefix (ي / ب / بي …) so we keep only the stem: يِكتِب → كتِب */
function presentStem(present: string, past: string): string {
  const pastCore = letters(past).replace(/^ا/, '');
  let s = present.trim();
  for (let i = 0; i < 2; i++) {
    const l = letters(s);
    if (l.length > pastCore.length && /^[بيم]/.test(l)) {
      s = s.replace(/^[بيم][ً-ْ]*/, '');
    } else break;
  }
  return s;
}

/**
 * After a prefix, the stem's first letter loses its vowel: مَنِع → بمنِع، إمنِع (not بمَنِع).
 * Kept when the 2nd letter is long (قارن، سافر) or doubled (قرّر، دوّر), where the vowel is real.
 */
function tidyStem(st: string): string {
  const m = st.match(/^([^\u064B-\u0652])([\u064E\u064F\u0650])([^\u064B-\u0652])([\u064B-\u0652]*)/);
  if (!m) return st;
  const [, , , second, marks] = m;
  if (/[اوي]/.test(second) || marks.includes('\u0651')) return st;
  return st[0] + st.slice(2);
}

const IRREGULAR_TABLES: Record<string, Partial<Conjugation>> = {
  اجى: {
    past: ['أجيت', 'أجيت', 'أجيتي', 'أجى', 'إجت', 'أجينا', 'أجيتو', 'إجو'],
    present: ['باجي', 'بتيجي', 'بتيجي', 'بيجي', 'بتيجي', 'منيجي', 'بتيجو', 'بيجو'],
    future: ['رح آجي', 'رح تيجي', 'رح تيجي', 'رح ييجي', 'رح تيجي', 'رح نيجي', 'رح تيجو', 'رح ييجو'],
    imperative: ['تعال', 'تعالي', 'تعالو'],
  },
};
const IRREGULAR_IMPERATIVE: Record<string, string[]> = {
  اكل: ['كُل', 'كُلي', 'كُلو'],
  اخد: ['خُد', 'خُدي', 'خُدو'],
  اخذ: ['خُد', 'خُدي', 'خُدو'],
};

export function conjugate(arabic: string, english: string, notes?: string | null): Conjugation | null {
  const info = verbInfo(arabic, english, notes);
  if (!info) return null;
  const forms = parseForms(arabic, english);
  // first alternative, first word; anything after it (عَلَى، بال) is carried along.
  // info.past is set when the notebook wrote a conjugated form (أزور → زار).
  const [pastWord, ...pastTail] = (info.past || forms.main).split(/\s*\/\s*/)[0].trim().split(/\s+/);
  const tail = pastTail.length ? ' ' + pastTail.join(' ') : '';
  const presentWord = info.present ? info.present.split(/\s*\/\s*/)[0].trim().split(/\s+/)[0] : null;
  const c = info.verbCase;
  const key = letters(pastWord);
  const star = {
    // past: S.C.3 / S.C.4 / S.C.5 change for everyone except هيّا & همّا
    starPast: c === 'regular' || c === 'irregular' || c === 'sc1' ? [] : [4, 7],
    // present: S.C.4 drops ي for إنتي، إنتو & همّا
    starPresent: c === 'sc4' || c === 'keeps-a' ? [2, 6, 7] : [],
  };

  const base: Conjugation = {
    verb: pastWord + tail,
    english,
    verbCase: c,
    past: [],
    present: null,
    future: null,
    imperative: null,
    presentSuggested: info.presentSuggested,
    note: info.note,
    ...star,
  };

  if (IRREGULAR_TABLES[key]) {
    const t = IRREGULAR_TABLES[key];
    return { ...base, ...t, past: t.past!.map((x) => x + tail) } as Conjugation;
  }

  // ---------------- past ----------------
  const P = dropFinalVowel(pastWord);
  const pl = letters(P);
  let suffixed: string; // the stem used with consonant endings (أنا، إنتا، إنتي، إحنا، إنتو)
  let vowelStem = P; // the stem used with vowel endings (هيّا، همّا)
  let joint = ''; // what goes between stem and ending (S.C.3 / S.C.4: ي)
  if (c === 'sc3') {
    suffixed = P;
    joint = 'ي';
  } else if (c === 'sc4' || (c === 'keeps-a' && /[ىاأ]$/.test(pl))) {
    // حكى → حكيت، حكت · قرا / قرأ → قريت، قرت
    suffixed = P.replace(/[ىاأ][ً-ْ]*$/, '');
    vowelStem = suffixed;
    joint = 'ي';
  } else if (c === 'keeps-a') {
    // نسي، صحي: نسيت (nsīt) … هيّا نسيت (nisyat), همّا نسيو
    suffixed = P.replace(/ي[ً-ْ]*$/, '');
    joint = 'ي';
    vowelStem = P;
  } else if (c === 'sc5' || c === 'sc2' || (c === 'sc1' && /ا.$/.test(pl) && pl.length >= 5)) {
    // drop the ا. 3 letters: the first letter takes ـُ (S.C.2: رُحت، خُفت) or ـِ (S.C.5: بِعت، نِمت).
    // Long verbs like إحتاج: إحتجت.
    const idx = P.lastIndexOf('ا');
    const withoutAlif = noVowels(P.slice(0, idx)) + P.slice(idx + 1);
    suffixed = pl.length === 3 ? withoutAlif[0] + (c === 'sc2' ? 'ُ' : 'ِ') + withoutAlif.slice(1) : withoutAlif;
  } else {
    suffixed = P;
  }
  const S = suffixed;
  base.past = [
    S + joint + 'ت',
    S + joint + 'ت',
    S + joint + 'تي',
    pastWord,
    vowelStem + 'ت',
    S + joint + 'نا',
    S + joint + 'تو',
    vowelStem + 'و',
  ].map((x) => x + tail);

  // ---------------- present & future ----------------
  if (presentWord) {
    const stem = presentStem(presentWord, pastWord);
    const st = tidyStem(dropFinalVowel(stem));
    // the final ي / ى (or ا in بقرا) drops before the ي / و endings of إنتي، إنتو، همّا
    const endsInY = c === 'sc4' || c === 'keeps-a' ? /[يىا]$/.test(noVowels(st)) : /[يى]$/.test(noVowels(st));
    // stem used before ي / و endings
    const before = endsInY ? noVowels(st).slice(0, -1) : noVowels(st);
    // ياكل → اكل (an alif that merges with the prefix), but أكّد keeps its hamza (بأكّد)
    const startsWithAlif = /^[اأآ]/.test(noVowels(st)) && !/^[اأآ][ً-ِْ]*.[ً-ِْ]*ّ/.test(st);
    const pre = { ana: 'ب', t: 'بت', y: 'بي', n: 'من' };
    const anaForm = startsWithAlif ? 'ب' + st.replace(/^[أآ]/, 'ا') : pre.ana + st;
    base.present = [
      anaForm,
      pre.t + st,
      pre.t + before + 'ي',
      pre.y + st,
      pre.t + st,
      pre.n + st,
      pre.t + before + 'و',
      pre.y + before + 'و',
    ].map((x) => x + tail);
    const anaFuture = startsWithAlif ? 'آ' + st.replace(/^[اأآ][ً-ْ]*/, '') : 'أ' + st;
    base.future = [
      anaFuture,
      'ت' + st,
      'ت' + before + 'ي',
      'ي' + st,
      'ت' + st,
      'ن' + st,
      'ت' + before + 'و',
      'ي' + before + 'و',
    ].map((x) => 'رح ' + x + tail);

    // ---------------- imperative ----------------
    if (IRREGULAR_IMPERATIVE[key]) {
      base.imperative = IRREGULAR_IMPERATIVE[key].map((x) => x + tail);
    } else {
      const pastStartsWithAlif = /^ا/.test(letters(pastWord));
      const coreLen = letters(pastWord).length;
      const needsAlif =
        pastStartsWithAlif || // إشتغل، إستنّى → إشتغل، إستنّى
        ((c === 'regular' || c === 'sc4' || c === 'keeps-a') && coreLen === 3 && !pastWord.includes('ّ') && !st.includes('ّ'));
      const imp = (needsAlif && !startsWithAlif ? 'إ' : '') + st;
      const impBefore = (needsAlif && !startsWithAlif ? 'إ' : '') + before;
      if (c === 'sc4') base.imperative = [imp, imp, impBefore + 'و'];
      else if (c === 'keeps-a') base.imperative = [imp, impBefore + 'ي', impBefore + 'و'];
      else base.imperative = [imp, impBefore + 'ي', impBefore + 'و'];
      base.imperative = base.imperative.map((x) => x + tail);
    }
  }
  return base;
}
