const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanDatabase() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    
    try {
        console.log('🗑️  Nettoyage de la base de données...\n');
        
        // Supprimer toutes les réservations
        await db.query('DELETE FROM reservations');
        console.log('✅ Réservations supprimées');
        
        // Supprimer tous les créneaux
        await db.query('DELETE FROM creneaux_dates');
        console.log('✅ Créneaux supprimés');
        
        // Garder uniquement le code admin
        await db.query('DELETE FROM invite_codes WHERE code != "KYRL-ADMIN"');
        console.log('✅ Codes d\'invitation nettoyés');
        
        // Supprimer tous les utilisateurs sauf admin
        await db.query('DELETE FROM users WHERE role != "admin"');
        console.log('✅ Utilisateurs clients supprimés');
        
        console.log('\n✅ Base de données nettoyée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage :', error);
    } finally {
        await db.end();
    }
}

cleanDatabase();
