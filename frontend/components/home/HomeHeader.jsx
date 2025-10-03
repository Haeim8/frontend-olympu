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
  Sparkles,
  Filter,
  BarChart3
} from 'lucide-react';

export default function HomeHeader({ 
  showFinalized, 
  setShowFinalized, 
  onCreateCampaign,
  campaignStats = { total: 0, active: 0, finalized: 0, totalRaised: 0 }
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleFilterChange = (newFilter) => {
    setShowFinalized(newFilter);
    setMenuOpen(false);
  };

  return (
    <div className="relative">
      {/* Header Compact */}
      <div className="relative bg-gradient-to-br from-lime-50 via-white to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-lg">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-5 dark:opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-lime-400 to-blue-500"></div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Titre + Stats compacts */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 text-xs">
                  Live
                </Badge>
              </div>

              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                {t('header.title_part1')} <span className="bg-gradient-to-r from-lime-500 to-blue-600 bg-clip-text text-transparent">{t('header.title_part2')}</span>
              </h1>

              {/* Stats inline */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-200/50">
                  <BarChart3 className="h-3 w-3 text-blue-600" />
                  <span className="text-sm font-bold">{campaignStats.total}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Projets</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-200/50">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-sm font-bold">{campaignStats.active}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Actifs</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-200/50">
                  <Users className="h-3 w-3 text-purple-600" />
                  <span className="text-sm font-bold">{campaignStats.finalized}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Finalisés</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-200/50">
                  <DollarSign className="h-3 w-3 text-orange-600" />
                  <span className="text-sm font-bold">{campaignStats.totalRaised.toFixed(1)}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">ETH</span>
                </div>
              </div>
            </div>

            {/* Actions compactes */}
            <div className="flex items-center gap-2">
              {/* Filtre */}
              <div className="relative z-50">
                <Button
                  variant="outline"
                  onClick={handleMenuToggle}
                  size="sm"
                  className="bg-white dark:bg-neutral-800 backdrop-blur-sm text-xs h-8 border-2 border-gray-300 dark:border-neutral-600"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  <span>{showFinalized ? t('header.filter.finalized', 'Finalisées') : t('header.filter.ongoing', 'En cours')}</span>
                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </Button>

                {menuOpen && (
                  <>
                    {/* Overlay */}
                    <div
                      className="fixed inset-0 z-[60]"
                      onClick={() => setMenuOpen(false)}
                    />

                    {/* Menu Dropdown - PRIORITÉ MAXIMALE */}
                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-950 rounded-xl shadow-2xl border-2 border-gray-300 dark:border-neutral-700 z-[70] overflow-hidden min-w-[200px]">
                      <div className="p-2">
                        <button
                          onClick={() => handleFilterChange(false)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                            !showFinalized
                              ? 'bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-300'
                              : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${!showFinalized ? 'bg-lime-500' : 'bg-gray-400'}`}></div>
                          <span>{t('header.filter.ongoing', 'En cours')}</span>
                        </button>

                        <button
                          onClick={() => handleFilterChange(true)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                            showFinalized
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${showFinalized ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                          <span>{t('header.filter.finalized', 'Finalisées')}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Bouton Créer compact */}
              <Button
                onClick={onCreateCampaign}
                size="sm"
                className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white shadow-lg group h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1 group-hover:rotate-90 transition-transform" />
                <span className="font-semibold">{t('header.create_campaign', 'Créer')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
