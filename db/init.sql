-- Si jamais la base n'existait pas (normalement elle existe déjà)
CREATE DATABASE IF NOT EXISTS s43_HairCut
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE s43_HairCut;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role ENUM('user','admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des codes d'invitation
CREATE TABLE IF NOT EXISTS invite_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  max_uses INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Code d'invitation de test
INSERT IGNORE INTO invite_codes (code, max_uses, used_count)
VALUES ('KYRIAN-TEST', 10, 0);

-- NOTE: Pour créer le compte admin, exécutez après init: node create-admin.js

-- Table des prestations
CREATE TABLE IF NOT EXISTS prestations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  duree_minutes INT NOT NULL DEFAULT 60,
  prix DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des prestations pour coupe homme jeune
INSERT IGNORE INTO prestations (id, nom, description, duree_minutes, prix) VALUES
(1, 'Coupe Classique', 'Coupe simple aux ciseaux et tondeuse, idéale pour un style sobre et professionnel', 45, 20.00),
(2, 'Coupe Dégradé', 'Dégradé progressif (fade) avec finitions précises, tendance et moderne', 60, 20.00),
(3, 'Coupe + Barbe', 'Coupe complète avec taille et contours de barbe pour un look soigné', 75, 20.00),
(4, 'Coupe Créative', 'Coupe personnalisée avec motifs, traits ou styles originaux', 90, 20.00),
(5, 'Rafraîchissement', 'Retouche rapide pour entretenir votre coupe actuelle', 30, 20.00);

-- Table des créneaux horaires disponibles (templates)
CREATE TABLE IF NOT EXISTS creneaux_disponibles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jour_semaine ENUM('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche') NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_creneau (jour_semaine, heure_debut)
);

-- Créneaux par défaut (Lundi au Vendredi de 10h à 18h)
INSERT IGNORE INTO creneaux_disponibles (jour_semaine, heure_debut, heure_fin) VALUES
('Lundi', '10:00', '11:00'),
('Lundi', '11:00', '12:00'),
('Lundi', '14:00', '15:00'),
('Lundi', '15:00', '16:00'),
('Lundi', '16:00', '17:00'),
('Mardi', '10:00', '11:00'),
('Mardi', '11:00', '12:00'),
('Mardi', '14:00', '15:00'),
('Mardi', '15:00', '16:00'),
('Mardi', '16:00', '17:00'),
('Mercredi', '10:00', '11:00'),
('Mercredi', '11:00', '12:00'),
('Mercredi', '14:00', '15:00'),
('Mercredi', '15:00', '16:00'),
('Mercredi', '16:00', '17:00'),
('Jeudi', '10:00', '11:00'),
('Jeudi', '11:00', '12:00'),
('Jeudi', '14:00', '15:00'),
('Jeudi', '15:00', '16:00'),
('Jeudi', '16:00', '17:00'),
('Vendredi', '10:00', '11:00'),
('Vendredi', '11:00', '12:00'),
('Vendredi', '14:00', '15:00'),
('Vendredi', '15:00', '16:00'),
('Vendredi', '16:00', '17:00'),
('Samedi', '10:00', '11:00'),
('Samedi', '11:00', '12:00'),
('Samedi', '14:00', '15:00');

-- Table des réservations
CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  prestation_id INT NOT NULL,
  date_reservation DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  statut ENUM('confirmee','annulee','terminee') DEFAULT 'confirmee',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (prestation_id) REFERENCES prestations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_reservation (date_reservation, heure_debut)
);

-- Table des jours de fermeture exceptionnels
CREATE TABLE IF NOT EXISTS jours_fermes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_fermeture DATE NOT NULL UNIQUE,
  raison VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
