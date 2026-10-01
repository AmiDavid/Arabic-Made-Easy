# Arab Made Easy

Your personal Palestinian Arabic learning app — a PWA you can install on Android and use on your laptop, wired to your 2,142-entry notebook vocabulary.

**What's inside:**
- 📚 **Vocabulary** — browse & search all 2,142 entries by topic
- 📖 **Grammar** — rules & patterns from your notebook, with source-page images
- 🎴 **Flashcards** — Anki-style spaced repetition (SM-2 algorithm)
- 🎯 **Matching game** — pair Arabic ↔ English against a timer
- 📷 **Scan** — snap new notebook pages, AI extracts + files them automatically
- 🎙 **Voice chat** — practice speaking Palestinian Arabic (Jordanian voice for now, swappable to cloned Bethlehem accent later)
- 🖼 **Notebook pages** — browse all 47 original scans

---

## Setup (roughly 10 minutes)

### 1. Get your accounts and keys ready

| Service | What you need | Where |
|---|---|---|
| **Supabase** | Project URL + anon key + service role key | https://supabase.com — free tier |
| **Anthropic** | API key (starts with `sk-ant-…`) | https://console.anthropic.com |
| **OpenAI** | API key (starts with `sk-…`) — for Whisper STT | https://platform.openai.com |
| **ElevenLabs** | API key + voice ID — for TTS | https://elevenlabs.io — free tier gives 10k chars/mo |

### 2. Install

```bash
cd arab-made-easy
npm install
```

Requires **Node 20+**.

### 3. Set your environment variables

```bash
cp .env.local.example .env.local
# open .env.local and fill in the keys
```

The default voice ID (`pMsXgVXv3BLzUgSXRplE`) is ElevenLabs' Jordanian Arabic voice (Rachel). To swap in a Bethlehem-cloned voice later, just change `ELEVENLABS_VOICE_ID`.

### 4. Set up the database

1. Open your Supabase project → **SQL Editor**
2. Open `supabase/schema.sql` from this repo → copy the whole file
3. Paste into the SQL editor → hit **Run**

You should see tables `entries`, `topics`, `grammar_rules`, `notebook_pages`, `reviews`, `scans`, `conversations` created, with 15 seed topics.

### 5. Import your vocabulary

```bash
npm run import-vocab
```

This reads `data/arabic_vocabulary.xlsx` (already included), pushes all 2,142 entries into Supabase with topics auto-tagged based on notebook page ranges, seeds the grammar rules, and registers all 47 scanned pages.

### 6. Run it

```bash
npm run dev
```

Open http://localhost:3000

### 7. Install on your phone (Android)

1. Deploy to Vercel (`vercel deploy` — it walks you through it)
2. Open the URL on your Android in Chrome
3. Menu → "Install app" (or "Add to Home Screen")
4. Now it's a real app icon

---

## Troubleshooting

**"Import failed with RLS error"** — the schema.sql opens up permissive policies, but make sure you're using the service role key (not anon) in `SUPABASE_SERVICE_ROLE_KEY`.

**"Voice chat gets no response"** — check API keys for OpenAI (Whisper) and ElevenLabs. The Anthropic key powers the chat brain.

**"Scan returns nothing"** — Claude Vision requires the image to be reasonably clear. Try in good light. The API returns the raw model output if parsing fails.

**"The Arabic looks wrong direction"** — the `.arabic` CSS class handles RTL. If a component isn't showing it, add `className="arabic"` to the element.

---

## Swapping in a Bethlehem voice

1. Record ~5 minutes of clear Bethlehem-Palestinian speech (a friend, or find a Bethlehem interview on YouTube — download the audio)
2. In ElevenLabs → Voices → **Add Voice** → **Instant Voice Cloning**
3. Upload the samples
4. Copy the new Voice ID → paste into `ELEVENLABS_VOICE_ID` in `.env.local`
5. Restart dev server

That's it — the voice chat now speaks in Bethlehem.

---

## File structure

```
arab-made-easy/
├── app/
│   ├── page.tsx                 # Home / tile grid
│   ├── catalog/                 # Vocabulary browser
│   ├── grammar/                 # Grammar rules
│   ├── flashcards/              # SRS practice
│   ├── match/                   # Matching game
│   ├── scan/                    # Camera + AI extraction
│   ├── voice/                   # Voice chat
│   ├── pages-viewer/            # Original scans
│   └── api/
│       ├── scan/route.ts        # Claude Vision OCR
│       ├── stt/route.ts         # Whisper STT
│       ├── chat/route.ts        # Claude chat (Palestinian)
│       └── tts/route.ts         # ElevenLabs TTS
├── lib/
│   ├── supabase.ts              # DB client
│   ├── srs.ts                   # SM-2 spaced repetition
│   ├── grammar-content.ts       # ← Edit here to add/change grammar rules
│   └── utils.ts
├── scripts/
│   └── import-vocab.ts          # Excel → Supabase
├── supabase/
│   └── schema.sql               # Paste into Supabase SQL editor
├── public/
│   ├── notebook-pages/          # 47 scan images
│   └── manifest.json            # PWA manifest
└── data/
    └── arabic_vocabulary.xlsx   # Source of truth for vocab
```

## What to build next

- Real auth (Supabase magic link) — required before sharing with friends
- More study games: fill-in-the-blank, listening quiz, sentence-building
- Streak tracking + daily reminder
- Export progress
- Pretty icons (right now `public/icon-*.png` are placeholders you'll want to replace)
- Cache SR audio so re-plays are instant

Enjoy! 🇵🇸
