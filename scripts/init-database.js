/**
 * Script d'initialisation de la base de données
 * Exécute le contenu de db/init.sql sur la base de données distante
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  let connection;
  
  try {
    console.log('📡 Connexion au serveur MySQL...');
    
    // Connexion au serveur MySQL (sans spécifier la base de données)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    console.log('✓ Connecté au serveur MySQL');
    
    // Créer la base de données si elle n'existe pas
    console.log('📦 Création de la base de données...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log('✓ Base de données prête');

    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'db', 'init.sql');
    let sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Retirer les commandes CREATE DATABASE et USE qui ne fonctionnent pas avec Hostinger
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS[^;]+;/g, '');
    sql = sql.replace(/USE [^;]+;/g, '');
    
    console.log('📄 Lecture du fichier init.sql...');
    console.log('🔄 Exécution des requêtes SQL...');

    // Exécuter le SQL
    await connection.query(sql);

    console.log('✓ Base de données initialisée avec succès !');
    console.log('');
    console.log('📊 Tables créées :');
    console.log('  - users');
    console.log('  - invite_codes');
    console.log('  - prestations (5 types de coupes)');
    console.log('  - creneaux_disponibles');
    console.log('  - reservations');
    console.log('  - jours_fermes');
    console.log('');
    console.log('🎉 Prochaine étape : node create-admin.js');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
