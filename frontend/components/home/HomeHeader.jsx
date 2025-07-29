"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-lime-50 via-white to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
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

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Titre et Description */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1">
                  Live
                </Badge>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent leading-tight">
                  Projets en cours de
                  <span className="block bg-gradient-to-r from-lime-500 to-blue-600 bg-clip-text text-transparent">
                    financement
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                  Découvrez et investissez dans les projets les plus innovants de l'écosystème blockchain. 
                  Chaque investissement est sécurisé et transparent.
                </p>
              </div>

              {/* Stats Rapides */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {campaignStats.total}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Projets</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {campaignStats.active}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Actifs</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {campaignStats.finalized}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Finalisés</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {campaignStats.totalRaised.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ETH levés</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions et Filtres */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              {/* Filtre de vue */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={handleMenuToggle}
                  className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-gray-200/50 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800 min-w-[200px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">
                      {showFinalized ? 'Campagnes finalisées' : 'Campagnes en cours'}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${menuOpen ? 'transform rotate-180' : ''}`} />
                </Button>

                {menuOpen && (
                  <>
                    {/* Overlay */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    
                    {/* Menu Dropdown */}
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-950 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 z-50 overflow-hidden">
                      <div className="p-2">
                        <button
                          onClick={() => handleFilterChange(false)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center gap-3 ${
                            !showFinalized 
                              ? 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300' 
                              : 'hover:bg-gray-50 dark:hover:bg-neutral-900 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${!showFinalized ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                          <div>
                            <p className="font-medium">Campagnes en cours</p>
                            <p className="text-sm opacity-70">Projets actuellement ouverts aux investissements</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleFilterChange(true)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center gap-3 ${
                            showFinalized 
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                              : 'hover:bg-gray-50 dark:hover:bg-neutral-900 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${showFinalized ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                          <div>
                            <p className="font-medium">Campagnes finalisées</p>
                            <p className="text-sm opacity-70">Projets ayant atteint leurs objectifs</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Bouton Créer Campagne */}
              <Button
                onClick={onCreateCampaign}
                className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-8 py-6 text-lg rounded-xl group"
              >
                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                <span>Créer campagne</span>
                <Sparkles className="h-4 w-4 ml-2 animate-pulse" />
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-lime-400/20 to-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-lg animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}