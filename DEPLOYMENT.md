# Guide de Déploiement sur AlwaysData

Ce guide détaille les étapes pour déployer C Mastery sur AlwaysData.

## Prérequis

- Un compte AlwaysData (gratuit ou payant)
- Accès SSH activé
- Une base de données PostgreSQL créée

## Étape 1 : Configuration de la Base de Données

### 1.1 Créer la base de données

1. Connectez-vous à l'interface AlwaysData
2. Allez dans **Bases de données** > **PostgreSQL**
3. Cliquez sur **Ajouter une base de données**
4. Notez les informations de connexion :
   - Hôte : `postgresql-[votre-compte].alwaysdata.net`
   - Port : `5432`
   - Nom de la base : `[votre-compte]_cmastery`
   - Utilisateur : `[votre-compte]`
   - Mot de passe : celui défini lors de la création

### 1.2 Construire l'URL de connexion

```
postgresql://[utilisateur]:[mot_de_passe]@postgresql-[compte].alwaysdata.net:5432/[compte]_cmastery
```

## Étape 2 : Configuration de Node.js

### 2.1 Activer Node.js

1. Allez dans **Web** > **Sites**
2. Cliquez sur **Ajouter un site**
3. Configurez :
   - **Type** : Node.js
   - **Adresses** : votre domaine ou sous-domaine
   - **Répertoire racine** : `/c-mastery-app/public`
   - **Commande** : `node server/src/index.js`
   - **Répertoire de travail** : `/c-mastery-app`

### 2.2 Version de Node.js

AlwaysData supporte plusieurs versions de Node.js. Utilisez la version LTS (18.x ou 20.x).

## Étape 3 : Variables d'Environnement

### 3.1 Créer le fichier .env

Créez le fichier `/c-mastery-app/server/.env` :

```env
# Base de données
DATABASE_URL=postgresql://[user]:[pass]@postgresql-[compte].alwaysdata.net:5432/[compte]_cmastery

# JWT
JWT_SECRET=votre_secret_jwt_tres_long_et_securise
JWT_REFRESH_SECRET=autre_secret_pour_refresh_token

# Serveur
PORT=3000
NODE_ENV=production

# CORS (votre domaine)
CORS_ORIGIN=https://votre-domaine.alwaysdata.net
```

### 3.2 Variables via l'interface

Vous pouvez aussi définir les variables dans **Environnement** > **Variables d'environnement**.

## Étape 4 : Déploiement des Fichiers

### 4.1 Via SSH

```bash
# Connexion SSH
ssh [compte]@ssh-[compte].alwaysdata.net

# Cloner ou uploader le projet
cd ~
git clone [votre-repo] c-mastery-app
# ou utilisez SFTP pour uploader les fichiers

# Aller dans le dossier
cd c-mastery-app

# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh
```

### 4.2 Via SFTP

1. Connectez-vous avec FileZilla ou autre client SFTP
2. Uploadez le dossier `c-mastery-app` dans votre home
3. Connectez-vous en SSH pour exécuter les commandes

## Étape 5 : Installation des Dépendances

```bash
# Dépendances serveur
cd ~/c-mastery-app/server
npm install --production

# Construction du frontend
cd ~/c-mastery-app/client
npm install
npm run build

# Copier le build
cp -r dist/* ../public/
```

## Étape 6 : Initialisation de la Base de Données

```bash
cd ~/c-mastery-app/server

# Créer les tables
node database/init.js

# Insérer les données initiales
node database/seed.js
```

## Étape 7 : Configuration Apache/Nginx

AlwaysData gère automatiquement le proxy vers Node.js. Cependant, vous pouvez personnaliser avec le fichier `.htaccess` fourni.

### Structure des fichiers

```
~/c-mastery-app/
├── .htaccess           # Configuration Apache
├── public/             # Fichiers statiques (build React)
│   ├── index.html
│   └── assets/
├── server/             # Backend Node.js
│   ├── src/
│   ├── database/
│   └── .env
└── client/             # Sources React (optionnel en prod)
```

## Étape 8 : Vérification

1. Accédez à votre site : `https://votre-domaine.alwaysdata.net`
2. Vérifiez que la page d'accueil s'affiche
3. Testez l'inscription et la connexion
4. Vérifiez les logs en cas d'erreur :
   ```bash
   cat ~/admin/log/apache/error.log
   cat ~/c-mastery-app/logs/app.log
   ```

## Dépannage

### Erreur 502 Bad Gateway

- Vérifiez que Node.js est bien démarré
- Vérifiez le port dans la configuration

### Erreur de connexion à la base de données

- Vérifiez l'URL de connexion PostgreSQL
- Testez la connexion manuellement :
  ```bash
  psql "postgresql://..."
  ```

### Page blanche

- Vérifiez que le build React est dans `/public`
- Vérifiez la configuration du site dans l'interface

### Erreurs CORS

- Vérifiez la variable `CORS_ORIGIN`
- Assurez-vous qu'elle correspond à votre domaine

## Maintenance

### Mise à jour de l'application

```bash
cd ~/c-mastery-app
git pull origin main
cd server && npm install
cd ../client && npm install && npm run build
cp -r dist/* ../public/
# Redémarrer Node.js via l'interface AlwaysData
```

### Sauvegarde de la base de données

```bash
pg_dump "postgresql://..." > backup_$(date +%Y%m%d).sql
```

### Logs

Les logs sont disponibles dans :
- `/admin/log/apache/` - Logs Apache
- `~/c-mastery-app/logs/` - Logs applicatifs

## Support

Pour toute question sur AlwaysData, consultez leur documentation :
https://help.alwaysdata.com/

Pour les problèmes liés à l'application, ouvrez une issue sur le dépôt GitHub.
