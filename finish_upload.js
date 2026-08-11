const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://zhctrwqvdmcvkuldqmso.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoY3Ryd3F2ZG1jdmt1bGRxbXNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAyNDE3NywiZXhwIjoyMTAxNjAwMTc3fQ.rWsLapbii7DjvrLAqVog4AQ-aSm0-7Ej8z6o9fX_zOA';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = 'sujets-videos';
const VIDEO_DIR = path.join(__dirname, 'public', 'SUJETS FRANCAIS');

const REMAINING = [36, 40, 45];

async function finishUpload() {
  console.log('Upload des 3 derniers sujets...');
  for (const num of REMAINING) {
    const padded = String(num).padStart(2, '0');
    const file = `sujet_${padded}.mp4`;
    const filePath = path.join(VIDEO_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.log('⚠️ Fichier introuvable:', file);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    console.log(`Uploading ${file} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)... `);

    const { error } = await supabase.storage.from(BUCKET).upload(file, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });

    if (error) {
      console.log('❌ Erreur upload:', error.message);
      continue;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file);
    const publicUrl = urlData.publicUrl;

    const oldPath = `/SUJETS%20FRANCAIS/sujet_${padded}.mp4`;
    const { error: dbErr } = await supabase.from('composition_subjects').update({ audio_url: publicUrl }).eq('audio_url', oldPath);

    if (dbErr) {
      console.log('⚠️ Erreur BD update:', dbErr.message);
    } else {
      console.log('✅ Succès:', publicUrl);
    }
  }

  console.log('\n--- VERIFICATION FINALE ---');
  const { data } = await supabase.from('composition_subjects').select('id, title, audio_url');
  const uploaded = data.filter(s => s.audio_url && s.audio_url.includes('supabase.co/storage'));
  console.log(`${uploaded.length}/${data.length} vidéos hébergées sur Supabase Storage.`);
}

finishUpload();
