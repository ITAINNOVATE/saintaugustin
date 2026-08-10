-- 1. CREATION DE LA TABLE composition_questions
CREATE TABLE IF NOT EXISTS public.composition_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT REFERENCES public.composition_subjects(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT,
  question_type TEXT DEFAULT 'single',
  options JSONB,
  correct_answers JSONB,
  explanation TEXT,
  image_url TEXT,
  audio_start_time INTEGER,
  audio_end_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, question_number)
);
ALTER TABLE public.composition_questions DISABLE ROW LEVEL SECURITY;
