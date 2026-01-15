"use client";

import { useMemo } from 'react';
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useTranslation } from '@/hooks/useLanguage';
import {
  Wallet,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Lock,
  ArrowUpRight,
  Activity
} from 'lucide-react';

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const raisedFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 6,
});

export function LandingInfoSection({ darkMode, stats, statsLoading }) {
  const { t } = useTranslation();

  const figures = useMemo(() => {
    const users = stats?.users ?? 0;
    const campaigns = stats?.campaigns ?? 0;
    const totalRaised = stats?.totalRaised ?? 0;

    return [
      {
        label: t('landing.cta.activeUsers', 'Active Traders'),
        value: users,
        formatter: (value) => numberFormatter.format(Math.max(0, value)),
      },
      {
        label: t('landing.cta.fundsRaised', 'Total Volume'),
        value: totalRaised,
        formatter: (value) => `${raisedFormatter.format(Math.max(0, value))} ETH`,
      },
      {
        label: t('landing.cta.projectsFunded', 'Ventures'),
        value: campaigns,
        formatter: (value) => numberFormatter.format(Math.max(0, value)),
      },
    ];
  }, [stats, t]);

  return (
    <section id="features" className="relative z-10 py-24 px-4 bg-background">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              {t('landing.info.titlePrefix')} <span className="text-primary">{t('landing.info.titleSuffix')}</span>
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              {t('landing.info.description')}
            </p>
          </div>
          <div className="flex gap-4">
            {figures.map((stat, i) => (
              <div key={i} className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 min-w-[140px]">
                <div className="text-2xl font-mono font-bold text-white">
                  {statsLoading ? '...' : stat.formatter(stat.value)}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">

          {/* Feature 1: Main Large Card */}
          <motion.div
            className="md:col-span-2 lg:col-span-2 row-span-2 rounded-3xl bg-card border border-white/10 p-8 relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe className="w-48 h-48 text-primary" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-white">{t('landing.info.realTimeTitle')}</h3>
                <p className="text-gray-400 max-w-sm">
                  {t('landing.info.realTimeDesc')}
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-sm text-gray-500 mb-1">{t('landing.info.latency')}</div>
                  <div className="text-xl font-mono text-primary font-bold">{"<"}50ms</div>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-sm text-gray-500 mb-1">{t('landing.info.uptime')}</div>
                  <div className="text-xl font-mono text-primary font-bold">99.99%</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Clean Card */}
          <motion.div
            className="md:col-span-1 lg:col-span-2 rounded-3xl bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-start justify-between mb-6">
              <Wallet className="w-8 h-8 text-white" />
              <ArrowUpRight className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('landing.info.decentralizedTitle')}</h3>
            <p className="text-sm text-gray-400">
              {t('landing.info.decentralizedDesc')}
            </p>
          </motion.div>

          {/* Feature 3: Tall Vertical */}
          <motion.div
            className="md:col-span-1 row-span-2 rounded-3xl bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 p-8 flex flex-col items-center text-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(101,163,13,0.3)] animate-pulse">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('landing.info.securityTitle')}</h3>
            <p className="text-sm text-gray-400">
              {t('landing.info.securityDesc')}
            </p>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            className="md:col-span-1 lg:col-span-1 rounded-3xl bg-white/5 border border-white/10 p-8 hover:border-primary/50 transition-colors group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Zap className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">{t('landing.info.executionTitle')}</h3>
            <p className="text-xs text-gray-500">
              {t('landing.info.executionDesc')}
            </p>
          </motion.div>

          {/* Feature 5 */}
          <motion.div
            className="md:col-span-1 lg:col-span-2 rounded-3xl bg-white/5 border border-white/10 p-8 flex items-center justify-between hover:bg-white/10 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{t('landing.info.rewardsTitle')}</h3>
              <p className="text-sm text-gray-400">{t('landing.info.rewardsDesc')}</p>
            </div>
            <div className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
