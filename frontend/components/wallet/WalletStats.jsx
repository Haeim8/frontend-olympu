"use client";

import React from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Award,
  Coins,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { formatEth } from '@/lib/utils/formatNumber';

function StatCard({ title, value, icon: Icon, isLoading, index, colorClass }) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-opacity-10 border border-opacity-20 ${colorClass.replace('text-', 'bg-').replace('text-', 'border-')}`}>
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
            <ArrowUpRight className="h-3 w-3" />
            <span>LIVE</span>
          </div>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <div className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
          ) : (
            <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {value}
            </div>
          )}
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function WalletStats({ walletInfo, isLoading }) {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('wallet.stats.nftCount', 'NFTs Détenus'),
      value: walletInfo.totalNFTs.toString(),
      icon: Award,
      colorClass: 'text-purple-500'
    },
    {
      title: t('wallet.stats.invested', 'Total Investi'),
      value: formatEth(walletInfo.totalInvested),
      icon: Wallet,
      colorClass: 'text-blue-500'
    },
    {
      title: t('wallet.stats.supportedProjects', 'Projets Soutenus'),
      value: walletInfo.activeProjects.toString(),
      icon: TrendingUp,
      colorClass: 'text-green-500'
    },
    {
      title: t('wallet.stats.dividends', 'Dividendes Reçus'),
      value: formatEth(walletInfo.totalDividends),
      icon: Coins,
      colorClass: 'text-yellow-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 ml-1 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {t('wallet.stats.title', 'Statistiques')}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              {t('wallet.stats.subtitle', 'Aperçu global de vos performances')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
          <Activity className="h-3.5 w-3.5" />
          <span>{t('wallet.stats.updated', 'Mis à jour en temps réel')}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            isLoading={isLoading}
            index={index}
          />
        ))}
      </div>

      {/* Empty State CTA */}
      {!isLoading && walletInfo.totalNFTs === 0 && (
        <div className="rounded-2xl bg-card border border-border p-8 text-center shadow-lg">
          <div className="inline-flex p-4 rounded-2xl bg-muted mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-foreground text-xl mb-2">
            {t('wallet.stats.startInvesting', 'Commencez votre aventure')}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('wallet.stats.noInvestmentsYet', 'Vous n\'avez pas encore effectué d\'investissement. Explorez les projets disponibles pour commencer à construire votre portefeuille.')}
          </p>
        </div>
      )}
    </div>
  );
}