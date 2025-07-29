"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  RefreshCw, 
  Download,
  Settings,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function WalletHeader({ 
  address, 
  onRefresh, 
  isLoading,
  walletInfo 
}) {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Vous pouvez ajouter une notification toast ici
  };

  const getWalletStatus = () => {
    const totalValue = parseFloat(walletInfo.totalInvested);
    if (totalValue === 0) return { status: 'new', label: 'Nouveau', color: 'bg-blue-100 text-blue-800' };
    if (totalValue < 1) return { status: 'beginner', label: 'Débutant', color: 'bg-green-100 text-green-800' };
    if (totalValue < 10) return { status: 'active', label: 'Actif', color: 'bg-purple-100 text-purple-800' };
    return { status: 'whale', label: 'Investisseur', color: 'bg-orange-100 text-orange-800' };
  };

  const walletStatus = getWalletStatus();

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <defs>
              <pattern id="wallet-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wallet-grid)" />
          </svg>
        </div>

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            
            {/* Left side - Wallet info */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <Badge className={`${walletStatus.color} px-3 py-1 font-medium`}>
                  {walletStatus.label}
                </Badge>
                <Badge className="bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 px-3 py-1">
                  <Activity className="h-3 w-3 mr-1" />
                  En ligne
                </Badge>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent leading-tight">
                  Votre portefeuille
                  <span className="block bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    d'investissements
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                  Gérez vos NFT, suivez vos investissements et consultez vos dividendes en temps réel.
                </p>
              </div>

              {/* Wallet Address */}
              <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50 inline-block">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Adresse connectée
                    </p>
                    <button
                      onClick={() => copyToClipboard(address)}
                      className="font-mono text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {formatAddress(address)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stats Preview */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Investissements</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {walletInfo.totalInvested} ETH
                  </p>
                </div>

                <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">NFT</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {walletInfo.totalNFTs}
                  </p>
                </div>

                <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50 col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Projets</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {walletInfo.activeProjects}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              
              {/* Refresh Button */}
              <Button
                onClick={onRefresh}
                disabled={isLoading}
                variant="outline"
                className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-gray-200/50 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800 group"
              >
                <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-500 ${
                  isLoading ? 'animate-spin' : 'group-hover:rotate-180'
                }`} />
                Actualiser
              </Button>

              {/* Export Button */}
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-gray-200/50 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>

              {/* Settings Button */}
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-gray-200/50 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800"
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-lg animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}