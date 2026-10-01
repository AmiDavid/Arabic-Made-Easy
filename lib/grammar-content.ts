/**
 * Hand-curated grammar rules from the notebook, keyed to source pages.
 * Seeded into the DB by scripts/import-vocab.ts.
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
    content_md: `Primary colors follow the pattern **أَفعَل / فَعلَة** (m/f):

- أَبيَض / بِيضَة (white)
- أَسوَد / سَودَة (black)
- أَحمَر / حَمرَة (red)
- أَخضَر / خَضرَة (green)
- أَزرَق / زَرقَة (blue)
- أَصفَر / صَفرَة (yellow)
- أَشقَر / شَقرَة (blonde)

Secondary/borrowed colors end in **ـِي** and don't change:
- بُرتُقَالِي (orange), زَهرِي (pink), بَنَفسَجِي (purple), بُنِّي (brown), ذَهَبِي (gold), فِضِّي (silver)

**Modifiers:** فَاتِح (light) · غَامِق (dark)`,
    examples: [
      { ar: 'الفُستَان الأَحمَر', en: 'the red dress' },
      { ar: 'السَيَّارَة الحَمرَة', en: 'the red car (fem noun → fem color)' },
      { ar: 'أَزرَق فَاتِح', en: 'light blue' },
    ],
    source_pages: [2, 3],
    sort_order: 10,
  },

  // ============================================================
  // NUMBERS / DATES / ORDINALS
  // ============================================================
  {
    slug: 'singular-plural-counting',
    title: 'Singular, dual, plural — counting nouns',
    category: 'numbers',
    summary: 'Numbers 1–2 use singular/dual, 3–10 use plural, 11+ use singular again.',
    content_md: `Palestinian follows classical Arabic counting rules:

- **1**: noun singular — بَيت وَاحَد (one house)
- **2**: dual ending ـِين — بَيتِين (two houses), سَيَّارتِين (two cars)
- **3–10**: plural noun — تَلَات سَيَّارَات (three cars), خَمس بُيُوت (five houses)
- **11+**: singular noun again — خَمسطَعَش بَيت (fifteen houses)
- **Compound**: مِيِّة وَ سِتَّة سَيَّارَات (106 cars)`,
    examples: [
      { ar: 'بَيت وَاحَد', en: 'one house' },
      { ar: 'سَيَّارتِين', en: 'two cars (dual)' },
      { ar: 'خَمس بُيُوت', en: 'five houses (plural)' },
      { ar: 'خَمسطَعَش بَيت', en: 'fifteen houses (back to singular)' },
    ],
    source_pages: [4],
    sort_order: 20,
  },
  {
    slug: 'ordinal-numbers',
    title: 'Ordinal numbers (first, second, third…)',
    category: 'numbers',
    summary: 'Pattern فَاعِل. Placement before noun = indefinite; after = definite.',
    content_md: `**Ordinals 1–10:** أَوَّل، تَانِي، تَالِت، رَابِع، خَامِس، سَادِس، سَابِع، تَامِن، تَاسِع، عَاشِر
(feminine forms: أُولَى، تَانيَة، تَالتَة…)

**Placement rule:**
- **Before** the noun = indefinite: أَوَّل يَوم (a first day)
- **After** the noun (with الـ) = definite: اليَوم الأَوَّل (the first day)
- **With possessive**: يَومِي الأَوَّل (my first day) or أَوَّل يَومِي (idem)

**"Second time" vs "another time":**
- تَانِي مَرَّة = second time
- مَرَّة تَانيَة = another / other time
- المَرَّة التَانيَة = the second time`,
    examples: [
      { ar: 'أَوَّل يَوم', en: 'a first day (indef.)' },
      { ar: 'اليَوم الأَوَّل', en: 'the first day (def.)' },
      { ar: 'الطَابِق الخَامِس', en: 'the fifth floor' },
    ],
    source_pages: [5, 6],
    sort_order: 30,
  },
  {
    slug: 'dates',
    title: 'Dates — just numbers',
    category: 'numbers',
    summary: 'Dates in Palestinian use plain numbers, not ordinals.',
    content_md: `Unlike English "the third of March", Palestinian uses plain cardinal numbers:

- عِشرِين شَهَر تَلَات = "twenty, month three" = March 20
- Year is spoken as compound: الفَين وَاحَد وَ عِشرِين = 2021

The word شَهَر + number is how months are referred to conversationally (شَهَر تَلَات = March).`,
    examples: [
      { ar: 'نَقَلِت لِبَارِيس عِشرِين شَهَر تَلَات الفَين وَاحَد وَ عِشرِين', en: 'I moved to Paris on March 20, 2021' },
    ],
    source_pages: [5],
    sort_order: 25,
  },

  // ============================================================
  // SPECIAL-CASE VERBS
  // ============================================================
  {
    slug: 'sc3-two-letter-verbs',
    title: 'S.C.3 — verbs with two visible letters (doubled root)',
    category: 'verbs',
    summary: 'Verbs like حَبَّ / مَرَّ / حَطَّ where the last two root letters are identical (shadda).',
    content_md: `These verbs *look* like they have 2 letters but actually have 3 — the last two are identical and written with a shadda.

**Format:** past (he) — present (he)

- حَبَّ، يحِب — to like / love
- مَرَّ، يمُر — to pass by
- حَطَّ، يحُط — to put
- حَسَّ، يحِس — to feel
- شَدَّ، يشِد — to pull
- شَمَّ، يشِم — to smell
- حَلَّ، يحِل — to solve
- رَدَّ، يرُد — to respond
- قَصَّ، يقُص — to cut
- عَدَّ، يعِد — to count
- صَفَّ، يصُف — to park
- لَفَّ، يلِف — to turn
- عَضَّ، يعُض — to bite
- نَطَّ، ينُط — to jump
- رَنَّ، يرِن — to ring
- ضَلَّ، يضِل — to stay`,
    examples: [
      { ar: 'حَبَّيت هَادَا الفِيلم', en: 'I loved this movie' },
      { ar: 'بحِبَّك', en: 'I love you' },
      { ar: 'حَط الكِتَاب عَلَى الطَاوِلَة', en: 'put the book on the table' },
    ],
    source_pages: [7, 8],
    sort_order: 40,
  },
  {
    slug: 'sc4-alif-maqsura-verbs',
    title: 'S.C.4 — verbs ending in ى (alif maqsura)',
    category: 'verbs',
    summary: 'Verbs like حَكَى / مَشَى / بَكَى — the final ى behaves specially in conjugation.',
    content_md: `Verbs ending in **ـَى** (alif maqsura) form a big family in Palestinian:

- حَكَى — to speak / talk / tell
- مَشَى — to walk
- اِشتَرَى — to buy
- أَعطَى — to give
- سَوَّى — to do / make
- جَلَى — to wash dishes
- كَوَى — to iron
- قَلَى — to fry
- شَوَى — to grill
- بَنَى — to build
- صَلَّى — to pray
- كَفَى — to be enough
- أَجَى — to come
- بَكَى — to cry
- رَمَى — to throw
- غَنَّى — to sing
- عَانَى — to suffer
- لاقَى — to find
- مَضَى — to spend time
- حَمَى — to protect
- عَبَّى — to fill
- طَفَى — to turn off

**Conjugation tip:** in past tense, the ى usually shifts:
- حَكَى (he spoke) → حَكِيت (I spoke) → حَكَت (she spoke) → حَكُوا (they spoke)`,
    examples: [
      { ar: 'حَكَيت مَع صَاحبِي', en: 'I spoke with my friend' },
      { ar: 'مَشَينَا كَتِير', en: 'we walked a lot' },
      { ar: 'اِشتَرَت فُستَان جَدِيد', en: 'she bought a new dress' },
    ],
    source_pages: [9, 10],
    sort_order: 50,
  },
  {
    slug: 'sc5-hollow-verbs',
    title: 'S.C.5 — hollow verbs (middle ا)',
    category: 'verbs',
    summary: 'Verbs like بَاع / صَار / جَاب where the middle letter is ا that flips in conjugation.',
    content_md: `Hollow verbs have **ا** as their middle root letter, which changes to a short vowel when conjugated:

- بَاع، يبِيع — to sell
- صَار، يصِير — to become / happen
- شَال، يشِيل — to remove / lift
- جَاب، يجِيب — to bring
- ضَاف، يضِيف — to add
- طَار، يطِير — to fly
- عَاش، يعِيش — to live
- صَاد، يصِيد — to hunt / fish
- دَار، يدِير — to manage
- قَاس، يقِيس — to measure
- طَاب، يطِيب — to recover
- زَاد، يزِيد — to increase
- ضَاع، يضِيع — to be lost
- نَام، ينَام — to sleep

**Past conjugation drops the ا:**
- بَاع (he sold) → بِعت (I sold) → بَاعِت (she sold) → بَاعُوا (they sold)`,
    examples: [
      { ar: 'بِعت السَيَّارَة', en: 'I sold the car' },
      { ar: 'جَابِت خِبِز', en: 'she brought bread' },
      { ar: 'نِمت بَدرِي', en: 'I slept early' },
    ],
    source_pages: [11, 12],
    sort_order: 60,
  },

  // ============================================================
  // COMPARATIVES
  // ============================================================
  {
    slug: 'comparative-afal-formation',
    title: 'Comparative formation — أَفعَل pattern',
    category: 'comparatives',
    summary: 'Remove all vowels from the adjective, add أ at the start, add ي at the third letter.',
    content_md: `**Rule:** Take an adjective like سَهِل, and:
1. Remove all vowels
2. Add **أَ** at the start
3. Add short vowel/**ي** to shape the third letter

Result: **أَسهَل** (easier)

**Examples:**
- سَهِل → أَسهَل (easy → easier)
- شَاطِر → أَشطَر (clever → cleverer)
- كِبِير → أَكبَر (big → bigger)
- قَوِي → أَقوَى (strong → stronger)
- زَكِي → أَزكَى (tasty → tastier)
- حِلِي → أَحلَى (sweet → sweeter)

**When it doesn't fit** (already long/heavy words), use **أَكتَر** after the word:
- مَشغُول → أَكتَر مَشغُول (busier)
- مَجنُون → مَجنُون أَكتَر (crazier)`,
    examples: [
      { ar: 'القُدس أَحلَى مِن بَارِيس', en: 'Jerusalem is nicer than Paris' },
      { ar: 'أَنَا أَنشَط مِنهَا', en: 'I am more active than her' },
    ],
    source_pages: [17, 19],
    sort_order: 70,
  },
  {
    slug: 'comparative-irregular',
    title: 'Irregular comparatives',
    category: 'comparatives',
    summary: 'A handful of comparatives don\'t follow the standard pattern.',
    content_md: `- كُوَيِّس / مَنِيح → **أَحسَن** (good → better)
- مُهِم → **أَهَم** (important → more important)
- مُرِيح → **أَرِيح** (comfortable → more comfortable)
- سَيِّء → **أَسوَأ** (bad → worse)
- بَدرِي → **أَبدَر** (early → earlier)
- حِلو → **أَحلَى** (sweet → sweeter)`,
    examples: [
      { ar: 'شَغلُهُم الأَحسَن', en: 'their best work' },
      { ar: 'هَادَا أَهَم شِي', en: 'this is the most important thing' },
    ],
    source_pages: [18],
    sort_order: 75,
  },
  {
    slug: 'comparative-most-superlative',
    title: 'Superlative — "the most X"',
    category: 'comparatives',
    summary: 'The comparative form + a definite noun expresses superlative.',
    content_md: `**Structure:** [comparative] + [definite noun] = "the X-est [noun]"

- الأَكِل الأَزكَى = the tastiest food
- بَستِي أَحلَى بِسَّة = my cat is the sweetest cat
- القُدس أَقدَم مَدِينَة = Jerusalem is the oldest city
- بَيتنَا مِش أَكبَر بَيت = our house is not the biggest house`,
    examples: [
      { ar: 'الأَكِل الأَزكَى', en: 'the tastiest food' },
      { ar: 'القُدس أَقدَم مَدِينَة', en: 'Jerusalem is the oldest city' },
    ],
    source_pages: [19, 20],
    sort_order: 78,
  },
  {
    slug: 'ma-exclamation',
    title: 'مَا أَفعَل — exclamation "How X!"',
    category: 'comparatives',
    summary: 'مَا + comparative form = admiring exclamation.',
    content_md: `**Pattern:** مَا + أَفعَل + [noun] = "How X the [noun] is!"

Note: مَا here is NOT negation. It's a connector that turns the comparative into an exclamation.

- مَا أَحلَى الحَيَاة! — How sweet life is!
- مَا أَرِيح كُرسِينَا الجَدِيد — How comfortable our new chair is
- مَا أَغلَى هَادَا البَيت — How expensive this house is
- مَا أَحلَى وَ مَا أَغلَى الحَيَاة في سُويسرَا — How nice and how expensive life is in Switzerland`,
    examples: [
      { ar: 'مَا أَحلَى الطَقس اليَوم!', en: 'How nice the weather is today!' },
      { ar: 'مَا أَرِيح كُرسِينَا الجَدِيد', en: 'How comfortable our new chair is' },
    ],
    source_pages: [22],
    sort_order: 80,
  },
  {
    slug: 'more-than-verb',
    title: '"More than [verb]" — أَكتَر مِن مَا',
    category: 'comparatives',
    summary: 'To compare verb actions, use [comparative] + مِن مَا + verb.',
    content_md: `**Pattern:** [subject] + [comparative] + مِن مَا + [verb]

Meaning: "more than [doing X]"

- هُوَّ بِفهَم أَكتَر مِن مَا بِيحكِي — he understands more than he speaks
- بِتحكِي أَكتَر مِن مَا بِتشتَغِل — you talk more than you work
- بِينَام أَكتَر مِن مَا بِيشتَغِل — he sleeps more than he works`,
    examples: [
      { ar: 'هُوَّ بِفهَم أَكتَر مِن مَا بِيحكِي', en: 'he understands more than he speaks' },
      { ar: 'بِتشتَرِي مَلَابِس أَكتَر مِن مَا بِتحتَاج', en: 'she buys more clothes than she needs' },
    ],
    source_pages: [21],
    sort_order: 82,
  },
  {
    slug: 'qaddi-ma-limit',
    title: 'قَدِّ مَا — "as much as / to the extent that"',
    category: 'comparatives',
    summary: 'Used with ability verbs to express limits ("more than we can").',
    content_md: `**Pattern:** [comparison] + مِن قَدِّ مَا + [verb]

- هَادَا الكِتَاب أَكبَر مِن قَدِّ مَا نَقدِر — this book is bigger than we can [handle]
- الأُوتِيل أَغلَى مِن قَدِّ مَا نَدفَع — the hotel is more expensive than we can pay
- عِندنَا بَرنَامِج أَحسَن مِن قَدِّ مَا نَعمَل — we have a better program than we can execute`,
    examples: [
      { ar: 'هَادَا المَطعَم أَغلَى مِن قَدِّ مَا نَدفَع', en: 'this restaurant is more expensive than we can pay' },
    ],
    source_pages: [21],
    sort_order: 84,
  },
  {
    slug: 'zayy-ma-similarity',
    title: 'زَي مَا — "as / like"',
    category: 'comparatives',
    summary: 'Introduces similes or "as you know"-type expressions.',
    content_md: `**Pattern:** زَي مَا + [verb/clause]

- زَي مَا بِتعرَف، إِحنَا شَرِكَة كِبِيرَة — as you know, we are a big company
- زَي مَا لَازِم — as it should be
- زَي مَا حَكَيت لَك إِمبَارِح — as I told you yesterday`,
    examples: [
      { ar: 'زَي مَا بِتعرَف، إِحنَا شَرِكَة كِبِيرَة', en: 'as you know, we are a big company' },
      { ar: 'زَي مَا لَازِم', en: 'as it should be' },
    ],
    source_pages: [21],
    sort_order: 86,
  },

  // ============================================================
  // IMPERATIVE
  // ============================================================
  {
    slug: 'imperative-formation',
    title: 'Imperative (command) formation',
    category: 'imperative',
    summary: 'The imperative varies by gender/number and by verb type.',
    content_md: `Palestinian imperative has three forms: **masc. sg. / fem. sg. / plural**.

**Regular verbs** — add اِ + drop present marker:
- اِدرُس / اِدرُسِي / اِدرُسُو (study — m/f/pl)
- اِفتَح / اِفتَحِي / اِفتَحُو (open)

**Form-II/III/IV verbs** — drop first vowel:
- سَافِر / سَافرِي / سَافرُو (travel)
- فَكِّر / فَكرِي / فَكرُو (think)
- أَرسِل / أَرسلِي / أَرسلُو (send)

**Hollow verbs** — the internal vowel stays:
- كُون / كُونِي / كُونُو (be)
- رُوح / رُوحِي / رُوحُو (go)
- قُول / قُولِي / قُولُو (say)
- بِيع / بِيعِي / بِيعُو (sell)

**Alif-maqsura verbs (SC4):**
- اِحكِي / اِحكُو (speak — f/pl; masc: اِحكِي too)
- اِمشِي / اِمشُو (walk)
- سَوِّي / سَوُّو (do)

**Doubled verbs (SC3):**
- ضَل / ضَلِّي / ضَلُّو (stay)
- حِل / حِلِّي / حِلُّو (solve)

**Irregular** (dropped alif in present):
- كُل / كُلِي / كُلُو (eat) — from أَكَل
- خُد / خُدِي / خُدُو (take) — from أَخَد

**Negative imperative:** مَا + present tense (2nd person)
- مَا تِشرَبِي قَهوَة بِاللَيل — don't drink coffee at night`,
    examples: [
      { ar: 'رُوح لِلبَيت', en: 'go home (masc.)' },
      { ar: 'كُلِي كُل الأَكِل', en: 'eat all the food (fem.)' },
      { ar: 'مَا تِنسَوا المَفَاتِيح', en: "don't forget the keys (pl.)" },
    ],
    source_pages: [32, 33, 34],
    sort_order: 90,
  },

  // ============================================================
  // TIME EXPRESSIONS
  // ============================================================
  {
    slug: 'before-after-like',
    title: 'قَبِل / بَعد / زَي + مَا (time & similarity)',
    category: 'connectors',
    summary: 'These prepositions become clause connectors when followed by مَا.',
    content_md: `**قَبِل** (before), **بَعد** (after), and **زَي** (like/as) can precede either a noun or (with مَا) a verb clause.

**With a noun** (direct):
- قَبِل الشُغل — before work
- بَعد شَهرَين — after two months
- زَي عَمتِك — like your aunt

**With a verb clause** (add مَا):
- قَبِل مَا تَحكِي فَكِّر — think before you speak
- بَعد مَا شَرَح فِهِمت المُشكِلَة — after he explained, I understood the problem
- زَي مَا بِتعَرَف — as you know
- بدُون مَا تحتَرِم القَانُون مِش مُمكِن تِدخُل — without respecting the law, it's not possible to enter`,
    examples: [
      { ar: 'قَبِل مَا تَحكِي فَكِّر', en: 'think before you speak' },
      { ar: 'بَعد مَا شَرَح فِهِمت المُشكِلَة', en: 'after he explained, I understood the problem' },
    ],
    source_pages: [31],
    sort_order: 100,
  },
  {
    slug: 'last-past-time',
    title: 'المَاضِي / اللِي فَات — "last / previous"',
    category: 'connectors',
    summary: 'Two ways to say "last week/month/year" — formal vs colloquial.',
    content_md: `Both patterns agree in gender with the noun.

**More formal:**
- الأُسبُوع المَاضِي — last week (masc)
- السَنَة المَاضيَة — last year (fem)

**More colloquial:**
- الأُسبُوع اللِي فَات — "the week that passed"
- السَنَة اللِي فَاتِت — last year

**Time markers:**
- إِمبَارِح — yesterday
- أَوَّل إِمبَارِح — the day before yesterday
- زَمَان — long time ago
- فِي المَاضِي — in the past`,
    examples: [
      { ar: 'الأُسبُوع اللِي فَات', en: 'last week' },
      { ar: 'السَنَة المَاضيَة', en: 'last year' },
    ],
    source_pages: [195, 196],
    sort_order: 110,
  },

  // ============================================================
  // م PREFIX FAMILY
  // ============================================================
  {
    slug: 'm-prefix-patterns',
    title: 'The مـ prefix — 4 patterns',
    category: 'morphology',
    summary: 'One of Arabic\'s most productive prefixes. Different vowel = different meaning.',
    content_md: `The letter **م** at the start of a word carries different meanings depending on the vowel.

**Pattern 1: مَـ = Place noun** ("where the action happens")
- كَتَب → مَكتَب (desk/office)
- طَبَخ → مَطبَخ (kitchen)
- دَخَل → مَدخَل (entrance)
- خَزَن → مَخزَن (storage)
- وَقَف → مَوقِف (parking)

**Pattern 2: مِـ = Tool / instrument**
- كَنَس → مِكنَسَة (broom)
- لعق → مِلعَقَة (spoon)
- صَفَى → مِصفَاة (filter)
- فتح → مِفتَاح (key)

**Pattern 3: مَـ...ُو = Passive participle** ("the [verb]-ed thing")
- شَغَل → مَشغُول (busy = "occupied")
- نَسِي → مَنسِي (forgotten)
- فهم → مَفهُوم (understood)
- كَتَب → مَكتُوب (written)

**Pattern 4: مُـ = Derived-verb participle** (forms II–X)
- هَاجَر → مُهَاجِر (immigrant)
- حَافَظ → مُحَافِظ (conservative)
- وَاطَن → مُوَاطِن (citizen)
- خَيَّم → مُخَيَّم (camp)`,
    examples: [
      { ar: 'المَكتَب في المَطبَخ', en: 'the desk is in the kitchen (both places)' },
      { ar: 'مِفتَاح البَيت مَنسِي', en: 'the house key is forgotten (tool + passive)' },
    ],
    source_pages: [],  // synthesis rule, not from a specific page
    sort_order: 120,
  },
];
