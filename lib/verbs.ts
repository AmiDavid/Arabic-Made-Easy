/**
 * Sorts every verb into its case from the notebook (Basil Zboun's method):
 *   S.C.1  starts with ا, more than 3 letters  إشتغل، إستخدم (present drops the ا)
 *   S.C.2  ا in the middle, و in the present   راح، قال، شاف، خاف (past: رُحت)
 *   S.C.3  two letters with a shadda           حبّ، حطّ
 *   S.C.4  ends in ى                           حكى، مشى، إشترى
 *   ى-keepers  present ends in ى (p.13–16)     إستنّى، نسي، صحي
 *   S.C.5  ا in the middle, ي in the present   باع، جاب، نام (past: بِعت)
 *   irregular                                  أجى، أكل، أخد
 *   regular                                    everything else
 * and supplies the present form for verbs the notebook lists with one form only.
 * Those are marked "suggested": they come from Palestinian conjugation patterns
 * (and the rules on p.9–16), not from the notebook itself.
 */
import { parseForms, kindFromEnglish } from './forms';

export type VerbCase = 'regular' | 'sc1' | 'sc2' | 'sc3' | 'sc4' | 'keeps-a' | 'sc5' | 'irregular';

export const VERB_CASES: Record<VerbCase, { label: string; long: string; slug: string }> = {
  regular: { label: 'Regular', long: 'Regular verb', slug: 'verbs-how-to-conjugate' },
  sc1: { label: 'S.C.1', long: 'S.C.1: starts with ا, more than 3 letters', slug: 'sc1-verbs-starting-with-alif' },
  sc2: { label: 'S.C.2', long: 'S.C.2: ا in the middle, و in the present', slug: 'sc2-hollow-waw-verbs' },
  sc3: { label: 'S.C.3', long: 'S.C.3: two-letter verb', slug: 'sc3-two-letter-verbs' },
  sc4: { label: 'S.C.4', long: 'S.C.4: ends in ى', slug: 'sc4-alif-maqsura-verbs' },
  'keeps-a': { label: 'S.C.4 (ى)', long: 'Keeps ى in the present (like إستنّى)', slug: 'verbs-ending-a-istanna-family' },
  sc5: { label: 'S.C.5', long: 'S.C.5: ا in the middle', slug: 'sc5-hollow-verbs' },
  irregular: { label: 'Irregular', long: 'Irregular verb', slug: 'imperative-formation' },
};

const HARAKAT = /[ً-ِْٰ]/g; // keeps shadda (0651)
const SHADDA = 'ّ';

/** letters + shadda, no vowels — used as the SUGGESTED_PRESENT key (رجّع ≠ رجع) */
export function verbKey(s: string) {
  return s.replace(HARAKAT, '').replace(/^[أإآٱ]/, 'ا').replace(/\s+/g, ' ').trim();
}

/** letters only: no vowels, no shadda, first alif → ا */
export function letters(s: string) {
  return s
    .replace(HARAKAT, '')
    .replace(new RegExp(SHADDA, 'g'), '')
    .replace(/^[أإآٱ]/, 'ا') // only the first letter: a hamza inside (سأل، قرأ) matters
    .replace(/\s+/g, ' ')
    .trim();
}

// Things whose English starts with "to" but aren't verbs
const NOT_VERBS = new Set(['ل / ل', 'ل', 'ال', 'الِ', 'على', 'على قلبك', 'على قلبكم', 'مطرود', 'بد']);

const KEEPS_A = new Set(['استنى', 'اتمنى', 'اتغدى', 'اتعشى', 'نسي', 'صحي', 'قرا', 'قرأ']);
const IRREGULAR = new Set(['اجى', 'اجا', 'اكل', 'اخد', 'اخذ']);

// Verb lists from the notebook pages
const SC2 = new Set(['راح', 'كان', 'شاف', 'فات', 'قال', 'مات', 'زار', 'باس', 'قام', 'صام', 'ساق', 'فاز', 'ذاق', 'قاد', 'خاف', 'غاص', 'لام']); // p.82
const SC5 = new Set(['باع', 'صار', 'شال', 'جاب', 'ضاف', 'طار', 'عاش', 'صاد', 'دار', 'قاس', 'صاب', 'حاب', 'طاب', 'زاد', 'ضاع', 'عاد', 'نام']); // p.11

