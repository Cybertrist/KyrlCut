const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function autoGenerateSlots() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        console.log('🔄 Vérification des créneaux pour les semaines futures...');
        
        // Calculer les dates importantes
        const today = new Date();
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - today.getDay() + 1); // Lundi de cette semaine
        currentMonday.setHours(0, 0, 0, 0);
        
        // Semaine actuelle : lundi de cette semaine au dimanche
        const weekStart = new Date(currentMonday);
        const weekEnd = new Date(currentMonday);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Semaine suivante : 7 jours après
        const nextWeekStart = new Date(currentMonday);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
        
        console.log(`📅 Semaine actuelle : ${formatDate(weekStart)} au ${formatDate(weekEnd)}`);
        console.log(`📅 Semaine suivante : ${formatDate(nextWeekStart)} au ${formatDate(nextWeekEnd)}`);
        
        // Vérifier si la semaine suivante a déjà des créneaux
        const [nextWeekSlots] = await connection.query(
            'SELECT COUNT(*) as count FROM creneaux_dates WHERE date_specifique BETWEEN ? AND ?',
            [formatDate(nextWeekStart), formatDate(nextWeekEnd)]
        );
        
        if (nextWeekSlots[0].count > 0) {
            console.log(`✅ La semaine suivante a déjà ${nextWeekSlots[0].count} créneaux`);
        } else {
            console.log('⚠️  La semaine suivante n\'a pas de créneaux, création d\'une semaine vierge...');
            console.log(`📝 Nouvelle semaine vierge créée : ${formatDate(nextWeekStart)} au ${formatDate(nextWeekEnd)}`);
            console.log('ℹ️  L\'admin peut maintenant ajouter des créneaux pour cette semaine');
        }
        
        console.log('✅ Maintenance terminée (historique conservé)');
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération automatique :', error);
    } finally {
        await connection.end();
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Si exécuté directement
if (require.main === module) {
    autoGenerateSlots().then(() => process.exit(0));
}

module.exports = { autoGenerateSlots };
