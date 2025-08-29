"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, Users, Clock, CheckCircle, Zap, Star, Diamond, Wallet } from "lucide-react";
import { apiManager } from '@/lib/services/api-manager';
import { PromotionService } from '@/lib/services/promotion-service';
import { useTranslation } from '@/hooks/useLanguage';

export function ProjectsSection({ darkMode, isLandingPage = false, onViewProject }) {
  const { t } = useTranslation();
  const [address, setAddress] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [promotions, setPromotions] = useState([]);

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

      for (const campaignAddress of campaignAddresses.slice(0, 6)) { // Limiter à 6 pour l'affichage
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
            description: campaignData.description || 'Description non disponible',
            raised: campaignData.raised || '0',
            target: campaignData.goal || '0',
            backers: campaignData.investorCount || 0,
            timeLeft: campaignData.isActive ? 'En cours' : 'Terminé',
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

      // Trier par promotions (boostées en premier)
      projectsData.sort((a, b) => {
        if (a.promotion && !b.promotion) return -1;
        if (!a.promotion && b.promotion) return 1;
        if (a.promotion && b.promotion) {
          return (b.promotion.boost_type || 0) - (a.promotion.boost_type || 0);
        }
        return 0;
      });

      setProjects(projectsData);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white/5 border border-white/10 rounded-lg p-6 h-80">
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

        {/* Projets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {projects.map((project, index) => {
            const StatusIcon = getStatusIcon(project.status);
            
            return (
              <motion.div
                key={project.address || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
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
                        {project.description}
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
                          {project.raised} ETH levés
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
                          {project.backers} contributeurs
                        </span>
                      </div>
                      <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Objectif: {project.target} ETH
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
                          Projet financé
                        </>
                      ) : isLandingPage && !address ? (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Connectez-vous pour investir
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Voir le projet
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
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