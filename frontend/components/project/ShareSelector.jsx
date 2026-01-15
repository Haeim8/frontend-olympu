"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Minus,
  Plus,
  Clock,
  AlertTriangle,
  Zap,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguage';
import { formatEth, formatWeiToEth } from '@/lib/utils/formatNumber';

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

  const unitPrice = formatWeiToEth(project.sharePrice);
  const totalPrice = nftCount * unitPrice;
  const sharesRemaining = Math.floor((formatWeiToEth(project.goal) - formatWeiToEth(project.raised)) / unitPrice);

  const handleBuyShares = () => {
    onBuyShares(nftCount);
  };

  const getButtonContent = () => {
    if (buying) return { text: t('shareSelector.purchaseInProgress'), icon: <Clock className="h-4 w-4 animate-spin" /> };
    if (isCampaignEnded) return { text: t('shareSelector.campaignEnded'), icon: <AlertTriangle className="h-4 w-4" /> };
    if (isOutOfShares) return { text: t('shareSelector.noSharesAvailable'), icon: <AlertTriangle className="h-4 w-4" /> };
    return {
      text: t('shareSelector.buyShares', { count: nftCount, plural: nftCount > 1 ? 's' : '' }),
      icon: <ShoppingCart className="h-4 w-4" />
    };
  };

  const buttonContent = getButtonContent();

  return (
    <Card className="border-2 border-lime-200 dark:border-lime-800 bg-gradient-to-br from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20 shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-lime-600" />
                {t('shareSelector.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('shareSelector.sharesAvailable', { count: sharesRemaining })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('shareSelector.unitPrice')}</div>
              <div className="text-xl font-bold text-lime-700 dark:text-lime-300">
                {formatEth(project.sharePrice)}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-lime-200 dark:border-lime-800"></div>

          {/* Sélecteur + Total */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Sélecteur quantité */}
            <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 rounded-lg p-3 flex-1">
              <Button
                onClick={() => setNftCount(Math.max(1, nftCount - 1))}
                disabled={nftCount <= 1 || isDisabled}
                variant="outline"
                size="sm"
                className="w-10 h-10 p-0 border-lime-200 dark:border-lime-800 hover:bg-lime-50 dark:hover:bg-lime-900/20"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <div className="flex-1 text-center">
                <input
                  type="number"
                  value={nftCount}
                  onChange={(e) => setNftCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, sharesRemaining)))}
                  className="w-full text-center text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white"
                  disabled={isDisabled}
                  min="1"
                  max={sharesRemaining}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('shareSelector.shares')}</p>
              </div>

              <Button
                onClick={() => setNftCount(Math.min(nftCount + 1, sharesRemaining))}
                disabled={nftCount >= sharesRemaining || isDisabled}
                variant="outline"
                size="sm"
                className="w-10 h-10 p-0 border-lime-200 dark:border-lime-800 hover:bg-lime-50 dark:hover:bg-lime-900/20"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Total et bouton */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-white dark:bg-neutral-900 rounded-lg p-3 text-center sm:text-left">
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('shareSelector.total')}</div>
                <div className="text-2xl font-bold text-lime-700 dark:text-lime-300 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {formatEth(totalPrice)}
                </div>
              </div>

              <Button
                onClick={handleBuyShares}
                disabled={isDisabled}
                className="bg-lime-500 hover:bg-lime-600 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  {buttonContent.icon}
                  <span>{buttonContent.text}</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Quick select buttons */}
          {!isDisabled && (
            <div className="flex gap-2 pt-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 self-center">{t('shareSelector.quickBuy')}</span>
              {[1, 5, 10, 25].map(count => (
                count <= sharesRemaining && (
                  <Button
                    key={count}
                    onClick={() => setNftCount(count)}
                    variant="outline"
                    size="sm"
                    className={`h-8 px-3 text-xs ${nftCount === count ? 'bg-lime-100 dark:bg-lime-900/20 border-lime-400 dark:border-lime-600' : 'border-gray-200 dark:border-neutral-700'}`}
                  >
                    {count}
                  </Button>
                )
              ))}
              {sharesRemaining > 1 && (
                <Button
                  onClick={() => setNftCount(sharesRemaining)}
                  variant="outline"
                  size="sm"
                  className={`h-8 px-3 text-xs ${nftCount === sharesRemaining ? 'bg-lime-100 dark:bg-lime-900/20 border-lime-400 dark:border-lime-600' : 'border-gray-200 dark:border-neutral-700'}`}
                >
                  {t('shareSelector.max', { count: sharesRemaining })}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
