"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
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
    color: 'from-orange-500 to-yellow-500',
    badge: 'bg-orange-500',
  },
  trending: {
    icon: TrendingUp,
    labelKey: 'promoted.trending',
    color: 'from-primary to-secondary',
    badge: 'bg-primary',
  },
  spotlight: {
    icon: Zap,
    labelKey: 'promoted.spotlight',
    color: 'from-blue-500 to-cyan-400',
    badge: 'bg-blue-500',
  },
};

export function PromotedCampaignsCarousel({ onViewCampaign }) {
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
      <div className="w-full py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-white/5 rounded w-64 mb-4"></div>
            <div className="h-64 bg-white/5 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de campagnes promues
  }

  const currentCampaign = campaigns[currentIndex];
  // Safe access to promotion type in case of unknown type
  const promotionInfo = PROMOTION_TYPES[currentCampaign.promotion.type] || PROMOTION_TYPES.featured;
  const PromotionIcon = promotionInfo.icon;

  return (
    <div className="w-full py-8 relative">
      <div className="absolute inset-0 bg-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Titre */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${promotionInfo.color} text-white shadow-lg`}>
              <PromotionIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {t('promoted.trending', 'Tendance')}
              </h2>
              <p className="text-gray-400 mt-1">
                {t('promoted.subtitle', 'Les projets les plus prometteurs du moment')}
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
                className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-primary"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-primary"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Carousel */}
        <div
          ref={carouselRef}
          className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl z-0" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <Card className={`border-0 bg-gradient-to-r ${promotionInfo.color} p-[1px] shadow-2xl overflow-hidden`}>
                <CardContent className="p-0 h-full">
                  <div className="bg-[#050505] rounded-[inherit] overflow-hidden h-full">
                    <div className="grid md:grid-cols-2 gap-8 p-8 items-center">
                      {/* Image/Logo */}
                      <div className="flex items-center justify-center">
                        <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden bg-white/5 shadow-2xl">
                          {currentCampaign.logo && currentCampaign.logo.startsWith('http') ? (
                            <Image
                              src={currentCampaign.logo}
                              alt={currentCampaign.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-8xl">
                              {currentCampaign.logo}
                            </div>
                          )}

                          {/* Badge promotion */}
                          <div className="absolute top-4 right-4">
                            <Badge className={`${promotionInfo.badge} text-white flex items-center gap-2 px-3 py-1.5 border-none shadow-lg`}>
                              <PromotionIcon className="w-4 h-4" />
                              {t(promotionInfo.labelKey)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="flex flex-col justify-center">
                        <Badge className="w-fit mb-4 bg-white/10 text-gray-300 border-none px-3 py-1">
                          {currentCampaign.category}
                        </Badge>

                        <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                          {currentCampaign.name}
                        </h3>

                        <p className="text-gray-400 mb-8 line-clamp-3 leading-relaxed text-lg">
                          {currentCampaign.description || 'Description non disponible'}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-2xl font-bold text-primary shadow-glow">
                              {currentCampaign.progress.toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-1">{t('promoted.progress', 'Progression')}</div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-2xl font-bold text-white">
                              {parseFloat(currentCampaign.raised).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-1">{t('promoted.raised', 'Levés (ETH)')}</div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-2xl font-bold text-white">
                              {currentCampaign.investors}
                            </div>
                            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-1">{t('promoted.investors', 'Inv.')}</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-8">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${currentCampaign.progress}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className={`h-full bg-gradient-to-r ${promotionInfo.color} shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
                          />
                        </div>

                        {/* CTA */}
                        <Button
                          onClick={() => onViewCampaign?.(currentCampaign)}
                          className={`w-full bg-gradient-to-r ${promotionInfo.color} hover:contrast-125 text-white font-bold py-6 text-lg rounded-xl shadow-lg transition-all`}
                        >
                          {t('promoted.discover', 'Découvrir le projet')}
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
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                  ? `w-8 bg-gradient-to-r ${promotionInfo.color}`
                  : 'w-2 bg-white/20'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Campagnes count */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            {currentIndex + 1} / {campaigns.length} {t('promoted.count', 'Projets en une')}
          </p>
        </div>
      </div>
    </div>
  );
}
