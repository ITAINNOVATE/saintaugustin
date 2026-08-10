-- 1. CREATION DE LA TABLE composition_subjects
CREATE TABLE IF NOT EXISTS public.composition_subjects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  permit_category TEXT,
  duration_minutes INTEGER,
  total_questions INTEGER,
  pass_score INTEGER,
  difficulty TEXT,
  audio_url TEXT,
  can_go_back BOOLEAN DEFAULT true,
  show_explanations BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.composition_subjects DISABLE ROW LEVEL SECURITY;

-- 2. CREATION DE LA TABLE composition_sessions
CREATE TABLE IF NOT EXISTS public.composition_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT,
  subject_id TEXT REFERENCES public.composition_subjects(id) ON DELETE CASCADE,
  score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  is_passed BOOLEAN,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  answers_data JSONB
);
ALTER TABLE public.composition_sessions DISABLE ROW LEVEL SECURITY;

-- 3. INSERTION DES 46 SUJETS OFFICIELS
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-01', 'Sujet Officiel N°01 — Examen Théorique', 'B', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_01.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-02', 'Sujet Officiel N°02 — Examen Théorique', 'B', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_02.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-03', 'Sujet Officiel N°03 — Examen Théorique', 'A', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_03.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-04', 'Sujet Officiel N°04 — Examen Théorique', 'C', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_04.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-05', 'Sujet Officiel N°05 — Examen Théorique', 'D', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_05.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-06', 'Sujet Officiel N°06 — Examen Théorique', 'B', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_06.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-07', 'Sujet Officiel N°07 — Examen Théorique', 'B', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_07.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-08', 'Sujet Officiel N°08 — Examen Théorique', 'A', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_08.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-09', 'Sujet Officiel N°09 — Examen Théorique', 'C', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_09.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-10', 'Sujet Officiel N°10 — Examen Théorique', 'D', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_10.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-11', 'Sujet Officiel N°11 — Examen Théorique', 'B', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_11.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-12', 'Sujet Officiel N°12 — Examen Théorique', 'B', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_12.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-13', 'Sujet Officiel N°13 — Examen Théorique', 'A', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_13.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-14', 'Sujet Officiel N°14 — Examen Théorique', 'C', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_14.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-15', 'Sujet Officiel N°15 — Examen Théorique', 'D', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_15.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-16', 'Sujet Officiel N°16 — Examen Théorique', 'B', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_16.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-17', 'Sujet Officiel N°17 — Examen Théorique', 'B', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_17.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-18', 'Sujet Officiel N°18 — Examen Théorique', 'A', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_18.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-19', 'Sujet Officiel N°19 — Examen Théorique', 'C', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_19.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-20', 'Sujet Officiel N°20 — Examen Théorique', 'D', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_20.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-21', 'Sujet Officiel N°21 — Examen Théorique', 'B', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_21.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-22', 'Sujet Officiel N°22 — Examen Théorique', 'B', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_22.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-23', 'Sujet Officiel N°23 — Examen Théorique', 'A', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_23.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-24', 'Sujet Officiel N°24 — Examen Théorique', 'C', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_24.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-25', 'Sujet Officiel N°25 — Examen Théorique', 'D', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_25.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-26', 'Sujet Officiel N°26 — Examen Théorique', 'B', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_26.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-27', 'Sujet Officiel N°27 — Examen Théorique', 'B', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_27.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-28', 'Sujet Officiel N°28 — Examen Théorique', 'A', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_28.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-29', 'Sujet Officiel N°29 — Examen Théorique', 'C', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_29.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-30', 'Sujet Officiel N°30 — Examen Théorique', 'D', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_30.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-31', 'Sujet Officiel N°31 — Examen Théorique', 'B', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_31.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-32', 'Sujet Officiel N°32 — Examen Théorique', 'B', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_32.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-33', 'Sujet Officiel N°33 — Examen Théorique', 'A', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_33.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-34', 'Sujet Officiel N°34 — Examen Théorique', 'C', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_34.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-35', 'Sujet Officiel N°35 — Examen Théorique', 'D', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_35.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-36', 'Sujet Officiel N°36 — Examen Théorique', 'B', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_36.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-37', 'Sujet Officiel N°37 — Examen Théorique', 'B', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_37.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-38', 'Sujet Officiel N°38 — Examen Théorique', 'A', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_38.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-39', 'Sujet Officiel N°39 — Examen Théorique', 'C', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_39.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-40', 'Sujet Officiel N°40 — Examen Théorique', 'D', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_40.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-41', 'Sujet Officiel N°41 — Examen Théorique', 'B', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_41.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-42', 'Sujet Officiel N°42 — Examen Théorique', 'B', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_42.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-43', 'Sujet Officiel N°43 — Examen Théorique', 'A', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_43.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-44', 'Sujet Officiel N°44 — Examen Théorique', 'C', 20, 20, 16, 'Difficile', '/SUJETS%20FRANCAIS/sujet_44.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-45', 'Sujet Officiel N°45 — Examen Théorique', 'D', 20, 20, 16, 'Facile', '/SUJETS%20FRANCAIS/sujet_45.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) 
VALUES ('sujet-46', 'Sujet Officiel N°46 — Examen Théorique', 'B', 20, 20, 16, 'Moyen', '/SUJETS%20FRANCAIS/sujet_46.mp4', true, true, true)
ON CONFLICT (id) DO NOTHING;
