import pkg from 'pg';
import dotenv from 'dotenv';
const { Client } = pkg;

dotenv.config();

// Test avec Client au lieu de Pool
async function testConnectionSimple() {
  console.log('🔍 Test de connexion PostgreSQL...');
  
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
  };
  
  console.log('Configuration utilisée:');
  console.log({
    ...config,
    password: config.password ? '[MASQUÉ]' : 'MANQUANT'
  });
  
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connexion réussie !');
    
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('⏰ Heure serveur:', result.rows[0].current_time);
    console.log('📊 Version PostgreSQL:', result.rows[0].pg_version);
    
    await client.end();
    return true;
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('Code d\'erreur:', error.code);
    
    if (error.code === '28P01') {
      console.log('🔑 Problème d\'authentification - vérifiez le mot de passe');
    } else if (error.code === '3D000') {
      console.log('🗄️  Base de données inexistante - créez "ciq_website"');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🚫 PostgreSQL n\'est pas démarré ou port incorrect');
    }
    
    return false;
  }
}

testConnectionSimple().then(() => process.exit(0));

