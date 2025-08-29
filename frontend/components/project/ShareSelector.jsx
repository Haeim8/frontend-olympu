"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Minus, 
  Plus, 
  Clock, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguage';

export default function ShareSelector({ 
  project, 
  onBuyShares, 
  isLoading, 
  buying 
}) {
  const { t } = useTranslation();
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
    if (buying) return { text: t('shareSelector.purchaseInProgress'), icon: <Clock className="h-4 w-4 animate-spin" /> };
    if (isCampaignEnded) return { text: t('shareSelector.campaignEnded'), icon: <AlertTriangle className="h-4 w-4" /> };
    if (isOutOfShares) return { text: t('shareSelector.noSharesAvailable'), icon: <AlertTriangle className="h-4 w-4" /> };
    return { 
      text: t('shareSelector.buyShares', { count: nftCount, plural: nftCount > 1 ? 's' : '' }), 
      icon: <Zap className="h-4 w-4" /> 
    };
  };

  const buttonContent = getButtonContent();

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-900/50 rounded-lg border border-gray-200 dark:border-neutral-800">
      {/* Sélecteur quantité */}
      <div className="flex items-center space-x-3">
        <Button
          onClick={() => setNftCount(Math.max(1, nftCount - 1))}
          disabled={nftCount <= 1 || isDisabled}
          variant="outline"
          size="sm"
          className="w-8 h-8 p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <input
          type="number"
          value={nftCount}
          onChange={(e) => setNftCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, sharesRemaining)))}
          className="w-16 text-center border rounded px-2 py-1 text-sm"
          disabled={isDisabled}
          min="1"
          max={sharesRemaining}
        />
        
        <Button
          onClick={() => setNftCount(Math.min(nftCount + 1, sharesRemaining))}
          disabled={nftCount >= sharesRemaining || isDisabled}
          variant="outline"
          size="sm"
          className="w-8 h-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {totalPrice.toFixed(4)} ETH
        </span>
        
        {!isDisabled && (
          <span className="text-xs text-gray-500">
            {t('shareSelector.sharesRemaining', { count: sharesRemaining })}
          </span>
        )}
      </div>
      
      {/* Bouton achat */}
      <Button
        onClick={handleBuyShares}
        disabled={isDisabled}
        className="bg-lime-500 hover:bg-lime-600 text-white px-6"
      >
        <div className="flex items-center gap-2">
          {buttonContent.icon}
          <span>{buying ? t('shareSelector.purchasing') : t('shareSelector.buy') + ` ${nftCount}`}</span>
        </div>
      </Button>
    </div>
  );
}