export function classifyVerb(mainForm: string, present?: string | null): VerbCase {
  const word = mainForm.split(/\s*\/\s*/)[0].trim().split(/\s+/)[0]; // first verb, first word
  const l = letters(word);
  if (IRREGULAR.has(l)) return 'irregular';
  if (KEEPS_A.has(l)) return 'keeps-a';
  if (/أ$/.test(l)) return 'regular'; // قرأ، بدأ
  if (l.length === 2) return 'sc3'; // "فعل مع حرفين" — shadda not always written (فك)
  if (l.length >= 3 && (l.endsWith('ى') || (l.length === 3 && l.endsWith('ا') && l[1] !== 'ا'))) {
    // present ending in ى / ا (بتلاقى، بقرا) = the إستنّى family; present ending in ي (بحكي) = S.C.4
    const p = present ? letters(present.split(/\s*\/\s*/)[0]) : '';
    return /[ىا]$/.test(p) ? 'keeps-a' : 'sc4';
  }
  if (l.length === 3 && l[1] === 'ا') {
    // 3 letters with ا in the middle: S.C.2 (و in the present) or S.C.5 (ي in the present)
    if (SC5.has(l)) return 'sc5';
    if (SC2.has(l)) return 'sc2';
    const p = present ? letters(present) : '';
    return /ي.$/.test(p) && !/و/.test(p) ? 'sc5' : 'sc2';
  }
  if (l.startsWith('ا') && l.length > 3) return 'sc1'; // إشتغل، إستخدم، إحتاج
  return 'regular';
}

/**
 * Present-tense ("he") forms for verbs the notebook lists with one form only.
 * Key = verbKey() of the past form (letters + shadda).
 */
export const SUGGESTED_PRESENT: Record<string, string> = {
  // regular & doubled-middle verbs (Notebook 1/2)
  'دار بال': 'يدِير بال',
  مسح: 'يِمسَح',
  لام: 'يلُوم',
  شكا: 'يِشكِي',
  فاز: 'يفُوز',
  زاد: 'يزِيد',
  ربّى: 'يرَبِّي',
  ارتاح: 'يِرتاح',
  'دوّر على': 'يدَوِّر عَلَى',
  جرّب: 'يجَرِّب',
  وقّع: 'يوَقِّع',
  'اتعوّد على': 'يِتعَوَّد عَلَى',
  رجع: 'يِرجَع',
  غسل: 'يِغسِل',
  لبس: 'يِلبَس',
  كتب: 'يِكتِب',
  عرف: 'يِعرِف',
  ضحك: 'يِضحَك',
  تعلّم: 'يِتعَلَّم',
  سكن: 'يُسكُن',
  لعب: 'يِلعَب',
  قرأ: 'يِقرَا',
  قرا: 'يِقرَا',
  ركب: 'يِركَب',
  وقّف: 'يوَقِّف',
  نجح: 'يِنجَح',
  شكر: 'يُشكُر',
  فكّر: 'يفَكِّر',
  سافر: 'يسافِر',
  فهم: 'يِفهَم',
  ترك: 'يِترُك',
  فتح: 'يِفتَح',
  دفع: 'يِدفَع',
  وعد: 'يُوعِد',
  قعد: 'يُقعُد',
  دخّن: 'يدَخِّن',
  درس: 'يُدرُس',
  وصل: 'يُوصَل',
  عمل: 'يِعمَل',
  رسم: 'يُرسُم',
  كبر: 'يِكبَر',
  وافق: 'يوافِق',
  سمح: 'يِسمَح',
  جاوب: 'يجاوِب',
  رتّب: 'يرَتِّب',
  سأل: 'يِسأَل',
  بلّش: 'يبَلِّش',
  كسر: 'يِكسِر',
  حمل: 'يِحمِل',
  شرب: 'يِشرَب',
  دخل: 'يُدخُل',
  سمع: 'يِسمَع',
  قرّر: 'يقَرِّر',
  نفى: 'يِنفِي',
  اشتغل: 'يِشتغِل',
  اتّصل: 'يِتَّصِل',
  ارسل: 'يِرسِل',
  استلم: 'يِستَلِم',
  استخدم: 'يِستَخدِم',
  احتاج: 'يِحتاج',
  اشتاق: 'يِشتاق',
  احتفل: 'يِحتِفِل',
  // S.C.2 (p.82): ا → و in the present (خاف keeps ا)
  راح: 'يرُوح',
  كان: 'يكُون',
  شاف: 'يشُوف',
  فات: 'يفُوت',
  قال: 'يقُول',
  مات: 'يمُوت',
  زار: 'يزُور',
  باس: 'يبُوس',
  قام: 'يقُوم',
  صام: 'يصُوم',
  ساق: 'يسُوق',
  ذاق: 'يذُوق',
  قاد: 'يقُود',
  خاف: 'يخاف',
  غاص: 'يغُوص',
  // irregular
  اكل: 'ياكُل',
  اخد: 'ياخُد',
  اخذ: 'ياخُد',
  اجى: 'ييجِي',
  رجّع: 'يرَجِّع',
  // S.C.4 (p.9): ى → ي in the present
  حكى: 'يِحكِي',
  مشى: 'يِمشِي',
  اشترى: 'يِشترِي',
  اعطى: 'يِعطِي',
  سوّى: 'يسَوِّي',
  جلى: 'يِجلِي',
  كوى: 'يِكوِي',
  قلى: 'يِقلِي',
  شكى: 'يِشكِي',
  شوى: 'يِشوِي',
  لغى: 'يِلغِي',
  بنى: 'يِبنِي',
  صلّى: 'يصَلِّي',
  ورّجى: 'يوَرجِي',
  كفى: 'يِكفِي',
  بكى: 'يِبكِي',
  رمى: 'يِرمِي',
  غنّى: 'يغَنِّي',
  عانى: 'يعانِي',
  لاقى: 'يلاقِي',
  مضى: 'يِمضِي',
  قضّى: 'يقَضِّي',
  اختفى: 'يِختِفِي',
  حمى: 'يِحمِي',
  عبّى: 'يعَبِّي',
  طفى: 'يِطفِي',
  فضّى: 'يفَضِّي',
  صحّى: 'يصَحِّي',
  طعمى: 'يطَعمِي',
  // S.C.5 (p.11): ا → ي in the present (نام keeps ا)
  باع: 'يبِيع',
  صار: 'يصِير',
  شال: 'يشِيل',
  جاب: 'يجِيب',
  ضاف: 'يضِيف',
  طار: 'يطِير',
  عاش: 'يعِيش',
  صاد: 'يصِيد',
  دار: 'يدِير',
  قاس: 'يقِيس',
  طاب: 'يطِيب',
  ضاع: 'يضِيع',
  عاد: 'يعِيد',
  نام: 'ينام',
  // p.13–16: present ends in ى
  استنّى: 'يِستَنَّى',
  اتمنّى: 'يِتمَنَّى',
  اتغدّى: 'يِتغَدَّى',
  اتعشّى: 'يِتعَشَّى',
  نسي: 'يِنسَى',
  صحي: 'يِصحَى',
};

