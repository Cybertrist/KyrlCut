require('dotenv').config();  // ← charge le .env en premier

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const path = require('path');
const cron = require('node-cron');
const { autoGenerateSlots } = require('./scripts/auto-generate-slots');
const { sendReservationConfirmation, sendReminder, sendCancellationConfirmation } = require('./email-service');

const app = express();

// --- CONFIG BDD via .env ---
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Configuration du pool de connexions
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 30000  // 30 secondes pour établir la connexion
});

// Test de connexion au démarrage
db.getConnection()
  .then(async connection => {
    console.log('✓ Connexion à la base de données établie');
    connection.release();
    
    // Vérification initiale au démarrage
    await autoGenerateSlots();
    
    // Planifier l'exécution automatique tous les lundis à 00h00
    cron.schedule('0 0 * * 1', async () => {
      console.log('⏰ Tâche planifiée : Génération automatique des créneaux (Lundi 00h00)');
      await autoGenerateSlots();
    }, {
      timezone: "Europe/Paris"
    });
    
    console.log('⏰ Tâche planifiée activée : génération automatique tous les lundis à 00h00');
  })
  .catch(err => {
    console.error('✗ Erreur de connexion à la base de données:', err.message);
    console.error('⚠️  Vérifiez votre fichier .env et la connexion réseau');
  });

// --- MIDDLEWARES ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

// Rediriger / vers /login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Middleware de protection
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login?error=login_required');
  }
  next();
}


// --- ROUTES PAGES ---
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/register.html'));
});

app.get('/reservations', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reservations.html'));
});

app.get('/profile', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// --- API AUTH ---

// Inscription
app.post('/api/register', async (req, res) => {
  const { email, password, phone, inviteCode } = req.body;

  if (!email || !password || !inviteCode) {
    return res.redirect('/register?error=missing_fields');
  }

  try {
    // Vérifier le code d'invitation
    const [codes] = await db.query(
      'SELECT * FROM invite_codes WHERE code = ?',
      [inviteCode]
    );

    const invite = codes[0];
    if (!invite) {
      return res.redirect('/register?error=invite_invalid');
    }
    if (invite.used_count >= invite.max_uses) {
      return res.redirect('/register?error=invite_used');
    }

    // Hasher le mot de passe
    const hash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, phone) VALUES (?, ?, ?)',
      [email, hash, phone]
    );

    // Marquer le code comme utilisé une fois de plus
    await db.query(
      'UPDATE invite_codes SET used_count = used_count + 1 WHERE id = ?',
      [invite.id]
    );

    // Connecter l'utilisateur
    req.session.userId = result.insertId;
    res.redirect('/reservations');

  } catch (err) {
    // Si l'email existe déjà
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  Tentative d\'inscription avec un email déjà utilisé:', email);
      return res.redirect('/register?error=email_taken');
    }

    console.error('Erreur /api/register :', err);
    res.redirect('/register?error=server_error');
  }
});


// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    const user = users[0];
    if (!user) {
      return res.redirect('/login?error=invalid_credentials');
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.redirect('/login?error=invalid_credentials');
    }

    req.session.userId = user.id;
    res.redirect('/reservations');

  } catch (err) {
    console.error('Erreur /api/login :', err);
    res.redirect('/login?error=server_error');
  }
});


// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

/**
 * GET /api/user/me
 * Récupère les informations de l'utilisateur connecté
 */
