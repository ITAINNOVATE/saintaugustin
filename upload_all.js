import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env variables
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^['"`]|['"`]$/g, '');
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function uploadAll() {
  const folderPath = path.join('public', 'SUJETS FRANCAIS');
  
  if (!fs.existsSync(folderPath)) {
    console.log("Le dossier", folderPath, "n'existe pas.");
    return;
  }

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.mp4'));
  console.log(`Trouvé ${files.length} fichiers .mp4 à téléverser...`);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    console.log(`\nUpload de ${file}...`);
    
    const fileBuffer = fs.readFileSync(filePath);
    
    // 1. Upload to Supabase Storage
    const { data, error } = await supabase.storage.from('compositions').upload(file, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });
    
    if (error) {
      console.error(`Erreur upload pour ${file}:`, error.message);
      continue;
    }
    
    // 2. Get Public URL
    const { data: publicUrlData } = supabase.storage.from('compositions').getPublicUrl(file);
    const publicUrl = publicUrlData.publicUrl;
    console.log('-> Succès ! URL:', publicUrl);
    
    // 3. Update database (Assuming subject ID matches the file name logic, e.g. sujet_01.mp4 -> sujet-01)
    const subjectIdMatch = file.match(/sujet_(\d+)/);
    if (subjectIdMatch) {
      const subjectId = `sujet-${subjectIdMatch[1]}`;
      const { error: dbError } = await supabase
        .from('composition_subjects')
        .update({ audio_url: publicUrl })
        .eq('id', subjectId);
        
      if (dbError) {
        console.error(`Erreur mise à jour BDD pour ${subjectId}:`, dbError.message);
      } else {
        console.log(`-> Base de données mise à jour pour ${subjectId}`);
      }
    }
  }
  
  console.log("\nTerminé ! Toutes les vidéos sont sur Supabase.");
}

uploadAll();
