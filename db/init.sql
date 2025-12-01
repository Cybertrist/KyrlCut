-- ============================================================
-- KYRLCUT - SCHÉMA DE BASE DE DONNÉES COMPLET
-- Système de réservation de salon de coiffure
-- Version: 1.0.0
-- Date: 2025-11-15
-- ============================================================

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS s43_HairCut
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE s43_HairCut;

-- ============================================================
-- TABLE: users
-- Description: Gère les comptes utilisateurs (clients + admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email unique pour la connexion',
  password_hash VARCHAR(255) NOT NULL COMMENT 'Mot de passe hashé avec bcrypt',
  phone VARCHAR(30) COMMENT 'Numéro de téléphone du client',
  role ENUM('user','admin') DEFAULT 'user' COMMENT 'Rôle: user (client) ou admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création du compte',
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Utilisateurs du système';

-- ============================================================
-- TABLE: invite_codes
-- Description: Codes d'invitation pour l'inscription
-- ============================================================
CREATE TABLE IF NOT EXISTS invite_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Code d\'invitation unique',
  max_uses INT NOT NULL DEFAULT 1 COMMENT 'Nombre maximum d\'utilisations',
  used_count INT NOT NULL DEFAULT 0 COMMENT 'Nombre d\'utilisations actuelles',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création du code',
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Codes d\'invitation';

-- Code d'invitation de test par défaut
INSERT IGNORE INTO invite_codes (code, max_uses, used_count)
VALUES ('KYRIAN-TEST', 10, 0);

-- ============================================================
-- TABLE: prestations
-- Description: Services proposés par le salon
-- ============================================================
CREATE TABLE IF NOT EXISTS prestations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL COMMENT 'Nom de la prestation',
  description TEXT COMMENT 'Description détaillée',
  duree_minutes INT NOT NULL DEFAULT 60 COMMENT 'Durée en minutes',
  prix DECIMAL(10,2) NOT NULL DEFAULT 20.00 COMMENT 'Prix en euros',
  actif BOOLEAN DEFAULT TRUE COMMENT 'Prestation active/inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
  INDEX idx_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Prestations du salon';

-- Prestations par défaut (toutes 60 minutes, 20€)
INSERT IGNORE INTO prestations (id, nom, description, duree_minutes, prix) VALUES
(1, 'Coupe Classique', 'Coupe simple aux ciseaux et tondeuse, idéale pour un style sobre et professionnel', 60, 20.00),
(2, 'Coupe Dégradé', 'Dégradé progressif (fade) avec finitions précises, tendance et moderne', 60, 20.00),
(3, 'Coupe + Barbe', 'Coupe complète avec taille et contours de barbe pour un look soigné', 60, 20.00),
(4, 'Coupe Créative', 'Coupe personnalisée avec motifs, traits ou styles originaux', 60, 20.00),
(5, 'Rafraîchissement', 'Retouche rapide pour entretenir votre coupe actuelle', 60, 20.00);

-- ============================================================
-- TABLE: creneaux_disponibles
-- Description: Templates de créneaux horaires par jour de la semaine
-- Utilisés pour la génération automatique des créneaux futurs
-- ============================================================
CREATE TABLE IF NOT EXISTS creneaux_disponibles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jour_semaine ENUM('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche') NOT NULL COMMENT 'Jour de la semaine',
  heure_debut TIME NOT NULL COMMENT 'Heure de début du créneau',
  heure_fin TIME NOT NULL COMMENT 'Heure de fin du créneau',
  actif BOOLEAN DEFAULT TRUE COMMENT 'Créneau actif/inactif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
  UNIQUE KEY unique_creneau (jour_semaine, heure_debut),
  INDEX idx_jour_actif (jour_semaine, actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Templates de créneaux hebdomadaires';

-- Créneaux par défaut (Lundi au Samedi)
INSERT IGNORE INTO creneaux_disponibles (jour_semaine, heure_debut, heure_fin) VALUES
-- Lundi
('Lundi', '10:00', '11:00'),
('Lundi', '11:00', '12:00'),
('Lundi', '14:00', '15:00'),
('Lundi', '15:00', '16:00'),
('Lundi', '16:00', '17:00'),
-- Mardi
('Mardi', '10:00', '11:00'),
('Mardi', '11:00', '12:00'),
('Mardi', '14:00', '15:00'),
('Mardi', '15:00', '16:00'),
('Mardi', '16:00', '17:00'),
-- Mercredi
('Mercredi', '10:00', '11:00'),
('Mercredi', '11:00', '12:00'),
('Mercredi', '14:00', '15:00'),
('Mercredi', '15:00', '16:00'),
('Mercredi', '16:00', '17:00'),
-- Jeudi
('Jeudi', '10:00', '11:00'),
('Jeudi', '11:00', '12:00'),
('Jeudi', '14:00', '15:00'),
('Jeudi', '15:00', '16:00'),
('Jeudi', '16:00', '17:00'),
-- Vendredi
('Vendredi', '10:00', '11:00'),
('Vendredi', '11:00', '12:00'),
('Vendredi', '14:00', '15:00'),
('Vendredi', '15:00', '16:00'),
('Vendredi', '16:00', '17:00'),
-- Samedi
('Samedi', '10:00', '11:00'),
('Samedi', '11:00', '12:00'),
('Samedi', '14:00', '15:00');

-- ============================================================
-- TABLE: creneaux_dates
-- Description: Créneaux horaires avec dates spécifiques
-- Générés automatiquement par le cron job basé sur creneaux_disponibles
-- Permet de gérer les créneaux par date exacte avec lieu personnalisable
-- ============================================================
CREATE TABLE IF NOT EXISTS creneaux_dates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_specifique DATE NOT NULL COMMENT 'Date exacte du créneau',
  heure_debut TIME NOT NULL COMMENT 'Heure de début',
  heure_fin TIME NOT NULL COMMENT 'Heure de fin',
  lieu VARCHAR(255) COMMENT 'Adresse/lieu du rendez-vous (optionnel)',
  actif BOOLEAN DEFAULT TRUE COMMENT 'Créneau actif/inactif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
  UNIQUE KEY unique_creneau_date (date_specifique, heure_debut, heure_fin),
  INDEX idx_date_actif (date_specifique, actif),
  INDEX idx_date (date_specifique)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Créneaux avec dates spécifiques';

-- ============================================================
-- TABLE: reservations
-- Description: Réservations des clients
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT 'ID de l\'utilisateur',
  prestation_id INT NOT NULL COMMENT 'ID de la prestation',
  date_reservation DATE NOT NULL COMMENT 'Date du rendez-vous',
  heure_debut TIME NOT NULL COMMENT 'Heure de début',
  heure_fin TIME NOT NULL COMMENT 'Heure de fin',
  statut ENUM('confirmee','annulee','terminee') DEFAULT 'confirmee' COMMENT 'Statut de la réservation',
  notes TEXT COMMENT 'Notes/remarques',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Dernière modification',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (prestation_id) REFERENCES prestations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_reservation (date_reservation, heure_debut),
  INDEX idx_user_date (user_id, date_reservation),
  INDEX idx_date_statut (date_reservation, statut),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Réservations des clients';

-- ============================================================
-- NOTE: Table jours_fermes supprimée (non utilisée)
-- Pour bloquer des dates, désactivez simplement les créneaux dans creneaux_dates
-- ============================================================

-- ============================================================
-- INSTRUCTIONS POST-INSTALLATION
-- ============================================================

-- 1. Créer le compte administrateur :
--    npm run create-admin
--    OU
--    node scripts/create-admin.js
--
--    Identifiants par défaut :
--    Email: admin@kyrian.com
--    Mot de passe: admin123
--    ⚠️ CHANGEZ CE MOT DE PASSE APRÈS LA PREMIÈRE CONNEXION !

-- 2. Génération automatique des créneaux :
--    - Automatique : Tous les lundis à 00h00 (cron job)
--    - Manuel : node scripts/auto-generate-slots.js

-- 3. Vérifier l'état des tables :
--    SHOW TABLES;
--    SELECT COUNT(*) FROM users;
--    SELECT COUNT(*) FROM prestations;
--    SELECT COUNT(*) FROM creneaux_disponibles;

-- ============================================================
-- FIN DU SCHÉMA
-- ============================================================
