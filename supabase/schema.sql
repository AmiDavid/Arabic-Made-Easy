-- ============================================================
-- Arab Made Easy — Supabase schema
-- Paste this whole file into Supabase SQL Editor and hit Run.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- topics: hierarchical categories (Politics > Elections > Voting)
-- ------------------------------------------------------------
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_ar text,
  parent_id uuid references topics(id) on delete set null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_topics_parent on topics(parent_id);

-- ------------------------------------------------------------
-- entries: vocabulary items (from Excel + future scans)
-- ------------------------------------------------------------
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  arabic text not null,
  english text not null,
  topic_id uuid references topics(id) on delete set null,
  notebook text,              -- e.g. "Notebook 3"
  page int,                   -- e.g. 39
  page_label text,            -- e.g. "Notebook 3, p.39"
  entry_type text default 'vocab',   -- vocab | grammar_example | phrase
  uncertain boolean default false,   -- [?] flag from OCR
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_entries_topic on entries(topic_id);
create index if not exists idx_entries_page on entries(notebook, page);
create index if not exists idx_entries_arabic_trgm on entries using gin (arabic gin_trgm_ops);
create index if not exists idx_entries_english_trgm on entries using gin (english gin_trgm_ops);

-- Enable trigram search for fuzzy matching
create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- grammar_rules: hand-curated grammar content
-- ------------------------------------------------------------
create table if not exists grammar_rules (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text,                 -- verbs | comparatives | numbers | pronouns | etc.
  summary text,                  -- short one-liner
  content_md text,               -- markdown body of the rule
  examples jsonb default '[]',   -- [{ ar, en, note }]
  source_pages int[] default '{}',  -- notebook page refs
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- notebook_pages: source images browsable by page
-- ------------------------------------------------------------
create table if not exists notebook_pages (
  id uuid primary key default gen_random_uuid(),
  notebook text not null,       -- e.g. "Notebook 3"
  page int not null,
  image_path text not null,     -- /notebook-pages/xxx.jpg
  title text,                   -- optional page title
  entry_count int default 0,
  unique (notebook, page)
);

-- ------------------------------------------------------------
-- reviews: SM-2 spaced repetition state per entry
-- ------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade,
  user_id text default 'me',    -- single-user for now, ready for auth later
  ease real default 2.5,
  interval_days int default 0,
  repetitions int default 0,
  due_at timestamptz default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique (entry_id, user_id)
);

create index if not exists idx_reviews_due on reviews(user_id, due_at);

-- ------------------------------------------------------------
-- scans: raw uploads + Claude Vision extractions
-- ------------------------------------------------------------
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  image_path text,              -- Supabase storage path
  raw_extraction jsonb,         -- Claude's raw output
  suggested_topic_id uuid references topics(id),
  status text default 'pending', -- pending | confirmed | rejected
  entries_created int default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- conversations: voice chat history
-- ------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text default 'me',
  messages jsonb default '[]',   -- [{ role, content_ar, content_en, audio_url }]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Seed the top-level topics
-- ------------------------------------------------------------
insert into topics (slug, name_en, name_ar, sort_order) values
  ('time', 'Time & Dates', 'الوقت والتاريخ', 10),
  ('colors', 'Colors', 'الألوان', 20),
  ('numbers-grammar', 'Numbers & Ordinals', 'الأرقام', 30),
  ('verbs-special', 'Special-Case Verbs', 'أفعال حالة خاصة', 40),
  ('comparatives', 'Comparatives', 'المقارنة', 50),
  ('market', 'Market & Food', 'السوق والأكل', 60),
  ('house', 'House & Rooms', 'البيت', 70),
  ('clothing', 'Clothing', 'الملابس', 80),
  ('body-meat', 'Body & Meat', 'أجزاء اللحم', 85),
  ('question-words', 'Question Words', 'كلمات السؤال', 90),
  ('imperative', 'Imperative & Pronouns', 'الأمر والضمائر', 100),
  ('politics', 'Politics', 'السياسة', 110),
  ('elections', 'Elections & Polling', 'الانتخابات', 115),
  ('appliances', 'Appliances & Kitchen', 'الأجهزة والمطبخ', 120),
  ('general', 'General', 'عام', 999)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Enable Row Level Security (single user for now; open policies)
-- ------------------------------------------------------------
alter table entries enable row level security;
alter table topics enable row level security;
alter table grammar_rules enable row level security;
alter table notebook_pages enable row level security;
alter table reviews enable row level security;
alter table scans enable row level security;
alter table conversations enable row level security;

-- Permissive policies for solo use — tighten when adding auth
create policy "public read entries" on entries for select using (true);
create policy "public write entries" on entries for all using (true) with check (true);
create policy "public read topics" on topics for select using (true);
create policy "public write topics" on topics for all using (true) with check (true);
create policy "public read grammar" on grammar_rules for select using (true);
create policy "public write grammar" on grammar_rules for all using (true) with check (true);
create policy "public read pages" on notebook_pages for select using (true);
create policy "public write pages" on notebook_pages for all using (true) with check (true);
create policy "public read reviews" on reviews for select using (true);
create policy "public write reviews" on reviews for all using (true) with check (true);
create policy "public read scans" on scans for select using (true);
create policy "public write scans" on scans for all using (true) with check (true);
create policy "public read convos" on conversations for select using (true);
create policy "public write convos" on conversations for all using (true) with check (true);
