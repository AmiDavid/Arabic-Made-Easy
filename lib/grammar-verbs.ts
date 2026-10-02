/**
 * Verb grammar — written from the notebook pages (Basil Zboun's method):
 *   p.7–8   S.C.3  (two-letter / doubled verbs)
 *   p.9–10  S.C.4  (verbs ending in ى)
 *   p.11–12 S.C.5  (verbs with a middle ا)
 *   p.13–16 worked verbs: إستنّى، إتمنّى، أجى، إتغدّى، إتعشّى، نسي، صحي
 *   p.32–34 the imperative (فعل أمر) and its 6 cases
 *
 * Notation kept from the notebook:
 *   suf = suffix (ending)   pre = prefix (beginning)
 *   ★   = the "exception people" for that tense
 */
import type { GrammarSeed } from './grammar-content';

type Form = [ar: string, tr: string];
type Verb = {
  past: Form[]; // 8 forms, pronoun order below
  pres: Form[];
  fut: Form[];
  imp: Form[]; // m, f, pl
  starPast?: number[];
  starPres?: number[];
};

const PRONOUNS = [
  'أنا (I)',
  'إنتا (you m)',
  'إنتي (you f)',
  'هوّ (he)',
  'هيّا (she)',
  'إحنا (we)',
  'إنتو (you pl)',
  'همّا (they)',
];

// Past: exceptions are هيّا (4) & همّا (7). Present/future: إنتي (2), إنتو (6) & همّا (7).
const PAST_STAR = [4, 7];
const PRES_STAR = [2, 6, 7];

function cell([ar, tr]: Form, star: boolean) {
  return `**${ar}** ${tr}${star ? ' ★' : ''}`;
}

/** Full 4-tense table for one verb, with pronunciation. */
function table(v: Verb) {
  const sp = v.starPast ?? PAST_STAR;
  const spr = v.starPres ?? PRES_STAR;
  const rows = PRONOUNS.map(
    (p, i) =>
      `| ${p} | ${cell(v.past[i], sp.includes(i))} | ${cell(v.pres[i], spr.includes(i))} | ${cell(v.fut[i], false)} |`
  );
  const imp = `**Imperative (أمر):** ${v.imp
    .map((f, i) => `${['to a man', 'to a woman', 'to a group'][i]} **${f[0]}** ${f[1]}`)
    .join(' · ')}`;
  return [
    '| Person | Past (ماضي) | Present (مضارع) | Future (مستقبل) |',
    '|---|---|---|---|',
    ...rows,
    '',
    imp,
  ].join('\n');
}

const f = (s: string): Form[] =>
  s
    .trim()
    .split('\n')
    .map((l) => {
      const [ar, tr] = l.split('|').map((x) => x.trim());
      return [ar, tr] as Form;
    });

// ---------------------------------------------------------------- verbs

const SHIRIB: Verb = {
  past: f(`شربت|shribt
شربت|shribt
شربتي|shribti
شرب|shirib
شربت|shirbat
شربنا|shribna
شربتو|shribtu
شربو|shirbu`),
  pres: f(`بشرب|bashrab
بتشرب|btishrab
بتشربي|btishrabi
بيشرب|bishrab
بتشرب|btishrab
منشرب|mnishrab
بتشربو|btishrabu
بيشربو|bishrabu`),
  fut: f(`رح أشرب|raḥ ashrab
رح تشرب|raḥ tishrab
رح تشربي|raḥ tishrabi
رح يشرب|raḥ yishrab
رح تشرب|raḥ tishrab
رح نشرب|raḥ nishrab
رح تشربو|raḥ tishrabu
رح يشربو|raḥ yishrabu`),
  imp: f(`إشرب|ishrab
إشربي|ishrabi
إشربو|ishrabu`),
  starPast: [],
  starPres: [],
};

const HABB: Verb = {
  past: f(`حبّيت|ḥabbēt
حبّيت|ḥabbēt
حبّيتي|ḥabbēti
حبّ|ḥabb
حبّت|ḥabbat
حبّينا|ḥabbēna
حبّيتو|ḥabbētu
حبّو|ḥabbu`),
  pres: f(`بحِبّ|baḥibb
بتحِبّ|btiḥibb
بتحِبّي|btiḥibbi
بيحِبّ|biḥibb
بتحِبّ|btiḥibb
منحِبّ|mniḥibb
بتحِبّو|btiḥibbu
بيحِبّو|biḥibbu`),
  fut: f(`رح أحِبّ|raḥ aḥibb
رح تحِبّ|raḥ tḥibb
رح تحِبّي|raḥ tḥibbi
رح يحِبّ|raḥ yḥibb
رح تحِبّ|raḥ tḥibb
رح نحِبّ|raḥ nḥibb
رح تحِبّو|raḥ tḥibbu
رح يحِبّو|raḥ yḥibbu`),
  imp: f(`حِبّ|ḥibb
حِبّي|ḥibbi
حِبّو|ḥibbu`),
  starPres: [],
};

const HATT: Verb = {
  past: f(`حطّيت|ḥaṭṭēt
حطّيت|ḥaṭṭēt
حطّيتي|ḥaṭṭēti
حطّ|ḥaṭṭ
حطّت|ḥaṭṭat
حطّينا|ḥaṭṭēna
حطّيتو|ḥaṭṭētu
حطّو|ḥaṭṭu`),
  pres: f(`بحُطّ|baḥuṭṭ
بتحُطّ|btiḥuṭṭ
بتحُطّي|btiḥuṭṭi
بيحُطّ|biḥuṭṭ
بتحُطّ|btiḥuṭṭ
منحُطّ|mniḥuṭṭ
بتحُطّو|btiḥuṭṭu
بيحُطّو|biḥuṭṭu`),
  fut: f(`رح أحُطّ|raḥ aḥuṭṭ
رح تحُطّ|raḥ tḥuṭṭ
رح تحُطّي|raḥ tḥuṭṭi
رح يحُطّ|raḥ yḥuṭṭ
رح تحُطّ|raḥ tḥuṭṭ
رح نحُطّ|raḥ nḥuṭṭ
رح تحُطّو|raḥ tḥuṭṭu
رح يحُطّو|raḥ yḥuṭṭu`),
  imp: f(`حُطّ|ḥuṭṭ
حُطّي|ḥuṭṭi
حُطّو|ḥuṭṭu`),
  starPres: [],
};

