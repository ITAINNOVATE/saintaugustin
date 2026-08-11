const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://zhctrwqvdmcvkuldqmso.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoY3Ryd3F2ZG1jdmt1bGRxbXNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAyNDE3NywiZXhwIjoyMTAxNjAwMTc3fQ.rWsLapbii7DjvrLAqVog4AQ-aSm0-7Ej8z6o9fX_zOA';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = 'sujets-videos';
const VIDEO_DIR = path.join(__dirname, 'public', 'SUJETS FRANCAIS');

async function run() {
  // 1. Créer le bucket s'il n'existe pas
  console.log('Vérification du bucket...');
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET);
  
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) { console.error('Erreur création bucket:', error.message); return; }
    console.log('✅ Bucket créé:', BUCKET);
  } else {
    console.log('✅ Bucket existant:', BUCKET);
  }

  // 2. Lister les fichiers MP4 uniquement
  const files = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.mp4'));
  console.log(`\n${files.length} fichiers MP4 à uploader...\n`);

  for (const file of files) {
    const filePath = path.join(VIDEO_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = file; // ex: sujet_01.mp4

    process.stdout.write(`Uploading ${file} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)... `);

    // Upload (upsert pour remplacer si existe)
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (error) {
      console.log(`❌ ${error.message}`);
      continue;
    }

    // Obtenir URL publique
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // Extraire le numéro du sujet (ex: sujet_01.mp4 → "01")
    const match = file.match(/sujet_(\d+)\.mp4/);
    if (!match) { console.log('⚠️ Nom de fichier non reconnu'); continue; }
    const num = match[1];
    const padded = num.padStart(2, '0');

    // Mettre à jour la BD : chercher par l'ancien chemin
    const oldPath = `/SUJETS%20FRANCAIS/sujet_${padded}.mp4`;
    const { error: updateError } = await supabase
      .from('composition_subjects')
      .update({ audio_url: publicUrl })
      .eq('audio_url', oldPath);

    if (updateError) {
      console.log(`⚠️ Upload OK mais erreur BD: ${updateError.message}`);
    } else {
      console.log(`✅ ${publicUrl}`);
    }
  }

  console.log('\n✅ Terminé ! Toutes les vidéos sont sur Supabase Storage.');
}

run();
