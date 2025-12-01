# 💇‍♂️ KyrlCut - Système de Réservation Professionnel

Plateforme complète de réservation de rendez-vous pour salon de coiffure avec espace client, panneau d'administration, et système de notifications automatiques.

[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7+-blue.svg)](https://www.mysql.com/)
[![Express](https://img.shields.io/badge/Express-5.1-lightgrey.svg)](https://expressjs.com/)

---

## ✨ Fonctionnalités

### 👤 Espace Client

#### Réservations
- **5 Prestations** disponibles (toutes à 20€) :
  - 💈 Coupe Classique (60 min)
  - ✂️ Coupe Dégradé (60 min)
  - 🧔 Coupe + Barbe (60 min)
  - 🎨 Coupe Créative (60 min)
  - ⚡ Rafraîchissement (60 min)
- **Calendrier dynamique** : Créneaux générés automatiquement pour les 14 prochains jours
- **Disponibilité en temps réel** : Créneaux réservés marqués visuellement
- **Réservation instantanée** avec confirmation par email
- **Système intelligent** : Une seule réservation active autorisée (annulation auto des anciennes)

#### Profil Utilisateur
- 📧 Gestion des informations personnelles
- 📱 Modification du numéro de téléphone
- 🔐 Changement de mot de passe sécurisé
- 📋 Historique complet des réservations
- ❌ Annulation de rendez-vous avec confirmation par email

### 🔧 Espace Administrateur

#### Gestion des Rendez-vous
- **Vue globale** : Tous les rendez-vous avec statut (confirmé/annulé/terminé)
- **Filtrage avancé** : Par date, statut
- **Actions rapides** :
  - ✅ Marquer comme terminé
  - ❌ Annuler un RDV
  - 🗑️ Supprimer définitivement
- **Informations clients** : Email et téléphone accessibles

#### Gestion des Créneaux
- **Créneaux par date spécifique** : Système flexible avec dates exactes
- **Génération automatique** :
  - 🤖 Cron job tous les lundis à 00h00
  - 📅 Crée 2 semaines de créneaux à l'avance
  - 🔄 Basé sur les templates par jour de la semaine
- **Personnalisation** :
  - 📍 Ajout d'adresse/lieu par créneau
  - ✏️ Activation/désactivation sans suppression
  - ➕ Ajout manuel de créneaux ponctuels

#### Gestion des Codes d'Invitation
- **Génération** : Codes uniques avec préfixe personnalisé
- **Contrôle d'usage** : Limite d'utilisations configurable
- **Suivi** : Compteur d'utilisations en temps réel
- **Suppression** : Révocation de codes

### 📧 Système d'Emails Automatiques

#### Notifications OAuth2 Gmail
- **Email de confirmation** :
  - 🎨 Template HTML professionnel
  - 📋 Récapitulatif complet (prestation, date, heure, lieu, prix)
  - 🔗 Lien vers l'espace personnel
  - ⚠️ Conseils pratiques
- **Email d'annulation** :
  - ✉️ Confirmation d'annulation
  - 🔗 Lien pour reprendre RDV
- **Email de rappel** (prévu) :
  - ⏰ Rappel 24h avant le RDV

#### Configuration Email
- Authentification OAuth2 sécurisée
- Support Gmail avec refresh token
- Envoi asynchrone (non bloquant)

### 🔐 Authentification & Sécurité

- **Inscription contrôlée** : Code d'invitation obligatoire
- **Hachage bcrypt** : 10 rounds de sécurité
- **Sessions persistantes** : express-session avec secret
- **Protection des routes** :
  - Middleware `requireAuth` pour les pages utilisateur
  - Middleware `requireAdmin` pour l'admin
- **Messages d'erreur** clairs et stylisés

---

## 📋 Prérequis

- **Node.js** 14+ (testé sur 18+)
- **MySQL** 5.7+ ou **MariaDB** 10+
- **NPM** ou **Yarn**
- **Compte Gmail** (pour les emails OAuth2)

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Cybertrist/KyrlCut.git
cd KyrlCut
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de l'environnement

Créer un fichier `.env` à la racine du projet :

```env
# Configuration Base de Données
DB_HOST=localhost
DB_PORT=3306
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=s43_HairCut

# Session Secret (générez une clé aléatoire sécurisée)
SESSION_SECRET=votre_secret_session_tres_securise_minimum_32_caracteres

# Configuration Email (OAuth2 Gmail)
EMAIL_USER=votre.email@gmail.com
EMAIL_FROM_NAME=Kyrl Cut
GMAIL_CLIENT_ID=votre_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=votre_client_secret
GMAIL_REFRESH_TOKEN=votre_refresh_token
```

#### 📧 Obtenir les credentials Gmail OAuth2 :

1. **Google Cloud Console** : https://console.cloud.google.com/
   - Créez un nouveau projet
   - Activez l'API Gmail
   - Créez des identifiants OAuth 2.0 (Application Web)
   - Ajoutez `https://developers.google.com/oauthplayground` aux URI de redirection

2. **OAuth Playground** : https://developers.google.com/oauthplayground/
   - Cliquez sur l'icône ⚙️ en haut à droite
   - Cochez "Use your own OAuth credentials"
   - Renseignez votre Client ID et Client Secret
   - Dans la liste de gauche, sélectionnez "Gmail API v1" → `https://mail.google.com/`
   - Cliquez "Authorize APIs"
   - Connectez-vous avec votre compte Gmail
   - Cliquez "Exchange authorization code for tokens"
   - Copiez le **Refresh token** et mettez-le dans votre `.env`

### 4. Initialiser la base de données

#### Option 1 : Script automatique (recommandé)

```bash
npm run init-db
```

#### Option 2 : Manuelle

```bash
# Se connecter à MySQL
mysql -u root -p

# Créer la base et importer le schéma
CREATE DATABASE s43_HairCut CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE s43_HairCut;
SOURCE db/init.sql;
exit;
```

### 5. Créer le compte administrateur

```bash
npm run create-admin
```

**Identifiants par défaut :**
- 📧 Email : `admin@kyrian.com`
- 🔑 Mot de passe : `admin123`

⚠️ **IMPORTANT : Changez immédiatement ces identifiants après la première connexion !**

> **Note** : Modifiez le script `scripts/create-admin.js` avec vos propres identifiants avant de l'exécuter en production.

### 6. Lancer le serveur

#### Mode Production

```bash
npm start
```

#### Mode Développement (avec rechargement auto)

```bash
npm run dev
```

Le serveur démarre sur **http://localhost:3000** 🚀

---

## 📂 Structure du Projet

```
KyrlCut/
├── 📄 server.js                    # Serveur Express + Routes API
├── 📄 email-service.js             # Service d'envoi d'emails OAuth2
├── 📄 package.json                 # Dépendances et scripts
├── 📄 .env                         # Variables d'environnement (à créer)
├── 📄 README.md                    # Documentation
├── 📄 LICENSE                      # Licence du projet
├── 📄 GITHUB_SETUP.md             # Guide de déploiement GitHub
├── 📁 db/
│   └── init.sql                   # Schéma de base de données
├── 📁 scripts/
│   ├── README.md                  # Documentation des scripts
│   ├── init-database.js           # Initialisation BDD automatique
│   ├── create-admin.js            # Création compte admin
│   ├── clean-database.js          # Nettoyage BDD
│   └── auto-generate-slots.js     # Génération auto des créneaux
└── 📁 public/
    ├── login.html                 # Page de connexion
    ├── register.html              # Page d'inscription
    ├── reservations.html          # Interface réservation client
    ├── profile.html               # Profil utilisateur
    ├── admin.html                 # Panneau d'administration
    └── styles.css                 # Styles globaux (thème violet/rose)
```

---

## 🎨 Routes API

### 🌐 Pages Publiques

| Route | Description |
|-------|-------------|
| `GET /` | Redirection vers `/login` |
| `GET /login` | Page de connexion |
| `GET /register` | Page d'inscription |

### 🔒 Pages Protégées (Authentification requise)

| Route | Description |
|-------|-------------|
| `GET /reservations` | Interface de réservation client |
| `GET /profile` | Profil utilisateur |
| `GET /admin` | Panneau d'administration (admin uniquement) |

### 🔐 API Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/register` | Inscription (code invitation requis) |
| `POST` | `/api/login` | Connexion |
| `POST` | `/api/logout` | Déconnexion |

### 👤 API Utilisateur (Protégé)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/user/me` | Informations du compte |
| `GET` | `/api/user/reservations` | Historique des réservations |
| `PUT` | `/api/user/profile` | Modifier le profil |
| `PUT` | `/api/user/password` | Changer le mot de passe |
| `DELETE` | `/api/user/reservations/:id` | Annuler une réservation |

### 📅 API Réservations (Client)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/prestations` | Liste des prestations |
| `GET` | `/api/slots/:date?prestationId=X` | Créneaux disponibles pour une date |
| `POST` | `/api/reservations` | Créer une réservation |

### 🛠️ API Administration (Admin uniquement)

#### Réservations

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/admin/reservations?date=YYYY-MM-DD` | Liste des réservations (filtre optionnel) |
| `PUT` | `/api/admin/reservations/:id/cancel` | Annuler une réservation |
| `PUT` | `/api/admin/reservations/:id/complete` | Marquer comme terminée |
| `DELETE` | `/api/admin/reservations/:id` | Supprimer définitivement |

#### Créneaux

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/admin/slots?startDate=X&endDate=Y` | Liste des créneaux (filtres optionnels) |
| `POST` | `/api/admin/slots` | Créer un créneau |
| `PUT` | `/api/admin/slots/:id` | Activer/Désactiver |
| `DELETE` | `/api/admin/slots/:id` | Supprimer |

#### Codes d'Invitation

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/admin/invite-codes` | Liste tous les codes |
| `POST` | `/api/admin/invite-codes` | Générer un nouveau code |
| `DELETE` | `/api/admin/invite-codes/:id` | Supprimer un code |

---

## 🗄️ Base de Données

### Tables Principales

| Table | Description | Champs clés |
|-------|-------------|-------------|
| **users** | Utilisateurs (clients + admin) | `id`, `email`, `password_hash`, `phone`, `role` |
| **invite_codes** | Codes d'invitation | `code`, `max_uses`, `used_count` |
| **prestations** | Services proposés | `nom`, `description`, `duree_minutes`, `prix` |
| **creneaux_disponibles** | Templates horaires par jour | `jour_semaine`, `heure_debut`, `heure_fin`, `actif` |
| **creneaux_dates** | Créneaux avec dates spécifiques | `date_specifique`, `heure_debut`, `heure_fin`, `lieu`, `actif` |
| **reservations** | Rendez-vous | `user_id`, `prestation_id`, `date_reservation`, `statut` |

### Statuts des Réservations

- `confirmee` : Réservation active
- `terminee` : Prestation effectuée
- `annulee` : Réservation annulée

---

## 🛠️ Scripts NPM

| Commande | Description |
|----------|-------------|
| `npm start` | Lance le serveur en production |
| `npm run dev` | Lance avec rechargement auto (nodemon) |
| `npm run init-db` | Initialise la base de données |
| `npm run create-admin` | Crée le compte administrateur |
| `npm run clean-db` | Nettoie la BDD (réservations, créneaux, users test) |

---

## 🤖 Tâches Automatisées

### Génération Automatique des Créneaux

- **Fréquence** : Tous les lundis à 00h00 (Europe/Paris)
- **Action** : Génère 2 semaines de créneaux basés sur les templates
- **Script** : `scripts/auto-generate-slots.js`
- **Moteur** : node-cron

---

## 🎯 Code d'Invitation de Test

**Code :** `KYRIAN-TEST`  
**Utilisations :** 10 maximum  
**Déjà utilisé :** 0 fois

Utilisez ce code pour créer des comptes de test.

---

## 🔒 Sécurité

| Mesure | Implémentation |
|--------|----------------|
| ✅ Mots de passe | Hashés avec bcrypt (10 rounds) |
| ✅ Sessions | express-session avec secret sécurisé |
| ✅ Protection CSRF | Formulaires POST avec validation |
| ✅ Authentification | Middleware `requireAuth` |
| ✅ Autorisation | Middleware `requireAdmin` |
| ✅ Validation | Vérification des entrées utilisateur |
| ✅ Pool de connexions | Limite de 10 connexions BDD |
| ✅ Timeout | 30s max pour établir une connexion |

---

## 🎨 Design

- **Thème** : Violet profond (#8b5cf6) / Rose lumineux (#e879f9)
- **Style** : Moderne, épuré, glassmorphism
- **Responsive** : Mobile-first avec breakpoints adaptatifs
- **Animations** : Transitions fluides (0.3s cubic-bezier)
- **UX** : Feedback visuel immédiat, états hover, messages clairs

## 👨‍💻 Développement

### Conventions de Code

- **Variables** : camelCase (`userName`, `dateReservation`)
- **Fonctions** : Commentaires JSDoc systématiques
- **Organisation** : Par fonctionnalité (auth, reservations, admin)
- **Gestion d'erreur** : Try-catch avec logs détaillés
- **Commits** : Messages explicites en français

### Bonnes Pratiques

- Code commenté en français pour faciliter la maintenance
- Logs explicites avec emojis (✓, ✗, ⚠️, ⏰)
- Validation côté client ET serveur
- Requêtes SQL paramétrées (protection injection)
- Gestion des erreurs avec codes HTTP appropriés

---

## 🐛 Dépannage

### Le serveur ne démarre pas

```bash
# Vérifier que MySQL est lancé
# Vérifier le fichier .env
# Vérifier les logs de connexion BDD
```

### Les emails ne s'envoient pas

```bash
# Vérifier les credentials Gmail OAuth2 dans .env
# Vérifier que l'API Gmail est activée
# Consulter les logs serveur pour les erreurs
```

### Les créneaux ne se génèrent pas

```bash
# Vérifier que des templates existent dans creneaux_disponibles
# Vérifier les logs du cron job (lundis 00h00)
# Exécuter manuellement : node scripts/auto-generate-slots.js
```

---

## 📄 Licence

Projet privé - Tous droits réservés © 2025 Tristan JONCOUR
---

## 👤 Auteur

Tristan JONCOUR

---

## 🤝 Contribution

Ce projet est actuellement privé. Pour toute suggestion ou rapport de bug, contactez l'auteur.

---

## 📞 Support

Pour toute question technique ou demande d'assistance :
- 📧 Email : tristanjoncour29@gmail.com*
- 🐛 Issues : [GitHub Issues](https://github.com/Cybertrist/KyrlCut/issues)

---

**Version 1.0.0** - Novembre 2025
