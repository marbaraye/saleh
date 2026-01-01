#!/bin/bash
# Script de préparation pour Railway & Netlify
# C Mastery - Application d'apprentissage du C avancé

set -e

echo "=== Préparation C Mastery pour Railway & Netlify ==="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Préparation Backend (Railway)
echo -e "${YELLOW}Préparation du Backend pour Railway...${NC}"
cd server
# S'assurer que le Procfile est présent
if [ ! -f Procfile ]; then
    echo "web: node src/index.js" > Procfile
fi
echo -e "${GREEN}✓ Backend prêt${NC}"
cd ..

# 2. Préparation Frontend (Netlify)
echo -e "${YELLOW}Préparation du Frontend pour Netlify...${NC}"
cd client
# S'assurer que netlify.toml est présent
if [ ! -f netlify.toml ]; then
    echo "Erreur: netlify.toml manquant"
    exit 1
fi
echo -e "${GREEN}✓ Frontend prêt${NC}"
cd ..

echo ""
echo -e "${GREEN}=== Préparation terminée ===${NC}"
echo ""
echo "Instructions pour Railway (Backend):"
echo "1. Créez un nouveau projet sur Railway"
echo "2. Ajoutez un service PostgreSQL"
echo "3. Déployez le dossier 'server/' (ou le repo complet)"
echo "4. Railway détectera automatiquement le Procfile"
echo "5. Configurez les variables d'env (JWT_SECRET, etc.)"
echo ""
echo "Instructions pour Netlify (Frontend):"
echo "1. Créez un nouveau site sur Netlify"
echo "2. Liez votre repo et pointez vers le dossier 'client/'"
echo "3. Commande de build: npm run build"
echo "4. Dossier de build: dist"
echo "5. Ajoutez la variable d'env VITE_API_URL pointant vers Railway"
echo ""
