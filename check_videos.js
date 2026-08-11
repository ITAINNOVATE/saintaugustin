const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zhctrwqvdmcvkuldqmso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoY3Ryd3F2ZG1jdmt1bGRxbXNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAyNDE3NywiZXhwIjoyMTAxNjAwMTc3fQ.rWsLapbii7DjvrLAqVog4AQ-aSm0-7Ej8z6o9fX_zOA'
);

async function check() {
  const { data, error } = await supabase
    .from('composition_subjects')
    .select('id, title, audio_url')
    .limit(3);
  
  if (error) console.error('Erreur:', error.message);
  else {
    console.log('URLs des sujets :');
    data.forEach(s => console.log(`- ${s.title}: ${s.audio_url}`));
  }
}

check();
