"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
// Firebase supprimé - utilisation localStorage à la place
import { apiManager } from '@/lib/services/api-manager';
import { useEnvironment } from '@/hooks/useEnvironment';

export default function AppInterface() {
  const { theme, setTheme } = useTheme();
  
  // États principaux
  const [hasCampaign, setHasCampaign] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  // États de chargement et données
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [projects, setProjects] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);
  
  // Hooks
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const router = useRouter(); 
  const { isMiniApp, isLoading: envLoading } = useEnvironment();

  // Informer Farcaster/Base que l'UI est prête afin de retirer le splash screen
  const miniAppReadyRef = useRef(false);

  const signalMiniAppReady = useCallback(async () => {
    if (miniAppReadyRef.current) return;

    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      await sdk?.actions?.ready?.();
      miniAppReadyRef.current = true;
    } catch (error) {
      console.warn('Unable to notify miniapp host that the UI is ready:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || miniAppReadyRef.current) {
      return undefined;
    }

    if (!envLoading && isMiniApp) {
      signalMiniAppReady();
      return undefined;
    }

    const fallbackTimer = window.setTimeout(signalMiniAppReady, 1500);
    return () => window.clearTimeout(fallbackTimer);
  }, [envLoading, isMiniApp, signalMiniAppReady]);

  // Redirection si pas d'adresse
  useEffect(() => {
  if (!address && !envLoading && !isMiniApp) {
    router.push('/');
  }

  if (!address && !envLoading && isMiniApp) {
    return <ConnectPrompt />;
  }
  }, [address, envLoading, isMiniApp, router]);

  // Chargement intelligent des campagnes avec API Manager
  const loadCampaignsData = useCallback(async () => {
    if (!address) return;
    
    setIsLoadingCampaigns(true);
    setError(null);
    
    try {
      // Charger toutes les campagnes via API Manager (version simplifiée)
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
      const userOwnedCampaigns = campaignsData.filter(
        campaign => campaign.creator.toLowerCase() === address.toLowerCase()
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
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [address, activePage]);
  
  useEffect(() => {
    if (address) {
      loadCampaignsData();
    }
  }, [address, loadCampaignsData]);

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
  
  // Initialiser les favoris depuis localStorage
  useEffect(() => {
    // Charger les favoris depuis localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error);
      }
    }
  }, []);

  // Gestionnaire de favoris optimisé
  const toggleFavorite = useCallback((projectId) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId];
      
      // Sauvegarder dans localStorage et éventuellement Firebase
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);
  
  // Gestionnaire de sélection de projet
  const handleSelectProject = useCallback(() => {
    // Pas de préchargement pour le moment (API simplifiée)
  }, []);
  
  // Rendu optimisé des pages avec props intelligentes
  const renderActivePage = useCallback(() => {
    const commonProps = {
      projects,
      favorites,
      toggleFavorite,
      setSelectedProject: handleSelectProject,
      isLoading: isLoadingCampaigns,
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
  }, [activePage, projects, favorites, toggleFavorite, handleSelectProject, isLoadingCampaigns, error, loadCampaignsData, address, hasCampaign]);

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
          isExpanded={sidebarExpanded}
          setIsExpanded={setSidebarExpanded}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-neutral-950 transition-all duration-300 ease-in-out">
          {renderActivePage()}
          
          {/* Debug info en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white text-xs rounded max-w-xs">
              <div>Cache Stats: {JSON.stringify(apiManager.getCacheStats(), null, 2)}</div>
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
