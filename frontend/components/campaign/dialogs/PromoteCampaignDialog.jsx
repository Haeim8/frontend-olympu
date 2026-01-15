"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useLanguage';
import { useToast } from '@/contexts/ToastContext';
import { useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { Megaphone, Target, Calendar, DollarSign, Users, TrendingUp, Zap } from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';
import { formatEth } from '@/lib/utils/formatNumber';

// Convertir WalletClient de wagmi en ethers Signer
function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.providers.Web3Provider(transport, network);
  return provider.getSigner(account.address);
}

// Mapping des types de boost vers les indices du contrat
const BOOST_TYPES = {
  'boost': 0,      // Featured
  'premium': 1,    // Trending
  'ultimate': 2    // Spotlight
};

export default function PromoteCampaignDialog({
  isOpen,
  onClose,
  campaignData,
  campaignAddress,
  onSuccess
}) {
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const { data: walletClient } = useWalletClient();
  const [promotionForm, setPromotionForm] = useState({
    type: 'boost',
    budget: '',
    duration: '7',
    targetAudience: 'crypto_investors',
    message: '',
    objectives: []
  });
  const [isPromoting, setIsPromoting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [error, setError] = useState(null);

  const promotionPackages = [
    {
      id: 'boost',
      name: t('promote.boost.name'),
      price: '~0.001', // Prix dynamique depuis le contrat
      duration: t('promote.boost.duration'),
      features: [
        t('promote.boost.feature1'),
        t('promote.boost.feature2'),
        t('promote.boost.feature3'),
        t('promote.boost.feature4')
      ],
      color: 'lime',
      estimatedViews: '1K - 5K',
      estimatedInvestors: '10 - 50'
    },
    {
      id: 'premium',
      name: t('promote.premium.name'),
      price: '~0.003',
      duration: t('promote.premium.duration'),
      features: [
        t('promote.premium.feature1'),
        t('promote.premium.feature2'),
        t('promote.premium.feature3'),
        t('promote.premium.feature4')
      ],
      color: 'lime',
      popular: true,
      estimatedViews: '5K - 15K',
      estimatedInvestors: '50 - 150'
    },
    {
      id: 'ultimate',
      name: t('promote.ultimate.name'),
      price: '~0.005',
      duration: t('promote.ultimate.duration'),
      features: [
        t('promote.ultimate.feature1'),
        t('promote.ultimate.feature2'),
        t('promote.ultimate.feature3'),
        t('promote.ultimate.feature4')
      ],
      color: 'lime',
      estimatedViews: '15K - 50K',
      estimatedInvestors: '150 - 500'
    }
  ];

  const targetAudiences = [
    { value: 'crypto_investors', label: t('promote.audience.cryptoInvestors') },
    { value: 'tech_enthusiasts', label: t('promote.audience.techEnthusiasts') },
    { value: 'startup_community', label: t('promote.audience.startupCommunity') },
    { value: 'defi_users', label: t('promote.audience.defiUsers') },
    { value: 'nft_collectors', label: t('promote.audience.nftCollectors') },
    { value: 'general_public', label: t('promote.audience.generalPublic') }
  ];

  const handleFormChange = (field, value) => {
    setPromotionForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePackageSelect = (packageData) => {
    setSelectedPackage(packageData);
    setPromotionForm(prev => ({
      ...prev,
      type: packageData.id,
      budget: packageData.price,
      duration: packageData.duration.split(' ')[0]
    }));
    setError(null);
  };

  const handlePromoteCampaign = async () => {
    if (!walletClient) {
      setError(t('promote.walletNotConnected', 'Portefeuille non connecté'));
      return;
    }

    if (!selectedPackage) {
      setError(t('promote.selectPackage', 'Sélectionnez un package'));
      return;
    }

    setIsPromoting(true);
    setError(null);

    try {
      const signer = walletClientToSigner(walletClient);
      const boostType = BOOST_TYPES[selectedPackage.id] ?? 0;

      await apiManager.promoteCampaign(campaignAddress, boostType, signer);

      if (onSuccess) {
        onSuccess(promotionForm);
      }

      onClose();
      showSuccess(t('promote.success', { package: selectedPackage?.name }));

    } catch (error) {
      showError(error);
      setError(error.message || t('promote.error'));
    } finally {
      setIsPromoting(false);
    }
  };

  const getPackageColor = (colorType) => {
    const colors = {
      lime: {
        bg: 'bg-lime-50 dark:bg-lime-900/20',
        border: 'border-lime-200 dark:border-lime-800',
        text: 'text-lime-800 dark:text-lime-200',
        badge: 'bg-lime-600'
      }
    };
    return colors[colorType] || colors.lime;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-950 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-lime-500" />
            {t('promote.dialog.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats actuelles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-lime-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatEth(campaignData?.raised || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('promote.stats.ethRaised')}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
              <Users className="h-6 w-6 text-lime-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {campaignData?.investors || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('promote.stats.investors')}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
              <Target className="h-6 w-6 text-lime-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(((campaignData?.raised || 0) / (campaignData?.goal || 1)) * 100)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('promote.stats.progress')}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
              <Calendar className="h-6 w-6 text-lime-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.floor((campaignData?.timeRemaining || 0) / (1000 * 60 * 60 * 24))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('promote.stats.daysRemaining')}</p>
            </div>
          </div>

          {/* Packages de promotion */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('promote.choosePackage')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {promotionPackages.map((pkg) => {
                const colors = getPackageColor(pkg.color);
                const isSelected = selectedPackage?.id === pkg.id;

                return (
                  <Card
                    key={pkg.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected ? 'ring-2 ring-lime-500 shadow-lg' : ''
                      } ${colors.bg} ${colors.border}`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        {pkg.popular && (
                          <Badge className="mb-2 bg-gradient-to-r from-lime-500 to-green-600 text-white">
                            <Zap className="h-3 w-3 mr-1" />
                            {t('promote.popular')}
                          </Badge>
                        )}
                        <h4 className={`text-xl font-bold ${colors.text} mb-2`}>
                          {pkg.name}
                        </h4>
                        <div className="flex items-center justify-center gap-1 mb-3">
                          <DollarSign className={`h-5 w-5 ${colors.text}`} />
                          <span className={`text-2xl font-bold ${colors.text}`}>
                            {pkg.price.replace('~', '')}
                          </span>
                          <span className={`text-sm ${colors.text}`}>ETH</span>
                        </div>
                        <p className={`text-sm ${colors.text} mb-4`}>
                          {pkg.duration}
                        </p>

                        <div className="space-y-2 mb-4">
                          {pkg.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <div className={`w-1.5 h-1.5 rounded-full ${colors.badge} flex-shrink-0 mt-2`}></div>
                              <span className={colors.text}>{feature}</span>
                            </div>
                          ))}
                        </div>

                        <div className={`text-xs ${colors.text} space-y-1 border-t pt-3`}>
                          <p><strong>{t('promote.estimatedViews')}:</strong> {pkg.estimatedViews}</p>
                          <p><strong>{t('promote.estimatedInvestors')}:</strong> {pkg.estimatedInvestors}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Configuration avancée */}
          {selectedPackage && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('promote.configuration')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-audience" className="text-gray-700 dark:text-gray-300">
                    {t('promote.targetAudience')}
                  </Label>
                  <Select
                    value={promotionForm.targetAudience}
                    onValueChange={(value) => handleFormChange('targetAudience', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-neutral-800 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {targetAudiences.map((audience) => (
                        <SelectItem key={audience.value} value={audience.value}>
                          {audience.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">
                    {t('promote.budget')}
                  </Label>
                  <div className="mt-1 p-3 bg-white dark:bg-neutral-800 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedPackage.price.replace('~', '')} ETH
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedPackage.duration}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="promo-message" className="text-gray-700 dark:text-gray-300">
                  {t('promote.customMessage')}
                </Label>
                <Textarea
                  id="promo-message"
                  value={promotionForm.message}
                  onChange={(e) => handleFormChange('message', e.target.value)}
                  placeholder={t('promote.messagePlaceholder')}
                  className="bg-white dark:bg-neutral-800 mt-1 h-20"
                  maxLength={280}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {promotionForm.message.length}/280 {t('promote.characters')}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPromoting}
            >
              {t('promote.cancel')}
            </Button>
            <Button
              onClick={handlePromoteCampaign}
              disabled={!selectedPackage || isPromoting}
              className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white min-w-[160px]"
            >
              {isPromoting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('promote.activating')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  {t('promote.activate')}
                </div>
              )}
            </Button>
          </div>

          {/* Note importante */}
          <div className="text-xs text-gray-500 dark:text-gray-400 p-4 bg-lime-50 dark:bg-lime-900/20 rounded-lg border border-lime-200 dark:border-lime-800">
            <p className="font-medium text-lime-800 dark:text-lime-200 mb-2">
              📈 {t('promote.howItWorks')}
            </p>
            <ul className="space-y-1 text-lime-700 dark:text-lime-300">
              <li>• {t('promote.howItWorks1')}</li>
              <li>• {t('promote.howItWorks2')}</li>
              <li>• {t('promote.howItWorks3')}</li>
              <li>• {t('promote.howItWorks4')}</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
