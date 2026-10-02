/**
 * Hand-curated grammar rules from the notebook, keyed to source pages.
 * Seeded into the DB by scripts/import-vocab.ts.
 *
 * Each rule should include: clear explanation, full conjugation (not just he/she),
 * transliteration for pronunciation, and multiple example sentences.
 */

export type GrammarSeed = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  content_md: string;
  examples: { ar: string; en: string; note?: string }[];
  source_pages: number[];
  sort_order: number;
};

import { VERB_RULES } from './grammar-verbs';

const BASE_RULES: GrammarSeed[] = [
  // ============================================================
  // COLORS & ADJECTIVES
  // ============================================================
  {
    slug: 'colors-m-f',
    title: 'Colors — masculine / feminine forms',
    category: 'adjectives',
    summary: 'Primary colors have distinct m/f forms; secondary colors are invariant.',
    content_md: `## The rule

Primary colors in Palestinian follow the pattern **أَفعَل / فَعلَة** — one shape for masculine, one for feminine. The feminine isn't formed by adding ة to the masculine; it's a different shape altogether.

| Color | Masculine | Feminine | Pronunciation |
|---|---|---|---|
| white | أَبيَض | بِيضَة | abyaḍ / bīḍa |
| black | أَسوَد | سَودَة | aswad / sawda |
| red | أَحمَر | حَمرَة | aḥmar / ḥamra |
| green | أَخضَر | خَضرَة | akhḍar / khaḍra |
| blue | أَزرَق | زَرقَة | azraq / zarqa |
| yellow | أَصفَر | صَفرَة | aṣfar / ṣafra |
| blonde | أَشقَر | شَقرَة | ashqar / shaqra |

## Secondary/borrowed colors

Secondary colors end in **ـِي** and don't change for gender:
بُرتُقَالِي (burtuqāli, orange), زَهرِي (zahri, pink), بَنَفسَجِي (banafsaji, purple), بُنِّي (bunni, brown), ذَهَبِي (dhahabi, gold), فِضِّي (fiḍḍi, silver), سَكَنِي (sakani, gray)

## Modifiers

- **فَاتِح** (fātiḥ) — light
- **غَامِق** (ghāmiq) — dark

Place the modifier **after** the color: أَزرَق فَاتِح (light blue), أَحمَر غَامِق (dark red).

## How to use

The color agrees with the gender of the noun it describes:
- **فُستَان أَحمَر** (fustān aḥmar) — a red dress (fustān is masc.)
- **سَيَّارَة حَمرَة** (sayyāra ḥamra) — a red car (sayyāra is fem.)

Plural non-human nouns take the feminine singular color:
- **بُيُوت بِيضَة** (buyūt bīḍa) — white houses`,
    examples: [
      { ar: 'الفُستَان الأَحمَر', en: 'the red dress (al-fustān al-aḥmar)' },
      { ar: 'السَيَّارَة الحَمرَة', en: 'the red car (as-sayyāra al-ḥamra) — fem noun → fem color' },
      { ar: 'أَزرَق فَاتِح', en: 'light blue (azraq fātiḥ)' },
      { ar: 'عَينِي خَضرَة', en: 'my eye is green (ʕēni khaḍra) — ʕēn is fem.' },
    ],
    source_pages: [2, 3],
    sort_order: 10,
  },

  // ============================================================
  // NUMBERS / DATES / ORDINALS
  // ============================================================
  {
    slug: 'singular-plural-counting',
    title: 'Counting nouns: 1, 2, 3–10, 11+',
    category: 'numbers',
    summary: 'Arabic counting shifts between singular, dual, and plural depending on the number.',
    content_md: `## The rule

Numbers in Arabic don't just precede a noun — they also change the noun's **form**. Palestinian follows these classical rules:

| Number | Noun form | Example |
|---|---|---|
| 1 | **singular** (noun first, then wāḥad) | بَيت وَاحَد (bēt wāḥad) — one house |
| 2 | **dual** ending ـَين or ـِين | بَيتِين (bētēn) — two houses |
| 3–10 | **plural** | خَمس بُيُوت (khams buyūt) — 5 houses |
| 11+ | **back to singular** | خَمسطَعَش بَيت (khamṣṭaʕash bēt) — 15 houses |
| 100+ | **singular** continues | مِيِّة بَيت (miyyeh bēt) — 100 houses |

## Dual forms

The dual (number 2) uses specific endings — you don't say "two cars" with the number 2:

- **بَيت** → **بَيتِين** (bētēn) — two houses
- **سَيَّارَة** → **سَيَّارتِين** (sayyārtēn) — two cars
- **كِتَاب** → **كِتَابِين** (kitābēn) — two books
- **بِنت** → **بِنتِين** (bintēn) — two girls

For feminine nouns ending in ة, the ة becomes ت before the ending: سَيَّارَة → سَيَّارتِين.

## Example counts (3-10 use plural)

- تَلَات سَيَّارَات (talāt sayyārāt) — three cars
- أَربَع بُيُوت (arbaʕ buyūt) — four houses
- خَمس كُتُب (khams kutub) — five books
- سِت بَنَات (sitt banāt) — six girls
- سَبع سَاعَات (sabʕ sāʕāt) — seven hours

## Compound numbers

For 100+, use مِيِّة + و + remainder:
- مِيِّة وَ سِتَّة سَيَّارَات (miyyeh w sitta sayyārāt) — 106 cars`,
    examples: [
      { ar: 'بَيت وَاحَد', en: 'one house (bēt wāḥad)' },
      { ar: 'سَيَّارتِين', en: 'two cars (sayyārtēn — dual)' },
      { ar: 'خَمس بُيُوت', en: 'five houses (khams buyūt — plural)' },
      { ar: 'خَمسطَعَش بَيت', en: 'fifteen houses (khamṣṭaʕash bēt — back to singular)' },
      { ar: 'مِيِّة وَ خَمسِين دُولَار', en: 'one hundred and fifty dollars' },
    ],
    source_pages: [4],
    sort_order: 20,
  },
  {
    slug: 'ordinal-numbers',
    title: 'Ordinals: first, second, third… (أَوَّل، تَانِي، تَالِت)',
    category: 'numbers',
    summary: 'Pattern فَاعِل. Placement before noun = indefinite; after = definite.',
    content_md: `## The ordinals

| Position | Masculine | Feminine | Pronunciation |
|---|---|---|---|
| 1st | أَوَّل | أُولَى | awwal / ūla |
| 2nd | تَانِي | تَانيَة | tāni / tānye |
| 3rd | تَالِت | تَالتَة | tālit / tālte |
| 4th | رَابِع | رَابعَة | rābeʕ / rābʕa |
| 5th | خَامِس | خَامسَة | khāmes / khāmse |
| 6th | سَادِس | سَادسَة | sādes / sādse |
| 7th | سَابِع | سَابعَة | sābeʕ / sābʕa |
| 8th | تَامِن | تَامنَة | tāmen / tāmne |
| 9th | تَاسِع | تَاسعَة | tāseʕ / tāsʕa |
| 10th | عَاشِر | عَاشرَة | ʕāsher / ʕāshra |

## The placement rule (very important)

The position of the ordinal — **before or after** the noun — changes the meaning:

| Order | Form | Meaning |
|---|---|---|
| ordinal + indefinite noun | أَوَّل يَوم (awwal yōm) | a first day (not THE first — any first) |
| definite noun + ordinal (with الـ) | اليَوم الأَوَّل (al-yōm al-awwal) | THE first day |
| noun + possessive + ordinal | يَومِي الأَوَّل (yōmi al-awwal) | my first day |
| ordinal + possessive noun | أَوَّل يَومِي (awwal yōmi) | my first day (alt., informal) |

## "Second time" vs "another time"

Palestinian uses تَانِي and تَانيَة cleverly to distinguish:

- **تَانِي مَرَّة** (tāni marra) — second time (literally)
- **مَرَّة تَانيَة** (marra tānye) — another / other time (not necessarily the 2nd)
- **المَرَّة التَانيَة** (al-marra at-tānye) — the second time (specifically)`,
    examples: [
      { ar: 'أَوَّل يَوم في الشُغل', en: "a first day at work (awwal yōm fi ash-shughl)" },
      { ar: 'اليَوم الأَوَّل في الشُغل', en: "THE first day at work (al-yōm al-awwal fi ash-shughl)" },
      { ar: 'الطَابِق الخَامِس', en: 'the fifth floor (aṭ-ṭābeq al-khāmes)' },
      { ar: 'مَرَّة تَانيَة', en: 'another time (marra tānye)' },
      { ar: 'المَرَّة التَالتَة', en: 'the third time (al-marra at-tālte)' },
    ],
    source_pages: [5, 6],
    sort_order: 30,
  },
  {
    slug: 'dates',
    title: 'Dates — plain numbers, not ordinals',
    category: 'numbers',
    summary: 'Palestinian dates use cardinal numbers (twenty) not ordinals (twentieth).',
    content_md: `## The rule

Unlike English ("the third of March"), Palestinian uses plain **cardinal** numbers:

- **عِشرِين شَهَر تَلَات** (ʕishrīn shahar talāt) = "twenty, month three" = March 20
- **خَمسَة شَهَر خَمسَة** (khamsa shahar khamsa) = "five, month five" = May 5

## Months are numbered

Months are usually referred to by number using **شَهَر + number**:

| English | Palestinian | Pronunciation |
|---|---|---|
| January | شَهَر وَاحَد | shahar wāḥad |
| February | شَهَر اِتنِين | shahar itnēn |
| March | شَهَر تَلَات | shahar talāt |
| April | شَهَر أَربَعَة | shahar arbaʕa |
| May | شَهَر خَمسَة | shahar khamsa |
| June | شَهَر سِتَّة | shahar sitta |
| July | شَهَر سَبعَة | shahar sabʕa |
| August | شَهَر تَمَانيَة | shahar tamānye |
| September | شَهَر تِسعَة | shahar tisʕa |
| October | شَهَر عَشَرَة | shahar ʕashra |
| November | شَهَر إِحدَعَش | shahar iḥdaʕash |
| December | شَهَر اِتنَعَش | shahar itnaʕash |

## Years

Years are spoken as compound numbers:
- **الفَين وَاحَد وَ عِشرِين** (alfēn wāḥad w ʕishrīn) — 2021
- **الفَين وَ خَمسَة وَ عِشرِين** (alfēn w khamsa w ʕishrīn) — 2025`,
    examples: [
      { ar: 'نَقَلِت لِبَارِيس عِشرِين شَهَر تَلَات الفَين وَاحَد وَ عِشرِين', en: 'I moved to Paris on March 20, 2021' },
      { ar: 'عِيد مِيلَادِي خَمسَة شَهَر سَبعَة', en: 'My birthday is July 5' },
    ],
    source_pages: [5],
    sort_order: 25,
  },
  // ============================================================
  // COMPARATIVES
  // ============================================================
  {
    slug: 'comparative-afal-formation',
    title: 'Comparative formation — the أَفعَل pattern',
    category: 'comparatives',
    summary: 'Transform an adjective into "more X" by rearranging letters into the أَفعَل shape.',
    content_md: `## The rule

To form the comparative ("more X") in Palestinian:

1. **Remove all short vowels** from the adjective
2. **Add أَ at the beginning**
3. **Add a short vowel/ي shaped by the third letter** so it fits the pattern أَفعَل

Example: سَهِل (sahil, easy) → remove vowels: سهل → add أ: أسهل → add vowels: **أَسهَل** (ashal, easier)

## Common comparatives

| Adjective | Pronunciation | Comparative | Pronunciation |
|---|---|---|---|
| سَهِل (easy) | sahil | أَسهَل | ashal |
| شَاطِر (clever) | shāṭir | أَشطَر | ashṭar |
| كِبِير (big) | kbīr | أَكبَر | akbar |
| صَغِير (small) | ṣghīr | أَصغَر | aṣghar |
| قَوِي (strong) | qawi | أَقوَى | aqwā |
| زَكِي (tasty) | zaki | أَزكَى | azkā |
| حِلِي (sweet) | ḥili | أَحلَى | aḥlā |
| قَدِيم (old) | qadīm | أَقدَم | aqdam |
| جَدِيد (new) | jadīd | أَجدَد | ajdad |
| غَالِي (expensive) | ghāli | أَغلَى | aghlā |
| رخِيص (cheap) | rkhīṣ | أَرخَص | arkhaṣ |
| سَرِيع (fast) | sarīʕ | أَسرَع | asraʕ |
| بَطِيء (slow) | baṭī | أَبطَأ | abṭā |
| نَشِيط (active) | nashīṭ | أَنشَط | anshaṭ |

## When the pattern doesn't fit

For long/heavy words, use **أَكتَر** (aktar, "more") *after* the word:

- مَشغُول → **أَكتَر مَشغُول** (aktar mashghūl) — busier
- مَجنُون → **مَجنُون أَكتَر** (majnūn aktar) — crazier
- مُهتَم → **مُهتَم أَكتَر** (muhtamm aktar) — more interested

## Making comparisons

Pattern: **[subject] + [comparative] + مِن + [thing compared to]**

- القُدس أَحلَى مِن بَارِيس (al-quds aḥlā min bārīs) — Jerusalem is nicer than Paris
- السَيَّارَة أَسرَع مِن البُسكليت (as-sayyāra asraʕ min al-buskalēt) — the car is faster than the bike
- أَنَا أَنشَط مِنهَا (ana anshaṭ minha) — I am more active than her`,
    examples: [
      { ar: 'القُدس أَحلَى مِن بَارِيس', en: 'Jerusalem is nicer than Paris' },
      { ar: 'أَنَا أَنشَط مِنهَا', en: 'I am more active than her' },
      { ar: 'هَادَا الكِتَاب أَرخَص مِن ذَاك', en: 'this book is cheaper than that one' },
      { ar: 'إِنتَا أَكتَر مَشغُول مِنِّي', en: 'you are busier than me' },
    ],
    source_pages: [17, 19],
    sort_order: 70,
  },
  {
    slug: 'comparative-irregular',
    title: 'Irregular comparatives',
    category: 'comparatives',
    summary: 'A handful of common comparatives have unique forms.',
    content_md: `## The exceptions

Not every adjective follows the أَفعَل pattern. These are the ones you must memorize:

| Adjective | Pronunciation | Comparative | Pronunciation |
|---|---|---|---|
| كُوَيِّس / مَنِيح (good) | kwayyes / manīḥ | **أَحسَن** | aḥsan |
| مُهِم (important) | muhimm | **أَهَم** | ahamm |
| مُرِيح (comfortable) | murīḥ | **أَرِيح** | arīḥ |
| سَيِّء (bad) | sayy'e | **أَسوَأ** | aswa' |
| بَدرِي (early) | badri | **أَبدَر** | abdar |
| حِلو (sweet) | ḥilo | **أَحلَى** | aḥlā |

## Why irregular?

Historical sound-change — the regular pattern would produce ugly or ambiguous forms, so these common words kept older irregular shapes. Just memorize them.

## Example sentences

- **شَغلُهُم الأَحسَن في البَلَد** (shughluhum al-aḥsan fi al-balad) — their work is the best in the country
- **هَادَا أَهَم شِي اليَوم** (hāda ahamm shī al-yōm) — this is the most important thing today
- **الكُرسِي الجَدِيد أَرِيح بِكَتِير** (al-kursi al-jadīd arīḥ bi-katīr) — the new chair is much more comfortable
- **الحَال أَسوَأ هَلَّأ** (al-ḥāl aswa' halla') — the situation is worse now`,
    examples: [
      { ar: 'شَغلُهُم الأَحسَن', en: 'their best work (shughluhum al-aḥsan)' },
      { ar: 'هَادَا أَهَم شِي', en: 'this is the most important thing (hāda ahamm shī)' },
      { ar: 'الحَال أَسوَأ هَلَّأ', en: 'the situation is worse now' },
    ],
    source_pages: [18],
    sort_order: 75,
  },
  {
    slug: 'comparative-most-superlative',
    title: 'Superlative — "the most X" (الأَحلَى)',
    category: 'comparatives',
    summary: 'Comparative + definite noun creates the superlative.',
    content_md: `## The rule

Palestinian doesn't have a separate "most" form. You use the **comparative** + a **definite noun** to express the superlative.

Two patterns, both common:

### Pattern A: Comparative + definite noun

**[comparative] + الـ[noun]** — "the X-est [thing]"

- **الأَكِل الأَزكَى** (al-akl al-azkā) — the tastiest food
- **القُدس أَقدَم مَدِينَة** (al-quds aqdam madīna) — Jerusalem is the oldest city
- **هَادَا أَصغَر بَيت** (hāda aṣghar bēt) — this is the smallest house

### Pattern B: Comparative + possessive noun

**[comparative] + [noun]ـه/ـنَا/ـي** — "the X-est of [possessive]"

- **بَستِي أَحلَى بِسَّة** (basti aḥlā bissa) — my cat is the sweetest cat
- **شَغلُهُم الأَحسَن** (shughluhum al-aḥsan) — their work is the best

## Negation

To say "not the most X":

- **بَيتنَا مِش أَكبَر بَيت** (bētna mish akbar bēt) — our house is not the biggest house
- **مِش أَهَم شِي** (mish ahamm shī) — it's not the most important thing`,
    examples: [
      { ar: 'الأَكِل الأَزكَى', en: 'the tastiest food (al-akl al-azkā)' },
      { ar: 'القُدس أَقدَم مَدِينَة', en: 'Jerusalem is the oldest city' },
      { ar: 'بَيتنَا مِش أَكبَر بَيت', en: 'our house is not the biggest house' },
    ],
    source_pages: [19, 20],
    sort_order: 78,
  },
  {
    slug: 'ma-exclamation',
    title: 'مَا أَفعَل — "How X!" (exclamation)',
    category: 'comparatives',
    summary: 'مَا + comparative form = admiring exclamation.',
    content_md: `## The rule

**مَا + [comparative] + [noun]** → "How X the [noun] is!"

⚠️ **Important:** the مَا here is NOT negation. It's a connector that turns the comparative into an exclamation.

## Examples

- **مَا أَحلَى الحَيَاة!** (mā aḥlā al-ḥayāh!) — How sweet life is!
- **مَا أَرِيح كُرسِينَا الجَدِيد** (mā arīḥ kursīna al-jadīd) — How comfortable our new chair is
- **مَا أَغلَى هَادَا البَيت** (mā aghlā hāda al-bēt) — How expensive this house is
- **مَا أَحلَى وَ مَا أَغلَى الحَيَاة في سُويسرَا** (mā aḥlā w mā aghlā al-ḥayāh fi swīsrā) — How nice and how expensive life is in Switzerland
- **مَا أَصغَر هَاد الولَد!** (mā aṣghar hād al-walad) — How small this boy is!

## How to tell negation from exclamation

| Form | Meaning |
|---|---|
| مَا أَحكِي | I don't speak (negation + present verb) |
| مَا أَحلَى | How beautiful! (exclamation + comparative) |

Context + the comparative shape (starts with أَ) makes it unambiguous.`,
    examples: [
      { ar: 'مَا أَحلَى الطَقس اليَوم!', en: 'How nice the weather is today! (mā aḥlā aṭ-ṭaqs al-yōm)' },
      { ar: 'مَا أَرِيح كُرسِينَا الجَدِيد', en: 'How comfortable our new chair is' },
      { ar: 'مَا أَصغَر هَاد الولَد!', en: 'How small this boy is!' },
    ],
    source_pages: [22],
    sort_order: 80,
  },
  {
    slug: 'more-than-verb',
    title: '"More than [verb]" — أَكتَر مِن مَا',
    category: 'comparatives',
    summary: 'Compare verb actions using [comparative] + مِن مَا + verb.',
    content_md: `## The rule

**[subject] + [comparative] + مِن مَا + [verb]**

Meaning: "more than [doing X]"

The مَا here turns a verb into a quantifiable thing you can compare against.

## Examples

- **هُوَّ بِفهَم أَكتَر مِن مَا بِيحكِي** (huwwe byifham aktar min mā byiḥki) — he understands more than he speaks
- **بِتحكِي أَكتَر مِن مَا بِتشتَغِل** (btiḥki aktar min mā btishtaghel) — you talk more than you work
- **بِينَام أَكتَر مِن مَا بِيشتَغِل** (binām aktar min mā byishtaghel) — he sleeps more than he works
- **بِتشتَرِي مَلَابِس أَكتَر مِن مَا بِتحتَاج** (btishtari malābes aktar min mā btiḥtāj) — she buys more clothes than she needs

## Pronunciation tip

The verb after مَا uses the present continuous (بـ prefix), not the bare present.`,
    examples: [
      { ar: 'هُوَّ بِفهَم أَكتَر مِن مَا بِيحكِي', en: 'he understands more than he speaks' },
      { ar: 'بِتشتَرِي مَلَابِس أَكتَر مِن مَا بِتحتَاج', en: 'she buys more clothes than she needs' },
      { ar: 'بِيدرُس أَكتَر مِن مَا بِيلعَب', en: 'he studies more than he plays' },
    ],
    source_pages: [21],
    sort_order: 82,
  },
  {
    slug: 'qaddi-ma-limit',
    title: 'قَدِّ مَا — "as much as / to the extent that"',
    category: 'comparatives',
    summary: 'Express limits with ability verbs ("more than we can").',
    content_md: `## The rule

**[comparison] + مِن قَدِّ مَا + [ability verb]**

The literal meaning is "more than the amount that [we can X]."

## Examples

- **هَادَا الكِتَاب أَكبَر مِن قَدِّ مَا نَقدِر نِحمِل** (hāda al-kitāb akbar min qaddi mā naqdir niḥmil) — this book is bigger than we can carry
- **الأُوتِيل أَغلَى مِن قَدِّ مَا نَدفَع** (al-ōtēl aghlā min qaddi mā nadfaʕ) — the hotel is more expensive than we can pay
- **عِندنَا بَرنَامِج أَحسَن مِن قَدِّ مَا نَعمَل** (ʕindna barnāmej aḥsan min qaddi mā naʕmal) — we have a better program than we can execute

## Common ability verbs that follow

- نَقدِر (naqdir) — we can
- فِيَّا (fiyya) — I can (fiyyak, fiyyik... for other persons)
- نَعمَل (naʕmal) — we do
- نَحتَمِل (naḥtamel) — we can bear`,
    examples: [
      { ar: 'هَادَا المَطعَم أَغلَى مِن قَدِّ مَا نَدفَع', en: 'this restaurant is more expensive than we can pay' },
      { ar: 'الكِتَاب أَصعَب مِن قَدِّ مَا نَفهَم', en: 'the book is harder than we can understand' },
    ],
    source_pages: [21],
    sort_order: 84,
  },
  {
    slug: 'zayy-ma-similarity',
    title: 'زَي مَا — "as / like"',
    category: 'comparatives',
    summary: 'Introduce similes or "as you know"-type expressions.',
    content_md: `## The rule

**زَي مَا + [verb/clause]** → "as / like [X]"

Used for comparing an action or state to a known reference.

## Examples

- **زَي مَا بِتعرَف، إِحنَا شَرِكَة كِبِيرَة** (zayy mā btiʕraf, iḥna sharika kbīra) — as you know, we are a big company
- **زَي مَا لَازِم** (zayy mā lāzim) — as it should be
- **زَي مَا حَكَيت لَك إِمبَارِح** (zayy mā ḥakēt lak imbāraḥ) — as I told you yesterday
- **زَي مَا أَنَا شَايِف** (zayy mā ana shāyif) — as I see it

## With a noun (no مَا needed)

- **زَي عَمتِك** (zayy ʕammtak) — like your aunt
- **زَي أَبُوك** (zayy abūk) — like your father
- **زَي الكَلب** (zayy al-kalb) — like a dog (colloquial expression)`,
    examples: [
      { ar: 'زَي مَا بِتعرَف، إِحنَا شَرِكَة كِبِيرَة', en: 'as you know, we are a big company' },
      { ar: 'زَي مَا لَازِم', en: 'as it should be' },
      { ar: 'زَي عَمتِك', en: 'like your aunt' },
    ],
    source_pages: [21],
    sort_order: 86,
  },

  // ============================================================
  // TIME EXPRESSIONS
  // ============================================================
  {
    slug: 'before-after-like',
    title: 'قَبِل / بَعد / زَي + مَا (time & similarity connectors)',
    category: 'connectors',
    summary: 'Prepositions that become clause connectors when followed by مَا.',
    content_md: `## The rule

**قَبِل** (qabil, before), **بَعد** (baʕd, after), and **زَي** (zayy, like/as) have two modes:

### Mode 1: With a noun directly

- **قَبِل الشُغل** (qabil ash-shughl) — before work
- **بَعد شَهرَين** (baʕd shahrēn) — after two months
- **زَي عَمتِك** (zayy ʕammtak) — like your aunt
- **بَعد الفُطُور** (baʕd al-fuṭūr) — after breakfast

### Mode 2: With a verb clause (add مَا)

- **قَبِل مَا تَحكِي فَكِّر** (qabil mā taḥki fakker) — think before you speak
- **بَعد مَا شَرَح فِهِمت المُشكِلَة** (baʕd mā sharaḥ fahimt al-mushkila) — after he explained, I understood the problem
- **زَي مَا بِتعَرَف** (zayy mā btiʕraf) — as you know
- **بدُون مَا تحتَرِم القَانُون مِش مُمكِن تِدخُل** (bidūn mā tiḥtarem al-qānūn mish mumkin tidkhul) — without respecting the law, it's not possible to enter

## Memory trick

If what follows is a thing (noun), you can go direct: قَبِل + noun.
If what follows is an action (verb), you need the bridge: قَبِل مَا + verb.`,
    examples: [
      { ar: 'قَبِل مَا تَحكِي فَكِّر', en: 'think before you speak (qabil mā taḥki fakker)' },
      { ar: 'بَعد مَا شَرَح فِهِمت المُشكِلَة', en: 'after he explained, I understood the problem' },
      { ar: 'قَبِل الفُطُور', en: 'before breakfast (qabil al-fuṭūr)' },
    ],
    source_pages: [31],
    sort_order: 100,
  },
  {
    slug: 'last-past-time',
    title: 'المَاضِي / اللِي فَات — "last / previous"',
    category: 'connectors',
    summary: 'Two ways to say "last week/month/year" — formal vs colloquial.',
    content_md: `## Two patterns, both common

Both agree in gender with the noun they modify.

### More formal: المَاضِي / المَاضيَة

- **الأُسبُوع المَاضِي** (al-usbūʕ al-māḍi) — last week (masc)
- **السَنَة المَاضيَة** (as-sana al-māḍye) — last year (fem)
- **الشَهَر المَاضِي** (ash-shahar al-māḍi) — last month

### More colloquial: اللِي فَات / فَاتِت

Literally "that passed." Agrees in gender.

- **الأُسبُوع اللِي فَات** (al-usbūʕ illi fāt) — "the week that passed" = last week
- **السَنَة اللِي فَاتِت** (as-sana illi fātat) — last year
- **المَرَّة اللِي فَاتِت** (al-marra illi fātat) — last time

Both are equally correct — pick whichever feels natural.

## Related time markers

- **إِمبَارِح** (imbāreḥ) — yesterday
- **أَوَّل إِمبَارِح** (awwal imbāreḥ) — the day before yesterday
- **زَمَان** (zamān) — a long time ago
- **فِي المَاضِي** (fi al-māḍi) — in the past
- **قَبِل كَم يَوم** (qabil kam yōm) — a few days ago
- **بُكرَا** (bukra) — tomorrow (opposite)
- **بَعد بُكرَا** (baʕd bukra) — the day after tomorrow`,
    examples: [
      { ar: 'الأُسبُوع اللِي فَات', en: 'last week (al-usbūʕ illi fāt)' },
      { ar: 'السَنَة المَاضيَة', en: 'last year (as-sana al-māḍye)' },
      { ar: 'شُفتَك المَرَّة اللِي فَاتِت', en: 'I saw you last time' },
    ],
    source_pages: [195, 196],
    sort_order: 110,
  },

  // ============================================================
  // م PREFIX FAMILY
  // ============================================================
  {
    slug: 'm-prefix-patterns',
    title: 'The مـ prefix — 4 patterns to recognize',
    category: 'morphology',
    summary: "One of Arabic's most productive prefixes. The vowel after م tells you the meaning.",
    content_md: `## The rule

The letter **م** at the start of a word carries different meanings depending on the vowel after it. If you learn to recognize the four patterns, you can often guess the meaning of a word you've never seen before.

## Pattern 1: مَـ = Place noun ("where the action happens")

From a verb → the place where that verb happens.

| Root verb | Place noun | Pronunciation |
|---|---|---|
| كَتَب (to write) | **مَكتَب** (desk/office) | maktab |
| طَبَخ (to cook) | **مَطبَخ** (kitchen) | maṭbakh |
| دَخَل (to enter) | **مَدخَل** (entrance) | madkhal |
| خَزَن (to store) | **مَخزَن** (storage) | makhzan |
| وَقَف (to stop) | **مَوقِف** (parking) | mawqef |
| لَعَب (to play) | **مَلعَب** (playground) | malʕab |
| جَلَس (to sit) | **مَجلِس** (council/sitting room) | majles |

## Pattern 2: مِـ = Tool / instrument

From a verb → the thing used to do that action.

| Root | Tool | Pronunciation |
|---|---|---|
| كَنَس (to sweep) | **مِكنَسَة** (broom) | miknasa |
| لعق (to scoop) | **مِلعَقَة** (spoon) | milʕaqa |
| صَفَى (to filter) | **مِصفَاة** (filter) | miṣfāh |
| فتح (to open) | **مِفتَاح** (key) | miftāḥ |
| قص (to cut) | **مِقَص** (scissors) | miqaṣṣ |

## Pattern 3: مَـ...ُو = Passive participle ("the [verb]-ed thing")

| Root | Passive participle | Pronunciation |
|---|---|---|
| شَغَل (to occupy) | **مَشغُول** (busy) | mashghūl |
| نَسِي (to forget) | **مَنسِي** (forgotten) | mansi |
| فهم (to understand) | **مَفهُوم** (understood) | mafhūm |
| كَتَب (to write) | **مَكتُوب** (written) | maktūb |
| فَصَل (to separate) | **مَفصُول** (separated) | mafṣūl |

## Pattern 4: مُـ = Derived-verb participle (forms II–X)

For verbs with shadda, elongation, or prefixes.

| Root verb | Participle | Pronunciation |
|---|---|---|
| هَاجَر (to migrate) | **مُهَاجِر** (immigrant) | muhājer |
| حَافَظ (to preserve) | **مُحَافِظ** (conservative) | muḥāfeẓ |
| وَاطَن (to be a citizen) | **مُوَاطِن** (citizen) | muwāṭen |
| خَيَّم (to camp) | **مُخَيَّم** (camp) | mukhayyam |
| فَكَّر (to think) | **مُفَكِّر** (thinker) | mufakker |

## Why this matters

When you see a new word starting with م, check the vowel:
- **مَ** (fatḥa) → probably a place or passive thing
- **مِ** (kasra) → probably a tool
- **مُ** (ḍamma) → probably someone/something doing a derived action

This single rule unlocks hundreds of words.`,
    examples: [
      { ar: 'المَكتَب في المَطبَخ', en: 'the desk is in the kitchen (both places — maktab, maṭbakh)' },
      { ar: 'مِفتَاح البَيت مَنسِي', en: 'the house key is forgotten (tool + passive participle)' },
      { ar: 'مُوَاطِن مُهَاجِر', en: 'immigrant citizen (both مُـ pattern)' },
    ],
    source_pages: [],
    sort_order: 120,
  },
];

// Verb chapters (S.C.3/4/5, key verbs, imperative) live in grammar-verbs.ts
export const GRAMMAR: GrammarSeed[] = [...BASE_RULES, ...VERB_RULES].sort(
  (a, b) => a.sort_order - b.sort_order
);
