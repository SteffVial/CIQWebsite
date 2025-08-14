import pkg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pkg;

// Charger les variables d'environnement
dotenv.config();

// Configuration simple et directe
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ciq_website',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

console.log('🔧 Configuration base de données:');
console.log({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password ? '[PRÉSENT]' : '[MANQUANT]',
  ssl: dbConfig.ssl
});

// Créer le pool de connexions
const pool = new Pool(dbConfig);

// Gestionnaires d'événements
pool.on('connect', () => {
  console.log('✅ Nouvelle connexion PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL inattendue:', err);
});

// Fonction utilitaire pour exécuter des requêtes
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Query: ${text.substring(0, 50)}... (${duration}ms)`);
    }
    
    return res;
  } catch (error) {
    console.error('❌ Erreur de requête SQL:', error);
    throw error;
  }
};

// Fonction pour tester la connexion
export const testConnection = async () => {
  try {
    console.log('🔄 Test de connexion à la base de données...');
    const result = await query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('✅ Connexion réussie !');
    console.log('⏰ Heure:', result.rows[0].current_time);
    console.log('🗄️  Base:', result.rows[0].db_name);
    return true;
  } catch (error) {
    console.error('❌ Test de connexion échoué:', error.message);
    return false;
  }
};

// Fonction pour fermer le pool
export const closePool = async () => {
  try {
    await pool.end();
    console.log('🔌 Pool de connexions fermé');
  } catch (error) {
    console.error('❌ Erreur fermeture pool:', error);
  }
};

export default pool;