app.get('/api/user/me', requireAuth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, phone, role, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(users[0]);
  } catch (err) {
    console.error('Erreur /api/user/me:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/user/reservations
 * Récupère toutes les réservations de l'utilisateur connecté
 */
app.get('/api/user/reservations', requireAuth, async (req, res) => {
  try {
    const [reservations] = await db.query(`
      SELECT r.*, 
             DATE_FORMAT(r.date_reservation, '%Y-%m-%d') as date_reservation,
             p.nom as prestation_nom, 
             p.prix as prestation_prix,
             c.lieu
      FROM reservations r
      JOIN prestations p ON r.prestation_id = p.id
      LEFT JOIN creneaux_dates c ON c.date_specifique = r.date_reservation 
        AND c.heure_debut = r.heure_debut 
        AND c.heure_fin = r.heure_fin
      WHERE r.user_id = ?
      ORDER BY r.date_reservation DESC, r.heure_debut DESC
    `, [req.session.userId]);
    
    res.json(reservations);
  } catch (err) {
    console.error('Erreur /api/user/reservations:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/user/profile
 * Met à jour le profil de l'utilisateur (téléphone)
 */
app.put('/api/user/profile', requireAuth, async (req, res) => {
  const { phone } = req.body;
  
  try {
    await db.query(
      'UPDATE users SET phone = ? WHERE id = ?',
      [phone, req.session.userId]
    );
    
    res.json({ success: true, message: 'Profil mis à jour' });
  } catch (err) {
    console.error('Erreur /api/user/profile:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/user/password
 * Change le mot de passe de l'utilisateur
 */
app.put('/api/user/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
  }
  
  try {
    // Vérifier le mot de passe actuel
    const [users] = await db.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.session.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const validPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }
    
    // Hasher le nouveau mot de passe
    const newHash = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour
    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newHash, req.session.userId]
    );
    
    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    console.error('Erreur /api/user/password:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/user/reservations/:id
 * Annule une réservation de l'utilisateur
 */
app.delete('/api/user/reservations/:id', requireAuth, async (req, res) => {
  const reservationId = req.params.id;
  const userId = req.session.userId;

  try {
    // Vérifier que la réservation appartient à l'utilisateur et récupérer les détails
    const [reservations] = await db.query(
      `SELECT r.*, u.email, p.nom as prestation_nom, 
              DATE_FORMAT(r.date_reservation, '%d/%m/%Y') as date_formatted
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN prestations p ON r.prestation_id = p.id
       WHERE r.id = ? AND r.user_id = ?`,
      [reservationId, userId]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    const reservation = reservations[0];

    // Annuler la réservation
    await db.query(
      'UPDATE reservations SET statut = "annulee" WHERE id = ?',
      [reservationId]
    );

    // Envoyer l'email d'annulation
    const emailDetails = {
      prestationNom: reservation.prestation_nom,
      date: reservation.date_formatted,
      heureDebut: reservation.heure_debut.substring(0, 5),
      heureFin: reservation.heure_fin.substring(0, 5)
    };

    sendCancellationConfirmation(reservation.email, emailDetails).catch(err => {
      console.error('Erreur envoi email annulation:', err);
    });

    res.json({ success: true, message: 'Réservation annulée' });
  } catch (err) {
    console.error('Erreur /api/user/reservations/:id DELETE:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// --- ROUTES API CRÉNEAUX ---

/**
 * GET /api/prestations
 * Récupère toutes les prestations actives
 */
app.get('/api/prestations', async (req, res) => {
  try {
    const [prestations] = await db.query(
      'SELECT * FROM prestations WHERE actif = TRUE ORDER BY id'
    );
    res.json(prestations);
  } catch (err) {
    console.error('Erreur /api/prestations :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// --- ROUTES API CRÉNEAUX DISPONIBLES ---

/**
 * GET /api/slots/:date
 * Récupère les créneaux disponibles pour une date donnée
 * Query param: prestationId (requis)
 */
app.get('/api/slots/:date', async (req, res) => {
  const { date } = req.params;
  const { prestationId } = req.query;

  if (!prestationId) {
    return res.status(400).json({ error: 'prestationId requis' });
  }

  try {
    // Récupérer la durée de la prestation
    const [prestations] = await db.query(
      'SELECT duree_minutes FROM prestations WHERE id = ?',
      [prestationId]
    );

    if (prestations.length === 0) {
      return res.status(404).json({ error: 'Prestation non trouvée' });
    }

    const dureePrest = prestations[0].duree_minutes;

    // Récupérer les créneaux pour cette date spécifique
    const [creneauxTemplate] = await db.query(
      'SELECT * FROM creneaux_dates WHERE date_specifique = ? AND actif = TRUE ORDER BY heure_debut',
      [date]
    );

    // Récupérer les réservations existantes pour cette date (confirmées ET terminées)
    const [reservations] = await db.query(
      'SELECT heure_debut, heure_fin FROM reservations WHERE date_reservation = ? AND statut IN ("confirmee", "terminee")',
      [date]
    );

    // Marquer les créneaux réservés au lieu de les filtrer
    const creneauxAvecStatut = creneauxTemplate.map(creneau => {
      const estReserve = reservations.some(res => {
        // Vérifier si le créneau chevauche une réservation existante
        return (
          (creneau.heure_debut >= res.heure_debut && creneau.heure_debut < res.heure_fin) ||
          (creneau.heure_fin > res.heure_debut && creneau.heure_fin <= res.heure_fin) ||
          (creneau.heure_debut <= res.heure_debut && creneau.heure_fin >= res.heure_fin)
        );
      });
      
      return {
        ...creneau,
        reserve: estReserve
      };
    });

    res.json(creneauxAvecStatut);

  } catch (err) {
    console.error('Erreur /api/slots/:date :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// --- ROUTES API RÉSERVATIONS (CLIENT) ---

/**
 * POST /api/reservations
 * Crée une nouvelle réservation
 */
app.post('/api/reservations', requireAuth, async (req, res) => {
  const { prestationId, date, heureDebut, heureFin } = req.body;
  const userId = req.session.userId;

  if (!prestationId || !date || !heureDebut || !heureFin) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  try {
    // Annuler les réservations futures existantes de l'utilisateur
    await db.query(
      'UPDATE reservations SET statut = "annulee" WHERE user_id = ? AND statut = "confirmee" AND (date_reservation > CURDATE() OR (date_reservation = CURDATE() AND heure_debut > CURTIME()))',
      [userId]
    );

    // Vérifier que le créneau est encore disponible
    const [existing] = await db.query(
      'SELECT * FROM reservations WHERE date_reservation = ? AND heure_debut = ?',
      [date, heureDebut]
    );

    if (existing.length > 0) {
      // Si la réservation existante est annulée, la supprimer pour libérer le créneau
      if (existing[0].statut === 'annulee') {
        await db.query(
          'DELETE FROM reservations WHERE id = ?',
          [existing[0].id]
        );
      } else {
        return res.status(409).json({ message: 'Ce créneau est déjà réservé' });
      }
    }

    // Créer la réservation
    const [result] = await db.query(
      'INSERT INTO reservations (user_id, prestation_id, date_reservation, heure_debut, heure_fin) VALUES (?, ?, ?, ?, ?)',
      [userId, prestationId, date, heureDebut, heureFin]
    );

    // Récupérer les détails pour l'email
    const [userDetails] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
    const [prestationDetails] = await db.query('SELECT nom, prix FROM prestations WHERE id = ?', [prestationId]);
    const [creneauDetails] = await db.query(
      'SELECT lieu FROM creneaux_dates WHERE date_specifique = ? AND heure_debut = ? AND heure_fin = ?',
      [date, heureDebut, heureFin]
    );

    // Envoyer l'email de confirmation (ne pas bloquer la réponse)
    if (userDetails.length > 0 && prestationDetails.length > 0) {
      const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      sendReservationConfirmation(userDetails[0].email, {
        prestationNom: prestationDetails[0].nom,
        date: dateFormatted,
        heureDebut: heureDebut.substring(0, 5),
        heureFin: heureFin.substring(0, 5),
        lieu: creneauDetails[0]?.lieu || null,
        prix: prestationDetails[0].prix
      }).catch(err => console.error('Erreur envoi email:', err));
    }

    res.json({ success: true, message: 'Réservation confirmée' });

  } catch (err) {
    console.error('Erreur /api/reservations POST :', err);
    
    // Gérer les erreurs de doublon
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ce créneau est déjà réservé' });
    }
    
    res.status(500).json({ message: 'Erreur serveur lors de la réservation' });
  }
});


// --- ROUTES API ADMINISTRATION ---

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  db.query('SELECT role FROM users WHERE id = ?', [req.session.userId])
    .then(([users]) => {
      if (users.length === 0 || users[0].role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé - Admin requis' });
      }
      next();
    })
    .catch(err => {
      console.error('Erreur vérification admin:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    });
}

/**
 * GET /admin
 * Page d'administration (protégée)
 */
app.get('/admin', requireAuth, requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

/**
 * GET /api/admin/reservations
 * Liste toutes les réservations avec filtrage optionnel par date
 */
app.get('/api/admin/reservations', requireAuth, requireAdmin, async (req, res) => {
  const { date } = req.query;

  try {
    let query = `
      SELECT 
        r.id,
        DATE_FORMAT(r.date_reservation, '%Y-%m-%d') as date_reservation,
        r.heure_debut,
        r.heure_fin,
        r.statut,
        r.notes,
        r.created_at,
        p.nom as prestation_nom,
        p.duree_minutes as prestation_duree,
        p.prix as prestation_prix,
        u.email as user_email,
        u.phone as user_phone,
        c.lieu
      FROM reservations r
      JOIN prestations p ON r.prestation_id = p.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN creneaux_dates c ON c.date_specifique = r.date_reservation 
        AND c.heure_debut = r.heure_debut 
        AND c.heure_fin = r.heure_fin
    `;

    const params = [];

    if (date) {
      query += ' WHERE r.date_reservation = ?';
      params.push(date);
    }

    query += ' ORDER BY r.date_reservation DESC, r.heure_debut DESC';

    const [reservations] = await db.query(query, params);
    res.json(reservations);

  } catch (err) {
    console.error('Erreur /api/admin/reservations GET :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/reservations/:id/cancel
 * Annule une réservation
 */
app.put('/api/admin/reservations/:id/cancel', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      'UPDATE reservations SET statut = "annulee" WHERE id = ?',
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur annulation réservation:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/reservations/:id/complete
 * Marque une réservation comme terminée
 */
app.put('/api/admin/reservations/:id/complete', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      'UPDATE reservations SET statut = "terminee" WHERE id = ?',
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur complétion réservation:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/reservations/:id
 * Supprime définitivement une réservation
 */
app.delete('/api/admin/reservations/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM reservations WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur suppression réservation:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/slots
 * Liste les créneaux pour les 2 prochaines semaines (par date spécifique)
 * Query: startDate, endDate (optionnels)
 */
app.get('/api/admin/slots', requireAuth, requireAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    let query = 'SELECT *, DATE_FORMAT(date_specifique, "%Y-%m-%d") as date_specifique FROM creneaux_dates WHERE 1=1';
    const params = [];
    
    if (startDate) {
      query += ' AND date_specifique >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND date_specifique <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY date_specifique, heure_debut';
    
    const [slots] = await db.query(query, params);
    res.json(slots);
  } catch (err) {
    console.error('Erreur /api/admin/slots GET:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/slots
 * Crée un créneau pour une date spécifique
 * Body: { date, heureDebut, heureFin, lieu }
 */
app.post('/api/admin/slots', requireAuth, requireAdmin, async (req, res) => {
  const { date, heureDebut, heureFin, lieu } = req.body;

  if (!date || !heureDebut || !heureFin) {
    return res.status(400).json({ error: 'Date, heure de début et heure de fin requis' });
  }

  // Validation des horaires (8h-20h)
  const startHour = parseInt(heureDebut.split(':')[0]);
  const endHour = parseInt(heureFin.split(':')[0]);
  
  if (startHour < 8 || startHour >= 20 || endHour < 8 || endHour > 20) {
    return res.status(400).json({ error: 'Les créneaux doivent être entre 8h et 20h' });
  }
  
  if (heureDebut >= heureFin) {
    return res.status(400).json({ error: 'L\'heure de fin doit être après l\'heure de début' });
  }

  try {
    await db.query(
      'INSERT INTO creneaux_dates (date_specifique, heure_debut, heure_fin, lieu, actif) VALUES (?, ?, ?, ?, TRUE)',
      [date, heureDebut, heureFin, lieu]
    );
    
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ce créneau existe déjà pour cette date' });
    }
    console.error('Erreur création créneau:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/slots/:id
 * Modifie un créneau (actif/inactif)
 */
app.put('/api/admin/slots/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { actif } = req.body;

  try {
    await db.query(
      'UPDATE creneaux_dates SET actif = ? WHERE id = ?',
      [actif, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur modification créneau:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/slots/:id
 * Supprime un créneau spécifique
 */
app.delete('/api/admin/slots/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM creneaux_dates WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur suppression créneau:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- ROUTES API CODES D'INVITATION ---

/**
 * GET /api/admin/invite-codes
 * Liste tous les codes d'invitation
 */
app.get('/api/admin/invite-codes', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [codes] = await db.query(
      'SELECT * FROM invite_codes ORDER BY created_at DESC'
    );
    res.json(codes);
  } catch (err) {
    console.error('Erreur chargement codes:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/invite-codes
 * Génère un nouveau code d'invitation
 */
app.post('/api/admin/invite-codes', requireAuth, requireAdmin, async (req, res) => {
  const { prefix, maxUses } = req.body;

  try {
    // Générer un code unique
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = prefix ? `${prefix}-${randomPart}` : `CODE-${randomPart}`;

    // Insérer dans la base
    await db.query(
      'INSERT INTO invite_codes (code, max_uses, used_count) VALUES (?, ?, 0)',
      [code, maxUses || 1]
    );

    res.json({ success: true, code });
  } catch (err) {
    console.error('Erreur génération code:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ce code existe déjà' });
    }
    
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/invite-codes/:id
 * Supprime un code d'invitation
 */
app.delete('/api/admin/invite-codes/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM invite_codes WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur suppression code:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- LANCEMENT SERVEUR ---
app.listen(3000, () => {
  console.log('Serveur lancé sur http://localhost:3000');
});
