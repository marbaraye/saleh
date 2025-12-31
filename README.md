# C Mastery 🧠

**Application d'apprentissage du langage C avancé avec feuille de route interactive**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Description

C Mastery est une plateforme d'apprentissage complète pour maîtriser le langage C avancé. Elle propose une feuille de route interactive couvrant les sujets avancés : gestion mémoire, pointeurs, programmation système, réseaux, threads et plus encore.

### Fonctionnalités principales

- **🗺️ Feuille de route interactive** : Parcours structuré avec 6 modules et 30+ topics
- **💻 Éditeur de code intégré** : Monaco Editor avec coloration syntaxique C
- **✅ Validation automatique** : Tests unitaires pour chaque projet pratique
- **📊 Dashboard personnel** : Suivi de progression et statistiques
- **🏆 Gamification** : Points, badges, séries et classement
- **👤 Authentification** : Inscription/connexion avec JWT

## 🛠️ Stack Technique

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | TailwindCSS |
| **Éditeur** | Monaco Editor |
| **Backend** | Node.js + Express |
| **Base de données** | PostgreSQL |
| **Auth** | JWT (JSON Web Tokens) |
| **Hébergement** | AlwaysData |

## 📁 Structure du Projet

```
c-mastery-app/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API
│   │   ├── stores/         # État global (Zustand)
│   │   └── types/          # Types TypeScript
│   └── public/             # Assets statiques
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── routes/         # Routes API
│   │   ├── middleware/     # Middlewares Express
│   │   ├── services/       # Services métier
│   │   └── config/         # Configuration
│   └── database/           # Scripts SQL et seeds
├── public/                 # Build de production
├── .htaccess               # Configuration Apache
├── deploy.sh               # Script de déploiement
└── DEPLOYMENT.md           # Guide de déploiement
```

## 🚀 Installation

### Prérequis

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm ou yarn

### Installation locale

```bash
# Cloner le projet
git clone https://github.com/votre-repo/c-mastery-app.git
cd c-mastery-app

# Installer toutes les dépendances
npm run install:all

# Configurer les variables d'environnement
cp server/.env.example server/.env
# Éditer server/.env avec vos paramètres

# Initialiser la base de données
npm run db:reset

# Lancer en développement
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:5173
- Backend : http://localhost:3000

### Build de production

```bash
# Construire le frontend
npm run build

# Démarrer le serveur
npm start
```

## 📚 Modules d'Apprentissage

| Module | Description | Durée |
|--------|-------------|-------|
| 🧠 Maîtrise de la Mémoire | Allocation dynamique, mmap, fuites mémoire | 40h |
| 🎯 Pointeurs & Bas Niveau | Arithmétique, pointeurs de fonctions, bits | 35h |
| 🌐 Sockets Réseau | TCP/UDP, epoll, serveurs multi-clients | 40h |
| ⚡ Threads & Concurrence | pthreads, mutex, structures lock-free | 45h |
| 🐧 Programmation Système | Processus, signaux, IPC | 50h |
| 📁 Système de Fichiers | I/O bas niveau, mmap fichiers | 30h |

## 🔌 API Endpoints

### Authentification
```
POST /api/auth/register     # Inscription
POST /api/auth/login        # Connexion
POST /api/auth/refresh      # Rafraîchir le token
POST /api/auth/logout       # Déconnexion
```

### Modules et Topics
```
GET  /api/modules           # Liste des modules
GET  /api/modules/:slug     # Détail d'un module
GET  /api/topics/:slug      # Détail d'un topic
```

### Projets
```
GET  /api/projects          # Liste des projets
GET  /api/projects/:slug    # Détail d'un projet
POST /api/projects/:slug/submit   # Soumettre du code
POST /api/projects/:slug/hint     # Obtenir un indice
```

### Progression
```
GET  /api/progress          # Progression globale
POST /api/progress/topics/:id/start    # Commencer un topic
POST /api/progress/topics/:id/complete # Terminer un topic
```

### Gamification
```
GET  /api/badges            # Liste des badges
GET  /api/leaderboard       # Classement global
GET  /api/leaderboard/weekly # Classement hebdomadaire
```

## 🎮 Système de Gamification

### Points
- Complétion d'un topic : 100-200 points
- Réussite d'un projet : 200-500 points
- Série quotidienne : Bonus multiplicateur
- Badges : Points bonus variables

### Badges
| Badge | Condition | Rareté |
|-------|-----------|--------|
| 🌟 Premier Pas | Compléter le premier topic | Commun |
| 🔥 En Feu | Série de 7 jours | Rare |
| 🧠 Memory Master | Terminer le module Mémoire | Épique |
| 👑 C Grandmaster | Compléter tous les modules | Légendaire |

## 🚀 Déploiement sur AlwaysData

Consultez le guide détaillé : [DEPLOYMENT.md](./DEPLOYMENT.md)

### Résumé rapide

```bash
# 1. Configurer PostgreSQL dans l'interface AlwaysData
# 2. Configurer les variables d'environnement
# 3. Déployer via SSH

ssh compte@ssh-compte.alwaysdata.net
cd c-mastery-app
chmod +x deploy.sh
./deploy.sh
```

## 🧪 Tests

```bash
# Tests backend
cd server && npm test

# Tests frontend
cd client && npm test
```

## 📝 Variables d'Environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret pour les tokens | `votre_secret_securise` |
| `JWT_REFRESH_SECRET` | Secret pour refresh tokens | `autre_secret` |
| `PORT` | Port du serveur | `3000` |
| `NODE_ENV` | Environnement | `production` |
| `CORS_ORIGIN` | Origine autorisée | `https://votre-domaine.com` |

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines.

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) pour l'éditeur de code
- [TailwindCSS](https://tailwindcss.com/) pour le styling
- [AlwaysData](https://www.alwaysdata.com/) pour l'hébergement

---

**C Mastery** - Maîtrisez le C avancé, un topic à la fois. 🚀
