/**
 * Sorts every verb into its case from the notebook (Basil Zboun's method):
 *   S.C.3  two letters with a shadda           حبّ، حطّ
 *   S.C.4  ends in ى                           حكى، مشى، إشترى
 *   ى-keepers  present ends in ى (p.13–16)     إستنّى، نسي، صحي
 *   S.C.5  ا in the middle                     باع، جاب، نام
 *   irregular                                  أجى، أكل، أخد
 *   regular                                    everything else
 * and supplies the present form for verbs the notebook lists with one form only.
 * Those are marked "suggested": they come from Palestinian conjugation patterns
 * (and the rules on p.9–16), not from the notebook itself.
 */
import { parseForms, kindFromEnglish } from './forms';

export type VerbCase = 'regular' | 'sc3' | 'sc4' | 'keeps-a' | 'sc5' | 'irregular';

export const VERB_CASES: Record<VerbCase, { label: string; long: string; slug: string }> = {
  regular: { label: 'Regular', long: 'Regular verb', slug: 'verbs-how-to-conjugate' },
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
const NOT_VERBS = new Set(['ل / ل', 'ل', 'ال', 'الِ', 'على', 'على قلبك', 'على قلبكم', 'مطرود']);

const KEEPS_A = new Set(['استنى', 'اتمنى', 'اتغدى', 'اتعشى', 'نسي', 'صحي']);
const IRREGULAR = new Set(['اجى', 'اجا', 'اكل', 'اخد', 'اخذ']);

export function classifyVerb(mainForm: string): VerbCase {
  const word = mainForm.split(/\s*\/\s*/)[0].trim().split(/\s+/)[0]; // first verb, first word
  const l = letters(word);
  if (IRREGULAR.has(l)) return 'irregular';
  if (KEEPS_A.has(l)) return 'keeps-a';
  if (/أ$/.test(l)) return 'regular'; // قرأ، بدأ
    if (l.length === 2) return 'sc3'; // "فعل مع حرفين" — shadda not always written (فك)
  if (l.length >= 3 && (l.endsWith('ى') || (l.length === 3 && l.endsWith('ا') && l[1] !== 'ا'))) return 'sc4';
  if (l.length === 3 && l[1] === 'ا') return 'sc5';
  // إرتاح، إحتاج، إشتاق: ا before the last letter → past like S.C.5 (إحتجت), present keeps ا like نام
  if (l.length >= 5 && l.startsWith('ا') && l[l.length - 2] === 'ا' && !l.startsWith('است')) return 'sc5';
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
};

/** Present form saved by a scan in the notes field, e.g. "present (suggested): يِكتِب" */
function presentFromNotes(notes?: string | null) {
  const m = notes?.match(/present \(suggested\):\s*([^\n]+)/);
  return m ? m[1].trim() : null;
}

export function verbInfo(arabic: string, english: string, notes?: string | null): VerbInfo | null {
  if (!arabic || !english) return null;
  if (/\+|\[structure/.test(arabic + english)) return null;
  if (kindFromEnglish(english) !== 'present') return null;
  const f = parseForms(arabic, english);
  if (f.second && f.kind === 'plural') return null; // it's a noun pair after all
  if (NOT_VERBS.has(letters(f.main))) return null;
  const verbCase = classifyVerb(f.main);
  if (f.second && (f.kind === 'present' || f.kind === 'imperative')) {
    return { verbCase, present: f.kind === 'present' ? f.second : null, presentSuggested: false };
  }
  const key = verbKey(f.main.split(/\s*\/\s*/)[0]);
  const suggested = SUGGESTED_PRESENT[key] || presentFromNotes(notes);
  return { verbCase, present: suggested || null, presentSuggested: !!suggested };
}
