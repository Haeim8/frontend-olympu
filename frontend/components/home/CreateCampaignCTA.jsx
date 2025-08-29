"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useTranslation } from '@/hooks/useLanguage';
import { 
  Plus, 
  Sparkles, 
  ArrowRight,
  Zap,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';

export default function CreateCampaignCTA({ 
  onClick,
  campaignStats = { total: 0, success: 0, totalRaised: 0 }
}) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const benefits = [
    {
      icon: Shield,
      text: t('cta.benefits.security', 'Sécurité blockchain'),
      color: "text-blue-500"
    },
    {
      icon: Users, 
      text: t('cta.benefits.community', 'Communauté active'),
      color: "text-purple-500"
    },
    {
      icon: TrendingUp,
      text: t('cta.benefits.growth', 'Croissance rapide'), 
      color: "text-green-500"
    }
  ];

  return (
    <div className="relative group">
      {/* Card principale */}
      <div className="relative overflow-hidden bg-gradient-to-br from-lime-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-lime-400 to-blue-500"></div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <defs>
              <pattern id="cta-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-lime-100 dark:bg-lime-900/20 rounded-lg">
                  <Zap className="h-5 w-5 text-lime-600 dark:text-lime-400" />
                </div>
                <span className="text-sm font-semibold text-lime-700 dark:text-lime-300 tracking-wide uppercase">
                  {t('cta.launch_project', 'Lancez votre projet')}
                </span>
              </div>
              
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {t('cta.title_part1', 'Créez votre campagne')}
                  <span className="block bg-gradient-to-r from-lime-500 to-blue-600 bg-clip-text text-transparent">
                    {t('cta.title_part2', 'de financement')}
                  </span>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                  {t('cta.description', 'Transformez votre idée en réalité avec notre plateforme sécurisée')}
                </p>
              </div>
            </div>

            {/* Stats Circle */}
            <div className="hidden md:block">
              <div className="relative w-20 h-20 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-lime-600 dark:text-lime-400">
                    {campaignStats.total}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('cta.stats.projects', 'projets')}
                  </div>
                </div>
                {/* Pulsing ring */}
                <div className="absolute inset-0 rounded-full border-2 border-lime-500/30 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-neutral-700/50 transition-all duration-300 hover:scale-105"
              >
                <div className={`p-2 bg-gray-100 dark:bg-neutral-700 rounded-lg ${benefit.color}`}>
                  <benefit.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <Button
              onClick={onClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group relative overflow-hidden bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-8 py-4 text-lg rounded-xl min-w-[200px]"
            >
              {/* Background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-lime-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Content */}
              <span className="relative flex items-center justify-center gap-3">
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>{t('cta.create_button', 'Créer ma campagne')}</span>
                <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${
                  isHovered ? 'translate-x-1' : ''
                }`} />
              </span>

              {/* Sparkle animation */}
              <Sparkles className="absolute top-1 right-1 h-4 w-4 text-white/60 animate-pulse" />
              <Sparkles className="absolute bottom-1 left-1 h-3 w-3 text-white/40 animate-pulse delay-500" />
            </Button>

            {/* Additional info */}
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{t('cta.quick_setup', 'Configuration en 5 minutes')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></div>
                <span>{t('cta.support', 'Support 24/7')}</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-200/50 dark:border-neutral-700/50">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {campaignStats.totalRaised.toFixed(1)}M€
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('cta.stats.total_raised', 'Total levé')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {Math.round((campaignStats.success / Math.max(campaignStats.total, 1)) * 100)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('cta.stats.success_rate', 'Taux de succès')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                2-4
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('cta.stats.avg_weeks', 'Sem. moyennes')}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-lime-400/20 to-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-lg animate-pulse delay-1000"></div>

        {/* Hover glow effect */}
        <div className={`absolute inset-0 rounded-3xl transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-lime-500/10 to-blue-500/10 blur-xl"></div>
        </div>
      </div>

      {/* External glow on hover */}
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r from-lime-500/20 to-blue-500/20 blur-2xl transition-opacity duration-500 -z-10 ${
        isHovered ? 'opacity-60' : 'opacity-0'
      }`}></div>
    </div>
  );
}