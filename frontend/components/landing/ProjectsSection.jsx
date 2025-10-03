"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, Users, Clock, CheckCircle, Zap, Star, Diamond, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { apiManager } from '@/lib/services/api-manager';
import { PromotionService } from '@/lib/services/promotion-service';
import { useTranslation } from '@/hooks/useLanguage';

export function ProjectsSection({ darkMode, isLandingPage = false, onViewProject }) {
  const { t } = useTranslation();
  const [address, setAddress] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [promotions, setPromotions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayRef = useRef(null);

  // Récupérer l'adresse du wallet
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        })
        .catch(console.error);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Charger les campagnes
      const campaignAddresses = await apiManager.getAllCampaigns();
      const projectsData = [];

      // Charger les promotions actives
      const activePromotions = await PromotionService.getActivePromotions();
      setPromotions(activePromotions);

      for (const campaignAddress of campaignAddresses.slice(0, 20)) { // Charger plus pour trier
        try {
          const campaignData = await apiManager.getCampaignData(campaignAddress);
          if (!campaignData) continue;

          // Vérifier si la campagne est boostée
          const promotion = activePromotions.find(p => 
            p.campaign_address?.toLowerCase() === campaignAddress.toLowerCase()
          );

          const progress = ((parseFloat(campaignData.raised || 0) / parseFloat(campaignData.goal || 1)) * 100) || 0;
          
          let status = 'active';
          if (progress >= 100) status = 'funded';
          else if (progress >= 80) status = 'nearly_funded';

          projectsData.push({
            address: campaignAddress,
            title: campaignData.name || 'Campaign',
            description: campaignData.description || '',
            raised: campaignData.raised || '0',
            target: campaignData.goal || '0',
            backers: campaignData.investorCount || 0,
            timeLeft: campaignData.isActive ? t('campaign.status.ongoing') : t('campaign.status.completed'),
            status: status,
            image: campaignData.logo || '🚀',
            tags: [campaignData.category || 'Startup'],
            progress: Math.min(progress, 100),
            isActive: campaignData.isActive,
            promotion: promotion
          });
        } catch (error) {
          console.warn(`Erreur campagne ${campaignAddress}:`, error);
        }
      }

      // Trier par popularité (nombre d'investisseurs)
      projectsData.sort((a, b) => {
        // D'abord les campagnes promues
        if (a.promotion && !b.promotion) return -1;
        if (!a.promotion && b.promotion) return 1;
        // Ensuite par nombre d'investisseurs (popularité)
        return b.backers - a.backers;
      });

      // Garder seulement les 5 plus populaires
      setProjects(projectsData.slice(0, 5));
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Auto-scroll carousel
  useEffect(() => {
    if (projects.length <= 3) return; // Pas besoin d'auto-scroll si 3 ou moins

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % projects.length);
    }, 4000); // Change toutes les 4 secondes

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [projects.length]);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Erreur connexion wallet:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "from-blue-400 to-blue-600";
      case "nearly_funded": return "from-orange-400 to-orange-600";
      case "funded": return "from-green-400 to-green-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active": return Clock;
      case "nearly_funded": return TrendingUp;
      case "funded": return CheckCircle;
      default: return Clock;
    }
  };

  const getPromotionBadge = (promotion) => {
    if (!promotion) return null;

    const badges = {
      0: { icon: Zap, label: 'FEATURED', color: 'from-blue-500 to-blue-600', emoji: '🔥' },
      1: { icon: Star, label: 'TRENDING', color: 'from-yellow-500 to-orange-500', emoji: '⭐' },
      2: { icon: Diamond, label: 'SPOTLIGHT', color: 'from-purple-500 to-pink-500', emoji: '💎' }
    };

    const badge = badges[promotion.boost_type] || badges[0];
    const PromotionIcon = badge.icon;

    return (
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-gradient-to-r ${badge.color} text-white text-xs animate-pulse`}>
        <PromotionIcon className="w-3 h-3" />
        <span>{badge.label}</span>
      </div>
    );
  };

  const handleProjectClick = (project) => {
    if (isLandingPage && !address) {
      connectWallet();
      return;
    }

    if (onViewProject) {
      onViewProject(project);
    }
  };

  if (isLoading) {
    return (
      <section id="projets" className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 w-64 mx-auto mb-4 rounded"></div>
            <div className="animate-pulse bg-gray-200 dark:bg-gray-600 h-4 w-96 mx-auto rounded"></div>
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-full md:w-1/3 animate-pulse bg-white/5 border border-white/10 rounded-lg p-6 h-80">
                <div className="bg-gray-300 dark:bg-gray-700 h-4 w-3/4 mb-4 rounded"></div>
                <div className="bg-gray-200 dark:bg-gray-600 h-3 w-full mb-2 rounded"></div>
                <div className="bg-gray-200 dark:bg-gray-600 h-3 w-2/3 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projets" className="relative z-10 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Titre */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
            {isLandingPage ? t('landing.projects.title') : t('campaigns.active')}
          </h2>
          <p className={`text-sm max-w-2xl mx-auto ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {isLandingPage 
              ? t('landing.projects.subtitle')
              : t('campaigns.investSubtitle')
            }
          </p>
        </motion.div>

        {/* Carousel - UNE SEULE LIGNE */}
        <div className="relative mb-12">
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-6"
              animate={{ x: `-${currentIndex * (100 / 3)}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {projects.map((project, index) => {
            const StatusIcon = getStatusIcon(project.status);
            
            return (
              <motion.div
                key={project.address || index}
                className="flex-shrink-0 w-full md:w-1/3"
                whileHover={{ y: -5 }}
              >
                <Card className={`h-full relative ${
                  darkMode 
                    ? "bg-white/5 border border-white/10" 
                    : "bg-white/80 border border-white/30"
                } backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 ${
                  project.promotion ? 'ring-2 ring-yellow-400/50' : ''
                }`}>
                  <CardContent className="p-6">
                    {/* Badge promotion en haut */}
                    {project.promotion && (
                      <div className="absolute -top-2 -right-2">
                        {getPromotionBadge(project.promotion)}
                      </div>
                    )}

                    {/* Header avec emoji et statut */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl">{project.image}</div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-gradient-to-r ${getStatusColor(project.status)} text-white text-xs`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{project.timeLeft}</span>
                      </div>
                    </div>

                    {/* Titre et description */}
                    <div className="mb-4">
                      <h3 className={`text-lg font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {project.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {project.description || t('landing.projects.noDescription')}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            darkMode 
                              ? "bg-lime-500/20 text-lime-400" 
                              : "bg-lime-500/20 text-lime-600"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                          {project.raised} {t('landing.projects.ethRaised')}
                        </span>
                        <span className="text-lime-500 font-medium">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-lime-400 to-green-500 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${project.progress}%` }}
                          transition={{ duration: 1.5, delay: index * 0.2 }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-lime-500" />
                        <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                          {project.backers} {t('campaign.contributors')}
                        </span>
                      </div>
                      <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {t('landing.projects.goal')}: {project.target} ETH
                      </span>
                    </div>

                    {/* Bouton */}
                    <Button
                      onClick={() => handleProjectClick(project)}
                      className="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0 text-sm"
                      disabled={project.status === 'funded'}
                    >
                      {project.status === 'funded' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t('campaign.status.funded')}
                        </>
                      ) : isLandingPage && !address ? (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          {t('campaign.connectToInvest')}
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {t('campaign.viewProject')}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
            </motion.div>
          </div>

          {/* Flèches navigation */}
          {projects.length > 3 && (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length)}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full ${
                  darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
                } backdrop-blur-lg flex items-center justify-center transition-all`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % projects.length)}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full ${
                  darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
                } backdrop-blur-lg flex items-center justify-center transition-all`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <Button
            className="px-8 py-3 bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0 font-semibold shadow-xl"
          >
            {t('landing.projects.viewAll')}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}