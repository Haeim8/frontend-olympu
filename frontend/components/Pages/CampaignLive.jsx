"use client";

import React, { useState } from 'react';
import { useAddress } from '@thirdweb-dev/react';
import { useRouter } from 'next/navigation';

// Import des composants modulaires
import LiveHeader from '@/components/live/LiveHeader';
import LiveVideoStream from '@/components/live/LiveVideoStream';
import DecentralizedChat from '@/components/live/DecentralizedChat';
import VotingPanel from '@/components/live/VotingPanel';
import NFTSwapInterface from '@/components/live/NFTSwapInterface';

export default function CampaignLive({ setActivePage }) {
  const address = useAddress();
  const router = useRouter();
  
  // États principaux
  const [isLive, setIsLive] = useState(true);
  const [viewerCount, setViewerCount] = useState(1247);
  const [campaignData, setCampaignData] = useState({
    name: "EcoChain Project",
    symbol: "ECO",
    totalRaised: "45.2",
    targetAmount: "50.0",
    nftHolders: 40,
    address: "0x742d35Cc6a7590C2b68de7418fd3c464988c0C56"
  });

  // Gestionnaires d'événements
  const handleVote = () => {
    console.log("Vote enregistré pour récupérer les fonds");
  };

  const handleSwap = (amount, refund) => {
    console.log(`Swap de ${amount} NFTs pour ${refund} ETH`);
  };

  const handleBack = () => {
    if (setActivePage) {
      setActivePage('live');
    } else {
      router.back();
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Accès Live DAO
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connectez votre wallet pour accéder à la session live de gouvernance.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 Seuls les détenteurs de NFTs peuvent participer au vote
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header avec informations de campagne */}
        <LiveHeader 
          campaignData={campaignData}
          isLive={isLive}
          viewerCount={viewerCount}
          onBack={handleBack}
        />

        {/* Interface principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
          {/* Colonne gauche : Video + Chat */}
          <div className="space-y-6">
            <div className="h-2/3">
              <LiveVideoStream 
                isLive={isLive}
                viewerCount={viewerCount}
                campaignData={campaignData}
              />
            </div>
            <div className="h-1/3">
              <DecentralizedChat 
                campaignAddress={campaignData.address}
                isLive={isLive}
              />
            </div>
          </div>

          {/* Colonne droite : Vote + Swap */}
          <div className="space-y-6">
            <div className="h-1/2">
              <VotingPanel 
                campaignData={campaignData}
                isLive={isLive}
                onVote={handleVote}
              />
            </div>
            <div className="h-1/2">
              <NFTSwapInterface 
                campaignData={campaignData}
                isLive={isLive}
                onSwap={handleSwap}
              />
            </div>
          </div>
        </div>

        {/* Footer informatif */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                🎯 Objectif de cette session
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Le fondateur présente l'avancement du projet
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Les investisseurs votent pour débloquer ou récupérer les fonds
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Déblocage démocratique basé sur la majorité
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                ⚖️ Règles de gouvernance
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <strong>1 NFT = 1 vote</strong> par wallet (équitable)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <strong>85% récupérable</strong> si vous votez contre
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <strong>Récompenses futures</strong> si vous gardez vos NFTs
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}