#!/bin/bash
# Script de déploiement pour AlwaysData
# C Mastery - Application d'apprentissage du C avancé

set -e

echo "=== Déploiement C Mastery sur AlwaysData ==="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier les prérequis
check_prerequisites() {
    echo -e "${YELLOW}Vérification des prérequis...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js n'est pas installé${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm n'est pas installé${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Prérequis vérifiés${NC}"
}

# Installer les dépendances du serveur
install_server() {
    echo -e "${YELLOW}Installation des dépendances serveur...${NC}"
    cd server
    npm install --production
    cd ..
    echo -e "${GREEN}✓ Dépendances serveur installées${NC}"
}

# Construire le frontend
build_client() {
    echo -e "${YELLOW}Construction du frontend React...${NC}"
    cd client
    npm install
    npm run build
    cd ..
    echo -e "${GREEN}✓ Frontend construit${NC}"
}

# Copier le build vers le dossier public
deploy_static() {
    echo -e "${YELLOW}Déploiement des fichiers statiques...${NC}"
    
    # Créer le dossier public s'il n'existe pas
    mkdir -p public
    
    # Copier le build React
    cp -r client/dist/* public/
    
    echo -e "${GREEN}✓ Fichiers statiques déployés${NC}"
}

# Initialiser la base de données
init_database() {
    echo -e "${YELLOW}Initialisation de la base de données...${NC}"
    
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}Variable DATABASE_URL non définie${NC}"
        echo "Définissez DATABASE_URL dans votre fichier .env"
        exit 1
    fi
    
    cd server
    node database/init.js
    echo -e "${GREEN}✓ Base de données initialisée${NC}"
    
    echo -e "${YELLOW}Insertion des données initiales...${NC}"
    node database/seed.js
    echo -e "${GREEN}✓ Données initiales insérées${NC}"
    cd ..
}

# Démarrer l'application
start_app() {
    echo -e "${YELLOW}Démarrage de l'application...${NC}"
    cd server
    
    # Utiliser PM2 si disponible, sinon node directement
    if command -v pm2 &> /dev/null; then
        pm2 delete c-mastery 2>/dev/null || true
        pm2 start src/index.js --name c-mastery
        pm2 save
        echo -e "${GREEN}✓ Application démarrée avec PM2${NC}"
    else
        echo "PM2 non disponible, démarrage avec node..."
        nohup node src/index.js > ../logs/app.log 2>&1 &
        echo -e "${GREEN}✓ Application démarrée${NC}"
    fi
    
    cd ..
}

# Menu principal
main() {
    echo ""
    echo "Options de déploiement:"
    echo "1) Déploiement complet (recommandé)"
    echo "2) Installer les dépendances uniquement"
    echo "3) Construire le frontend uniquement"
    echo "4) Initialiser la base de données uniquement"
    echo "5) Démarrer l'application uniquement"
    echo ""
    
    read -p "Choisissez une option [1-5]: " choice
    
    case $choice in
        1)
            check_prerequisites
            install_server
            build_client
            deploy_static
            init_database
            start_app
            ;;
        2)
            check_prerequisites
            install_server
            ;;
        3)
            check_prerequisites
            build_client
            deploy_static
            ;;
        4)
            init_database
            ;;
        5)
            start_app
            ;;
        *)
            echo -e "${RED}Option invalide${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}=== Déploiement terminé ===${NC}"
    echo ""
    echo "Prochaines étapes sur AlwaysData:"
    echo "1. Configurez les variables d'environnement dans l'interface"
    echo "2. Configurez le site pour pointer vers le dossier 'public'"
    echo "3. Configurez Node.js pour exécuter 'server/src/index.js'"
    echo "4. Vérifiez que PostgreSQL est configuré"
    echo ""
}

# Exécution
main "$@"
