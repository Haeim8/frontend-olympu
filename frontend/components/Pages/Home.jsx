"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiManager } from '@/lib/services/api-manager';

// Import des composants modulaires
import HomeHeader from '@/components/home/HomeHeader';
import CampaignFilters from '@/components/home/CampaignFilters';
import CampaignGrid from '@/components/home/CampaignGrid';
import CreateCampaignCTA from '@/components/home/CreateCampaignCTA';

// Import des modals
import CampaignModal from './CampaignModal';
import ProjectDetails from './ProjectDetails';

export default function Home() {
  // États principaux
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États d'interface
  const [showFinalized, setShowFinalized] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  
  // États des statistiques
  const [campaignStats, setCampaignStats] = useState({
    total: 0,
    active: 0,
    finalized: 0,
    totalRaised: 0
  });

  // États pour les adresses de campagnes (remplace ThirdWeb)
  const [campaignAddresses, setCampaignAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [contractError, setContractError] = useState(null);

  // Fonction pour calculer les statistiques
  const calculateStats = useCallback((campaigns) => {
    const stats = {
      total: campaigns.length,
      active: campaigns.filter(c => c.isActive && !c.isFinalized).length,
      finalized: campaigns.filter(c => c.isFinalized).length,
      totalRaised: campaigns.reduce((total, c) => total + parseFloat(c.raised || 0), 0)
    };
    setCampaignStats(stats);
    return stats;
  }, []);

  // Fonction pour appliquer les filtres
  const applyFilters = useCallback((campaigns, currentFilters, showFinalized) => {
    let filtered = campaigns.filter(project => 
      showFinalized ? project.isFinalized : (!project.isFinalized && project.isActive)
    );

    // Filtre de recherche
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm) ||
        project.sector.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre par secteurs
    if (currentFilters.sectors && currentFilters.sectors.length > 0) {
      filtered = filtered.filter(project =>
        currentFilters.sectors.includes(project.sector)
      );
    }

    // Filtre par prix
    if (currentFilters.priceRange) {
      const { min, max } = currentFilters.priceRange;
      if (min) {
        filtered = filtered.filter(project =>
          parseFloat(project.sharePrice) >= parseFloat(min)
        );
      }
      if (max) {
        filtered = filtered.filter(project =>
          parseFloat(project.sharePrice) <= parseFloat(max)
        );
      }
    }

    // Filtre certifiés
    if (currentFilters.verified) {
      filtered = filtered.filter(project => project.isCertified);
    }

    // Filtre populaires (Hot projects)
    if (currentFilters.hot) {
      filtered = filtered.filter(project => {
        const progress = (parseFloat(project.raised) / parseFloat(project.goal)) * 100;
        return progress > 50 && project.isActive;
      });
    }

    // Tri
    const sortBy = currentFilters.sortBy || 'newest';
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.creationTime - a.creationTime);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.creationTime - b.creationTime);
        break;
      case 'mostFunded':
        filtered.sort((a, b) => parseFloat(b.raised) - parseFloat(a.raised));
        break;
      case 'mostPopular':
        filtered.sort((a, b) => {
          const progressA = (parseFloat(a.raised) / parseFloat(a.goal)) * 100;
          const progressB = (parseFloat(b.raised) / parseFloat(b.goal)) * 100;
          return progressB - progressA;
        });
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  }, []);

  // Fonction pour charger les adresses des campagnes
  const fetchCampaignAddresses = useCallback(async () => {
    setAddressesLoading(true);
    setContractError(null);
    
    try {
      const addresses = await apiManager.getAllCampaigns(false); // Pas de cache pour forcer le rechargement
      setCampaignAddresses(addresses);
    } catch (error) {
      console.error("Error fetching campaign addresses:", error);
      setContractError(error.message);
      setCampaignAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  // Fonction pour charger toutes les campagnes avec cache intelligent
  const fetchAllCampaigns = useCallback(async () => {
    if (!campaignAddresses || campaignAddresses.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Récupérer les campagnes une par une avec délai pour éviter rate limiting
      const validCampaigns = [];
      for (let i = 0; i < campaignAddresses.length; i++) {
        const address = campaignAddresses[i];
        
        try {
          const campaignData = await apiManager.getCampaignData(address, false); // Pas de cache pour forcer le rechargement
          if (campaignData) {
            validCampaigns.push(campaignData);
          }
        } catch (error) {
          console.warn(`Erreur chargement campagne ${address}:`, error.message);
        }
        
        // Délai de 500ms entre chaque requête pour éviter le rate limiting
        if (i < campaignAddresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Enrichir les données avec des informations supplémentaires
      const enrichedCampaigns = validCampaigns.map(campaign => ({
        ...campaign,
        // Ajouter des propriétés calculées
        progressPercentage: ((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100) || 0,
        isNearCompletion: ((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100) >= 80,
        isHotProject: ((parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100) > 50 && campaign.isActive,
        // Simuler certaines propriétés pour le moment
        isCertified: Math.random() > 0.7,
        investors: Math.floor(Math.random() * 50) + 10
      }));

      setProjects(enrichedCampaigns);
      calculateStats(enrichedCampaigns);
      
      // Pas de préchargement pour le moment (API simplifié)
      
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setError("Impossible de charger les campagnes. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  }, [campaignAddresses, calculateStats]);

  // Effet pour charger les adresses des campagnes au démarrage
  useEffect(() => {
    fetchCampaignAddresses();
  }, [fetchCampaignAddresses]);

  // Effet pour charger les campagnes une fois les adresses récupérées
  useEffect(() => {
    if (!addressesLoading && campaignAddresses.length > 0) {
      fetchAllCampaigns();
    }
  }, [campaignAddresses, addressesLoading, fetchAllCampaigns]);

  // Effet pour appliquer les filtres
  useEffect(() => {
    const filtered = applyFilters(projects, filters, showFinalized);
    setFilteredProjects(filtered);
  }, [projects, filters, showFinalized, applyFilters]);

  // Gestionnaires d'événements
  const handleCreateCampaign = useCallback(() => {
    setShowCreateCampaign(true);
  }, []);

  const handleCampaignCreated = useCallback(() => {
    setShowCreateCampaign(false);
    fetchCampaignAddresses();
  }, [fetchCampaignAddresses]);

  const handleViewDetails = useCallback((project) => {
    console.log('🔍 Project selected:', project);
    console.log('🔍 isActive:', project.isActive);
    console.log('🔍 endDate:', project.endDate);
    setSelectedProject(project);
    // Pas de préchargement pour le moment (API simplifié)
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    // Vider le cache et recharger
    apiManager.clearCache();
    fetchCampaignAddresses();
  }, [fetchCampaignAddresses]);

  // Préchargement intelligent au survol (désactivé pour API simplifié)
  const handlePreloadHover = useCallback((campaignId) => {
    // Pas de préchargement pour le moment
  }, []);

  // Calcul des statistiques pour les filtres et header
  const getFilterStats = () => {
    const totalVisible = filteredProjects.length;
    const activeVisible = filteredProjects.filter(p => p.isActive && !p.isFinalized).length;
    return { totalVisible, activeVisible };
  };

  const { totalVisible, activeVisible } = getFilterStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* Header principal */}
        <HomeHeader
          showFinalized={showFinalized}
          setShowFinalized={setShowFinalized}
          onCreateCampaign={handleCreateCampaign}
          campaignStats={campaignStats}
        />

        {/* Section filtres */}
        <CampaignFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalCount={projects.length}
          activeCount={totalVisible}
        />

        {/* Grille des campagnes */}
        <CampaignGrid
          projects={filteredProjects}
          isLoading={isLoading}
          error={error}
          showFinalized={showFinalized}
          onViewDetails={handleViewDetails}
          onRefresh={handleRefresh}
          onPreloadHover={handlePreloadHover}
        />

        {/* CTA pour créer une campagne (affiché seulement s'il n'y a pas d'erreur) */}
        {!error && !isLoading && (
          <CreateCampaignCTA
            onClick={handleCreateCampaign}
            campaignStats={{
              total: campaignStats.total,
              success: campaignStats.finalized,
              totalRaised: campaignStats.totalRaised / 1000000 // Convertir en millions
            }}
          />
        )}

        {/* Modals */}
        {selectedProject && (
          <ProjectDetails
            selectedProject={selectedProject}
            onClose={handleCloseDetails}
          />
        )}

        <CampaignModal
          showCreateCampaign={showCreateCampaign}
          setShowCreateCampaign={setShowCreateCampaign}
          onCampaignCreated={handleCampaignCreated}
        />

        {/* Debug info en développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-neutral-900 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Debug Info (dev only)
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>Total campaigns: {projects.length}</p>
              <p>Filtered campaigns: {filteredProjects.length}</p>
              <p>Cache stats: {JSON.stringify(apiManager.getCacheStats(), null, 2)}</p>
              <p>Active filters: {JSON.stringify(filters, null, 2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}