export type VerbInfo = {
  verbCase: VerbCase;
  /** present form: from the notebook if written there, else suggested */
  present: string | null;
  presentSuggested: boolean;
  /** the dictionary (past "he") form the table is built from, when the word itself isn't it */
  past?: string;
  /** why: e.g. the notebook wrote the "I" form */
  note?: string;
};

/** Present form saved by a scan in the notes field, e.g. "present (suggested): يِكتِب" */
function presentFromNotes(notes?: string | null) {
  const m = notes?.match(/present \(suggested\):\s*([^\n]+)/);
  return m ? m[1].trim() : null;
}

const PRONOUN_START = /^\s*(i|you|he|she|we|they|it)\b/i;

function infoFor(past: string, english: string, notes?: string | null, extra: Partial<VerbInfo> = {}): VerbInfo {
  const key = verbKey(past);
  const suggested = SUGGESTED_PRESENT[key] || presentFromNotes(notes);
  return {
    verbCase: classifyVerb(past, suggested),
    present: suggested || null,
    presentSuggested: !!suggested,
    ...extra,
  };
}

export function verbInfo(arabic: string, english: string, notes?: string | null): VerbInfo | null {
  if (!arabic || !english) return null;
  if (/\+|\[structure/.test(arabic + english)) return null;

  // "they live (from سَكَن, to live)" — a conjugated example; build the table from the verb it names
  const from = english.match(/from\s+([\u0600-\u06FF\u064B-\u0652\u0670]+)/);
  if (from) {
    return infoFor(from[1], english, notes, { past: from[1], note: `Your notebook has the form ${arabic.trim()}; the table is for the verb ${from[1]}.` });
  }
  // "I sleep", "they work" with no dictionary form given: not something to conjugate
  if (PRONOUN_START.test(english)) {
    const hollow = hollowFromFirstPerson(arabic);
    if (hollow) return infoFor(hollow, english, notes, { past: hollow, note: `Your notebook has ${arabic.trim()} ("I" form); the table is for ${hollow}.` });
    return null;
  }
  if (kindFromEnglish(english) !== 'present') return null;
  const f = parseForms(arabic, english);
  if (f.second && f.kind === 'plural') return null; // it's a noun pair after all
  if (NOT_VERBS.has(letters(f.main))) return null;

  // أنام، أزور، أجيب written as the verb: that's the present "I" form of a hollow verb
  const hollow = !f.second && hollowFromFirstPerson(f.main);
  if (hollow) {
    return infoFor(hollow, english, notes, { past: hollow, note: `Your notebook has ${f.main} ("I" form); the table is for ${hollow}.` });
  }

  if (f.second && (f.kind === 'present' || f.kind === 'imperative')) {
    const present = f.kind === 'present' ? f.second : null;
    return { verbCase: classifyVerb(f.main, present), present, presentSuggested: false };
  }
  return infoFor(f.main.split(/\s*\/\s*/)[0], english, notes);
}

/** أزور → زار, أنام → نام, أجيب → جاب (present "I" form of a 3-letter verb with a long middle vowel) */
function hollowFromFirstPerson(word: string): string | null {
  const w = word.split(/\s*\/\s*/)[0].trim();
  if (!/^[أا]/.test(w.replace(/[\u064B-\u0652]/g, ''))) return null;
  const l = letters(w);
  if (l.length !== 4 || !/^ا.[ويا].$/.test(l)) return null;
  return l[1] + 'ا' + l[3];
}
