"use client";

import { useMemo } from 'react';
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from '@/hooks/useLanguage';

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const raisedFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export function LandingInfoSection({ darkMode, stats, statsLoading }) {
  const { t } = useTranslation();
  
  const features = [
    {
      title: t('landing.features.decentralizedFunding.title'),
      description: t('landing.features.decentralizedFunding.description'),
      icon: "💸",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: t('landing.features.realTimeInsights.title'),
      description: t('landing.features.realTimeInsights.description'),
      icon: "📊",
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      title: t('landing.features.transparentRewards.title'),
      description: t('landing.features.transparentRewards.description'),
      icon: "🏆",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      title: t('landing.features.maxSecurity.title'),
      description: t('landing.features.maxSecurity.description'),
      icon: "🔒",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const figures = useMemo(() => {
    const users = stats?.users ?? 0;
    const campaigns = stats?.campaigns ?? 0;
    const totalRaised = stats?.totalRaised ?? 0;

    return [
      {
        label: t('landing.cta.activeUsers', 'Utilisateurs actifs'),
        value: users,
        formatter: (value) => numberFormatter.format(Math.max(0, value)),
      },
      {
        label: t('landing.cta.fundsRaised', 'Fonds levés'),
        value: totalRaised,
        formatter: (value) => `${raisedFormatter.format(Math.max(0, value))} Ξ`,
      },
      {
        label: t('landing.cta.projectsFunded', 'Projets financés'),
        value: campaigns,
        formatter: (value) => numberFormatter.format(Math.max(0, value)),
      },
    ];
  }, [stats, t]);

  return (
    <section id="fonctionnalites" className="relative z-10 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Titre principal */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
            {t('landing.features.title')}
          </h2>
          <p className={`text-sm max-w-2xl mx-auto leading-relaxed ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}>
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        {/* Grille des fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
            >
              <Card className={`h-full ${
                darkMode 
                  ? "bg-white/5 border border-white/10" 
                  : "bg-white/80 border border-white/30"
              } backdrop-blur-md shadow-2xl hover:shadow-lime-500/20 transition-all duration-300`}>
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-2xl shadow-lg transform hover:rotate-12 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className={`text-lg font-bold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Section CTA finale */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className={`${darkMode 
            ? "bg-gradient-to-r from-lime-500/10 to-green-500/10 border-lime-500/20" 
            : "bg-gradient-to-r from-lime-500/20 to-green-500/20 border-lime-500/30"
          } backdrop-blur-md shadow-2xl`}>
            <CardContent className="p-8 text-center">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
                  {t('landing.cta.title')}
                </h3>
                <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"} mb-6 leading-relaxed`}>
                  {t('landing.cta.description')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  {figures.map((figure) => (
                    <div key={figure.label} className="space-y-1">
                      <div className="text-2xl font-bold text-lime-500">
                        {statsLoading ? '...' : figure.formatter(figure.value)}
                      </div>
                      <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {figure.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
