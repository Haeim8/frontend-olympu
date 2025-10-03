"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useLanguage';
import { 
  Filter,
  Search,
  X,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Star
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
    { value: 'Tech', label: t('filters.sectors.tech') },
    { value: 'Finance', label: t('filters.sectors.finance') },
    { value: 'DeFi', label: t('filters.sectors.defi') },
    { value: 'Gaming', label: t('filters.sectors.gaming') },
    { value: 'NFT', label: t('filters.sectors.nft') },
    { value: 'Blockchain', label: t('filters.sectors.blockchain') },
    { value: 'Infrastructure', label: t('filters.sectors.infrastructure') },
    { value: 'Industrie', label: t('filters.sectors.industry') }
  ];

  const sortOptions = [
    { value: 'newest', label: t('filters.sort.newest'), icon: Clock },
    { value: 'oldest', label: t('filters.sort.oldest'), icon: Clock },
    { value: 'mostFunded', label: t('filters.sort.mostFunded'), icon: DollarSign },
    { value: 'mostPopular', label: t('filters.sort.mostPopular'), icon: TrendingUp },
    { value: 'alphabetical', label: t('filters.sort.alphabetical'), icon: Star }
  ];

  const handleSectorToggle = (sector) => {
    const newSectors = selectedSectors.includes(sector)
      ? selectedSectors.filter(s => s !== sector)
      : [...selectedSectors, sector];
    
    setSelectedSectors(newSectors);
    applyFilters({ sectors: newSectors });
  };

  const handlePriceRangeChange = (field, value) => {
    const newRange = { ...priceRange, [field]: value };
    setPriceRange(newRange);
    applyFilters({ priceRange: newRange });
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
    <div className="space-y-4">
      {/* Barre de recherche et filtres rapides */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Tri */}
        <div className="sm:min-w-[200px]">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              applyFilters({ sortBy: e.target.value });
            }}
            className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200 appearance-none"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton filtres avancés */}
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-900"
        >
          <Filter className="h-4 w-4 mr-2" />
          {t('filters.title')}
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-lime-500 text-white text-xs px-2 py-0.5">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={showOnlyVerified ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setShowOnlyVerified(!showOnlyVerified);
            applyFilters({ verified: !showOnlyVerified });
          }}
          className={`${showOnlyVerified 
            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
            : 'border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-900'
          }`}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          {t('filters.certified')}
        </Button>

        <Button
          variant={showOnlyHot ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setShowOnlyHot(!showOnlyHot);
            applyFilters({ hot: !showOnlyHot });
          }}
          className={`${showOnlyHot
            ? 'bg-orange-500 hover:bg-orange-600 text-white'
            : 'border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-900'
          }`}
        >
          <Star className="h-4 w-4 mr-1" />
          {t('filters.popular')}
        </Button>
      </div>

      {/* Filtres avancés */}
      {isExpanded && (
        <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
          {/* Secteurs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('filters.sectorsTitle')}</h3>
            <div className="flex flex-wrap gap-2">
              {sectors.map(sector => (
                <Badge
                  key={sector.value}
                  variant={selectedSectors.includes(sector.value) ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedSectors.includes(sector.value)
                      ? 'bg-lime-500 hover:bg-lime-600 text-white'
                      : 'border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-900'
                  }`}
                  onClick={() => handleSectorToggle(sector.value)}
                >
                  {sector.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Fourchette de prix */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('filters.priceRange')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('filters.min')}</label>
                <input
                  type="number"
                  placeholder="0.001"
                  value={priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('filters.max')}</label>
                <input
                  type="number"
                  placeholder="1.0"
                  value={priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-neutral-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {totalCount} {t('filters.campaign')}{totalCount !== 1 ? 's' : ''} • {activeCount} {t('filters.active')}{activeCount !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('filters.clear')}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="bg-lime-500 hover:bg-lime-600 text-white"
              >
                {t('filters.apply')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}