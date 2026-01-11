"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Activity, ArrowUpRight } from "lucide-react";
import { useTranslation } from '@/hooks/useLanguage';
import { apiManager } from '@/lib/services/api-manager';

export function LandingHero({
  darkMode,
  address,
  stats,
  statsLoading,
  onAccessInterface,
}) {
  const { t } = useTranslation();
  const [terminalData, setTerminalData] = useState([]);
  const [terminalLoading, setTerminalLoading] = useState(true);

  // Fetch real campaign data for the "Terminal"
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const campaigns = await apiManager.getAllCampaigns({});
        // Format for terminal view
        const formatted = campaigns.slice(0, 5).map(c => {
          // Calculer le temps restant
          const endDate = new Date(c.endDate || c.end_date);
          const now = new Date();
          const timeRemaining = endDate - now;

          let timeStr;
          if (timeRemaining <= 0 || !c.isActive) {
            timeStr = 'Terminé';
          } else {
            const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeStr = daysRemaining > 0 ? `${daysRemaining}j` : `${hoursRemaining}h`;
          }

          return {
            name: c.name || 'Unknown Project',
            vol: `${parseFloat(c.raised || 0).toFixed(2)} ETH`,
            timeRemaining: timeStr,
            status: c.isActive && timeRemaining > 0 ? 'ACTIVE' : 'CLOSED'
          };
        });
        setTerminalData(formatted.length > 0 ? formatted : [
          { name: "Livar Demo", vol: "0.00 ETH", timeRemaining: "7j", status: "ACTIVE" },
          { name: "Green Bonds", vol: "0.00 ETH", timeRemaining: "14j", status: "ACTIVE" },
          { name: "Tech Ventures", vol: "0.00 ETH", timeRemaining: "3j", status: "ACTIVE" },
        ]);
      } catch (e) {
        console.error("Terminal data fetch error", e);
      } finally {
        setTerminalLoading(false);
      }
    };
    fetchRealData();
  }, []);

  return (
    <main id="hero" className="relative z-10 min-h-[90vh] flex flex-col justify-center pt-20 pb-12 px-4 bg-background overflow-hidden border-b border-white/5">

      {/* Background Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,rgba(101,163,13,0.15),transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

        {/* Left Column: Content */}
        <motion.div
          className="space-y-8 text-center lg:text-left"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold tracking-wider uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t('landing.hero.liveOnBase')}
          </div>

          <h1 className="text-5xl md:text-7xl font-sans font-black tracking-tight text-white leading-[1.1]">
            {t('landing.hero.titlePart1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-lime-400 to-white">
              {t('landing.hero.titlePart2')}
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Button
              onClick={onAccessInterface}
              className="h-14 px-8 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(101,163,13,0.3)] w-full sm:w-auto"
            >
              {t('landing.hero.startInvesting')} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="h-14 px-8 rounded-full border-white/20 bg-transparent text-white hover:bg-white/5 font-medium text-lg w-full sm:w-auto"
            >
              {t('landing.hero.viewDocumentation')}
            </Button>
          </div>

          <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-500 font-mono">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              {t('landing.hero.audited')}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Base Sepolia
            </div>
          </div>
        </motion.div>

        {/* Right Column: Visual / Terminal UI */}
        <motion.div
          className="relative hidden lg:block"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Mock Terminal / Dashboard Card */}
          <div className="relative rounded-2xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-1 overflow-hidden min-h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="text-xs font-mono text-gray-500">Livar • Base Mainnet</div>
            </div>

            {/* Window Content */}
            <div className="p-6 space-y-6">
              {/* Chart Mockup - Represents live activity */}
              <div className="flex items-end gap-1 h-24 w-full border-b border-white/5 pb-2 opacity-50">
                {[30, 45, 35, 60, 40, 75, 50, 70, 55, 85, 65, 90, 70, 40, 60, 50, 80, 75, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t-[2px]" style={{ height: `${h}%` }} />
                ))}
              </div>

              {/* Real Data Rows */}
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center text-gray-500 border-b border-white/5 pb-2 text-xs uppercase tracking-wider">
                  <span>{t('landing.hero.terminalMarket')}</span>
                  <span>{t('landing.hero.terminalRaised')}</span>
                  <span className="text-right">{t('landing.hero.terminalTimeRemaining', 'Temps')}</span>
                </div>

                {terminalLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-6 bg-white/5 rounded animate-pulse" />)}
                  </div>
                ) : (
                  terminalData.map((row, i) => (
                    <div key={i} className="flex justify-between items-center text-gray-200 py-1 hover:bg-white/5 px-2 -mx-2 rounded transition-colors cursor-default group">
                      <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                        <span className="font-semibold group-hover:text-primary transition-colors max-w-[150px] truncate">{row.name}</span>
                      </span>
                      <span className="font-mono text-gray-400">{row.vol}</span>
                      <span className={`font-bold text-right ${row.status === 'CLOSED' ? 'text-gray-500' : 'text-green-500'}`}>{row.timeRemaining}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between px-3 py-3 bg-black/50 rounded-lg border border-white/10 text-xs font-mono text-gray-300 mt-4">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-500">{t('landing.hero.connected', 'Connecté')}</span>
                </span>
                <span className="text-gray-500">{t('landing.hero.realTimeData', 'Données en direct')}</span>
              </div>
            </div>
          </div>

          {/* Stats Badge */}
          <div className="absolute -right-8 -bottom-8 rounded-xl bg-card border border-white/10 p-4 shadow-xl backdrop-blur-md animate-float">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <ArrowUpRight className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('landing.hero.terminalTotalVolume')}</div>
                <div className="text-xl font-bold text-white tracking-tight">
                  {statsLoading ? '...' : `${(stats?.totalRaised || 0).toFixed(1)} ETH`}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
