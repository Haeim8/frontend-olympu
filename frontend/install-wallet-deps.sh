#!/bin/bash

# Script d'installation des dépendances wallet pour l'architecture duale
echo "🚀 Installation des dépendances wallet (OnchainKit + Wagmi)"
echo "=================================================================="

# Vérifier que yarn est installé
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn n'est pas installé. Installation requise."
    exit 1
fi

# OnchainKit
echo "📦 Installation OnchainKit..."
yarn add @coinbase/onchainkit

# Wagmi + Viem + TanStack Query (déjà installé mais on met à jour)
echo "📦 Installation Wagmi + Viem..."
yarn add wagmi viem@^2.21.0

# Migration Thirdweb → OnchainKit/Wagmi terminée ✅
echo "✅ Migration Thirdweb terminée - Dépendances supprimées"
echo "   - @thirdweb-dev/* packages supprimés"
echo "   - Migration vers OnchainKit + Wagmi complète"

# Mettre à jour TanStack Query si nécessaire  
echo "📦 Mise à jour TanStack Query..."
yarn add @tanstack/react-query@^5.52.0

# Vérifier les versions installées
echo "✅ Vérification des versions installées:"
yarn list --pattern "@coinbase/onchainkit|wagmi|viem|@tanstack/react-query" --depth=0

echo ""
echo "🎉 Installation terminée !"
echo ""
echo "📋 État actuel du projet:"
echo "✅ 1. Détection d'environnement implémentée (useEnvironment hook)"
echo "✅ 2. Providers conditionnels configurés (WebApp + MiniApp)"
echo "✅ 3. Hooks abstraits universels créés"
echo "✅ 4. Architecture duale fonctionnelle"
echo "✅ 5. Adresses contrats Base Sepolia mises à jour"
echo ""
