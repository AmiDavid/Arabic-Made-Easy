/**
 * Grammar is shown in sections, in the order you'd learn it. Every card —
 * built-in or scanned — is placed by sectionOf(): the section you (or the
 * scanner) chose, stored as category "section:<id>", otherwise by what the card is about.
 * Inside a section, cards follow the notebook: S.C. number first, then page.
 */
export type SectionId =
  | 'nouns'
  | 'numbers'
  | 'verbs'
  | 'verb-cases'
  | 'negation'
  | 'kan'
  | 'imperative'
  | 'time'
  | 'comparatives'
  | 'words'
  | 'other';

export const SECTIONS: { id: SectionId; title: string; ar: string }[] = [
  { id: 'nouns', title: 'Nouns, adjectives & possessives', ar: 'الأَسمَاء وَالصِفَات' },
  { id: 'numbers', title: 'Numbers & dates', ar: 'الأَرقَام' },
  { id: 'verbs', title: 'Verbs: past, present, future', ar: 'الأَفعَال' },
  { id: 'verb-cases', title: 'Verbs: special cases (S.C.)', ar: 'حَالَات خَاصَّة' },
  { id: 'negation', title: 'Saying "not"', ar: 'النَفِي' },
  { id: 'kan', title: 'كان (to be) & عند (to have)', ar: 'كَان وعِند' },
  { id: 'imperative', title: 'Imperative (commands)', ar: 'الأَمر' },
  { id: 'time', title: 'Time expressions', ar: 'الوَقت' },
  { id: 'comparatives', title: 'Comparatives', ar: 'المُقَارَنَة' },
  { id: 'words', title: 'Building words', ar: 'بِنَاء الكَلِمَات' },
  { id: 'other', title: 'Other', ar: 'غَيرُه' },
];

const IDS = new Set(SECTIONS.map((s) => s.id));

type RuleLike = { slug: string; title: string; summary?: string | null; category?: string | null; source_pages?: number[] };

// built-in cards
const BUILT_IN: Record<string, SectionId> = {
  'verbs-how-to-conjugate': 'verbs',
  'colors-m-f': 'nouns',
  'm-prefix-patterns': 'words',
  'before-after-like': 'time',
  'last-past-time': 'time',
  'imperative-formation': 'imperative',
};

export function sectionOf(r: RuleLike): SectionId {
  // a section chosen by you ("Move to…") or by the scanner is stored as "section:<id>"
  const chosen = r.category?.startsWith('section:') ? r.category.slice(8) : null;
  if (chosen && IDS.has(chosen as SectionId)) return chosen as SectionId;
  if (BUILT_IN[r.slug]) return BUILT_IN[r.slug];
  if (!r.slug.startsWith('scan-')) {
    // built-in cards: their category is reliable
    const byCategory: Record<string, SectionId> = {
      verbs: 'verb-cases',
      numbers: 'numbers',
      comparatives: 'comparatives',
      adjectives: 'nouns',
      connectors: 'time',
      morphology: 'words',
      imperative: 'imperative',
    };
    if (r.category && byCategory[r.category]) return byCategory[r.category];
  }
  const text = `${r.title} ${r.summary || ''}`;
  const title = r.title;
  if (/\bS\.?\s?C\.?\s?\d|special case|^sc\d|verb-aja|verbs-ending-a/i.test(title + ' ' + r.slug)) return 'verb-cases';
  if (/كان|عند|to be\b|to have|"had"|will have/i.test(title)) return 'kan';
  if (/imperative|الأمر|command/i.test(title)) return 'imperative';
  if (/\b(adjectives?|nouns?|possessives?|plurals?|feminine)\b|مِلكِي|ضمائر|كتير/i.test(title)) return 'nouns';
  if (/negat|النفي|\bnot\b/i.test(title)) return 'negation';
  if (/before|after|\bago\b|\blast\b|\bnext\b|time expression|قبل|قَبل|بعد|الماضي|الجاي/i.test(title)) return 'time';
  if (/comparative|superlative|أفعل|أَفعَل|more than|as much as|\bas \/ like|exclamation/i.test(text) || r.category === 'comparatives') return 'comparatives';
  if (/number|ordinal|date|count/i.test(title) || r.category === 'numbers' || r.category === 'numbers-grammar') return 'numbers';
  if (/verb|tense|past|present|future|prefix|suffix|مضارع|ماضي|مستقبل/i.test(text)) return 'verbs';
  if (r.category === 'verbs' || r.category === 'verbs-special') return 'verbs';
  if (r.category === 'adjectives' || r.category === 'colors') return 'nouns';
  if (r.category === 'connectors' || r.category === 'time') return 'time';
  if (r.category === 'morphology') return 'words';
  if (r.category === 'imperative') return 'imperative';
  return 'other';
}

/** Order inside a section: S.C. number, then the first notebook page, then the card's own order. */
export function orderKey(r: RuleLike & { sort_order?: number }): number {
  const sc = `${r.title} ${r.slug}`.match(/S\.?\s?C\.?\s?(\d)|special case (\d)|\bsc(\d)/i);
  const scNo = sc ? Number(sc[1] || sc[2] || sc[3]) : null;
  if (scNo !== null) return scNo * 1000 + (r.slug.startsWith('scan-') ? 500 : 0) + (r.source_pages?.[0] ?? 0) / 1000;
  if (r.slug === 'verbs-how-to-conjugate') return -1;
  // irregular / ى-keeper cards from p.13–16 sit after S.C.4
  if (r.slug === 'verbs-ending-a-istanna-family') return 4600;
  if (r.slug === 'verb-aja-to-come') return 4700;
  const page = r.source_pages?.[0];
  return page !== undefined && page > 0 ? 100 + page : 50 + (r.sort_order ?? 0) / 1000;
}
