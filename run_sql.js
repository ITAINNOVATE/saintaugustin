const { Client } = require('pg');

async function runSQL() {
  const regions = [
    'eu-west-3', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-central-2', 'eu-north-1', 'eu-south-1',
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1',
    'sa-east-1', 'ca-central-1'
  ];
  
  for (const region of regions) {
    const connectionString = `postgresql://postgres.zhctrwqvdmcvkuldqmso:Saintaugustin2026@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    console.log('Essai avec', region);
    const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
    
    try {
      await client.connect();
      console.log('Connecté à la base de données !');
  
      const query = `
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS module_accesses JSONB DEFAULT '[]'::jsonb;
      `;
      
      await client.query(query);
      console.log('Requête SQL exécutée avec succès.');
      await client.end();
      return;
    } catch (err) {
      console.error('Erreur SQL:', err.message);
    }
  }
}

runSQL();
