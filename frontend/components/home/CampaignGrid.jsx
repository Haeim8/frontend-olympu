"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import CampaignCard from './CampaignCard';
import { PromotionService } from '@/lib/services/promotion-service';
import { useTranslation } from '@/hooks/useLanguage';
import { RefreshCw, TrendingUp, Search, Grid3X3 } from 'lucide-react';

export default function CampaignGrid({ 
  projects = [], 
  isLoading, 
  error, 
  showFinalized,
  onViewDetails,
  onRefresh,
  onPreloadHover
}) {
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState([]);

  // Charger les promotions actives
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const activePromotions = await PromotionService.getActivePromotions();
        setPromotions(activePromotions);
      } catch (error) {
        console.warn('Erreur chargement promotions:', error);
      }
    };

    loadPromotions();
  }, []);

  const projectsArray = Array.isArray(projects) ? projects : [];
  const filteredProjects = projectsArray.filter(project => 
    showFinalized ? project.isFinalized : (!project.isFinalized && project.isActive)
  );

  // Trier les projets avec les campagnes boostées en premier
  const promotionsArray = Array.isArray(promotions) ? promotions : [];
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const promotionA = promotionsArray.find(p => 
      p.campaign_address?.toLowerCase() === a.address?.toLowerCase()
    );
    const promotionB = promotionsArray.find(p => 
      p.campaign_address?.toLowerCase() === b.address?.toLowerCase()
    );

    // Les campagnes boostées d'abord
    if (promotionA && !promotionB) return -1;
    if (!promotionA && promotionB) return 1;
    
    // Si les deux sont boostées, trier par type de boost (SPOTLIGHT > TRENDING > FEATURED)
    if (promotionA && promotionB) {
      return (promotionB.boost_type || 0) - (promotionA.boost_type || 0);
    }

    // Sinon trier par statut actif
    return b.isActive - a.isActive;
  });

  // États de chargement avec skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 animate-pulse">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="text-center space-y-2">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                      <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('campaigns.error.title', 'Erreur de chargement')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error}
          </p>
          <Button 
            onClick={onRefresh}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('campaigns.error.retry', 'Réessayer')}
          </Button>
        </div>
      </div>
    );
  }

  // État vide
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-lime-100 to-blue-100 dark:from-lime-900/20 dark:to-blue-900/20 rounded-2xl flex items-center justify-center mx-auto">
            <Grid3X3 className="w-10 h-10 text-lime-600 dark:text-lime-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('campaigns.empty.title', 'Aucune campagne disponible')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('campaigns.empty.description', 'Il n\'y a pas encore de campagnes de financement. Soyez le premier à lancer votre projet !')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={onRefresh}
              variant="outline"
              className="border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-900"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('campaigns.refresh', 'Actualiser')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // État avec campagnes filtrées vides
  if (filteredProjects.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {showFinalized ? t('campaigns.finalized_title', 'Campagnes finalisées') : t('campaigns.ongoing_title', 'Campagnes en cours')}
            </h2>
            <span className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
              {filteredProjects.length}
            </span>
          </div>
          <Button 
            onClick={onRefresh}
            variant="outline"
            className="border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-900"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('campaigns.refresh', 'Actualiser')}
          </Button>
        </div>

        {/* Message vide pour filtre */}
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
              {showFinalized 
                ? t('campaigns.no_finalized', 'Aucune campagne finalisée') 
                : t('campaigns.no_ongoing', 'Aucune campagne en cours')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {showFinalized 
                ? t('campaigns.no_finalized_desc', 'Aucune campagne n\'a encore été finalisée.') 
                : t('campaigns.no_ongoing_desc', 'Aucune campagne n\'est actuellement active.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Rendu normal avec campagnes
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-lime-100 to-blue-100 dark:from-lime-900/20 dark:to-blue-900/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-lime-600 dark:text-lime-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {showFinalized ? t('campaigns.finalized_title', 'Campagnes finalisées') : t('campaigns.ongoing_title', 'Campagnes en cours')}
          </h2>
          <span className="px-3 py-1 bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300 rounded-full text-sm font-semibold">
            {filteredProjects.length}
          </span>
        </div>
        <Button 
          onClick={onRefresh}
          variant="outline"
          className="border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-900 group"
        >
          <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
          {t('campaigns.refresh', 'Actualiser')}
        </Button>
      </div>

      {/* Grid des campagnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedProjects.map((project, index) => (
          <div
            key={project.id}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{
              animationDelay: `${index * 100}ms`,
              animationDuration: '600ms',
              animationFillMode: 'both'
            }}
          >
            <CampaignCard
              project={project}
              onViewDetails={onViewDetails}
              onPreloadHover={onPreloadHover}
            />
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {filteredProjects.length > 0 && (
        <div className="text-center pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('campaigns.footer_info', '{count} campagne{plural} {status}{pluralStatus} • Mis à jour il y a quelques instants', {
              count: filteredProjects.length,
              plural: filteredProjects.length > 1 ? 's' : '',
              status: showFinalized ? 'finalisée' : 'active',
              pluralStatus: filteredProjects.length > 1 ? 's' : ''
            })}
          </p>
        </div>
      )}
    </div>
  );
}