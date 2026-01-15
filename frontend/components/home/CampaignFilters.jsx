"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  CheckCircle,
  Star,
  ChevronDown,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

export default function CampaignFilters({
  filters = {},
  onFiltersChange,
  totalCount = 0,
  activeCount = 0
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedSectors, setSelectedSectors] = useState(filters.sectors || []);
  const [priceRange, setPriceRange] = useState(filters.priceRange || { min: '', max: '' });
  const [sortBy, setSortBy] = useState(filters.sortBy || 'newest');
  const [showOnlyVerified, setShowOnlyVerified] = useState(filters.verified || false);
  const [showOnlyHot, setShowOnlyHot] = useState(filters.hot || false);

  const sectors = [
    { value: 'Tech', label: 'Tech', icon: '💻' },
    { value: 'Finance', label: 'Finance', icon: '💰' },
    { value: 'DeFi', label: 'DeFi', icon: '🔗' },
    { value: 'Gaming', label: 'Gaming', icon: '🎮' },
    { value: 'NFT', label: 'NFT', icon: '🖼️' },
    { value: 'Blockchain', label: 'Blockchain', icon: '⛓️' },
    { value: 'Infrastructure', label: 'Infra', icon: '🏗️' },
    { value: 'Industrie', label: 'Industrie', icon: '🏭' }
  ];

  const sortOptions = [
    { value: 'newest', label: t('filters.sort.newest', 'Plus récents') },
    { value: 'oldest', label: t('filters.sort.oldest', 'Plus anciens') },
    { value: 'mostFunded', label: t('filters.sort.mostFunded', 'Plus financés') },
    { value: 'mostPopular', label: t('filters.sort.mostPopular', 'Populaires') },
  ];

  const handleSectorToggle = (sector) => {
    const newSectors = selectedSectors.includes(sector)
      ? selectedSectors.filter(s => s !== sector)
      : [...selectedSectors, sector];

    setSelectedSectors(newSectors);
    applyFilters({ sectors: newSectors });
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    applyFilters({ search: value });
  };

  const applyFilters = (newFilters) => {
    const updatedFilters = {
      search: searchTerm,
      sectors: selectedSectors,
      priceRange,
      sortBy,
      verified: showOnlyVerified,
      hot: showOnlyHot,
      ...newFilters
    };
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedSectors([]);
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
    setShowOnlyVerified(false);
    setShowOnlyHot(false);
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedSectors.length > 0) count++;
    if (priceRange.min || priceRange.max) count++;
    if (showOnlyVerified) count++;
    if (showOnlyHot) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <motion.div
      className="space-y-4 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Search & Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Search Input */}
        <div className="relative flex-1 group">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t('filters.searchPlaceholder', 'Rechercher une campagne...')}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm text-foreground placeholder:text-muted-foreground font-medium shadow-sm"
            />
            {searchTerm && (
              <motion.button
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-xl transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="relative sm:w-52 group">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              applyFilters({ sortBy: e.target.value });
            }}
            className="w-full appearance-none px-5 py-4 pr-12 bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm text-foreground cursor-pointer font-medium shadow-sm hover:border-border"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-popover text-popover-foreground">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" />
        </div>

        {/* Advanced Filters Toggle */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm transition-all shadow-sm
            ${isExpanded
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
              : 'bg-card/50 backdrop-blur-md border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground hover:bg-card'
            }
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{t('filters.title', 'Filtres')}</span>
          {activeFiltersCount > 0 && (
            <Badge className={`ml-1 text-xs px-2 py-0.5 rounded-full ${isExpanded
              ? 'bg-white/20 text-white'
              : 'bg-primary text-primary-foreground'
              }`}>
              {activeFiltersCount}
            </Badge>
          )}
        </motion.button>
      </div>

      {/* Quick Filters - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowOnlyVerified(!showOnlyVerified);
            applyFilters({ verified: !showOnlyVerified });
          }}
          className={`
            flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all
            ${showOnlyVerified
              ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-card/50 border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground hover:bg-card'
            }
          `}
        >
          <CheckCircle className="h-4 w-4" />
          {t('filters.certified', 'Certifiés')}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowOnlyHot(!showOnlyHot);
            applyFilters({ hot: !showOnlyHot });
          }}
          className={`
            flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all
            ${showOnlyHot
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
              : 'bg-card/50 border border-border/50 hover:border-orange-500/30 text-muted-foreground hover:text-foreground hover:bg-card'
            }
          `}
        >
          <Star className="h-4 w-4" />
          {t('filters.popular', 'Populaires')}
        </motion.button>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xl space-y-6 mt-4">

              {/* Sectors */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t('filters.sectorsTitle', 'Secteurs')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sectors.map(sector => (
                    <motion.button
                      key={sector.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSectorToggle(sector.value)}
                      className={`
                        px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all
                        ${selectedSectors.includes(sector.value)
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'bg-muted/50 border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground hover:bg-muted'
                        }
                      `}
                    >
                      {sector.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4">
                  {t('filters.priceRange', 'Fourchette de prix (ETH)')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-2 font-medium">{t('filters.min', 'Minimum')}</label>
                    <input
                      type="number"
                      placeholder="0.001"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm font-medium text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-2 font-medium">{t('filters.max', 'Maximum')}</label>
                    <input
                      type="number"
                      placeholder="1.0"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm font-medium text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-border/50">
                <div className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">{totalCount}</span> {t('filters.campaign', 'campagne')}{totalCount !== 1 ? 's' : ''}
                  <span className="mx-2">•</span>
                  <span className="font-bold text-primary">{activeCount}</span> {t('filters.active', 'active')}{activeCount !== 1 ? 's' : ''}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted flex-1 sm:flex-none"
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      {t('filters.clear', 'Effacer')}
                    </Button>
                  )}
                  <motion.button
                    onClick={() => setIsExpanded(false)}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 flex-1 sm:flex-none hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('filters.apply', 'Appliquer')}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}