const HAKA: Verb = {
  past: f(`حكيت|ḥakēt
حكيت|ḥakēt
حكيتي|ḥakēti
حكى|ḥaka
حكت|ḥakat
حكينا|ḥakēna
حكيتو|ḥakētu
حكو|ḥaku`),
  pres: f(`بحكي|baḥki
بتحكي|btiḥki
بتحكي|btiḥki
بيحكي|biḥki
بتحكي|btiḥki
منحكي|mniḥki
بتحكو|btiḥku
بيحكو|biḥku`),
  fut: f(`رح أحكي|raḥ aḥki
رح تحكي|raḥ tiḥki
رح تحكي|raḥ tiḥki
رح يحكي|raḥ yiḥki
رح تحكي|raḥ tiḥki
رح نحكي|raḥ niḥki
رح تحكو|raḥ tiḥku
رح يحكو|raḥ yiḥku`),
  imp: f(`إحكي|iḥki
إحكي|iḥki
إحكو|iḥku`),
};

const ISHTARA: Verb = {
  past: f(`إشتريت|ishtarēt
إشتريت|ishtarēt
إشتريتي|ishtarēti
إشترى|ishtara
إشترت|ishtarat
إشترينا|ishtarēna
إشتريتو|ishtarētu
إشترو|ishtaru`),
  pres: f(`بشتري|bashtari
بتشتري|btishtari
بتشتري|btishtari
بيشتري|bishtari
بتشتري|btishtari
منشتري|mnishtari
بتشترو|btishtaru
بيشترو|bishtaru`),
  fut: f(`رح أشتري|raḥ ashtari
رح تشتري|raḥ tishtari
رح تشتري|raḥ tishtari
رح يشتري|raḥ yishtari
رح تشتري|raḥ tishtari
رح نشتري|raḥ nishtari
رح تشترو|raḥ tishtaru
رح يشترو|raḥ yishtaru`),
  imp: f(`إشتري|ishtari
إشتري|ishtari
إشترو|ishtaru`),
};

const SAWWA: Verb = {
  past: f(`سوّيت|sawwēt
سوّيت|sawwēt
سوّيتي|sawwēti
سوّى|sawwa
سوّت|sawwat
سوّينا|sawwēna
سوّيتو|sawwētu
سوّو|sawwu`),
  pres: f(`بسوّي|basawwi
بتسوّي|btsawwi
بتسوّي|btsawwi
بيسوّي|bisawwi
بتسوّي|btsawwi
منسوّي|mnsawwi
بتسوّو|btsawwu
بيسوّو|bisawwu`),
  fut: f(`رح أسوّي|raḥ asawwi
رح تسوّي|raḥ tsawwi
رح تسوّي|raḥ tsawwi
رح يسوّي|raḥ ysawwi
رح تسوّي|raḥ tsawwi
رح نسوّي|raḥ nsawwi
رح تسوّو|raḥ tsawwu
رح يسوّو|raḥ ysawwu`),
  imp: f(`سوّي|sawwi
سوّي|sawwi
سوّو|sawwu`),
};

const ISTANNA: Verb = {
  past: f(`إستنّيت|istannēt
إستنّيت|istannēt
إستنّيتي|istannēti
إستنّى|istanna
إستنّت|istannat
إستنّينا|istannēna
إستنّيتو|istannētu
إستنّو|istannu`),
  pres: f(`بستنّى|bastanna
بتستنّى|btistanna
بتستنّي|btistanni
بيستنّى|bistanna
بتستنّى|btistanna
منستنّى|mnistanna
بتستنّو|btistannu
بيستنّو|bistannu`),
  fut: f(`رح أستنّى|raḥ astanna
رح تستنّى|raḥ tistanna
رح تستنّي|raḥ tistanni
رح يستنّى|raḥ yistanna
رح تستنّى|raḥ tistanna
رح نستنّى|raḥ nistanna
رح تستنّو|raḥ tistannu
رح يستنّو|raḥ yistannu`),
  imp: f(`إستنّى|istanna
إستنّي|istanni
إستنّو|istannu`),
};

const ITMANNA: Verb = {
  past: f(`إتمنّيت|itmannēt
إتمنّيت|itmannēt
إتمنّيتي|itmannēti
إتمنّى|itmanna
إتمنّت|itmannat
إتمنّينا|itmannēna
إتمنّيتو|itmannētu
إتمنّو|itmannu`),
  pres: f(`بتمنّى|batmanna
بتتمنّى|btitmanna
بتتمنّي|btitmanni
بيتمنّى|bitmanna
بتتمنّى|btitmanna
منتمنّى|mnitmanna
بتتمنّو|btitmannu
بيتمنّو|bitmannu`),
  fut: f(`رح أتمنّى|raḥ atmanna
رح تتمنّى|raḥ titmanna
رح تتمنّي|raḥ titmanni
رح يتمنّى|raḥ yitmanna
رح تتمنّى|raḥ titmanna
رح نتمنّى|raḥ nitmanna
رح تتمنّو|raḥ titmannu
رح يتمنّو|raḥ yitmannu`),
  imp: f(`إتمنّى|itmanna
إتمنّي|itmanni
إتمنّو|itmannu`),
};

const ITGHADDA: Verb = {
  past: f(`إتغدّيت|itghaddēt
إتغدّيت|itghaddēt
إتغدّيتي|itghaddēti
إتغدّى|itghadda
إتغدّت|itghaddat
إتغدّينا|itghaddēna
إتغدّيتو|itghaddētu
إتغدّو|itghaddu`),
  pres: f(`بتغدّى|batghadda
بتتغدّى|btitghadda
بتتغدّي|btitghaddi
بيتغدّى|bitghadda
بتتغدّى|btitghadda
منتغدّى|mnitghadda
بتتغدّو|btitghaddu
بيتغدّو|bitghaddu`),
  fut: f(`رح أتغدّى|raḥ atghadda
رح تتغدّى|raḥ titghadda
رح تتغدّي|raḥ titghaddi
رح يتغدّى|raḥ yitghadda
رح تتغدّى|raḥ titghadda
رح نتغدّى|raḥ nitghadda
رح تتغدّو|raḥ titghaddu
رح يتغدّو|raḥ yitghaddu`),
  imp: f(`إتغدّى|itghadda
إتغدّي|itghaddi
إتغدّو|itghaddu`),
};

