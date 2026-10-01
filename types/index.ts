export type Topic = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string | null;
  parent_id: string | null;
  sort_order: number;
};

export type Entry = {
  id: string;
  arabic: string;
  english: string;
  topic_id: string | null;
  notebook: string | null;
  page: number | null;
  page_label: string | null;
  entry_type: 'vocab' | 'grammar_example' | 'phrase';
  uncertain: boolean;
  notes: string | null;
  created_at: string;
};

export type GrammarRule = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content_md: string;
  examples: { ar: string; en: string; note?: string }[];
  source_pages: number[];
  sort_order: number;
};

export type NotebookPage = {
  id: string;
  notebook: string;
  page: number;
  image_path: string;
  title: string | null;
  entry_count: number;
};

export type Review = {
  id: string;
  entry_id: string;
  user_id: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  last_reviewed_at: string | null;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content_ar: string;
  content_en?: string;
  audio_url?: string;
  timestamp: string;
};
