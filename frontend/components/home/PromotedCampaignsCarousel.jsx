"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, TrendingUp, Zap, ExternalLink } from "lucide-react";
import { apiManager } from '@/lib/services/api-manager';
import { PromotionService } from '@/lib/services/promotion-service';
import { useTranslation } from '@/hooks/useLanguage';

const PROMOTION_TYPES = {
  featured: {
    icon: Star,
    labelKey: 'promoted.featured',
    color: 'from-yellow-400 to-orange-500',
    badge: 'bg-yellow-500',
  },
  trending: {
    icon: TrendingUp,
    labelKey: 'promoted.trending',
    color: 'from-purple-400 to-pink-500',
    badge: 'bg-purple-500',
  },
  spotlight: {
    icon: Zap,
    labelKey: 'promoted.spotlight',
    color: 'from-blue-400 to-cyan-500',
    badge: 'bg-blue-500',
  },
};

export function PromotedCampaignsCarousel({ onViewCampaign, darkMode }) {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Charger les campagnes promues
  const loadPromotedCampaigns = useCallback(async () => {
    try {
      // Charger les promotions actives
      const activePromotions = await PromotionService.getActivePromotions();

      if (!activePromotions || activePromotions.length === 0) {
        setCampaigns([]);
        setIsLoading(false);
        return;
      }

      // Charger TOUTES les campagnes en parallèle (non bloquant)
      const campaignPromises = activePromotions.map(async (promotion) => {
        try {
          const campaignData = await apiManager.getCampaignData(promotion.campaign_address, true);

          if (!campaignData) return null;

          const progress = ((parseFloat(campaignData.raised || 0) / parseFloat(campaignData.goal || 1)) * 100) || 0;

          return {
            address: promotion.campaign_address,
            name: campaignData.name || 'Campaign',
            description: campaignData.description || campaignData.shortDescription || '',
            logo: campaignData.logo || '🚀',
            category: campaignData.category || 'Startup',
            goal: campaignData.goal || '0',
            raised: campaignData.raised || '0',
            progress: Math.min(progress, 100),
            investors: campaignData.investors || 0,
            isActive: campaignData.isActive,
            promotion: {
              type: promotion.boost_type || 'featured',
              priority: promotion.priority || 0,
              endsAt: promotion.end_timestamp,
            },
          };
        } catch (error) {
          console.warn(`Erreur chargement campagne ${promotion.campaign_address}:`, error);
          return null;
        }
      });

      // Attendre toutes les campagnes en parallèle
      const results = await Promise.all(campaignPromises);
      const campaignsData = results.filter(Boolean);

      // Trier par priorité de promotion
      campaignsData.sort((a, b) => (b.promotion.priority || 0) - (a.promotion.priority || 0));

      setCampaigns(campaignsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur chargement campagnes promues:', error);
      setCampaigns([]);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromotedCampaigns();
  }, [loadPromotedCampaigns]);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || campaigns.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 5000); // Change toutes les 5 secondes

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, campaigns.length]);

  const handlePrevious = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  }, [campaigns.length]);

  const handleNext = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % campaigns.length);
  }, [campaigns.length]);

  const handleDotClick = useCallback((index) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-neutral-800 rounded w-64 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-neutral-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de campagnes promues
  }

  const currentCampaign = campaigns[currentIndex];
  const promotionInfo = PROMOTION_TYPES[currentCampaign.promotion.type] || PROMOTION_TYPES.featured;
  const PromotionIcon = promotionInfo.icon;

  return (
    <div className="w-full py-12 bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950">
      <div className="max-w-7xl mx-auto px-4">
        {/* Titre */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${promotionInfo.color} text-white`}>
              <PromotionIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('promoted.trending')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('promoted.subtitle')}
              </p>
            </div>
          </div>

          {/* Navigation */}
          {campaigns.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                className="rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div
          ref={carouselRef}
          className="relative overflow-hidden rounded-2xl"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <Card className={`border-0 bg-gradient-to-r ${promotionInfo.color} p-1 shadow-2xl`}>
                <CardContent className="p-0">
                  <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-8 p-8">
                      {/* Image/Logo */}
                      <div className="flex items-center justify-center">
                        <div className="relative w-full aspect-square max-w-md rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900">
                          {currentCampaign.logo && currentCampaign.logo.startsWith('http') ? (
                            <img
                              src={currentCampaign.logo}
                              alt={currentCampaign.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-8xl">
                              {currentCampaign.logo}
                            </div>
                          )}

                          {/* Badge promotion */}
                          <div className="absolute top-4 right-4">
                            <Badge className={`${promotionInfo.badge} text-white flex items-center gap-2 px-3 py-1.5`}>
                              <PromotionIcon className="w-4 h-4" />
                              {t(promotionInfo.labelKey)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="flex flex-col justify-center">
                        <Badge className="w-fit mb-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300">
                          {currentCampaign.category}
                        </Badge>

                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                          {currentCampaign.name}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                          {currentCampaign.description || 'Description non disponible'}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div>
                            <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
                              {currentCampaign.progress.toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('promoted.progress')}</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {parseFloat(currentCampaign.raised).toFixed(4)} ETH
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('promoted.raised')}</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {currentCampaign.investors}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('promoted.investors')}</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-6">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${currentCampaign.progress}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className={`h-full bg-gradient-to-r ${promotionInfo.color}`}
                          />
                        </div>

                        {/* CTA */}
                        <Button
                          onClick={() => onViewCampaign?.(currentCampaign)}
                          className={`w-full bg-gradient-to-r ${promotionInfo.color} hover:opacity-90 text-white font-semibold py-6 text-lg`}
                        >
                          {t('promoted.discover')}
                          <ExternalLink className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots navigation */}
        {campaigns.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {campaigns.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? `w-8 bg-gradient-to-r ${promotionInfo.color}`
                    : 'w-2 bg-gray-300 dark:bg-neutral-700'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Campagnes count */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} / {campaigns.length} {t('promoted.count')}
          </p>
        </div>
      </div>
    </div>
  );
}
