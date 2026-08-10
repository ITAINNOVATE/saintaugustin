import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^['"`]|['"`]$/g, '');
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

(async () => {
  const OFFICIAL_SUBJECTS = Array.from({ length: 46 }, (_, i) => {
    const numStr = (i + 1).toString().padStart(2, '0');
    const categories = ['B', 'B', 'A', 'C', 'D'];
    const difficulties = ['Moyen', 'Difficile', 'Facile'];
    return {
      title: 'Sujet Officiel N°' + numStr + ' — Examen Théorique',
      permit_category: categories[i % categories.length],
      duration_minutes: 20,
      total_questions: 20,
      pass_score: 16,
      difficulty: difficulties[i % difficulties.length],
      audio_url: '/SUJETS%20FRANCAIS/sujet_' + numStr + '.mp4',
      can_go_back: true,
      show_explanations: true,
      is_published: true
    };
  });

  console.log('Inserting subjects...');
  const { data, error } = await supabase.from('composition_subjects').insert(OFFICIAL_SUBJECTS).select();
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Inserted successfully:', data?.length);
  }
})();
