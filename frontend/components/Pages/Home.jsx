"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiManager } from '@/lib/services/api-manager';
import { useTranslation } from '@/hooks/useLanguage';

import HomeHeader from '@/components/home/HomeHeader';
import CampaignFilters from '@/components/home/CampaignFilters';
import CampaignGrid from '@/components/home/CampaignGrid';
// CreateCampaignCTA supprimé
import { PromotedCampaignsCarousel } from '@/components/home/PromotedCampaignsCarousel';
import CampaignModal from './CampaignModal';
import ProjectDetails from './ProjectDetails';

const normalizeCampaign = (campaign) => {
  if (!campaign) return null;

  // Convertir le prix de wei en ETH si c'est un grand nombre
  const rawSharePrice = campaign.sharePrice ?? campaign.share_price ?? '0';
  const sharePriceNum = parseFloat(rawSharePrice);
  // Si le prix est supérieur à 1000, c'est probablement en wei
  const sharePriceInEth = sharePriceNum > 1000 ? sharePriceNum / 1e18 : sharePriceNum;

  const goalRaw = campaign.goal ?? '0';
  const goalNum = parseFloat(goalRaw);
  const goalValue = goalNum > 1000 ? goalNum / 1e18 : goalNum;

  const raisedRaw = campaign.raised ?? '0';
  const raisedNum = parseFloat(raisedRaw);
  const raisedValue = raisedNum > 1000 ? raisedNum / 1e18 : raisedNum;

  const status = campaign.status ?? null;
  const isActive = campaign.isActive ?? (status ? status === 'active' : false);
  const isFinalized = campaign.isFinalized ?? (status ? status === 'finalized' : false);
  const endDate = campaign.endDate ?? campaign.end_date ?? null;
  const endTimestamp = endDate ? new Date(endDate).getTime() : null;
  const sharesSoldValue = parseInt(campaign.sharesSold ?? campaign.shares_sold ?? '0', 10) || 0;
  const updatedAt = campaign.updatedAt ?? campaign.updated_at ?? null;
  const creationTime = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const progress = goalValue > 0 ? (raisedValue / goalValue) * 100 : 0;

  return {
    ...campaign,
    id: campaign.id ?? campaign.address,
    address: campaign.address,
    name: campaign.name,
    sector: campaign.sector ?? campaign.category ?? 'General',
    sharePrice: sharePriceInEth.toString(),
    goal: goalValue.toString(),
    raised: raisedValue.toString(),
    status: status ?? (isActive ? 'active' : isFinalized ? 'finalized' : 'pending'),
    isActive,
    isFinalized,
    endDate,
    metadataUri: campaign.metadataUri ?? campaign.metadata_uri ?? null,
    sharesSold: sharesSoldValue.toString(),
    totalShares: (campaign.totalShares ?? campaign.total_shares ?? '0').toString(),
    investors: campaign.investors ?? sharesSoldValue,
    creationTime,
    progressPercentage: progress,
    isNearCompletion: progress >= 80,
    isHotProject: progress > 50 && isActive,
    nftPrice: sharePriceInEth.toString(),
    nftTotal: sharePriceInEth > 0 ? Math.floor(goalValue / sharePriceInEth) : 0,
    timeRemaining: endTimestamp ? Math.max(0, endTimestamp - Date.now()) : 0,
  };
};

