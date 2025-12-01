/**
 * Script pour créer un compte administrateur
 * Usage: node create-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function createAdmin() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✓ Connecté à la base de données');

    // Hash du mot de passe admin
    const passwordHash = await bcrypt.hash('123456', 10);
    
    // Créer ou mettre à jour l'admin
    await connection.query(`
      INSERT INTO users (email, password_hash, role) 
      VALUES ('tristanjoncour29@gmail.com', ?, 'admin')
      ON DUPLICATE KEY UPDATE password_hash = ?, role = 'admin'
    `, [passwordHash, passwordHash]);

    console.log('✓ Compte administrateur créé/mis à jour');
    console.log('');
    console.log('📧 Email: tristanjoncour29@gmail.com');
    console.log('🔑 Mot de passe: 123456');
    console.log('');
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAdmin();
