"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Star, Diamond, Clock, DollarSign, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';

export default function BoostCampaignModal({ 
  isOpen, 
  onClose, 
  campaignData,
  onBoostSuccess 
}) {
  const { address } = useAccount();
  const [selectedBoost, setSelectedBoost] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [boostPrices, setBoostPrices] = useState({
    featured: { eth: '0.08', usd: '150' },
    trending: { eth: '0.24', usd: '450' }, 
    spotlight: { eth: '0.64', usd: '1200' }
  });

  const boostOptions = [
    {
      id: 'featured',
      name: 'Featured',
      icon: Zap,
      emoji: '🔥',
      duration: '24 heures',
      description: 'Apparaît en tête de liste pendant 24h',
      benefits: [
        'Position prioritaire dans la liste',
        'Badge "Featured" visible',
        'Visibilité accrue sur 24h'
      ],
      color: 'from-orange-400 to-red-500',
      popular: false
    },
    {
      id: 'trending', 
      name: 'Trending',
      icon: TrendingUp,
      emoji: '⭐',
      duration: '7 jours',
      description: 'Mise en avant dans la section tendances',
      benefits: [
        'Section "Trending" dédiée',
        'Badge "Trending" premium', 
        'Visibilité sur 7 jours complets',
        'Apparaît dans les recommandations'
      ],
      color: 'from-blue-400 to-indigo-500',
      popular: true
    },
    {
      id: 'spotlight',
      name: 'Spotlight',
      icon: Diamond,
      emoji: '💎',
      duration: '30 jours',
      description: 'Promotion premium maximum pendant 1 mois',
      benefits: [
        'Position #1 garantie',
        'Badge "Spotlight" exclusif',
        'Visibilité maximale 30 jours',
        'Notifications push aux investisseurs',
        'Analyses détaillées incluses'
      ],
      color: 'from-purple-400 to-pink-500',
      popular: false
    }
  ];

  // Simuler la récupération des prix dynamiques (à remplacer par l'appel au contrat)
  useEffect(() => {
    // TODO: Récupérer les vrais prix depuis RecPromotionManager
    // const fetchPrices = async () => {
    //   const prices = await promotionContract.getAllBoostPrices();
    //   setBoostPrices(prices);
    // };
    // fetchPrices();
  }, []);

  const handleBoostSelect = (boostId) => {
    setSelectedBoost(boostId);
  };

  const handleBoostPurchase = async () => {
    if (!selectedBoost || !address || !campaignData) return;

    setIsLoading(true);
    try {
      // Vérification des droits
      if (address.toLowerCase() !== campaignData.creator?.toLowerCase()) {
        throw new Error('Seul le créateur de la campagne peut la booster');
      }

      const boostPrice = boostPrices[selectedBoost].eth;
      
      // TODO: Appeler le contrat RecPromotionManager
      console.log('🚀 Boost purchase:', {
        campaign: campaignData.address,
        boostType: selectedBoost,
        price: boostPrice,
        creator: address
      });

      // Simuler l'appel blockchain
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Succès
      onBoostSuccess && onBoostSuccess({
        boostType: selectedBoost,
        duration: boostOptions.find(b => b.id === selectedBoost)?.duration,
        price: boostPrice
      });

      onClose();
      
    } catch (error) {
      console.error('Erreur boost:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getBoostOption = (id) => boostOptions.find(b => b.id === id);
  const selectedOption = selectedBoost ? getBoostOption(selectedBoost) : null;

  if (!campaignData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            Booster votre campagne
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Augmentez la visibilité de <strong>{campaignData.name}</strong> et attirez plus d&apos;investisseurs
          </p>
        </DialogHeader>

        {/* Infos campagne */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">{campaignData.name}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">Round {campaignData.currentRound} • {campaignData.raised} ETH levés</p>
            </div>
            <Badge className="bg-blue-500 text-white">
              En cours
            </Badge>
          </div>
        </div>

        {/* Options de boost */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Choisissez votre formule :</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {boostOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedBoost === option.id;
              
              return (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'ring-2 ring-purple-500 shadow-lg scale-105' 
                      : 'hover:shadow-md hover:scale-102'
                  } ${option.popular ? 'border-2 border-purple-300' : ''}`}
                  onClick={() => handleBoostSelect(option.id)}
                >
                  {option.popular && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold text-center py-1 rounded-t-lg">
                      ⭐ POPULAIRE
                    </div>
                  )}
                  
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r ${option.color} flex items-center justify-center text-white text-2xl`}>
                        {option.emoji}
                      </div>
                      <h4 className="text-xl font-bold">{option.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4" />
                        {option.duration}
                      </p>
                    </div>

                    {/* Prix */}
                    <div className="text-center border-t border-b py-3">
                      <div className="text-3xl font-bold text-green-600">
                        {boostPrices[option.id]?.eth} ETH
                      </div>
                      <div className="text-sm text-gray-500">
                        ≈ ${boostPrices[option.id]?.usd} USD
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                      {option.description}
                    </p>

                    {/* Avantages */}
                    <ul className="space-y-2 text-sm">
                      {option.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Sélection */}
                    <div className="pt-2">
                      <Button 
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full ${isSelected ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : ''}`}
                      >
                        {isSelected ? '✓ Sélectionné' : 'Sélectionner'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Résumé et achat */}
        {selectedOption && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <selectedOption.icon className="w-5 h-5" />
              Résumé de votre boost
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Formule :</span>
                  <span className="font-medium">{selectedOption.name} {selectedOption.emoji}</span>
                </div>
                <div className="flex justify-between">
                  <span>Durée :</span>
                  <span className="font-medium">{selectedOption.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prix :</span>
                  <span className="font-medium text-green-600">
                    {boostPrices[selectedBoost]?.eth} ETH
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Important :</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Le boost démarre immédiatement</li>
                      <li>Durée non remboursable</li>
                      <li>Un seul boost actif par round</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleBoostPurchase}
                disabled={isLoading || !address || address.toLowerCase() !== campaignData.creator?.toLowerCase()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Booster maintenant
                  </>
                )}
              </Button>
            </div>
            
            {address && address.toLowerCase() !== campaignData.creator?.toLowerCase() && (
              <div className="text-center text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                ⚠️ Seul le créateur de la campagne peut la booster
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-gray-500 border-t pt-4">
          <p>💡 Les prix sont calculés en temps réel via Chainlink • Blockchain transparente</p>
          <button className="text-blue-500 hover:underline flex items-center gap-1 mx-auto mt-1">
            <ExternalLink className="w-3 h-3" />
            Voir le contrat sur BaseScan
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
