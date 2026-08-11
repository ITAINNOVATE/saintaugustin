const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://zhctrwqvdmcvkuldqmso.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoY3Ryd3F2ZG1jdmt1bGRxbXNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAyNDE3NywiZXhwIjoyMTAxNjAwMTc3fQ.rWsLapbii7DjvrLAqVog4AQ-aSm0-7Ej8z6o9fX_zOA';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = 'sujets-videos';
const VIDEO_DIR = path.join(__dirname, 'public', 'SUJETS FRANCAIS');

// Only the failed ones
const FAILED = [23, 24, 36, 37, 38, 39, 40, 42, 44, 45, 46];

async function run() {
  console.log(`Reprise de ${FAILED.length} fichiers en échec...\n`);

  for (const num of FAILED) {
    const padded = String(num).padStart(2, '0');
    const file = `sujet_${padded}.mp4`;
    const filePath = path.join(VIDEO_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Fichier introuvable: ${file}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    process.stdout.write(`Uploading ${file} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)... `);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(file, fileBuffer, { contentType: 'video/mp4', upsert: true });

    if (error) {
      console.log(`❌ ${error.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file);
    const publicUrl = urlData.publicUrl;

    const oldPath = `/SUJETS%20FRANCAIS/sujet_${padded}.mp4`;
    await supabase.from('composition_subjects').update({ audio_url: publicUrl }).eq('audio_url', oldPath);

    console.log(`✅ ${publicUrl}`);
  }

  console.log('\n✅ Terminé !');
}

run();
