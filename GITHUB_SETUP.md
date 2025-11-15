# 🚀 Mise sur GitHub

## Étapes pour push le projet sur GitHub

### 1. Initialiser le repo Git
```bash
git init
git add .
git commit -m "Initial commit - Système de réservation Kyrl Cut"
```

### 2. Créer le repo sur GitHub
1. Va sur https://github.com/new
2. Nom du repo : `kyrl-cut-reservation`
3. **Private** ou **Public** (choisis selon tes besoins)
4. **NE PAS** cocher "Initialize with README" (on en a déjà un)

### 3. Lier et push
```bash
git remote add origin https://github.com/TON-USERNAME/kyrl-cut-reservation.git
git branch -M main
git push -u origin main
```

## ⚠️ SÉCURITÉ - VÉRIFIE AVANT DE PUSH :

### ✅ Fichiers qui DOIVENT être dans le repo :
- ✅ `README.md`
- ✅ `.gitignore`
- ✅ `.env.example`
- ✅ `package.json`
- ✅ Tout le code source (`server.js`, `public/`, `scripts/`, etc.)
- ✅ `GMAIL_SETUP.md`

### ❌ Fichiers qui NE DOIVENT PAS être dans le repo :
- ❌ `.env` (contient tes vrais mots de passe !)
- ❌ `node_modules/`
- ❌ Fichiers de log

### 🔍 Vérifier avant push :
```bash
git status
```

Si tu vois `.env` dans la liste, c'est **MAUVAIS** ! Arrête tout et contacte-moi.

## 📝 Cloner le projet ailleurs :

Pour installer le projet sur un autre PC :
```bash
git clone https://github.com/TON-USERNAME/kyrl-cut-reservation.git
cd kyrl-cut-reservation
npm install
cp .env.example .env
# Éditer .env avec tes vraies infos
npm run init-db
npm run create-admin
npm start
```

## 🔐 Notes importantes :

1. **Le fichier `.env`** n'est JAMAIS committé grâce au `.gitignore`
2. **Le fichier `.env.example`** montre ce qui est requis sans exposer les secrets
3. Chaque personne qui clone le projet doit créer son propre `.env`
4. **Ne JAMAIS** commit de mots de passe, tokens, ou clés API

## 🆘 Si tu as accidentellement commit .env :

```bash
# Supprimer .env du repo (pas du disque)
git rm --cached .env
git commit -m "Remove .env from repo"
git push

# Ensuite CHANGE TOUS TES MOTS DE PASSE ET TOKENS !
```
