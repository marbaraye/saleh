/**
 * Configuration de la connexion PostgreSQL
 * Compatible avec AlwaysData
 */
const { Pool } = require('pg');
require('dotenv').config();

// Configuration du pool de connexions
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Nombre maximum de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test de connexion au démarrage
pool.on('connect', () => {
  console.log('✅ Connexion à PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err);
});

/**
 * Exécute une requête SQL
 * @param {string} text - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise} Résultat de la requête
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query:', { text: text.substring(0, 50), duration: `${duration}ms`, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('❌ Erreur SQL:', error.message);
    throw error;
  }
};

/**
 * Obtient un client du pool pour les transactions
 * @returns {Promise} Client PostgreSQL
 */
const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  // Timeout pour éviter les clients bloqués
  const timeout = setTimeout(() => {
    console.error('⚠️ Client PostgreSQL non libéré après 5 secondes');
  }, 5000);

  client.query = (...args) => {
    return originalQuery(...args);
  };

  client.release = () => {
    clearTimeout(timeout);
    return originalRelease();
  };

  return client;
};

module.exports = {
  query,
  getClient,
  pool
};
