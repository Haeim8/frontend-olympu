"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useLanguage';
import {
  ChevronDown,
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Filter,
  ArrowUpRight,
  Target
} from 'lucide-react';

export default function HomeHeader({
  showFinalized,
  setShowFinalized,
  onCreateCampaign,
  campaignStats = { total: 0, active: 0, finalized: 0, totalRaised: 0 }
}) {
  const { t } = useTranslation();

  // Helper for Stats Card
  const StatCard = ({ icon: Icon, label, value, subtext, colorClass }) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-primary/20 group hover:bg-card/80">
      <div className={`p-2.5 rounded-lg bg-background/50 ${colorClass} group-hover:scale-110 transition-transform shadow-inner`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-lg font-bold text-foreground leading-none mb-1 tracking-tight">
          {value}
        </div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80">
          {label}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Row: Title & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {t('dashboard.title', 'Tableau de bord')}
            <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
              Live Market
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            {t('dashboard.subtitle', 'Gérez vos investissements et suivez le marché en temps réel.')}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* Create Button */}
          <Button
            onClick={onCreateCampaign}
            className="flex-1 lg:flex-none h-11 px-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('header.create_campaign', 'Créer une campagne')}
          </Button>
        </div>
      </div>

      {/* Stats Bar (Ticker Tape Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          icon={Target}
          label={t('stats.total_projects', 'Projets')}
          value={campaignStats.total}
          colorClass="text-blue-500"
        />
        <StatCard
          icon={Activity}
          label={t('stats.active', 'Actifs')}
          value={campaignStats.active}
          colorClass="text-green-500"
        />
        <StatCard
          icon={Users}
          label={t('stats.finalized', 'Finalisés')}
          value={campaignStats.finalized}
          colorClass="text-purple-500"
        />
        <StatCard
          icon={DollarSign}
          label={t('stats.raised', 'Volume (ETH)')}
          value={`${campaignStats.totalRaised.toFixed(2)}`}
          colorClass="text-yellow-500"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-1 bg-muted/40 border border-border/50 rounded-xl w-full sm:w-fit backdrop-blur-sm">
        <button
          onClick={() => setShowFinalized(false)}
          className={`
            flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all
            ${!showFinalized
              ? 'bg-card text-primary shadow-sm ring-1 ring-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }
          `}
        >
          {t('header.filter.ongoing', 'En cours')}
        </button>
        <button
          onClick={() => setShowFinalized(true)}
          className={`
            flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all
            ${showFinalized
              ? 'bg-card text-primary shadow-sm ring-1 ring-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }
          `}
        >
          {t('header.filter.finalized', 'Finalisées')}
        </button>
      </div>
    </div>
  );
}
