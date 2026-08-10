
import { createClient } from '@supabase/supabase-js';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;
const projectDir = process.cwd();
loadEnvConfig(projectDir);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  console.log('Fixing profiles...');
  let { data: users, error } = await supabase.from('profiles').select('*');
  console.log('Users found:', users?.length);
  const { data: d2, error: e2 } = await supabase.from('profiles').update({ role: 'admin' }).eq('role', 'apprenant');
  console.log('Update all result:', d2, e2);
})();

