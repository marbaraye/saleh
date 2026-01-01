# Guide de Déploiement : Railway & Netlify

Ce guide explique comment déployer l'application C Mastery en utilisant **Railway** pour le backend et la base de données, et **Netlify** pour le frontend.

## 1. Backend & Base de Données (Railway)

### 1.1 Créer le projet
1. Allez sur [Railway.app](https://railway.app/) et connectez-vous.
2. Cliquez sur **New Project** > **Provision PostgreSQL**.
3. Une fois la base créée, cliquez sur **New** > **GitHub Repo** (ou upload direct) pour ajouter le service backend.
4. **Important** : Si vous déployez depuis un monorepo, configurez le **Root Directory** sur `server`.

### 1.2 Variables d'environnement (Railway)
Dans l'onglet **Variables** de votre service backend, ajoutez :
- `DATABASE_URL` : (Générée automatiquement par Railway si vous liez le service Postgres)
- `JWT_SECRET` : Une chaîne aléatoire longue (ex: `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET` : Une autre chaîne aléatoire longue
- `CORS_ORIGIN` : L'URL de votre futur site Netlify (ex: `https://c-mastery.netlify.app`)
- `NODE_ENV` : `production`
- `PORT` : `3000`

### 1.3 Initialisation de la DB
Une fois déployé, allez dans l'onglet **View Logs** ou utilisez la console Railway pour exécuter :
```bash
npm run db:init
npm run db:seed
```

---

## 2. Frontend (Netlify)

### 2.1 Créer le site
1. Allez sur [Netlify.com](https://www.netlify.com/).
2. Cliquez sur **Add new site** > **Import an existing project**.
3. Sélectionnez votre repo GitHub.
4. Configurez les paramètres de build :
   - **Base directory** : `client`
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`

### 2.2 Variables d'environnement (Netlify)
Dans **Site configuration** > **Environment variables**, ajoutez :
- `VITE_API_URL` : L'URL de votre service Railway (ex: `https://c-mastery-production.up.railway.app/api`)

### 2.3 Configuration des redirections
Le fichier `client/netlify.toml` est déjà configuré pour gérer les redirections de React Router (SPA) et les headers de sécurité.

---

## 3. Développement Local

Pour travailler localement :

1. **Backend** :
   ```bash
   cd server
   cp .env.local.example .env
   # Adaptez les valeurs dans .env
   npm install
   npm run dev
   ```

2. **Frontend** :
   ```bash
   cd client
   cp .env.local.example .env.local
   # Adaptez VITE_API_URL à http://localhost:3000/api
   npm install
   npm run dev
   ```

---

## 4. Résumé des URLs

| Service | URL de déploiement | Rôle |
|---------|-------------------|------|
| **Railway** | `https://xxx.up.railway.app` | API Backend + PostgreSQL |
| **Netlify** | `https://xxx.netlify.app` | Interface Utilisateur (React) |

---

## 5. Dépannage

### Erreurs CORS
Si le frontend ne peut pas appeler le backend, vérifiez que `CORS_ORIGIN` sur Railway contient bien l'URL exacte de Netlify (sans slash à la fin).

### Erreur de connexion DB
Vérifiez que le service Backend est bien "lié" au service PostgreSQL dans l'interface Railway (le plugin Postgres doit apparaître dans le graphe du projet).

### Page 404 sur Netlify au rafraîchissement
C'est normalement géré par le `netlify.toml`. Si le problème persiste, vérifiez que ce fichier est bien à la racine du dossier `client`.
