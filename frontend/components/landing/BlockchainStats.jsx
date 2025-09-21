"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Target } from "lucide-react";
import { useTranslation } from '@/hooks/useLanguage';

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const raisedFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export function BlockchainStats({ darkMode, stats, statsLoading }) {
  const { t } = useTranslation();
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    campaigns: 0,
    totalRaised: 0,
  });

  useEffect(() => {
    if (statsLoading) {
      return;
    }

    const targetUsers = stats?.users ?? 0;
    const targetCampaigns = stats?.campaigns ?? 0;
    const targetRaised = stats?.totalRaised ?? 0;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep += 1;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        users: Math.floor(easedProgress * targetUsers),
        campaigns: Math.floor(easedProgress * targetCampaigns),
        totalRaised: easedProgress * targetRaised,
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          users: targetUsers,
          campaigns: targetCampaigns,
          totalRaised: targetRaised,
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [stats, statsLoading]);

  const statCards = [
    {
      icon: Users,
      value: animatedStats.users,
      formatter: (value) => numberFormatter.format(Math.max(0, value)),
      label: t('landing.stats.registeredUsers'),
      color: "from-blue-400 to-blue-600",
    },
    {
      icon: Target,
      value: animatedStats.campaigns,
      formatter: (value) => numberFormatter.format(Math.max(0, value)),
      label: t('landing.stats.activeCampaigns'),
      color: "from-purple-400 to-purple-600",
    },
    {
      icon: TrendingUp,
      value: animatedStats.totalRaised,
      formatter: (value) => `${raisedFormatter.format(Math.max(0, value))} Ξ`,
      label: t('landing.stats.ethCollected'),
      color: "from-lime-400 to-green-600",
    },
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
          {statCards.map((stat, index) => (
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
                    {statsLoading ? '...' : stat.formatter(stat.value)}
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