const ITASHSHA: Verb = {
  past: f(`إتعشّيت|itʕashshēt
إتعشّيت|itʕashshēt
إتعشّيتي|itʕashshēti
إتعشّى|itʕashsha
إتعشّت|itʕashshat
إتعشّينا|itʕashshēna
إتعشّيتو|itʕashshētu
إتعشّو|itʕashshu`),
  pres: f(`بتعشّى|batʕashsha
بتتعشّى|btitʕashsha
بتتعشّي|btitʕashshi
بيتعشّى|bitʕashsha
بتتعشّى|btitʕashsha
منتعشّى|mnitʕashsha
بتتعشّو|btitʕashshu
بيتعشّو|bitʕashshu`),
  fut: f(`رح أتعشّى|raḥ atʕashsha
رح تتعشّى|raḥ titʕashsha
رح تتعشّي|raḥ titʕashshi
رح يتعشّى|raḥ yitʕashsha
رح تتعشّى|raḥ titʕashsha
رح نتعشّى|raḥ nitʕashsha
رح تتعشّو|raḥ titʕashshu
رح يتعشّو|raḥ yitʕashshu`),
  imp: f(`إتعشّى|itʕashsha
إتعشّي|itʕashshi
إتعشّو|itʕashshu`),
};

const NISI: Verb = {
  past: f(`نسيت|nsīt
نسيت|nsīt
نسيتي|nsīti
نسي|nisi
نسيت|nisyat
نسينا|nsīna
نسيتو|nsītu
نسيو|nisyu`),
  pres: f(`بنسى|bansa
بتنسى|btinsa
بتنسي|btinsi
بينسى|binsa
بتنسى|btinsa
مننسى|mninsa
بتنسو|btinsu
بينسو|binsu`),
  fut: f(`رح أنسى|raḥ ansa
رح تنسى|raḥ tinsa
رح تنسي|raḥ tinsi
رح ينسى|raḥ yinsa
رح تنسى|raḥ tinsa
رح ننسى|raḥ ninsa
رح تنسو|raḥ tinsu
رح ينسو|raḥ yinsu`),
  imp: f(`إنسى|insa
إنسي|insi
إنسو|insu`),
};

const SIHI: Verb = {
  past: f(`صحيت|ṣḥīt
صحيت|ṣḥīt
صحيتي|ṣḥīti
صحي|ṣiḥi
صحيت|ṣiḥyat
صحينا|ṣḥīna
صحيتو|ṣḥītu
صحيو|ṣiḥyu`),
  pres: f(`بصحى|baṣḥa
بتصحى|btiṣḥa
بتصحي|btiṣḥi
بيصحى|biṣḥa
بتصحى|btiṣḥa
منصحى|mniṣḥa
بتصحو|btiṣḥu
بيصحو|biṣḥu`),
  fut: f(`رح أصحى|raḥ aṣḥa
رح تصحى|raḥ tiṣḥa
رح تصحي|raḥ tiṣḥi
رح يصحى|raḥ yiṣḥa
رح تصحى|raḥ tiṣḥa
رح نصحى|raḥ niṣḥa
رح تصحو|raḥ tiṣḥu
رح يصحو|raḥ yiṣḥu`),
  imp: f(`إصحى|iṣḥa
إصحي|iṣḥi
إصحو|iṣḥu`),
};

const AJA: Verb = {
  past: f(`أجيت|ijīt
أجيت|ijīt
أجيتي|ijīti
أجى|ija
إجت|ijat
أجينا|ijīna
أجيتو|ijītu
إجو|iju`),
  pres: f(`باجي|bāji
بتيجي|btīji
بتيجي|btīji
بيجي|bīji
بتيجي|btīji
منيجي|mnīji
بتيجو|btīju
بيجو|bīju`),
  fut: f(`رح آجي|raḥ āji
رح تيجي|raḥ tīji
رح تيجي|raḥ tīji
رح ييجي|raḥ yīji
رح تيجي|raḥ tīji
رح نيجي|raḥ nīji
رح تيجو|raḥ tīju
رح ييجو|raḥ yīju`),
  imp: f(`تعال|taʕāl
تعالي|taʕāli
تعالو|taʕālu`),
};

const BAA: Verb = {
  past: f(`بِعت|biʕt
بِعت|biʕt
بِعتي|biʕti
باع|bāʕ
باعت|bāʕat
بِعنا|biʕna
بِعتو|biʕtu
باعو|bāʕu`),
  pres: f(`ببيع|babīʕ
بتبيع|btibīʕ
بتبيعي|btibīʕi
بيبيع|bibīʕ
بتبيع|btibīʕ
منبيع|mnibīʕ
بتبيعو|btibīʕu
بيبيعو|bibīʕu`),
  fut: f(`رح أبيع|raḥ abīʕ
رح تبيع|raḥ tbīʕ
رح تبيعي|raḥ tbīʕi
رح يبيع|raḥ ybīʕ
رح تبيع|raḥ tbīʕ
رح نبيع|raḥ nbīʕ
رح تبيعو|raḥ tbīʕu
رح يبيعو|raḥ ybīʕu`),
  imp: f(`بيع|bīʕ
بيعي|bīʕi
بيعو|bīʕu`),
  starPres: [],
};

const JAB: Verb = {
  past: f(`جِبت|jibt
جِبت|jibt
جِبتي|jibti
جاب|jāb
جابت|jābat
جِبنا|jibna
جِبتو|jibtu
جابو|jābu`),
  pres: f(`بجيب|bajīb
بتجيب|btijīb
بتجيبي|btijībi
بيجيب|bijīb
بتجيب|btijīb
منجيب|mnijīb
بتجيبو|btijību
بيجيبو|bijību`),
  fut: f(`رح أجيب|raḥ ajīb
رح تجيب|raḥ tjīb
رح تجيبي|raḥ tjībi
رح يجيب|raḥ yjīb
رح تجيب|raḥ tjīb
رح نجيب|raḥ njīb
رح تجيبو|raḥ tjību
رح يجيبو|raḥ yjību`),
  imp: f(`جيب|jīb
جيبي|jībi
جيبو|jību`),
  starPres: [],
};