export default function Home({ toggleFavorite, isFavorite }) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFinalized, setShowFinalized] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  const [campaignStats, setCampaignStats] = useState({
    total: 0,
    active: 0,
    finalized: 0,
    totalRaised: 0,
  });

  const calculateStats = useCallback((campaigns) => {
    const list = Array.isArray(campaigns) ? campaigns : [];
    const totalRaised = list.reduce((acc, campaign) => acc + parseFloat(campaign.raised || 0), 0);
    const stats = {
      total: list.length,
      active: list.filter((campaign) => campaign.isActive && !campaign.isFinalized).length,
      finalized: list.filter((campaign) => campaign.isFinalized).length,
      totalRaised,
    };
    setCampaignStats(stats);
    return stats;
  }, []);

  const applyFilters = useCallback((campaigns, currentFilters, includeFinalized) => {
    const list = Array.isArray(campaigns) ? campaigns : [];
    let filtered = list.filter((project) =>
      includeFinalized ? project.isFinalized : (!project.isFinalized && project.isActive)
    );

    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(searchTerm) ||
        project.sector.toLowerCase().includes(searchTerm)
      );
    }

    if (currentFilters.sectors && currentFilters.sectors.length > 0) {
      filtered = filtered.filter((project) => currentFilters.sectors.includes(project.sector));
    }

    if (currentFilters.priceRange) {
      const { min, max } = currentFilters.priceRange;
      if (min) {
        filtered = filtered.filter((project) => parseFloat(project.sharePrice) >= parseFloat(min));
      }
      if (max) {
        filtered = filtered.filter((project) => parseFloat(project.sharePrice) <= parseFloat(max));
      }
    }

    if (currentFilters.verified) {
      filtered = filtered.filter((project) => project.isCertified);
    }

    if (currentFilters.hot) {
      filtered = filtered.filter((project) => project.isHotProject);
    }

    const sortBy = currentFilters.sortBy || 'newest';
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.creationTime - b.creationTime;
        case 'mostFunded':
          return parseFloat(b.raised) - parseFloat(a.raised);
        case 'mostPopular':
          return (parseFloat(b.raised) / parseFloat(b.goal || 1)) - (parseFloat(a.raised) / parseFloat(a.goal || 1));
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return b.creationTime - a.creationTime;
      }
    });

    return filtered;
  }, []);

  const fetchOnchainCampaigns = useCallback(async () => {
    const results = [];
    try {
      const addresses = await apiManager.getAllCampaigns(false);
      for (const addr of addresses) {
        try {
          const data = await apiManager.getCampaignData(addr, false);
          if (data) {
            const normalized = normalizeCampaign(data);
            if (normalized) {
              results.push(normalized);
            }
          }
        } catch (chainError) {
          console.warn('Fallback chain fetch failed for', addr, chainError);
        }
      }
    } catch (error) {
      console.warn('Erreur fallback getAllCampaigns:', error);
    }
    return results;
  }, []);

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const applyCampaigns = (campaigns) => {
      setProjects(campaigns);
      calculateStats(campaigns);
    };

    try {
      // 1️⃣ CHARGER LES CAMPAGNES DE LA DB UNIQUEMENT (instantané)
      const campaigns = await apiManager.getAllCampaigns({});
      const normalized = campaigns.map(normalizeCampaign).filter(Boolean);

      // 2️⃣ AFFICHER IMMÉDIATEMENT LES DONNÉES DE LA DB
      if (normalized.length > 0) {
        applyCampaigns(normalized);
        setIsLoading(false); // Arrêter le loading MAINTENANT
      }

      // Mode Web3 : lecture directe blockchain, pas de sync nécessaire
      console.log('✅ Lecture blockchain directe');

      // Si aucune campagne DB, fallback onchain
      if (normalized.length === 0) {
        const onchainCampaigns = await fetchOnchainCampaigns();
        if (onchainCampaigns.length > 0) {
          applyCampaigns(onchainCampaigns);
        } else {
          applyCampaigns([]);
        }
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      const fallback = await fetchOnchainCampaigns();
      if (fallback.length > 0) {
        applyCampaigns(fallback);
      } else {
        setProjects([]);
        calculateStats([]);
        setError(t('campaigns.error.generic', 'Impossible de charger les campagnes. Veuillez réessayer plus tard.'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [calculateStats, t, fetchOnchainCampaigns]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    const filtered = applyFilters(projects, filters, showFinalized);
    setFilteredProjects(filtered);
  }, [projects, filters, showFinalized, applyFilters]);

  const handleCreateCampaign = useCallback(() => {
    setShowCreateCampaign(true);
  }, []);

  const handleCampaignCreated = useCallback(async (newCampaignAddress) => {
    setShowCreateCampaign(false);
    apiManager.invalidateCache('api_campaign');
    apiManager.invalidateCache('campaign');
    if (newCampaignAddress) {
      try {
        const data = await apiManager.getCampaignData(newCampaignAddress, false);
        if (data) {
          const normalized = normalizeCampaign(data);
          if (normalized) {
            setProjects((prev) => {
              const lower = newCampaignAddress.toLowerCase();
              const without = prev.filter((project) => project.address?.toLowerCase?.() !== lower);
              const updated = [normalized, ...without];
              calculateStats(updated);
              return updated;
            });
            return;
          }
        }
      } catch (chainError) {
        console.warn('Impossible de récupérer la campagne nouvellement créée:', chainError);
      }
    }
    loadCampaigns();
  }, [loadCampaigns, calculateStats]);

  const handleViewDetails = useCallback((project) => {
    setSelectedProject(project);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    apiManager.invalidateCache('api_campaign');
    apiManager.invalidateCache('campaign');
    loadCampaigns();
  }, [loadCampaigns]);

  const handlePreloadHover = useCallback((campaignId) => {
    apiManager.preloadCampaignDetails(campaignId);
  }, []);

  const totalVisible = filteredProjects.length;
  const activeVisible = filteredProjects.filter((project) => project.isActive && !project.isFinalized).length;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 relative z-10">
        <HomeHeader
          showFinalized={showFinalized}
          setShowFinalized={setShowFinalized}
          onCreateCampaign={handleCreateCampaign}
          campaignStats={campaignStats}
        />

        {/* Carousel des campagnes promues - Affiché uniquement si campagnes boostées */}
        <PromotedCampaignsCarousel
          onViewCampaign={handleViewDetails}
          darkMode={false}
        />

        <CampaignFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalCount={projects.length}
          activeCount={totalVisible}
        />

        <CampaignGrid
          projects={filteredProjects}
          isLoading={isLoading}
          error={error}
          showFinalized={showFinalized}
          onViewDetails={handleViewDetails}
          onRefresh={handleRefresh}
          onPreloadHover={handlePreloadHover}
        />

        {/* CreateCampaignCTA supprimé - bouton déjà dans header */}

        {selectedProject && (
          <ProjectDetails
            selectedProject={selectedProject}
            onClose={handleCloseDetails}
            toggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
          />
        )}

        <CampaignModal
          showCreateCampaign={showCreateCampaign}
          setShowCreateCampaign={setShowCreateCampaign}
          onCampaignCreated={handleCampaignCreated}
        />

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-neutral-900 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Debug Info (dev only)
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>Total campaigns: {projects.length}</p>
              <p>Filtered campaigns: {filteredProjects.length}</p>
              <p>Cache stats: {JSON.stringify(apiManager.getCacheStats?.() ?? {}, null, 2)}</p>
              <p>Active filters: {JSON.stringify(filters, null, 2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
