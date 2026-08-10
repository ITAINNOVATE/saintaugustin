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

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function testColumn() {
  const { data, error } = await supabase.from('profiles').select('module_accesses').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success! Column exists.');
  }
}

testColumn();
