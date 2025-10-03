"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import Home from './Pages/Home';
import Wallet from './Pages/Wallet';
import Favorites from './Pages/Favorites';
import Campaign from './Pages/Campaign';
import ConnectPrompt from './app/ConnectPrompt';
import { useDisconnect, useAccount } from 'wagmi';
import { apiManager } from '@/lib/services/api-manager';
import { useFavoritesAndInvestments } from '@/hooks/useFavoritesAndInvestments';
import { BackgroundRippleEffect } from './ui/BackgroundRippleEffect';

export default function AppInterface() {
  const { theme, setTheme } = useTheme();

  // États principaux
  const [hasCampaign, setHasCampaign] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // États de chargement et données
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  // Hooks
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const router = useRouter();

  // Hook personnalisé pour gérer favoris + investissements
  const {
    favorites,
    investments,
    isLoadingInvestments,
    toggleFavorite,
    isFavorite,
    hasInvested,
    getTrackedCampaigns,
  } = useFavoritesAndInvestments();

  // Chargement intelligent des campagnes avec API Manager
  const loadCampaignsData = useCallback(async () => {
    if (!address) {
      setProjects([]);
      setHasCampaign(false);
      setIsLoadingCampaigns(false);
      return;
    }

    setIsLoadingCampaigns(true);
    setError(null);

    try {
      const allCampaigns = await apiManager.getAllCampaigns();
      const campaignsData = [];
      
      // Récupérer les données une par une
      for (const address of allCampaigns) {
        const campaignData = await apiManager.getCampaignData(address);
        if (campaignData) {
          // Ajouter l'id qui correspond à l'adresse pour les favoris
          campaignData.id = address;
          campaignsData.push(campaignData);
        }
      }
      
      // Filtrer les campagnes de l'utilisateur
      const normalizedAddress = address?.toLowerCase?.() ?? '';
      const userOwnedCampaigns = campaignsData.filter(
        (campaign) => normalizedAddress && campaign.creator?.toLowerCase?.() === normalizedAddress
      );
      
      // Stocker les campagnes utilisateur pour déterminer hasCampaign
      setProjects(campaignsData);
      setHasCampaign(userOwnedCampaigns.length > 0);
      
      // Si l'utilisateur n'a pas de campagne et est sur la page campaign, rediriger
      if (userOwnedCampaigns.length === 0 && activePage === 'campaign') {
        setActivePage('home');
      }
      
      // Pas de préchargement pour le moment (API simplifiée)
      
    } catch (err) {
      console.error('Erreur lors du chargement des campagnes:', err);
      setError('Impossible de charger les données. Veuillez réessayer plus tard.');
      setProjects([]);
      setHasCampaign(false);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [address, activePage]);

  useEffect(() => {
    loadCampaignsData();
  }, [loadCampaignsData]);

  // Gestionnaires d'événements optimisés
  const handleDisconnect = useCallback(() => {
    // Nettoyer le cache lors de la déconnexion
    apiManager.clearCache();
    disconnect();
    router.push('/');
  }, [disconnect, router]);

  const toggleDarkMode = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);
  
  // Gestionnaire de sélection de projet
  const handleSelectProject = useCallback(() => {
    // Pas de préchargement pour le moment (API simplifiée)
  }, []);
  
  // Si aucun wallet n'est connecté, afficher simplement le prompt de connexion
  if (!address) {
    return <ConnectPrompt />;
  }

  // Rendu optimisé des pages avec props intelligentes
  const renderActivePage = () => {
    const commonProps = {
      projects,
      favorites,
      investments,
      toggleFavorite,
      isFavorite,
      hasInvested,
      setSelectedProject: handleSelectProject,
      isLoading: isLoadingCampaigns || isLoadingInvestments,
      error,
      onRefresh: loadCampaignsData
    };

    switch (activePage) {
      case 'home':
        return <Home {...commonProps} />;
      case 'wallet':
        return <Wallet userAddress={address} />;
      case 'favorites':
        return <Favorites {...commonProps} />;
      case 'campaign':
        return hasCampaign ? <Campaign /> : <Home {...commonProps} />;
      default:
        return <Home {...commonProps} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <Header
        darkMode={theme === 'dark'}
        toggleDarkMode={toggleDarkMode}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        username="Utilisateur"
        disconnect={handleDisconnect}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
          hasCampaign={hasCampaign}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-neutral-950 transition-all duration-300 ease-in-out relative">
          {/* Background grille ripple subtil */}
          <BackgroundRippleEffect rows={8} cols={25} cellSize={40} />

          {/* Contenu des pages */}
          <div className="relative z-10">
            {renderActivePage()}
          </div>

          {/* Debug info en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white text-xs rounded max-w-xs">
              <div>Cache Stats: {JSON.stringify(apiManager.getCacheStats?.() ?? {}, null, 2)}</div>
              <div>Projects: {projects.length}</div>
              <div>Has Campaign: {hasCampaign.toString()}</div>
              <div>Active Page: {activePage}</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
