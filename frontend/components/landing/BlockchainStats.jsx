"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Target, Activity, Share2, Globe } from "lucide-react";
import { useTranslation } from '@/hooks/useLanguage';

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const raisedFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export function BlockchainStats({ darkMode, stats, statsLoading }) {
  const { t } = useTranslation();

  const [networkStatus, setNetworkStatus] = useState("Online");
  const [blockTime, setBlockTime] = useState("2.0s");
  const [gasPrice, setGasPrice] = useState("0.001 Gwei");

  // Simulate network stats (could be real if we had a provider hook here)
  useEffect(() => {
    const interval = setInterval(() => {
      setGasPrice(`${(Math.random() * 0.005).toFixed(4)} Gwei`);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative z-10 py-16 px-4 border-b border-white/5 bg-background">
      <div className="max-w-7xl mx-auto">

        {/* Network Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 mb-12 backdrop-blur-md">
          <div className="flex items-center gap-6 text-sm font-mono text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-300">{t('landing.stats.networkStatus')}: Base Mainnet</span>
            </div>
            <div className="flex items-center gap-2 hidden sm:flex">
              <Activity className="w-4 h-4 text-primary" />
              <span>{t('landing.stats.blockTime')}: {blockTime}</span>
            </div>
            <div className="flex items-center gap-2 hidden sm:flex">
              <Share2 className="w-4 h-4 text-blue-400" />
              <span>{t('landing.stats.gasPrice')}: {gasPrice}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">
            {t('landing.stats.systemOperational')}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Total Value Locked */}
          <div className="p-6 rounded-2xl bg-[#0a0a0f] border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-24 h-24 text-primary" />
            </div>
            <div className="text-sm text-gray-400 font-medium mb-1">{t('landing.stats.ethCollected')}</div>
            <div className="text-4xl font-bold text-white mb-2 tracking-tight">
              {statsLoading ? '...' : `${raisedFormatter.format(Math.max(0, stats?.totalRaised || 0))} Ξ`}
            </div>
            <div className="text-xs text-primary bg-primary/10 inline-block px-2 py-0.5 rounded border border-primary/20">
              {t('landing.stats.weeklyGrowth')}
            </div>
          </div>

          {/* Active Users */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <span className="text-xs text-gray-500">Live</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? '...' : numberFormatter.format(Math.max(0, stats?.users || 0))}
            </div>
            <div className="text-xs text-gray-400">{t('landing.stats.registeredUsers')}</div>
          </div>

          {/* Active Campaigns */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-6 h-6 text-purple-400" />
              <span className="text-xs text-gray-500">Global</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? '...' : numberFormatter.format(Math.max(0, stats?.campaigns || 0))}
            </div>
            <div className="text-xs text-gray-400">{t('landing.stats.activeCampaigns')}</div>
          </div>

          {/* Smart Contract Status */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-green-400">{t('landing.stats.verifiedContracts')}</div>
            </div>
            <div className="text-xs text-gray-400 leading-relaxed">
              {t('landing.stats.verifiedDesc')}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
