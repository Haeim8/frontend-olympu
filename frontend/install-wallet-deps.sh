#!/bin/bash

# Script d'installation des dépendances wallet (Wagmi + Query)
echo "🚀 Installation des dépendances wallet (Wagmi + React Query)"
echo "=================================================================="

# Vérifier que yarn est installé
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn n'est pas installé. Installation requise."
    exit 1
fi

# Wagmi + Viem + RainbowKit (déjà installés mais on met à jour)
echo "📦 Installation Wagmi + Viem + RainbowKit..."
yarn add wagmi viem@^2.21.0 @rainbow-me/rainbowkit@^2.1.3

# Nettoyage Thirdweb/OnchainKit terminé ✅
echo "✅ Nettoyage des anciennes dépendances effectué"
echo "   - @thirdweb-dev/* packages supprimés"
echo "   - @coinbase/onchainkit supprimé"

# Mettre à jour TanStack Query si nécessaire  
echo "📦 Mise à jour TanStack Query..."
yarn add @tanstack/react-query@^5.52.0

# Vérifier les versions installées
echo "✅ Vérification des versions installées:"
yarn list --pattern "rainbowkit|wagmi|viem|@tanstack/react-query" --depth=0

echo ""
echo "🎉 Installation terminée !"
echo ""
echo "📋 État actuel du projet:"
echo "✅ 1. Providers Wagmi + RainbowKit configurés"
echo "✅ 2. Support WalletConnect / Coinbase Wallet optionnel"
echo "✅ 3. Hooks wagmi disponibles sur l'ensemble du projet"
echo ""
