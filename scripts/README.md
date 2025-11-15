# Scripts utilitaires

Scripts de maintenance et d'initialisation du projet.

## Scripts disponibles

### `npm run init-db`
Initialise la base de données avec les tables nécessaires.
```bash
npm run init-db
```

### `npm run create-admin`
Crée un compte administrateur par défaut.
```bash
npm run create-admin
```

### `npm run clean-db`
Nettoie la base de données (supprime réservations, créneaux, utilisateurs test).
```bash
npm run clean-db
```

## Scripts internes

### `auto-generate-slots.js`
Utilisé automatiquement par le cron job (tous les lundis à 00h00) pour générer les semaines futures.
Ne pas exécuter manuellement.
