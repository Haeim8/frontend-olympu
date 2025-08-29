import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiManager } from '@/lib/services/api-manager';
import { useTranslation } from '@/hooks/useLanguage';
import { Star, ChevronRight, Zap, Diamond } from 'lucide-react';

export default function ProjectCard({ project, isFavorite, toggleFavorite, onViewDetails }) {
  const { t } = useTranslation();
  const [promotion, setPromotion] = useState(null);
  
  // Charger les données de promotion
  useEffect(() => {
    const checkPromotion = async () => {
      if (!project.address) return;
      
      try {
        const promotionData = await apiManager.isCampaignBoosted(
          project.address, 
          project.currentRound || 1
        );
        
        if (promotionData.isBoosted || promotionData.isBosted) {
          setPromotion(promotionData);
        }
      } catch (error) {
        console.warn('Erreur check promotion:', error);
      }
    };

    checkPromotion();
  }, [project.address, project.currentRound]);

  const progress = (project.currentRaise / project.goal) * 100;

  const getPromotionBadge = () => {
    if (!promotion) return null;

    const badges = {
      0: { icon: Zap, label: 'FEATURED', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
      1: { icon: Star, label: 'TRENDING', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
      2: { icon: Diamond, label: 'SPOTLIGHT', color: 'bg-gradient-to-r from-purple-500 to-pink-500' }
    };

    const badge = badges[promotion.boostType] || badges[0];
    const PromotionIcon = badge.icon;

    return (
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${badge.color} text-white text-xs`}>
        <PromotionIcon className="w-3 h-3" />
        <span>{badge.label}</span>
      </div>
    );
  };

  return (
    <Card className={`bg-white dark:bg-neutral-900 shadow-md hover:shadow-lg transition-shadow duration-300 relative ${
      promotion ? 'ring-2 ring-yellow-400/50' : ''
    }`}>
      <CardContent className="p-4">
        {/* Badge promotion */}
        {promotion && (
          <div className="absolute -top-2 -right-2 z-10">
            {getPromotionBadge()}
          </div>
        )}

        <div className="md:hidden mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{project.sector}</p>
            </div>
            {promotion && <div className="ml-2">{getPromotionBadge()}</div>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{project.sector}</p>
              </div>
              {promotion && <div className="ml-2">{getPromotionBadge()}</div>}
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('project.unit_price', 'Prix unitaire')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.unitPrice} USDC</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('project.current_raise', 'Levée en cours')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.currentRaise} USDC</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('project.goal', 'Objectif')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.goal} USDC</p>
          </div>
          <div className="col-span-2 space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 dark:text-gray-400 text-right">{t('project.progress', '{percent}% atteint', { percent: progress.toFixed(2) })}</p>
          </div>
          <div className="flex justify-between items-center md:justify-end space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(project.id)}
              className={`${isFavorite ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600`}
            >
              <Star className="h-5 w-5" />
            </Button>
            <Button onClick={() => onViewDetails(project)} className="bg-lime-500 hover:bg-lime-600 text-white">
              <span className="hidden md:inline">{t('project.view_details', 'Voir détails')}</span>
              <ChevronRight className="h-5 w-5 md:ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}