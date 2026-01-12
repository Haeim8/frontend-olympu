import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from '@/hooks/useLanguage';
import { Star, ChevronRight } from 'lucide-react';

export default function ProjectCard({ project, isFavorite, toggleFavorite, onViewDetails, promotion }) {
  const { t } = useTranslation();

  const progress = (project.currentRaise / project.goal) * 100;

  const getPromotionBadge = () => {
    if (!promotion) return null;

    const badges = {
      0: { label: 'FEATURED', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
      1: { label: 'TRENDING', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
      2: { label: 'SPOTLIGHT', color: 'bg-gradient-to-r from-purple-500 to-pink-500' }
    };

    const badge = badges[promotion.boost_type] || badges[0];

    return (
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${badge.color} text-white text-xs shadow-lg`}>
        <span>{badge.label}</span>
      </div>
    );
  };

  return (
    <Card className={`glass-card border-white/10 hover:border-primary/50 transition-all duration-300 relative group overflow-hidden ${promotion ? 'ring-1 ring-primary/50' : ''
      }`}>
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <CardContent className="p-5 relative z-10">
        {/* Badge promotion */}
        {promotion && (
          <div className="absolute -top-2 -right-2 z-10">
            {getPromotionBadge()}
          </div>
        )}

        <div className="md:hidden mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{project.name}</h3>
              <p className="text-sm text-gray-400">{project.sector}</p>
            </div>
            {promotion && <div className="ml-2">{getPromotionBadge()}</div>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors duration-300">{project.name}</h3>
                <p className="text-sm text-gray-400">{project.sector}</p>
              </div>
              {promotion && <div className="ml-2">{getPromotionBadge()}</div>}
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t('project.unit_price', 'Prix unitaire')}</p>
            <p className="text-lg font-bold text-white">{project.unitPrice} USDC</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t('project.current_raise', 'Levée en cours')}</p>
            <p className="text-lg font-bold text-white">{project.currentRaise} USDC</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t('project.goal', 'Objectif')}</p>
            <p className="text-lg font-bold text-white">{project.goal} USDC</p>
          </div>
            <div className="col-span-2 space-y-2">
              <Progress value={progress} className="w-full h-2 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-secondary" />
              <p className="text-xs text-gray-400 text-right font-medium">{t('project.progress', '{percent}% atteint', { percent: progress.toFixed(2) })}</p>
            </div>
          <div className="flex justify-between items-center md:justify-end space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(project.id)}
              className={`rounded-full hover:bg-white/10 ${isFavorite ? 'text-accent' : 'text-gray-500'} transition-colors`}
            >
              <Star className={`h-5 w-5 ${isFavorite ? 'fill-accent' : ''}`} />
            </Button>
            <Button
              onClick={() => onViewDetails(project)}
              className="bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              <span className="hidden md:inline font-semibold">{t('project.view_details', 'Voir détails')}</span>
              <ChevronRight className="h-4 w-4 md:ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}