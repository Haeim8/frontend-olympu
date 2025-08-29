"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Target } from "lucide-react";
import { useTranslation } from '@/hooks/useLanguage';
import { apiManager } from '@/lib/services/api-manager';

export function BlockchainStats({ darkMode }) {
  const { t } = useTranslation();
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    campaigns: 0,
    totalRaised: 0
  });
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chargement des campagnes via API Manager
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const campaigns = await apiManager.getAllCampaigns();
        setAllCampaigns(campaigns);
      } catch (error) {
        console.error('Erreur chargement campagnes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  // Calcul simulé du nombre d'utilisateurs (basé sur le nombre de campagnes * estimation)
  const userCount = allCampaigns ? Math.max(allCampaigns.length * 12 + 147, 147) : 147;
  
  // Nombre de campagnes directement depuis getAllCampaigns
  const campaignCount = allCampaigns ? allCampaigns.length : 0;
  
  // SIMULATION: Montant total collecté (sera remplacé par de vraies données plus tard)
  const totalRaised = allCampaigns ? allCampaigns.length * 25.5 + 127.5 : 127.5;

  // Animation des compteurs
  useEffect(() => {
    const targetUsers = userCount; // Valeur calculée
    const targetCampaigns = campaignCount; // Nombre réel de campagnes
    const targetRaised = totalRaised; // Valeur simulée en ETH

    const duration = 2000; // 2 secondes d'animation
    const steps = 60; // 60 FPS
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Easing out cubic

      setAnimatedStats({
        users: Math.floor(easedProgress * targetUsers),
        campaigns: Math.floor(easedProgress * targetCampaigns),
        totalRaised: (easedProgress * targetRaised).toFixed(1)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          users: targetUsers,
          campaigns: targetCampaigns,
          totalRaised: targetRaised.toFixed(1)
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [allCampaigns, userCount, campaignCount, totalRaised]);

  const stats = [
    {
      icon: Users,
      value: animatedStats.users,
      label: t('landing.stats.registeredUsers'),
      suffix: "",
      color: "from-blue-400 to-blue-600"
    },
    {
      icon: Target,
      value: animatedStats.campaigns,
      label: t('landing.stats.activeCampaigns'),
      suffix: "",
      color: "from-purple-400 to-purple-600"
    },
    {
      icon: TrendingUp,
      value: animatedStats.totalRaised,
      label: t('landing.stats.ethCollected'),
      suffix: "Ξ",
      color: "from-lime-400 to-green-600"
    }
  ];

  return (
    <section className="relative z-10 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
            {t('landing.stats.realTimeTitle')}
          </h2>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {t('landing.stats.blockchainData')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className={`p-6 rounded-2xl ${
                darkMode 
                  ? "bg-white/5 border border-white/10" 
                  : "bg-white/60 border border-white/30"
              } backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {typeof stat.value === 'number' && stat.value > 0 ? stat.value : '...'}
                    <span className="text-lime-500 ml-1">{stat.suffix}</span>
                  </div>
                  <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {stat.label}
                  </div>
                </div>
              </div>
              
              {/* Barre de progression animée */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 1.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Indicateur temps réel */}
        <motion.div
          className="flex items-center justify-center mt-8 space-x-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {t('landing.stats.realTimeUpdate')}
          </span>
        </motion.div>
      </div>
    </section>
  );
}