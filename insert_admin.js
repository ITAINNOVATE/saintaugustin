const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zhctrwqvdmcvkuldqmso.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoY3Ryd3F2ZG1jdmt1bGRxbXNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAyNDE3NywiZXhwIjoyMTAxNjAwMTc3fQ.rWsLapbii7DjvrLAqVog4AQ-aSm0-7Ej8z6o9fX_zOA';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('1. Recherche de admin@saintaugustin.com dans auth.users...');
  
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Erreur auth.admin.listUsers:', usersError.message);
    return;
  }
  
  const adminUser = usersData.users.find(u => u.email === 'admin@saintaugustin.com');
  
  if (!adminUser) {
    console.log('⚠️  admin@saintaugustin.com non trouvé dans auth.users');
    console.log('Utilisateurs existants:', usersData.users.map(u => u.email));
    return;
  }
  
  console.log('✅ Utilisateur trouvé ! ID:', adminUser.id);
  
  // Vérifier si profil existe déjà
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role, first_name')
    .eq('id', adminUser.id)
    .single();
    
  if (existing) {
    console.log('ℹ️  Profil existant:', existing);
    if (existing.role !== 'admin') {
      console.log('⚠️  Le rôle est "' + existing.role + '" et non "admin". Mise à jour...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin', is_active: true })
        .eq('id', adminUser.id);
      if (updateError) console.error('Erreur update:', updateError.message);
      else console.log('✅ Rôle mis à jour à "admin"');
    } else {
      console.log('✅ Le profil admin est correct, rien à faire.');
    }
    return;
  }
  
  console.log('2. Insertion du profil admin dans la table profiles...');
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: adminUser.id,
      role: 'admin',
      first_name: 'Administrateur',
      last_name: 'Saint Augustin',
      is_active: true,
      email: 'admin@saintaugustin.com'
    })
    .select();
    
  if (error) {
    console.error('❌ Erreur insertion profil:', error.message, error.details);
  } else {
    console.log('✅ Profil administrateur créé avec succès !', data);
  }
}

run();
