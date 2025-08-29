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
import { Megaphone, Target, Calendar, DollarSign, Users, TrendingUp, Zap } from 'lucide-react';

export default function PromoteCampaignDialog({ 
  isOpen, 
  onClose, 
  campaignData, 
  campaignAddress, 
  onSuccess 
}) {
  const { t } = useTranslation();
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

  const promotionPackages = [
    {
      id: 'boost',
      name: 'Boost Standard',
      price: '0.1',
      duration: '7 jours',
      features: [
        'Mise en avant sur la page d\'accueil',
        'Badge "Promu" visible',
        'Notifications push aux investisseurs',
        'Analytics détaillés'
      ],
      color: 'blue',
      estimatedViews: '1K - 5K',
      estimatedInvestors: '10 - 50'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '0.25',
      duration: '14 jours',
      features: [
        'Toutes les fonctionnalités Boost',
        'Article dédié dans la newsletter',
        'Partage sur les réseaux sociaux Livar',
        'Support marketing personnalisé'
      ],
      color: 'purple',
      popular: true,
      estimatedViews: '5K - 15K',
      estimatedInvestors: '50 - 150'
    },
    {
      id: 'ultimate',
      name: 'Ultimate',
      price: '0.5',
      duration: '30 jours',
      features: [
        'Toutes les fonctionnalités Premium',
        'Interview avec l\'équipe Livar',
        'Campagne d\'influence partenaire',
        'Conseils stratégiques dédiés'
      ],
      color: 'gold',
      estimatedViews: '15K - 50K',
      estimatedInvestors: '150 - 500'
    }
  ];

  const targetAudiences = [
    { value: 'crypto_investors', label: 'Investisseurs Crypto' },
    { value: 'tech_enthusiasts', label: 'Passionnés de Tech' },
    { value: 'startup_community', label: 'Communauté Startup' },
    { value: 'defi_users', label: 'Utilisateurs DeFi' },
    { value: 'nft_collectors', label: 'Collectionneurs NFT' },
    { value: 'general_public', label: 'Grand Public' }
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
  };

  const handlePromoteCampaign = async () => {
    setIsPromoting(true);

    try {
      // Simulation de l'API call pour promouvoir la campagne
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onSuccess) {
        onSuccess(promotionForm);
      }

      onClose();
      alert(`Campagne promue avec succès ! Package ${selectedPackage?.name} activé.`);

    } catch (error) {
      console.error("Erreur lors de la promotion:", error);
      alert("Erreur lors de la promotion de la campagne");
    } finally {
      setIsPromoting(false);
    }
  };

  const getPackageColor = (colorType) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        badge: 'bg-blue-600'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-800 dark:text-purple-200',
        badge: 'bg-purple-600'
      },
      gold: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        badge: 'bg-gradient-to-r from-yellow-400 to-orange-500'
      }
    };
    return colors[colorType] || colors.blue;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-950 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-purple-500" />
            Promouvoir votre Campagne
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats actuelles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {campaignData?.raised || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ETH Levés</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {campaignData?.investors || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Investisseurs</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
              <Target className="h-6 w-6 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(((campaignData?.raised || 0) / (campaignData?.goal || 1)) * 100)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Progression</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.floor((campaignData?.timeRemaining || 0) / (1000 * 60 * 60 * 24))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Jours restants</p>
            </div>
          </div>

          {/* Packages de promotion */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Choisissez votre package de promotion
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {promotionPackages.map((pkg) => {
                const colors = getPackageColor(pkg.color);
                const isSelected = selectedPackage?.id === pkg.id;
                
                return (
                  <Card
                    key={pkg.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isSelected ? `ring-2 ring-${pkg.color}-500 shadow-lg` : ''
                    } ${colors.bg} ${colors.border}`}
                    onClick={() => handlePackageSelect(pkg)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        {pkg.popular && (
                          <Badge className="mb-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            <Zap className="h-3 w-3 mr-1" />
                            Populaire
                          </Badge>
                        )}
                        <h4 className={`text-xl font-bold ${colors.text} mb-2`}>
                          {pkg.name}
                        </h4>
                        <div className="flex items-center justify-center gap-1 mb-3">
                          <DollarSign className={`h-5 w-5 ${colors.text}`} />
                          <span className={`text-2xl font-bold ${colors.text}`}>
                            {pkg.price}
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
                          <p><strong>Vues estimées:</strong> {pkg.estimatedViews}</p>
                          <p><strong>Nouveaux investisseurs:</strong> {pkg.estimatedInvestors}</p>
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
                Configuration de la promotion
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-audience" className="text-gray-700 dark:text-gray-300">
                    Audience cible
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
                    Budget
                  </Label>
                  <div className="mt-1 p-3 bg-white dark:bg-neutral-800 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedPackage.price} ETH
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedPackage.duration}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="promo-message" className="text-gray-700 dark:text-gray-300">
                  Message de promotion personnalisé (optionnel)
                </Label>
                <Textarea
                  id="promo-message"
                  value={promotionForm.message}
                  onChange={(e) => handleFormChange('message', e.target.value)}
                  placeholder="Ajoutez un message spécial pour attirer les investisseurs..."
                  className="bg-white dark:bg-neutral-800 mt-1 h-20"
                  maxLength={280}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {promotionForm.message.length}/280 caractères
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
              Annuler
            </Button>
            <Button
              onClick={handlePromoteCampaign}
              disabled={!selectedPackage || isPromoting}
              className={`${
                selectedPackage?.color === 'gold' 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600' 
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white min-w-[160px]`}
            >
              {isPromoting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Activation...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Activer la Promotion
                </div>
              )}
            </Button>
          </div>

          {/* Note importante */}
          <div className="text-xs text-gray-500 dark:text-gray-400 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              📈 Comment la promotion fonctionne :
            </p>
            <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>• Votre campagne sera mise en avant selon le package choisi</li>
              <li>• Le paiement sera déduit automatiquement de votre portefeuille</li>
              <li>• Vous recevrez des analytics détaillés pendant la promotion</li>
              <li>• Les résultats sont visibles dans les 24-48h suivant l'activation</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}