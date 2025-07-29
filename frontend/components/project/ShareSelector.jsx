"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Minus, 
  Plus, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Calculator,
  Zap
} from 'lucide-react';

export default function ShareSelector({ 
  project, 
  onBuyShares, 
  isLoading, 
  buying 
}) {
  const [nftCount, setNftCount] = useState(1);

  if (!project) return null;

  const isCampaignEnded = new Date(project.endDate) < new Date();
  const isOutOfShares = parseFloat(project.raised) >= parseFloat(project.goal);
  const isDisabled = isCampaignEnded || isOutOfShares || buying || isLoading;
  const totalPrice = nftCount * parseFloat(project.sharePrice);
  const sharesRemaining = Math.floor((parseFloat(project.goal) - parseFloat(project.raised)) / parseFloat(project.sharePrice));

  const handleBuyShares = () => {
    onBuyShares(nftCount);
  };

  const getButtonContent = () => {
    if (buying) return { text: "Achat en cours...", icon: <Clock className="h-4 w-4 animate-spin" /> };
    if (isCampaignEnded) return { text: "Campagne terminée", icon: <AlertTriangle className="h-4 w-4" /> };
    if (isOutOfShares) return { text: "Plus de shares disponibles", icon: <AlertTriangle className="h-4 w-4" /> };
    return { 
      text: `Acheter ${nftCount} Share${nftCount > 1 ? 's' : ''}`, 
      icon: <Zap className="h-4 w-4" /> 
    };
  };

  const buttonContent = getButtonContent();

  return (
    <Card className="mt-6 bg-gradient-to-br from-lime-50 via-white to-emerald-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 border-2 border-lime-200 dark:border-lime-800 shadow-xl rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-lime-500 to-emerald-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Calculateur d'investissement
              </h3>
              <p className="text-lime-100 text-sm">
                Sélectionnez le nombre de shares à acheter
              </p>
            </div>
          </div>
          {!isDisabled && (
            <Badge className="bg-white/20 text-white border-white/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              {sharesRemaining} restantes
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Share selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-gray-900 dark:text-white">
              Nombre de Shares
            </label>
            <div className="flex items-center bg-white dark:bg-neutral-900 border-2 border-lime-200 dark:border-lime-800 rounded-xl overflow-hidden">
              <Button
                onClick={() => setNftCount(Math.max(1, nftCount - 1))}
                disabled={nftCount <= 1 || isDisabled}
                variant="ghost"
                className="h-12 w-12 rounded-none hover:bg-lime-50 dark:hover:bg-lime-900/20"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                type="number"
                value={nftCount}
                onChange={(e) => setNftCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, sharesRemaining)))}
                min="1"
                max={sharesRemaining}
                disabled={isDisabled}
                className="w-20 h-12 text-center text-lg font-bold bg-transparent border-none focus:ring-0 focus:outline-none text-gray-900 dark:text-white"
              />
              <Button
                onClick={() => setNftCount(Math.min(nftCount + 1, sharesRemaining))}
                disabled={nftCount >= sharesRemaining || isDisabled}
                variant="ghost"
                className="h-12 w-12 rounded-none hover:bg-lime-50 dark:hover:bg-lime-900/20"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick selection buttons */}
          {!isDisabled && (
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 25, 50].filter(amount => amount <= sharesRemaining).map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setNftCount(amount)}
                  className="bg-white dark:bg-neutral-900 border-lime-200 dark:border-lime-800 hover:bg-lime-50 dark:hover:bg-lime-900/20"
                >
                  {amount} shares
                </Button>
              ))}
              {sharesRemaining > 50 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNftCount(sharesRemaining)}
                  className="bg-white dark:bg-neutral-900 border-lime-200 dark:border-lime-800 hover:bg-lime-50 dark:hover:bg-lime-900/20"
                >
                  Max ({sharesRemaining})
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Pricing breakdown */}
        <div className="space-y-3 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prix unitaire</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {project.sharePrice} ETH
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantité × Prix unitaire
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {nftCount} × {project.sharePrice} ETH
            </span>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-neutral-600 to-transparent"></div>
          
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Prix total</span>
            <div className="text-right">
              <span className="text-2xl font-bold bg-gradient-to-r from-lime-500 to-emerald-600 bg-clip-text text-transparent">
                {totalPrice.toFixed(4)} ETH
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ≈ ${(totalPrice * 2000).toFixed(2)} USD
              </p>
            </div>
          </div>
        </div>

        {/* Warning messages */}
        {isCampaignEnded && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Campagne terminée</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Cette campagne de financement est arrivée à échéance.
            </p>
          </div>
        )}

        {isOutOfShares && !isCampaignEnded && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Objectif atteint</span>
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              Ce projet a atteint son objectif de financement.
            </p>
          </div>
        )}

        {/* Buy button */}
        <Button
          onClick={handleBuyShares}
          disabled={isDisabled}
          className={`w-full h-14 text-lg font-semibold rounded-xl transition-all duration-300 ${
            isDisabled 
              ? 'bg-gray-300 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          <div className="flex items-center gap-2">
            {buttonContent.icon}
            {buttonContent.text}
          </div>
        </Button>

        {/* Additional info */}
        {!isDisabled && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              🔒 Transaction sécurisée sur la blockchain Base
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Vous recevrez {nftCount} NFT{nftCount > 1 ? 's' : ''} représentant vos parts
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}