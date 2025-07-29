"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Share2, 
  Bell, 
  Users, 
  DollarSign, 
  Clock,
  Activity,
  TrendingUp
} from 'lucide-react';

export default function LiveHeader({ 
  campaignData, 
  onBack,
  isLive = true,
  viewerCount = 0,
  sessionDuration = "15:00"
}) {
  const {
    name = "Projet sans nom",
    symbol = "---",
    totalRaised = "0",
    targetAmount = "50.0",
    nftHolders = 0,
    address = ""
  } = campaignData || {};

  const progressPercentage = ((parseFloat(totalRaised) / parseFloat(targetAmount)) * 100);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${name} - Session Live DAO`,
        text: `Rejoignez la session live de gouvernance pour ${name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Vous pourriez ajouter une notification toast ici
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* Header avec navigation */}
      <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {name}
                </h1>
                <Badge variant="outline" className="font-mono text-xs">
                  {symbol}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Session Live de Gouvernance DAO • Déblocage de fonds décentralisé
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              className={`${
                isLive 
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse" 
                  : "bg-gray-500 text-white"
              } px-4 py-2`}
            >
              {isLive ? (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  🔴 EN DIRECT
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Session Fermée
                </>
              )}
            </Badge>
            
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Métriques en temps réel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-lime-50 dark:bg-lime-900/20 rounded-lg p-4 border border-lime-200 dark:border-lime-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-lime-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fonds Levés</span>
            </div>
            <div className="text-2xl font-bold text-lime-700 dark:text-lime-300">
              {totalRaised} ETH
            </div>
            <div className="text-xs text-gray-500 mt-1">
              sur {targetAmount} ETH ({progressPercentage.toFixed(1)}%)
            </div>
            <Progress value={progressPercentage} className="mt-2 h-1" />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">NFT Holders</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {nftHolders}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Détenteurs actifs • 1 vote chacun
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Spectateurs</span>
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {viewerCount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              En ligne maintenant
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Durée Min.</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {sessionDuration}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Session obligatoire
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'information importante */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Comment fonctionne cette session ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>Votez</strong> pour récupérer 85% de vos fonds si pas convaincu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>Gardez vos NFTs</strong> pour les récompenses futures</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>1 NFT = 1 vote</strong> par wallet (gouvernance équitable)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>Early adopters</strong> ont plus de récompenses futures</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}