const NAM: Verb = {
  past: f(`نِمت|nimt
نِمت|nimt
نِمتي|nimti
نام|nām
نامت|nāmat
نِمنا|nimna
نِمتو|nimtu
نامو|nāmu`),
  pres: f(`بنام|banām
بتنام|btinām
بتنامي|btināmi
بينام|binām
بتنام|btinām
مننام|mninām
بتنامو|btināmu
بينامو|bināmu`),
  fut: f(`رح أنام|raḥ anām
رح تنام|raḥ tnām
رح تنامي|raḥ tnāmi
رح ينام|raḥ ynām
رح تنام|raḥ tnām
رح ننام|raḥ nnām
رح تنامو|raḥ tnāmu
رح ينامو|raḥ ynāmu`),
  imp: f(`نام|nām
نامي|nāmi
نامو|nāmu`),
  starPres: [],
};

// ---------------------------------------------------------------- rules

const PRONUNCIATION_KEY = `**How to read the pronunciation:** ḥ = the breathy ح · kh = خ · gh = غ · ʕ = ع · ʔ = a catch in the throat (in Jerusalem & Bethlehem ق is said this way: قلى = ʔala) · ṣ ḍ ṭ = heavy ص ض ط · a long vowel has a line: ā ī ū ē.`;

export const VERB_RULES: GrammarSeed[] = [
  {
    slug: 'verbs-how-to-conjugate',
    title: 'How to conjugate a verb — past, present, future',
    category: 'verbs',
    summary:
      'The base system every verb uses: past = stem + ending (suf), present = prefix (pre) + stem, future = رح + present. Start here.',
    content_md: `## The idea in one line

Every verb is built the same way. The special cases (S.C.3, S.C.4, S.C.5) only change **the middle or the end of the stem**. The endings and prefixes below never change.

In the notebook: **suf** = suffix (an ending added at the end) and **pre** = prefix (added at the start).

## 1. Past (الماضي) = stem + suf

Take the "he" form (it's the dictionary form: شرب, shirib, he drank) and add the ending:

| Person | Ending (suf) | شرب — to drink |
|---|---|---|
| أنا (I) | ـت -t | **شربت** shribt |
| إنتا (you m) | ـت -t | **شربت** shribt |
| إنتي (you f) | ـتي -ti | **شربتي** shribti |
| هوّ (he) | — (nothing) | **شرب** shirib |
| هيّا (she) | ـت -at | **شربت** shirbat |
| إحنا (we) | ـنا -na | **شربنا** shribna |
| إنتو (you pl) | ـتو -tu | **شربتو** shribtu |
| همّا (they) | ـو -u | **شربو** shirbu |

"I", "you m" and "she" are all written شربت, but you say them differently: shribt (I, you m) vs shirbat (she).

## 2. Present (المضارع) = pre + stem (+ suf)

| Person | Prefix (pre) | Ending (suf) | شرب |
|---|---|---|---|
| أنا | بـ ba- | — | **بشرب** bashrab |
| إنتا | بتـ bti- | — | **بتشرب** btishrab |
| إنتي | بتـ bti- | ـي -i | **بتشربي** btishrabi |
| هوّ | بيـ bi- | — | **بيشرب** bishrab |
| هيّا | بتـ bti- | — | **بتشرب** btishrab |
| إحنا | منـ mni- (also بنـ bni-) | — | **منشرب** mnishrab |
| إنتو | بتـ bti- | ـو -u | **بتشربو** btishrabu |
| همّا | بيـ bi- | ـو -u | **بيشربو** bishrabu |

The بـ means "now / usually": بشرب قهوة = I drink coffee (habitually).

## 3. Future (المستقبل) = رح + present without the بـ

رح (raḥ) means "going to". Drop the بـ and keep the rest: بشرب → **رح أشرب** (raḥ ashrab, I will drink), بتشربي → **رح تشربي** (raḥ tishrabi, you f will drink).

## 4. Imperative (أمر)

The imperative uses the vowels of the present. It has only 3 forms: إنتا, إنتي (+ي), إنتو (+و): **إشرب، إشربي، إشربو**. See *Imperative — the 6 cases*.

## Full table — شرب (to drink), a regular verb

${table(SHIRIB)}

## The ★ "exception people" (the key to all the special cases)

Look at which endings **start with a vowel**:
- **Past:** هيّا (-at) and همّا (-u)
- **Present/future:** إنتي (-i), إنتو (-u) and همّا (-u)

In every special case below, the change in the rule happens for everyone **except these people**. That's why the notebook keeps writing *(مش لـ: هيّا & همّا)* for the past, and *(إنتي، إنتو & همّا)* for the present. In the tables they're marked ★.

## Which case is my verb?

| The verb looks like… | Example | Case |
|---|---|---|
| 3 normal letters | شرب، فتح، درس | regular (this page) |
| 2 letters with a shadda ّ | حبّ، حطّ، ردّ | **S.C.3** |
| ends in ى | حكى، مشى، إشترى | **S.C.4** |
| ا in the middle | باع، جاب، صار | **S.C.5** |

## Saying "not"

- Past: **ما** + verb → ما شربت (ma shribt, I didn't drink)
- Present: **ما** + verb → ما بشرب (ma bashrab, I don't drink)
- Future: **مش رح** → مش رح أشرب (mish raḥ ashrab, I won't drink)

${PRONUNCIATION_KEY}`,
    examples: [
      { ar: 'شربت قهوة الصبح', en: 'I drank coffee in the morning (shribt ʔahwe iṣ-ṣubḥ)' },
      { ar: 'بتشربي شاي؟', en: 'do you (f) drink tea? (btishrabi shāy?)' },
      { ar: 'رح نشرب إشي بعد الشغل', en: "we'll drink something after work (raḥ nishrab ishi baʕd ish-shughl)" },
      { ar: 'همّا شربو كتير مي', en: 'they drank a lot of water (humme shirbu ktīr mayy)' },
      { ar: 'ما بشرب قهوة بالليل', en: "I don't drink coffee at night (ma bashrab ʔahwe bil-lēl)" },
    ],
    source_pages: [7, 9, 11],
    sort_order: 35,
  },

  // ------------------------------------------------------------ S.C.3
  {
    slug: 'sc3-two-letter-verbs',
    title: 'S.C.3 — Two-letter verbs (حبّ، حطّ، ردّ)',
    category: 'verbs',
    summary:
      'Verbs of 2 letters with a shadda. Past: add ـيـ before the ending (not for هيّا & همّا). Present & future: regular.',
    content_md: `## شو يعني S.C.3؟ — what is it?

A **verb with two letters (فعل مع حرفين)**: the second letter carries a shadda ّ, e.g. **حبّ** (ḥabb, to love). The notebook writes each verb twice. The first is the past (حبّ), the second is the vowel you use in the present and the imperative (حِبّ, ḥibb).

## كيف بنشتغل مع S.C.3؟ — how to conjugate

**① Past (الماضي)**

- a. add **ـيـ** (ē) between the verb and the ending: حبّ → حبّيت (ḥabbēt)
- b. then add the suffix (suf) as usual
- ★ **not for هيّا & همّا:** they just take the suffix: **حبّت** (ḥabbat), **حبّو** (ḥabbu)

**② Present & future (المضارع والمستقبل):** **عادي**, regular. pre + verb + suf: بحِبّ، بتحِبّي، بيحِبّو.

## Summary (from the notebook)

- **Past, most people:** verb + ـيـ + suf → حبّيت، حبّينا
- **Past, ★ هيّا & همّا:** verb + suf → حبّت، حبّو
- **Present / future:** pre + verb + suf → بحِبّ، بتحِبّو

## Full table — حبّ (to love / to like)

${table(HABB)}

## Full table — حطّ (to put), with ُ in the present

${table(HATT)}

## The S.C.3 verbs in the notebook

| Past | Present / imperative vowel | Meaning |
|---|---|---|
| حبّ ḥabb | حِبّ ḥibb | to like / love |
| مرّ marr | مُرّ murr | to pass / pass by (مرّ على) |
| حطّ ḥaṭṭ | حُطّ ḥuṭṭ | to put |
| حسّ ḥass | حِسّ ḥiss | to feel |
| شدّ shadd | شِدّ shidd | to catch / pull |
| طخّ ṭakhkh | طُخّ ṭukhkh | to shoot |
| شمّ shamm | شِمّ shimm | to smell |
| ضلّ ḍall | ضَلّ ḍall | to stay |
| حلّ ḥall | حِلّ ḥill | to solve |
| ردّ radd | رُدّ rudd | to respond |
| قصّ ʔaṣṣ | قُصّ ʔuṣṣ | to cut |
| عدّ ʕadd | عِدّ ʕidd | to count |
| صفّ ṣaff | صُفّ ṣuff | to park |
| لفّ laff | لِفّ liff | to turn |
| شكّ shakk | شِكّ shikk | to doubt (شكّ في) |
| عضّ ʕaḍḍ | عُضّ ʕuḍḍ | to bite |
| نطّ naṭṭ | نُطّ nuṭṭ | to jump |
| رنّ rann | رِنّ rinn | to ring (رنّ على: to call someone) |

The vowel in the second column is the one you hear in the present: ردّ → **بَرُدّ** (barudd), عدّ → **بعِدّ** (baʕidd).

${PRONUNCIATION_KEY}`,
    examples: [
      { ar: 'حبّيت المطعم كتير', en: 'I really liked the restaurant (ḥabbēt il-maṭʕam ktīr)' },
      { ar: 'هيّا حبّت الفيلم', en: 'she liked the film (hiyye ḥabbat il-film) ★ no ـيـ' },
      { ar: 'وين حطّيتو المفاتيح؟', en: 'where did you (pl) put the keys? (wēn ḥaṭṭētu il-mafatīḥ?)' },
      { ar: 'رح أرُدّ عليك بكرا', en: "I'll answer you tomorrow (raḥ arudd ʕalēk bukra)" },
      { ar: 'ضلّينا بالبيت', en: 'we stayed at home (ḍallēna bil-bēt)' },
      { ar: 'بتحِبّي القهوة؟', en: 'do you (f) like coffee? (btiḥibbi il-ʔahwe?)' },
    ],
    source_pages: [7, 8],
    sort_order: 40,
  },

  // ------------------------------------------------------------ S.C.4
  {
    slug: 'sc4-alif-maqsura-verbs',
    title: 'S.C.4 — Verbs ending in ى (حكى، مشى، إشترى)',
    category: 'verbs',
    summary:
      'Past: ى → ي before the ending, except هيّا & همّا. Present & future: ى → ي, except إنتي، إنتو & همّا.',
    content_md: `## شو يعني S.C.4؟ — what is it?

A **verb ending in ى (alif maqsura)**: حكى (ḥaka), مشى (masha), إشترى (ishtara). The ى sounds like "a", and it's the letter that changes.

## كيف بنشتغل مع S.C.4؟ — how to conjugate

**① Past (الماضي)**

- a. **ى → ي** (you hear "ē"): حكى → حكيـ
- b. **+ suf**: حكيت (ḥakēt), حكينا (ḥakēna), حكيتو (ḥakētu)
- ★ **except هيّا & همّا:** the ى simply **drops** and the ending goes straight on: **حكت** (ḥakat), **حكو** (ḥaku)

**② Present & future (المضارع والمستقبل)**

- a. **ى → ي** (you hear "i"): بحكي (baḥki), بيحكي (biḥki)
- b. **+ pre & suf**
- ★ **except إنتي، إنتو & همّا:** the ي **drops** and their own ending takes its place: إنتي **بتحكي** (btiḥki, the ي you see is the إنتي ending), إنتو **بتحكو** (btiḥku), همّا **بيحكو** (biḥku)

## مُلخّص — summary

- **Past, most people:** stem + ي + suf → حكيت
- **Past, ★ هيّا & همّا:** stem + suf → حكت، حكو
- **Present / future, most people:** pre + stem + ي → بحكي
- **Present / future, ★ إنتي، إنتو & همّا:** pre + stem + suf → بتحكي، بتحكو، بيحكو

## Full table — حكى (to speak / tell / say)

${table(HAKA)}

إنتا and إنتي sound the same in the present (btiḥki). Context tells you who it is.

## Full table — إشترى (to buy)

${table(ISHTARA)}

## Full table — سوّى (to do / make), 4 letters, so no إ in the imperative

${table(SAWWA)}

## The S.C.4 verbs in the notebook (p.9)

| Verb | Present (I) | Meaning |
|---|---|---|
| حكى ḥaka | بحكي baḥki | to speak / talk / tell / say |
| مشى masha | بمشي bamshi | to walk / hike |
| إشترى ishtara | بشتري bashtari | to buy |
| أعطى aʕṭa | بعطي baʕṭi | to give |
| سوّى sawwa | بسوّي basawwi | to do / make |
| جلى jala | بجلي bajli | to wash dishes |
| كوى kawa | بكوي bakwi | to iron |
| قلى ʔala | بقلي baʔli | to fry |
| شوى shawa | بشوي bashwi | to grill |
| لغى lagha | بلغي balghi | to cancel |
| بنى bana | ببني babni | to build |
| صلّى ṣalla | بصلّي baṣalli | to pray |
| ورجى warja | بورجي bawarji | to show |
| كفّى kaffa | بكفّي bakaffi | to be enough |
| بكى baka | ببكي babki | to cry |
| شكى shaka | بشكي bashki | to complain |
| رمى rama | برمي barmi | to throw (away) |
| غنّى ghanna | بغنّي baghanni | to sing |
| عانى ʕāna | بعاني baʕāni | to suffer |
| لاقى lāʔa | بلاقي balāʔi | to find |
| قضّى ʔaḍḍa | بقضّي baʔaḍḍi | to spend time |
| إختفى ikhtafa | بختفي bakhtafi | to disappear |
| حمى ḥama | بحمي baḥmi | to protect |
| عبّى ʕabba | بعبّي baʕabbi | to fill |
| طفى ṭafa | بطفي baṭfi | to turn off |
| فضّى faḍḍa | بفضّي bafaḍḍi | to empty |

أجى (to come) is also on this page but it's irregular. It has its own card: *أجى — to come*.

${PRONUNCIATION_KEY}`,
    examples: [
      { ar: 'حكيت مع صاحبي', en: 'I spoke with my friend (ḥakēt maʕ ṣāḥbi)' },
      { ar: 'هيّا حكت مع أمها', en: 'she spoke with her mother (hiyye ḥakat maʕ immha) ★ ى drops' },
      { ar: 'مشينا كتير اليوم', en: 'we walked a lot today (mashēna ktīr il-yōm)' },
      { ar: 'إشترو سيارة جديدة', en: 'they bought a new car (ishtaru sayyāra jdīde) ★' },
      { ar: 'بتحكو عربي؟', en: 'do you (pl) speak Arabic? (btiḥku ʕarabi?) ★ ي drops' },
      { ar: 'رح أشتري خبز', en: "I'm going to buy bread (raḥ ashtari khubz)" },
      { ar: 'لاقيت المفاتيح', en: 'I found the keys (lāʔēt il-mafatīḥ)' },
    ],
    source_pages: [9, 10],
    sort_order: 50,
  },

  // ------------------------------------------------------------ key verbs p.13–16
  {
    slug: 'verbs-ending-a-istanna-family',
    title: 'إستنّى، إتمنّى، إتغدّى، إتعشّى، نسي، صحي — verbs that keep ى in the present',
    category: 'verbs',
    summary:
      'The notebook works these out one by one (p.13–16): same ★ exceptions as S.C.4, but the present ends in ى (a), not ي.',
    content_md: `## What's different here

These verbs follow the **S.C.4 pattern**, with one difference: in the present they end in **ى (a)**, not ي (i).
- S.C.4: بحكي (baḥki)
- these verbs: **بستنّى** (bastanna), **بنسى** (bansa)

The ★ people are the same: هيّا & همّا in the past, إنتي، إنتو & همّا in the present.

## The rule for all six (as drawn in the notebook)

- **Past, most people:** stem + ي + suf → إستنّيت
- **Past, ★ هيّا & همّا:** stem + suf → إستنّت، إستنّو (نسي and صحي keep a y sound: نسيت nisyat, نسيو nisyu)
- **Present / future, most people:** pre + stem ending in ى → بستنّى
- **Present / future, ★ إنتي، إنتو & همّا:** pre + stem + suf → بتستنّي، بتستنّو، بيستنّو
- **Imperative:** ending in ى for a man, ي for a woman, و for a group → إستنّى / إستنّي / إستنّو

## إستنّى — to wait

${table(ISTANNA)}

## إتمنّى — to hope / to wish

${table(ITMANNA)}

- **أُمنية / أُمنيات / أماني** (umniye, umniyāt, amāni): a wish / wishes
- **إتمنّى + noun:** to wish for something. **بتمنّى السلام** (batmanna is-salām), I wish for peace.
- **إتمنّى + لـ + person:** to wish someone something. **بتمنّالك التوفيق** (batmannālak it-tawfīʔ), I wish you success.

## إتغدّى — to have lunch

${table(ITGHADDA)}

## إتعشّى — to have dinner

${table(ITASHSHA)}

Related, from the same page: **فطر / أفطر** (fiṭir / afṭar), to have breakfast; **طعمى** (ṭaʕma), to feed.

## نسي — to forget

${table(NISI)}

- ⚠ **منسي / منسية / منسيين** (mansi, mansiyye, mansiyyīn): forgotten
- **مثال:** (أنا) **نسيتها** (nsīt-ha), I forgot it / her
- **إنساني / إنسيني** (insāni / insīni): forget me, forget about me

## صحي — to wake up (also: watch out / take care)

${table(SIHI)}

- ⚠ **صاحي / صاحية / صاحيين** (ṣāḥi, ṣāḥye, ṣāḥyīn): awake
- ⚠ **صحّى** (ṣaḥḥa), to wake **someone** up, is a normal S.C.4 verb: صحّيت إبني (ṣaḥḥēt ibni), I woke my son up
- **إصحى!** (iṣḥa!) also means **watch out!**

${PRONUNCIATION_KEY}`,
    examples: [
      { ar: 'إستنّيتك ساعة!', en: 'I waited for you for an hour! (istannētak sāʕa!)' },
      { ar: 'إستنّي شوي', en: 'wait a bit (to a woman) (istanni shwayy)' },
      { ar: 'وين إتغدّيتو اليوم؟', en: 'where did you (pl) have lunch today? (wēn itghaddētu il-yōm?)' },
      { ar: 'رح نتعشّى برّا', en: "we'll have dinner out (raḥ nitʕashsha barra)" },
      { ar: 'نسيت المفتاح بالبيت', en: 'I forgot the key at home (nsīt il-muftāḥ bil-bēt)' },
      { ar: 'ما تنسي!', en: "don't forget! (to a woman) (ma tinsi!)" },
      { ar: 'بصحى الساعة سبعة', en: 'I wake up at seven (baṣḥa is-sāʕa sabʕa)' },
      { ar: 'بتمنّالك التوفيق', en: 'I wish you success (batmannālak it-tawfīʔ)' },
    ],
    source_pages: [13, 14, 15, 16],
    sort_order: 55,
  },
  {
    slug: 'verb-aja-to-come',
    title: 'أجى — to come (irregular)',
    category: 'verbs',
    summary: 'Past like S.C.4 (أجيت، إجت، إجو); present باجي / بيجي; imperative تعال / تعالي / تعالو.',
    content_md: `## Why it gets its own card

**أجى** (ija, to come) ends in ى like S.C.4, but its present and imperative are irregular.

## How it works (p.14)

- **Past, most people:** أجيـ + suf → أجيت (ijīt)
- **Past, ★ هيّا & همّا:** إجـ + suf → **إجت** (ijat), **إجو** (iju)
- **Present / future, أنا:** **باجي** (bāji) / **رح آجي** (raḥ āji)
- **Present / future, most people:** pre + **يجي** → بتيجي، بيجي
- **Present / future, ★ إنتي، إنتو & همّا:** pre + **يجـ** + suf → بتيجي، بتيجو، بيجو
- **Imperative:** a completely different word, **تعال / تعالي / تعالو** (taʕāl / taʕāli / taʕālu), "come!"

## Full table

${table(AJA)}

## Useful related word

⚠ **جاي / جاية / جايين** (jāy, jāye, jāyīn): coming / on my way. **أنا جاي!** (ana jāy!), I'm coming!

${PRONUNCIATION_KEY}`,
    examples: [
      { ar: 'تعال لهون', en: 'come here (to a man) (taʕāl la-hōn)' },
      { ar: 'تعالي معنا', en: 'come with us (to a woman) (taʕāli maʕna)' },
      { ar: 'إجو بكّير', en: 'they came early (iju bakkīr)' },
      { ar: 'إمتى رح تيجي؟', en: 'when will you come? (imta raḥ tīji?)' },
      { ar: 'أنا جاي هلّأ', en: "I'm coming now (ana jāy hallaʔ)" },
    ],
    source_pages: [14],
    sort_order: 57,
  },

  // ------------------------------------------------------------ S.C.5
  {
    slug: 'sc5-hollow-verbs',
    title: 'S.C.5 — Verbs with ا in the middle (باع، جاب، صار)',
    category: 'verbs',
    summary:
      'Past: drop the ا and put ـِ on the first letter (not for هيّا & همّا). Present & future: ا → ي. Exception: نام.',
    content_md: `## شو يعني S.C.5؟ — what is it?

A **verb with ا in the middle**: باع (bāʕ, to sell), جاب (jāb, to bring), صار (ṣār, to happen / become).

## كيف بنشتغل مع S.C.5؟ — how to conjugate

**① Past (الماضي)**

- a. **drop the ا** ✗
- b. put a **kasra ـِ** on the first letter: باع → بِعـ (biʕ)
- c. **+ suf** → بِعت (biʕt), بِعنا (biʕna), بِعتو (biʕtu)
- ★ **except هيّا & همّا:** the ا **stays**: **باعت** (bāʕat), **باعو** (bāʕu)

**② Present & future (المضارع والمستقبل)**

- a. **ا → ي**: باع → بيع (bīʕ)
- b. **+ pre & suf** → ببيع (babīʕ), بتبيعي (btibīʕi), بيبيعو (bibīʕu)

## Summary (from the notebook)

- **Past, most people:** first letter with ـِ + suf → بِعت، بِعنا
- **Past, ★ هيّا & همّا:** keep the ا + suf → باعت، باعو
- **Present / future:** pre + stem with ي + suf → ببيع، بتبيعو

## Full table — باع (to sell)

${table(BAA)}

## Full table — جاب (to bring)

${table(JAB)}

## ⚠ The exception: نام (to sleep)

نام is **S.C.5 in the past** (نِمت, nimt) but **regular in the present**: the ا stays, **بنام** (banām), not "بنيم".

${table(NAM)}

## The S.C.5 verbs in the notebook (p.11)

| Past | Present (I) | Meaning |
|---|---|---|
| باع bāʕ → بِعت | ببيع babīʕ | to sell |
| صار ṣār → صِرت | بصير baṣīr | to happen / become |
| شال shāl → شِلت | بشيل bashīl | to take off / remove |
| جاب jāb → جِبت | بجيب bajīb | to bring |
| ضاف ḍāf → ضِفت | بضيف baḍīf | to add |
| طار ṭār → طِرت | بطير baṭīr | to fly |
| عاش ʕāsh → عِشت | بعيش baʕīsh | to live / be alive |
| صاد ṣād → صِدت | بصيد baṣīd | to hunt / fish |
| دار dār → دِرت | بدير badīr | to manage |
| قاس ʔās → قِست | بقيس baʔīs | to measure |
| صاب ṣāb → صِبت | بصيب baṣīb | to touch / hit |
| طاب ṭāb → طِبت | بطيب baṭīb | to recover |
| زاد zād → زِدت | بزيد bazīd | to increase |
| ضاع ḍāʕ → ضِعت | بضيع baḍīʕ | to be lost |
| عاد ʕād → عِدت | بعيد baʕīd | to repeat |
| **نام nām → نِمت** | **بنام banām** ⚠ | to sleep |

## Related: the "و" verbs (not on this page)

راح, شاف, قال and كان also drop the ا in the past, but with a **ُ** instead: **رُحت** (ruḥt), **شُفت** (shuft), **قُلت** (ʔult), **كُنت** (kunt). In the present the ا becomes **و**: بروح، بشوف، بقول، بكون. Their imperative is the imperative's special case 2: روح، قول، كون.

${PRONUNCIATION_KEY}`,
    examples: [
      { ar: 'بِعت السيارة', en: 'I sold the car (biʕt is-sayyāra)' },
      { ar: 'جابت خبز', en: 'she brought bread (jābat khubz) ★ ا stays' },
      { ar: 'شو صار؟', en: 'what happened? (shu ṣār?)' },
      { ar: 'نِمت بكّير إمبارح', en: 'I slept early yesterday (nimt bakkīr imbāriḥ)' },
      { ar: 'بيعيش بباريس', en: 'he lives in Paris (biʕīsh b-bārīs)' },
      { ar: 'رح أجيب الأولاد', en: "I'll bring the kids (raḥ ajīb il-wlād)" },
      { ar: 'ضِعنا بالبلد القديمة', en: 'we got lost in the Old City (ḍiʕna bil-balad il-ʔadīme)' },
    ],
    source_pages: [11, 12],
    sort_order: 60,
  },

  // ------------------------------------------------------------ Imperative p.32–34
  {
    slug: 'imperative-formation',
    title: 'Imperative (الأمر) — the 6 cases',
    category: 'imperative',
    summary:
      'Uses the vowels of the present. 3 forms: إنتا —، إنتي —ي، إنتو —و. Negative = ما + future form. 6 cases by verb type.',
    content_md: `## The basics

- **فعل أمر** (imperative) = **حركات المضارع والمستقبل**: it uses the **vowels of the present tense**.
- It has only **3 forms (3 ضماير)**:

| Talking to | Form | إشرب |
|---|---|---|
| إنتا (a man) | — | **إشرب** ishrab |
| إنتي (a woman) | —ي | **إشربي** ishrabi |
| إنتو (a group) | —و | **إشربو** ishrabu |

## Negative imperative = the future form ("don't…")

| Talking to | Form | Example |
|---|---|---|
| إنتا | ما تـ— | **ما تشرب** (ma tishrab) |
| إنتي | ما تـ—ي | **ما تشربي** (ma tishrabi) |
| إنتو | ما تـ—و | **ما تشربو** (ma tishrabu) |

**ما تشربي قهوة بالليل** (ma tishrabi ʔahwe bil-lēl): don't drink coffee at night.

## The imperative has 6 cases (بيخدّ 6 حالات)

### Ⓐ Regular verb (فعل عادي)

**1. 3 letters → add إ at the start**

| Verb | إنتا | إنتي | إنتو |
|---|---|---|---|
| درس (to study) | **إدرُس** idrus | **إدرُسي** idrusi | **إدرُسو** idrusu |
| فتح (to open) | **إفتح** iftaḥ | **إفتحي** iftaḥi | **إفتحو** iftaḥu |

**2. 4 letters → the verb stays as it is**

| Verb | إنتا | إنتي | إنتو |
|---|---|---|---|
| سافر (to travel) | **سافر** sāfir | **سافري** sāfri | **سافرو** sāfru |
| فكّر (to think) | **فكّر** fakkir | **فكّري** fakkri | **فكّرو** fakkru |

### Ⓑ Special case 1: verbs that already start with إ stay the same

| Verb | إنتا | إنتي | إنتو |
|---|---|---|---|
| إستخدم (to use) | **إستخدم** istakhdim | **إستخدمي** istakhdmi | **إستخدمو** istakhdmu |
| إشتغل (to work) | **إشتغل** ishtighil | **إشتغلي** ishtighli | **إشتغلو** ishtighlu |
| إرسل (to send) | **إرسل** irsil | **إرسلي** irsli | **إرسلو** irslu |

### Ⓒ Special case 2: و in the middle (—و—)

| Verb | إنتا | إنتي | إنتو |
|---|---|---|---|
| راح (to go) | **روح** rūḥ | **روحي** rūḥi | **روحو** rūḥu |
| كان (to be) | **كون** kūn | **كوني** kūni | **كونو** kūnu |
| قال (to say) | **قول** ʔūl | **قولي** ʔūli | **قولو** ʔūlu |

### Ⓓ Special case 3: two-letter verbs (S.C.3), just the 2 letters

| Verb | إنتا | إنتي | إنتو |
|---|---|---|---|
| مرّ (to pass) | **مُرّ** murr | **مُرّي** murri | **مُرّو** murru |
| حلّ (to solve) | **حِلّ** ḥill | **حِلّي** ḥilli | **حِلّو** ḥillu |
| ضلّ (to stay) | **ضَلّ** ḍall | **ضَلّي** ḍalli | **ضَلّو** ḍallu |

### Ⓔ Special case 4: verbs ending in ى (S.C.4)

- إنتا & إنتي → end in **ي** (same form for both!)
- إنتو → the ي **drops** ✗ → **و**
- 3 letters → add **إ**; 4 letters → no إ

| Verb | إنتا | إنتي | إنتو |
|---|---|---|---|
| حكى (to speak) | **إحكي** iḥki | **إحكي** iḥki | **إحكو** iḥku |
| مشى (to walk) | **إمشي** imshi | **إمشي** imshi | **إمشو** imshu |
| سوّى (to do) | **سوّي** sawwi | **سوّي** sawwi | **سوّو** sawwu |
| فضّى (to empty) | **فضّي** faḍḍi | **فضّي** faḍḍi | **فضّو** faḍḍu |

### Ⓕ Special case 5: ي in the middle (S.C.5 verbs)

| Verb | إنتا | إنتي | إنتو |
|---|---|---|---|
| جاب (to bring) | **جيب** jīb | **جيبي** jībi | **جيبو** jību |
| صار (to become) | **صير** ṣīr | **صيري** ṣīri | **صيرو** ṣīru |
| عاش (to live) | **عيش** ʕīsh | **عيشي** ʕīshi | **عيشو** ʕīshu |

## حالات خاصة: individual verbs (just learn them)

| Verb | إنتا | إنتي | إنتو |
|---|---|---|---|
| أكل (to eat) | **كُل** kul | **كُلي** kuli | **كُلو** kulu |
| أخد (to take) | **خُد** khud | **خُدي** khudi | **خُدو** khudu |
| أجى (to come) | **تعال** taʕāl | **تعالي** taʕāli | **تعالو** taʕālu |

${PRONUNCIATION_KEY}`,
    examples: [
      { ar: 'روح عالبيت', en: 'go home (to a man) (rūḥ ʕal-bēt)' },
      { ar: 'كُلي، الأكل بيبرد', en: "eat (to a woman), the food's getting cold (kuli, il-akl bibrad)" },
      { ar: 'ما تنسو المفاتيح', en: "don't forget the keys (to a group) (ma tinsu il-mafatīḥ)" },
      { ar: 'إحكي عربي معي', en: 'speak Arabic with me (iḥki ʕarabi maʕi)' },
      { ar: 'جيبي المي', en: 'bring the water (to a woman) (jībi il-mayy)' },
      { ar: 'ضَلّو هون', en: 'stay here (to a group) (ḍallu hōn)' },
      { ar: 'إستنّى شوي', en: 'wait a moment (to a man) (istanna shwayy)' },
    ],
    source_pages: [32, 33, 34],
    sort_order: 90,
  },
];
