const fs = require('fs');

let sql = '-- 1. CREATION DE LA TABLE composition_subjects\n';
sql += 'CREATE TABLE IF NOT EXISTS public.composition_subjects (\n';
sql += '  id TEXT PRIMARY KEY,\n';
sql += '  title TEXT NOT NULL,\n';
sql += '  permit_category TEXT,\n';
sql += '  duration_minutes INTEGER,\n';
sql += '  total_questions INTEGER,\n';
sql += '  pass_score INTEGER,\n';
sql += '  difficulty TEXT,\n';
sql += '  audio_url TEXT,\n';
sql += '  can_go_back BOOLEAN DEFAULT true,\n';
sql += '  show_explanations BOOLEAN DEFAULT true,\n';
sql += '  is_published BOOLEAN DEFAULT true,\n';
sql += '  created_at TIMESTAMPTZ DEFAULT NOW()\n';
sql += ');\n';
sql += 'ALTER TABLE public.composition_subjects DISABLE ROW LEVEL SECURITY;\n\n';

sql += '-- 2. CREATION DE LA TABLE composition_sessions\n';
sql += 'CREATE TABLE IF NOT EXISTS public.composition_sessions (\n';
sql += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n';
sql += '  student_id TEXT,\n';
sql += '  subject_id TEXT REFERENCES public.composition_subjects(id) ON DELETE CASCADE,\n';
sql += '  score INTEGER,\n';
sql += '  total_questions INTEGER,\n';
sql += '  correct_answers INTEGER,\n';
sql += '  is_passed BOOLEAN,\n';
sql += '  duration_seconds INTEGER,\n';
sql += '  started_at TIMESTAMPTZ DEFAULT NOW(),\n';
sql += '  completed_at TIMESTAMPTZ,\n';
sql += '  answers_data JSONB\n';
sql += ');\n';
sql += 'ALTER TABLE public.composition_sessions DISABLE ROW LEVEL SECURITY;\n\n';

sql += '-- 3. INSERTION DES 46 SUJETS OFFICIELS\n';
const categories = ['B', 'B', 'A', 'C', 'D'];
const difficulties = ['Moyen', 'Difficile', 'Facile'];
for (let i = 0; i < 46; i++) {
  const numStr = (i + 1).toString().padStart(2, '0');
  const cat = categories[i % categories.length];
  const diff = difficulties[i % difficulties.length];
  sql += `INSERT INTO public.composition_subjects (id, title, permit_category, duration_minutes, total_questions, pass_score, difficulty, audio_url, can_go_back, show_explanations, is_published) \n`;
  sql += `VALUES ('sujet-${numStr}', 'Sujet Officiel N°${numStr} — Examen Théorique', '${cat}', 20, 20, 16, '${diff}', '/SUJETS%20FRANCAIS/sujet_${numStr}.mp4', true, true, true)\n`;
  sql += `ON CONFLICT (id) DO NOTHING;\n`;
}

fs.writeFileSync('sujets.sql', sql);
console.log('sujets.sql generated successfully.');
