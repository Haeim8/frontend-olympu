"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSmallNumber } from '@/lib/utils/formatNumber';
import { useTranslation } from '@/hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  TrendingUp,
  Search,
  Shield,
  Clock,
  Users,
  Zap,
  Star,
  Flame,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  Rocket
} from 'lucide-react';

// Single Campaign Row Component
function CampaignRow({ project, index, onViewDetails, promotion }) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const progressPercentage = ((parseFloat(project.raised) / parseFloat(project.goal)) * 100) || 0;
  const isNearCompletion = progressPercentage >= 80;
  const isHotProject = progressPercentage > 50 && project.isActive;
  const isComplete = progressPercentage >= 100;

  const getPromotionBadge = () => {
    if (!promotion) return null;
    const configs = {
      0: { icon: Zap, label: t('promoted.featured', 'FEATURED'), color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
      1: { icon: Star, label: t('promoted.trending', 'TRENDING'), color: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
      2: { icon: Sparkles, label: t('promoted.spotlight', 'SPOTLIGHT'), color: 'bg-gradient-to-r from-primary to-secondary' }
    };
    const config = configs[promotion.boostType] || configs[0];
    return (
      <Badge className={`${config.color} text-white border-none text-[10px] font-bold px-2 py-0.5 shadow-md`}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatTimeRemaining = () => {
    if (!project.isActive) return { text: t('campaign.status.ended', 'Terminé'), urgent: false };
    const now = new Date();
    const endDate = new Date(project.endDate);
    const timeRemaining = endDate - now;
    if (timeRemaining <= 0) return { text: t('campaign.status.ongoing', 'En cours'), urgent: false };
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 7) return { text: `${days}j`, urgent: false };
    if (days > 0) return { text: `${days}j ${hours}h`, urgent: days <= 3 };
    return { text: `${hours}h`, urgent: true };
  };

  const timeInfo = formatTimeRemaining();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(project);
    }
  };

  return (
    <motion.tr
      className={`
        group cursor-pointer transition-all duration-200
        hover:bg-muted/40
        ${isHovered ? 'bg-muted/40' : ''}
        border-b border-border/50 last:border-0
      `}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status */}
      <td className="py-4 px-1 sm:px-4 w-8 sm:w-12 text-center">
        <div className="flex items-center justify-center">
          <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px] ${project.isActive ? 'bg-green-500 shadow-green-500/50 animate-pulse' : 'bg-muted-foreground/30'}`} />
        </div>
      </td>

      {/* Name & Badges */}
      <td className="py-4 px-1 sm:px-4 max-w-[120px] sm:max-w-none">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-primary/10 flex-shrink-0">
            <span className="font-bold text-primary text-[10px] sm:text-xs">{project.name.substring(0, 2).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
              <h3 className="font-bold text-foreground text-sm sm:text-base truncate group-hover:text-primary transition-colors duration-300">
                {project.name}
              </h3>
              {project.isCertified && (
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0 fill-current/20" />
              )}
              {isHotProject && !promotion && (
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0 animate-pulse fill-current/20" />
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
              <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold bg-muted/50 border-border text-muted-foreground uppercase tracking-wider px-1 py-0 truncate">
                {project.sector}
              </Badge>
              {getPromotionBadge()}
            </div>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="py-4 px-4 text-right hidden sm:table-cell">
        <div className="font-bold text-foreground font-mono tabular-nums">
          {formatSmallNumber(project.sharePrice)} <span className="text-muted-foreground">Ξ</span>
        </div>
        <div className="text-[10px] uppercase font-semibold text-muted-foreground">{t('projectOverview.stats.perShare', 'par part')}</div>
      </td>

      {/* Progress */}
      <td className="py-4 px-4 hidden md:table-cell">
        <div className="w-36">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-bold text-foreground tabular-nums">{formatSmallNumber(project.raised)} Ξ</span>
            <span className={`font-mono font-bold ${isComplete ? 'text-green-500' : 'text-primary'}`}>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full shadow-[0_0_10px] ${isComplete
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-emerald-500/50'
                : isNearCompletion
                  ? 'bg-gradient-to-r from-orange-400 to-yellow-500 shadow-orange-500/50'
                  : 'bg-gradient-to-r from-primary to-secondary shadow-primary/50'
                }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </td>

      {/* Investors */}
      <td className="py-4 px-4 text-center hidden lg:table-cell">
        <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-muted/30 border border-transparent group-hover:border-border/50 transition-all">
          <Users className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="font-bold text-foreground text-sm tabular-nums">{project.investors || 0}</span>
        </div>
      </td>

      {/* Time Remaining */}
      <td className="py-4 px-4 hidden lg:table-cell">
        <div className={`
          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
          ${timeInfo.urgent
            ? 'bg-red-500/10 text-red-500 border-red-500/20'
            : 'bg-muted/30 text-muted-foreground border-transparent'
          }
        `}>
          <Clock className="w-3 h-3" />
          {timeInfo.text}
        </div>
      </td>

      {/* Action */}
      <td className="py-4 px-4 text-right">
        <motion.button
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-primary hover:text-primary-foreground text-muted-foreground font-bold text-xs uppercase tracking-wide transition-all shadow-sm hover:shadow-primary/25 border border-border group-hover:border-primary/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="hidden sm:inline">{t('campaign.viewDetails', 'Détails')}</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </td>
    </motion.tr>
  );
}

// Skeleton Row Component
function SkeletonRow({ index }) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-4 px-4"><div className="w-2.5 h-2.5 bg-muted rounded-full mx-auto animate-pulse" /></td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </td>
      <td className="py-4 px-4 hidden sm:table-cell"><div className="h-4 w-12 bg-muted rounded ml-auto animate-pulse" /></td>
      <td className="py-4 px-4 hidden md:table-cell"><div className="h-2 w-24 bg-muted rounded-full animate-pulse" /></td>
      <td className="py-4 px-4 hidden lg:table-cell"><div className="h-6 w-16 bg-muted rounded-full mx-auto animate-pulse" /></td>
      <td className="py-4 px-4 hidden lg:table-cell"><div className="h-6 w-20 bg-muted rounded-full animate-pulse" /></td>
      <td className="py-4 px-4"><div className="h-8 w-20 bg-muted rounded-lg animate-pulse ml-auto" /></td>
    </tr>
  );
}

// Empty State Component
function EmptyState({ type, onRefresh, t }) {
  const configs = {
    noProjects: {
      icon: Rocket,
      title: t('campaigns.empty.title', 'Aucune campagne disponible'),
      description: t('campaigns.empty.description', 'Soyez le premier à lancer votre projet !')
    },
    noFiltered: {
      icon: Search,
      title: t('campaigns.no_results', 'Aucun résultat'),
      description: t('campaigns.no_results_desc', 'Essayez d\'ajuster vos filtres')
    },
    error: {
      icon: Zap,
      title: t('campaigns.error.title', 'Erreur de chargement'),
      description: t('campaigns.error.description', 'Une erreur est survenue')
    }
  };

  const config = configs[type] || configs.noProjects;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(112,0,255,0.2)]">
        <Icon className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2">{config.title}</h3>
      <p className="text-muted-foreground mb-8 max-w-sm text-center">{config.description}</p>
      <Button
        onClick={onRefresh}
        className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-xl px-8 py-6 shadow-lg shadow-primary/25 font-bold"
      >
        <RefreshCw className="w-5 h-5 mr-2" />
        {t('campaigns.refresh', 'Actualiser')}
      </Button>
    </div>
  );
}

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

  // Load active promotions
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const res = await fetch('/api/promotions?includeExpired=true');
        const data = await res.json();
        setPromotions(data.promotions || []);
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

  // Sort projects
  const promotionsArray = Array.isArray(promotions) ? promotions : [];
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    // Boosted campaigns first
    const promotionA = promotionsArray.find(p =>
      p.campaign_address?.toLowerCase() === a.address?.toLowerCase()
    );
    const promotionB = promotionsArray.find(p =>
      p.campaign_address?.toLowerCase() === b.address?.toLowerCase()
    );

    if (promotionA && !promotionB) return -1;
    if (!promotionA && promotionB) return 1;

    return b.isActive - a.isActive;
  });

  const getPromotion = (project) => {
    return promotionsArray.find(p =>
      p.campaign_address?.toLowerCase() === project.address?.toLowerCase()
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-4 px-4 w-12"></th>
              <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('campaignGrid.project', 'Projet')}</th>
              <th className="py-4 px-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{t('campaignGrid.price', 'Prix')}</th>
              <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t('campaignGrid.progress', 'Progression')}</th>
              <th className="py-4 px-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t('campaignGrid.investors', 'Investisseurs')}</th>
              <th className="py-4 px-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t('campaignGrid.time', 'Temps')}</th>
              <th className="py-4 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} index={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  // Error State
  if (error) {
    return <EmptyState type="error" onRefresh={onRefresh} t={t} />;
  }

  // Empty State
  if (!projects || projects.length === 0) {
    return <EmptyState type="noProjects" onRefresh={onRefresh} t={t} />;
  }

  if (filteredProjects.length === 0) {
    return <EmptyState type="noFiltered" onRefresh={onRefresh} t={t} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {showFinalized ? t('campaigns.finalized_title', 'Campagnes finalisées') : t('campaigns.ongoing_title', 'Campagnes en cours')}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              {sortedProjects.length} {t('projects', 'projet')}{sortedProjects.length !== 1 ? 's' : ''} • <span className="text-green-500">Live Updates</span>
            </p>
          </div>
        </div>

        <Button
          onClick={onRefresh}
          variant="outline"
          className="rounded-xl border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('campaigns.refresh', 'Actualiser')}
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div
        className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="py-4 px-1 sm:px-4 w-8 sm:w-12 text-center">
                  <span className="sr-only">Status</span>
                </th>
                <th className="py-4 px-1 sm:px-4 text-left">
                  <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group">
                    {t('project', 'Projet')}
                    <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </th>
                <th className="py-4 px-4 text-right hidden sm:table-cell">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('wallet.nft.unitPrice', 'Prix / Part')}</span>
                </th>
                <th className="py-4 px-4 text-left hidden md:table-cell">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('progress', 'Progression')}</span>
                </th>
                <th className="py-4 px-4 text-center hidden lg:table-cell">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('campaign.card.investors', 'Investisseurs')}</span>
                </th>
                <th className="py-4 px-4 text-left hidden lg:table-cell">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('landing.projects.timeRemaining', 'Temps restant')}</span>
                </th>
                <th className="py-4 px-1 sm:px-4 w-12 sm:w-auto">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sortedProjects.map((project, index) => (
                  <CampaignRow
                    key={project.id}
                    project={project}
                    index={index}
                    onViewDetails={onViewDetails}
                    promotion={getPromotion(project)}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="flex justify-center pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/50 text-sm text-muted-foreground font-medium">
          <span className="font-bold text-foreground shadow-glow">{sortedProjects.length}</span>
          {t('campaigns.campaign', 'campagne')}{sortedProjects.length !== 1 ? 's' : ''} {showFinalized ? t('campaign.status.finalized', 'finalisée') : t('campaigns.active', 'active')}{sortedProjects.length !== 1 ? 's' : ''}
        </div>
      </motion.div>
    </div>
  );
}