/**
 * Script d'initialisation de la base de données
 * Exécute le schéma SQL et crée les tables
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');
require('dotenv').config();

async function initDatabase() {
  console.log('🚀 Initialisation de la base de données...');
  
  try {
    // Lire le fichier de schéma
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Exécuter le schéma
    await pool.query(schema);
    
    console.log('✅ Schéma de base de données créé avec succès');
    
    // Vérifier les tables créées
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables créées:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('\n✅ Initialisation terminée');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Échec de l\'initialisation:', err);
      process.exit(1);
    });
}

module.exports = { initDatabase };
