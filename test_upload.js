import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^['"`]|['"`]$/g, '');
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function testUpload() {
  const filePath = path.join('public', 'SUJETS FRANCAIS', 'sujet_01.mp4');
  if (!fs.existsSync(filePath)) {
    console.error('File not found');
    return;
  }
  
  console.log('Reading file...');
  const fileBuffer = fs.readFileSync(filePath);
  
  console.log('Uploading to Supabase...');
  const { data, error } = await supabase.storage.from('compositions').upload('sujet_01.mp4', fileBuffer, {
    contentType: 'video/mp4',
    upsert: true
  });
  
  if (error) {
    console.error('Upload error:', error);
  } else {
    console.log('Upload success:', data);
    const { data: publicUrlData } = supabase.storage.from('compositions').getPublicUrl('sujet_01.mp4');
    console.log('Public URL:', publicUrlData.publicUrl);
  }
}

testUpload();
