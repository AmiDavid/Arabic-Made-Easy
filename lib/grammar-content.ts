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

export const GRAMMAR: GrammarSeed[] = [
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
  // SPECIAL-CASE VERBS — now with full conjugations
  // ============================================================
  {
    slug: 'sc3-two-letter-verbs',
    title: 'S.C.3 — Doubled-root verbs (حَبَّ / مَرَّ / حَطَّ)',
    category: 'verbs',
    summary: 'Verbs with a shadda on the middle letter — look like 2 letters, actually 3 (last two identical).',
    content_md: `## The rule

These verbs look like they have only 2 visible letters, but they actually have **3 root letters** — the last two are identical and written with a **shadda (ّ)**.

Example: **حَبَّ** (ḥabb) looks like 2 letters (ح + ب) but is really **ح + ب + ب** compressed with a shadda.

## The verb family

**Format**: past (he) / present (he) / meaning

| Verb (past) | Present | Meaning | Pronunciation |
|---|---|---|---|
| حَبَّ | يحِب | to like, to love | ḥabb / yiḥibb |
| مَرَّ | يمُر | to pass by | marr / yimurr |
| حَطَّ | يحُط | to put | ḥaṭṭ / yiḥuṭṭ |
| حَسَّ | يحِس | to feel | ḥass / yiḥiss |
| شَدَّ | يشِد | to pull, to tighten | shadd / yishidd |
| شَمَّ | يشِم | to smell | shamm / yishimm |
| حَلَّ | يحِل | to solve | ḥall / yiḥill |
| رَدَّ | يرُد | to respond | radd / yirudd |
| قَصَّ | يقُص | to cut | qaṣṣ / yiquṣṣ |
| عَدَّ | يعِد | to count | ʕadd / yiʕidd |
| صَفَّ | يصُف | to park | ṣaff / yiṣuff |
| لَفَّ | يلِف | to turn, to wrap | laff / yiliff |
| عَضَّ | يعُض | to bite | ʕaḍḍ / yiʕuḍḍ |
| نَطَّ | ينُط | to jump | naṭṭ / yinuṭṭ |
| رَنَّ | يرِن | to ring | rann / yirinn |
| ضَلَّ | يضِل | to stay | ḍall / yiḍill |
| طَخَّ | يطُخ | to shoot | ṭakhkh / yiṭukhkh |
| شَكَّ | يشِك | to doubt | shakk / yishikk |

## Full past-tense conjugation — حَبَّ (to love)

| Person | Form | Pronunciation |
|---|---|---|
| أَنَا (I) | حَبَّيت | ḥabbēt |
| إِنتَا (you m) | حَبَّيت | ḥabbēt |
| إِنتِي (you f) | حَبَّيتِي | ḥabbēti |
| هُوَّ (he) | حَبَّ | ḥabb |
| هِيَّ (she) | حَبَّت | ḥabbat |
| إِحنَا (we) | حَبَّينَا | ḥabbēna |
| إِنتُو (you pl) | حَبَّيتُو | ḥabbētu |
| هُمَّ (they) | حَبُّو | ḥabbu |

**Trick to remember:** when adding an ending that starts with a vowel (like ـِت for she, ـُو for they), the doubled consonant stays joined. When adding one that starts with a consonant (like ـَيت for I/you), you unpack it to **two letters + shadda-vowel**.

## Full present-tense conjugation — يحِب (he loves)

| Person | Form | Pronunciation |
|---|---|---|
| أَنَا | بحِب | baḥibb |
| إِنتَا | بِتحِب | btiḥibb |
| إِنتِي | بِتحِبِّي | btiḥibbi |
| هُوَّ | بِيحِب | biḥibb |
| هِيَّ | بِتحِب | btiḥibb |
| إِحنَا | بِنحِب | bniḥibb |
| إِنتُو | بِتحِبُّو | btiḥibbu |
| هُمَّ | بِيحِبُّو | biḥibbu |

## Example sentences

- **بحِبَّك كَتِير** (baḥibbak katīr) — I love you a lot (to a male)
- **حَبَّيتَ المَطعَم** (ḥabbēt al-maṭʕam) — I loved the restaurant
- **رَدَّت عَلَى الرِسَالَة** (raddat ʕalā ar-risāla) — she responded to the message
- **حُط الكِتَاب عَلَى الطَاوِلَة** (ḥuṭ al-kitāb ʕalā aṭ-ṭāwla) — put the book on the table`,
    examples: [
      { ar: 'بحِبَّك', en: 'I love you (baḥibbak)' },
      { ar: 'حَبَّيت هَادَا الفِيلم', en: 'I loved this movie (ḥabbēt hāda al-film)' },
      { ar: 'بِيمُر مِن هُون كُل يَوم', en: 'he passes by here every day (biyimurr min hōn kull yōm)' },
      { ar: 'حِل المُشكِلَة', en: 'solve the problem (ḥill al-mushkila) — imperative' },
      { ar: 'عَدَّينَا الفُلُوس', en: 'we counted the money (ʕaddēna al-fulūs)' },
    ],
    source_pages: [7, 8],
    sort_order: 40,
  },
  {
    slug: 'sc4-alif-maqsura-verbs',
    title: 'S.C.4 — Verbs ending in ى (حَكَى / مَشَى / بَكَى)',
    category: 'verbs',
    summary: 'Verbs ending in alif maqsura (ـَى) — the final ى shifts dramatically in conjugation.',
    content_md: `## The rule

These verbs end in **alif maqsura (ـَى)** — an a-sound written with the shape of ي. In conjugation, this ending transforms completely depending on who's doing the action.

## The verb family

| Verb (past) | Present | Meaning | Pronunciation |
|---|---|---|---|
| حَكَى | يحكِي | to speak, tell, say | ḥakā / yiḥki |
| مَشَى | يمشِي | to walk | mashā / yimshi |
| اِشتَرَى | يشتَرِي | to buy | ishtarā / yishtari |
| أَعطَى | يعطِي | to give | aʕṭā / yiʕṭi |
| سَوَّى | يسَوِّي | to do, make | sawwā / yisawwi |
| جَلَى | يجلِي | to wash dishes | jalā / yijli |
| كَوَى | يكوِي | to iron | kawā / yikwi |
| قَلَى | يقلِي | to fry | qalā / yiqli |
| شَوَى | يشوِي | to grill | shawā / yishwi |
| بَنَى | يبنِي | to build | banā / yibni |
| صَلَّى | يصَلِّي | to pray | ṣallā / yiṣalli |
| كَفَى | يكفِي | to be enough | kafā / yikfi |
| أَجَى | يجِي | to come | ajā / yiji |
| بَكَى | يبكِي | to cry | bakā / yibki |
| رَمَى | يرمِي | to throw | ramā / yirmi |
| غَنَّى | يغَنِّي | to sing | ghannā / yighanni |
| عَانَى | يعَانِي | to suffer | ʕānā / yiʕāni |
| لاقَى | يلاقِي | to find | lāqā / yilāqi |
| مَضَى | يمضِي | to spend time | maḍā / yimḍi |
| حَمَى | يحمِي | to protect | ḥamā / yiḥmi |
| عَبَّى | يعَبِّي | to fill | ʕabbā / yiʕabbi |
| طَفَى | يطفِي | to turn off | ṭafā / yiṭfi |
| اِنتَهَى | ينتَهِي | to finish, end | intahā / yintahi |

## Full past-tense conjugation — حَكَى (to speak)

| Person | Form | Pronunciation |
|---|---|---|
| أَنَا | حَكِيت | ḥakēt |
| إِنتَا | حَكِيت | ḥakēt |
| إِنتِي | حَكِيتِي | ḥakēti |
| هُوَّ | حَكَى | ḥakā |
| هِيَّ | حَكِت | ḥakat |
| إِحنَا | حَكِينَا | ḥakēna |
| إِنتُو | حَكِيتُو | ḥakētu |
| هُمَّ | حَكُو | ḥaku |

**The shift pattern**: the ـَى becomes ـِي when a consonant-starting ending follows (I/you/we). It becomes shortened or dropped when a vowel-starting ending follows (she/they).

## Full present-tense conjugation — يحكِي (he speaks)

| Person | Form | Pronunciation |
|---|---|---|
| أَنَا | بحكِي | baḥki |
| إِنتَا | بِتحكِي | btiḥki |
| إِنتِي | بِتحكِي | btiḥki (same as masc.!) |
| هُوَّ | بِيحكِي | biḥki |
| هِيَّ | بِتحكِي | btiḥki |
| إِحنَا | بِنحكِي | bniḥki |
| إِنتُو | بِتحكُو | btiḥku |
| هُمَّ | بِيحكُو | biḥku |

## Example sentences

- **حَكَيت مَع صَاحبِي** (ḥakēt maʕ ṣāḥbi) — I spoke with my friend
- **مَشَينَا كَتِير اليَوم** (mashēna katīr al-yōm) — we walked a lot today
- **اِشتَرَت فُستَان جَدِيد** (ishtarat fustān jadīd) — she bought a new dress
- **بِيصَلِّي كُل يَوم** (biṣalli kull yōm) — he prays every day
- **لاقِيت المَفَاتِيح** (lāqēt al-mafātīḥ) — I found the keys`,
    examples: [
      { ar: 'حَكَيت مَع صَاحبِي', en: 'I spoke with my friend (ḥakēt maʕ ṣāḥbi)' },
      { ar: 'مَشَينَا كَتِير', en: 'we walked a lot (mashēna katīr)' },
      { ar: 'اِشتَرَت فُستَان جَدِيد', en: 'she bought a new dress (ishtarat fustān jadīd)' },
      { ar: 'بِيصَلِّي كُل يَوم', en: 'he prays every day (biṣalli kull yōm)' },
      { ar: 'بِنغَنِّي سَوَى', en: 'we sing together (binghanni sawā)' },
    ],
    source_pages: [9, 10],
    sort_order: 50,
  },
  {
    slug: 'sc5-hollow-verbs',
    title: 'S.C.5 — Hollow verbs with middle ا (بَاع / جَاب / نَام)',
    category: 'verbs',
    summary: 'Verbs where the middle root letter is ا — it transforms to a short vowel in some conjugations.',
    content_md: `## The rule

Hollow verbs have **ا (alif)** as their middle root letter. In many conjugations, the alif gets replaced by a short vowel (usually ـِ or ـُ) depending on how the ending starts.

**Key pattern:** the ا stays when the ending starts with a vowel (she, they). It drops to a short vowel when the ending starts with a consonant (I, you, we).

## The verb family

| Verb (past) | Present | Meaning | Pronunciation |
|---|---|---|---|
| بَاع | يبِيع | to sell | bāʕ / yibīʕ |
| صَار | يصِير | to become, happen | ṣār / yiṣīr |
| شَال | يشِيل | to remove, lift | shāl / yishīl |
| جَاب | يجِيب | to bring | jāb / yijīb |
| ضَاف | يضِيف | to add | ḍāf / yiḍīf |
| طَار | يطِير | to fly | ṭār / yiṭīr |
| عَاش | يعِيش | to live | ʕāsh / yiʕīsh |
| صَاد | يصِيد | to hunt, fish | ṣād / yiṣīd |
| دَار | يدِير | to manage | dār / yidīr |
| قَاس | يقِيس | to measure | qās / yiqīs |
| طَاب | يطِيب | to recover, get better | ṭāb / yiṭīb |
| زَاد | يزِيد | to increase | zād / yizīd |
| ضَاع | يضِيع | to be lost | ḍāʕ / yiḍīʕ |
| نَام | ينَام | to sleep | nām / yināām |
| قَام | يقُوم | to get up | qām / yiqūm |
| رَاح | يرُوح | to go | rāḥ / yirūḥ |
| شَاف | يشُوف | to see | shāf / yishūf |
| قَال | يقُول | to say | qāl / yiqūl |

## Full past-tense conjugation — بَاع (to sell)

| Person | Form | Pronunciation |
|---|---|---|
| أَنَا | بِعت | biʕt |
| إِنتَا | بِعت | biʕt |
| إِنتِي | بِعتِي | biʕti |
| هُوَّ | بَاع | bāʕ |
| هِيَّ | بَاعِت | bāʕat |
| إِحنَا | بِعنَا | biʕna |
| إِنتُو | بِعتُو | biʕtu |
| هُمَّ | بَاعُو | bāʕu |

**The pattern:** when the ending starts with a consonant (I/you: ـت, we: ـنَا), the ا disappears → the vowel ـِ. When the ending starts with a vowel (she: ـِت, they: ـُو), the ا stays as بَا.

The vowel after the first letter also varies by verb:
- بَاع → بِعت (biʕt) — "i" vowel
- نَام → نِمت (nimt) — "i" vowel
- قَال → قُلت (qult) — "u" vowel
- شَاف → شُفت (shuft) — "u" vowel
- رَاح → رُحت (ruḥt) — "u" vowel

## Full present-tense conjugation — يبِيع (he sells)

| Person | Form | Pronunciation |
|---|---|---|
| أَنَا | ببِيع | babīʕ |
| إِنتَا | بِتبِيع | btibīʕ |
| إِنتِي | بِتبِيعِي | btibīʕi |
| هُوَّ | بِيبِيع | bibīʕ |
| هِيَّ | بِتبِيع | btibīʕ |
| إِحنَا | بِنبِيع | bnibīʕ |
| إِنتُو | بِتبِيعُو | btibīʕu |
| هُمَّ | بِيبِيعُو | bibīʕu |

## Example sentences

- **بِعت السَيَّارَة** (biʕt as-sayyāra) — I sold the car
- **جَابِت خِبِز** (jābat khibz) — she brought bread
- **نِمت بَدرِي اِمبَارِح** (nimt badri imbāraḥ) — I slept early yesterday
- **بِيعِيش في بَارِيس** (biʕīsh fi bārīs) — he lives in Paris
- **شُفت صَاحبِي في السُوق** (shuft ṣāḥbi fi as-sūq) — I saw my friend at the market
- **قُلتِ لَه الحَق** (qulti luh al-ḥaqq) — you (f) told him the truth`,
    examples: [
      { ar: 'بِعت السَيَّارَة', en: 'I sold the car (biʕt as-sayyāra)' },
      { ar: 'جَابِت خِبِز', en: 'she brought bread (jābat khibz)' },
      { ar: 'نِمت بَدرِي', en: 'I slept early (nimt badri)' },
      { ar: 'بِيعِيش في بَارِيس', en: 'he lives in Paris (biʕīsh fi bārīs)' },
      { ar: 'شُفت صَاحبِي', en: 'I saw my friend (shuft ṣāḥbi)' },
    ],
    source_pages: [11, 12],
    sort_order: 60,
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
  // IMPERATIVE
  // ============================================================
  {
    slug: 'imperative-formation',
    title: 'Imperative — telling someone to do something',
    category: 'imperative',
    summary: 'Commands change form by verb type and by gender/number of who you address.',
    content_md: `## The rule

Palestinian imperative has three forms depending on who you're addressing:
- **masculine singular** (default/bare)
- **feminine singular** (add ـِي)
- **plural** (add ـُو)

The way to form the imperative depends on the verb type.

## Regular verbs (3-letter roots like دَرَس, فَتَح)

Add **اِ** at the start, drop the present-tense prefix:

| Verb | Masc | Fem | Plural | Meaning |
|---|---|---|---|---|
| دَرَس | اِدرُس (idrus) | اِدرُسِي (idrusi) | اِدرُسُو (idrusu) | study |
| فَتَح | اِفتَح (iftaḥ) | اِفتَحِي (iftaḥi) | اِفتَحُو (iftaḥu) | open |
| كَتَب | اُكتُب (uktub) | اُكتُبِي (uktubi) | اُكتُبُو (uktubu) | write |

## Form II/III verbs (with shadda or elongation)

Drop the first vowel:

| Verb | Masc | Fem | Plural | Meaning |
|---|---|---|---|---|
| سَافَر | سَافِر (sāfer) | سَافرِي (sāfri) | سَافرُو (sāfru) | travel |
| فَكَّر | فَكِّر (fakker) | فَكرِي (fakri) | فَكرُو (fakru) | think |
| أَرسَل | أَرسِل (arsel) | أَرسلِي (arsli) | أَرسلُو (arslu) | send |

## Hollow verbs (middle ا — see S.C.5)

The internal vowel appears clean:

| Verb | Masc | Fem | Plural | Meaning |
|---|---|---|---|---|
| كَان | كُون (kūn) | كُونِي (kūni) | كُونُو (kūnu) | be |
| رَاح | رُوح (rūḥ) | رُوحِي (rūḥi) | رُوحُو (rūḥu) | go |
| قَال | قُول (qūl) | قُولِي (qūli) | قُولُو (qūlu) | say |
| بَاع | بِيع (bīʕ) | بِيعِي (bīʕi) | بِيعُو (bīʕu) | sell |

## Alif-maqsura verbs (ـَى — see S.C.4)

Masc and fem are often the same:

| Verb | Masc / Fem | Plural | Meaning |
|---|---|---|---|
| حَكَى | اِحكِي (iḥki) | اِحكُو (iḥku) | speak |
| مَشَى | اِمشِي (imshi) | اِمشُو (imshu) | walk |
| سَوَّى | سَوِّي (sawwi) | سَوُّو (sawwu) | do, make |

## Doubled verbs (shadda — see S.C.3)

| Verb | Masc | Fem | Plural | Meaning |
|---|---|---|---|---|
| ضَلَّ | ضَل (ḍall) | ضَلِّي (ḍalli) | ضَلُّو (ḍallu) | stay |
| حَلَّ | حِل (ḥill) | حِلِّي (ḥilli) | حِلُّو (ḥillu) | solve |

## Irregular (dropped alif in present)

| Verb | Masc | Fem | Plural | Meaning |
|---|---|---|---|---|
| أَكَل | كُل (kul) | كُلِي (kuli) | كُلُو (kulu) | eat |
| أَخَد | خُد (khud) | خُدِي (khudi) | خُدُو (khudu) | take |

## Negative imperative (don't do X)

**مَا + present tense (2nd person)**

- **مَا تِشرَبِي قَهوَة بِاللَيل** (mā tishrabi qahwa bi-l-lēl) — don't drink coffee at night (to f)
- **مَا تِنسَوا المَفَاتِيح** (mā tinsau al-mafātīḥ) — don't forget the keys (to pl)
- **مَا تِحكِي كَتِير** (mā tiḥki katīr) — don't talk a lot (to f)`,
    examples: [
      { ar: 'رُوح لِلبَيت', en: 'go home (rūḥ la-l-bēt) — to masc.' },
      { ar: 'كُلِي كُل الأَكِل', en: 'eat all the food (kuli kull al-akl) — to fem.' },
      { ar: 'مَا تِنسَوا المَفَاتِيح', en: "don't forget the keys (mā tinsau al-mafātīḥ) — to pl." },
      { ar: 'اِحكِي عَلَى الهَاتِف', en: 'speak on the phone (iḥki ʕalā al-hātef)' },
      { ar: 'جِيبِي المَي', en: 'bring the water (jībi al-mai) — to fem.' },
    ],
    source_pages: [32, 33, 34],
    sort_order: 90,
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
