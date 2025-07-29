"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  ArrowRightLeft, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Wallet,
  Calculator
} from 'lucide-react';

export default function NFTSwapInterface({ 
  campaignData, 
  userNFTBalance = 3,
  isLive = true,
  onSwap 
}) {
  const [swapAmount, setSwapAmount] = useState(1);
  const [hasSwapped, setHasSwapped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableForPurchase, setAvailableForPurchase] = useState(7); // NFTs disponibles à l'achat
  
  // Prix et calculs
  const originalPrice = 0.01; // Prix d'achat original
  const refundPercentage = 85; // 85% de récupération
  const platformFee = 15; // 15% de frais
  const refundPerNFT = (originalPrice * refundPercentage) / 100;
  const totalRefund = swapAmount * refundPerNFT;
  const feesDeducted = swapAmount * ((originalPrice * platformFee) / 100);

  const handleSwap = async () => {
    if (swapAmount <= 0 || swapAmount > userNFTBalance || !isLive || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Simulation d'appel au smart contract
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setHasSwapped(true);
      setAvailableForPurchase(prev => prev + swapAmount); // Les NFTs revendus deviennent disponibles
      onSwap && onSwap(swapAmount, totalRefund);
    } catch (error) {
      console.error('Erreur lors du swap:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmountChange = (value) => {
    const amount = Math.min(userNFTBalance, Math.max(0, parseInt(value) || 0));
    setSwapAmount(amount);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5" />
            Swap NFT → Fonds
          </CardTitle>
          <Badge variant={isLive ? "default" : "secondary"}>
            {isLive ? "🔄 Actif" : "❌ Fermé"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Portefeuille NFT */}
        <div className="bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20 rounded-lg p-4 border border-lime-200 dark:border-lime-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-lime-600" />
              <span className="text-sm font-medium">Mes NFTs</span>
            </div>
            <Badge variant="outline" className="bg-lime-100 text-lime-800 dark:bg-lime-900/20 dark:text-lime-400">
              {userNFTBalance} NFTs
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Valeur d'achat:</span>
              <div className="font-semibold">{(userNFTBalance * originalPrice).toFixed(4)} ETH</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Récupérable (85%):</span>
              <div className="font-semibold text-green-600">{(userNFTBalance * refundPerNFT).toFixed(4)} ETH</div>
            </div>
          </div>
        </div>

        {!hasSwapped && isLive ? (
          <div className="space-y-4">
            {/* Sélecteur de quantité */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Nombre de NFTs à échanger
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  max={userNFTBalance}
                  value={swapAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="text-center font-mono"
                  disabled={!isLive || userNFTBalance === 0}
                />
                <Button
                  variant="outline"
                  onClick={() => setSwapAmount(userNFTBalance)}
                  disabled={userNFTBalance === 0}
                  className="px-3"
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Calculateur détaillé */}
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>NFTs à échanger:</span>
                <span className="font-mono">{swapAmount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Prix original unitaire:</span>
                <span className="font-mono">{originalPrice} ETH</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Récupération (85%):</span>
                <span className="font-mono text-green-600">{refundPerNFT.toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between items-center text-sm text-red-600">
                <span>Frais plateforme (15%):</span>
                <span className="font-mono">-{feesDeducted.toFixed(4)} ETH</span>
              </div>
              <hr className="border-gray-300 dark:border-gray-600" />
              <div className="flex justify-between items-center font-semibold">
                <span>Total à recevoir:</span>
                <span className="text-lg text-lime-600 font-mono">{totalRefund.toFixed(4)} ETH</span>
              </div>
            </div>

            {/* Bouton de swap */}
            <Button 
              onClick={handleSwap}
              disabled={swapAmount <= 0 || swapAmount > userNFTBalance || !isLive || isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Traitement en cours...
                </div>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Échanger {swapAmount} NFT{swapAmount > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        ) : hasSwapped ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-700 dark:text-green-400">
                Swap effectué avec succès !
              </span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Vous avez reçu <strong>{totalRefund.toFixed(4)} ETH</strong>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Transaction confirmée sur la blockchain
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Swap fermé - Session live inactive
            </span>
          </div>
        )}

        {/* Marketplace d'opportunité */}
        {isLive && availableForPurchase > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Opportunité d'achat
              </span>
            </div>
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <p><strong>{availableForPurchase} NFTs disponibles</strong> à l'achat immédiat</p>
              <p>Prix: <strong>{originalPrice} ETH</strong> par NFT</p>
              <Button size="sm" variant="outline" className="w-full mt-2 border-blue-300 text-blue-700 hover:bg-blue-100">
                Acheter maintenant
              </Button>
            </div>
          </div>
        )}

        {/* Avertissements */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <p><strong>⚠️ Attention:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Une fois échangé, vous perdez vos droits de vote DAO</li>
                <li>Plus de récompenses futures du fondateur</li>
                <li>Transaction immédiate et définitive</li>
                <li>Frais de 15% prélevés par la plateforme</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Statistiques en temps réel */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 rounded p-2">
            <div className="text-xs text-red-600 dark:text-red-400">NFTs échangés</div>
            <div className="font-bold text-sm">12</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
            <div className="text-xs text-green-600 dark:text-green-400">Fonds distribués</div>
            <div className="font-bold text-sm">1.02 ETH</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}