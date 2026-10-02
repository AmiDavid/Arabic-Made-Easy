/**
 * Most notebook words are written with two forms, separated by "،":
 *   nouns:  singular، plural        بَيت، بُيُوت   ·   كَاسَة، ات  (ات = add ات)
 *   verbs:  past، present           طَلَب، بُطلُب
 *   people: m / ة، plural           سَايِح / ة، سُوَّاح   (ة = feminine form)
 * parseForms() splits the stored text into its parts without changing what's
 * saved, so every screen can show both forms with a clear label.
 */

export type FormKind = 'plural' | 'present' | 'imperative';

export type WordForms = {
  /** the first form(s): singular / past — what you'd look up */
  main: string;
  /** the second form(s): plural / present, with shorthands expanded */
  second: string | null;
  /** what the second form is */
  kind: FormKind | null;
  /** feminine form, when written as "X / ة" */
  feminine: string | null;
  /** the text exactly as written in the notebook */
  raw: string;
};

const HARAKAT = /[ً-ْٰ]/g;
const SHORTHANDS = new Set(['ات', 'ين', 'ون', 'ـات', 'ـين', 'ـون']);

function bare(s: string) {
  return s.replace(HARAKAT, '').trim();
}

/** "كَاسَة" + "ات" → "كَاسَات";  "مَصرُوف" + "ات" → "مَصرُوفَات" */
function expandShorthand(main: string, short: string): string {
  const suffix = bare(short).replace(/^ـ/, '');
  const word = main.trim();
  if (suffix === 'ات') {
    // drop ة (and a vowel mark after it), keep the fatha before it
    if (/ة[ً-ْ]*$/.test(word)) return word.replace(/ة[ً-ْ]*$/, 'ات');
    return word.replace(/[ً-ْ]*$/, '') + 'َات';
  }
  if (suffix === 'ين') return word.replace(/[ً-ْ]*$/, '') + 'ِين';
  if (suffix === 'ون') return word.replace(/[ً-ْ]*$/, '') + 'ُون';
  return short;
}

function feminineOf(main: string): string {
  const w = main.trim().replace(/[ً-ْ]*$/, '');
  return w.endsWith('ي') ? w + 'ّة' : w + 'َة';
}

export function kindFromEnglish(english: string): FormKind {
  const en = english.trim().toLowerCase();
  if (/\(m\s*\/\s*f\s*\/\s*pl\)/.test(en) && /^to\b/.test(en)) return 'imperative';
  if (/^to\b/.test(en)) return 'present';
  // English sometimes lists the meanings ("order, to ask") — check any part
  if (en.split(/[,/]/).some((p) => /^\s*to\s/.test(p))) return 'present';
  return 'plural';
}

export function parseForms(arabic: string, english = ''): WordForms {
  const raw = (arabic || '').trim();
  const empty: WordForms = { main: raw, second: null, kind: null, feminine: null, raw };
  if (!raw.includes('،')) return empty;

  const segs = raw.split(/\s*\/\s*/).filter(Boolean);
  const mains: string[] = [];
  const seconds: string[] = [];
  let seenComma = false;
  for (const seg of segs) {
    if (seg.includes('،')) {
      const [left, ...rest] = seg.split('،');
      if (left.trim()) mains.push(left.trim());
      const right = rest.join('،').trim();
      if (right) seconds.push(...right.split('،').map((x) => x.trim()).filter(Boolean));
      seenComma = true;
    } else if (seenComma) {
      seconds.push(seg.trim());
    } else {
      mains.push(seg.trim());
    }
  }

  // "سَايِح / ة" → feminine marker
  let feminine: string | null = null;
  const realMains = mains.filter((m) => {
    if (bare(m) === 'ة' || bare(m) === 'ـة') {
      feminine = mains[0] ? feminineOf(mains[0]) : null;
      return false;
    }
    return true;
  });
  if (!realMains.length || !seconds.length) return empty;

  // expand ات / ين shorthands (for every main when they share one ending)
  const expanded: string[] = [];
  for (const s of seconds) {
    if (SHORTHANDS.has(bare(s))) {
      for (const m of realMains) expanded.push(expandShorthand(m, s));
    } else {
      expanded.push(s);
    }
  }

  return {
    main: realMains.join(' / '),
    second: [...new Set(expanded)].join(' / '),
    // same letters, different vowels (وَافَق، وَافِق) = a verb even if the English has no "to"
    kind: bare(realMains[0]) === bare(expanded[0]) ? 'present' : kindFromEnglish(english),
    feminine,
    raw,
  };
}

export const FORM_LABEL: Record<FormKind, { short: string; long: string }> = {
  plural: { short: 'pl.', long: 'plural' },
  present: { short: 'present', long: 'present / future' },
  imperative: { short: 'command', long: 'command (m / f / pl)' },
};

/** The form to type or match in games (first spelling of the main form). */
export function primaryForm(arabic: string, english = ''): string {
  return parseForms(arabic, english).main.split(' / ')[0].trim();
}
