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
import { useFavoritesAndInvestments } from '@/hooks/useFavoritesAndInvestments';

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

  // Chargement intelligent des campagnes avec cache
  const loadCampaignsData = useCallback(async () => {
    if (!address) {
      setProjects([]);
      setHasCampaign(false);
      setIsLoadingCampaigns(false);
      return;
    }

    // Si déjà chargé et pas de changement, ne pas recharger
    if (projects.length > 0 && !isLoadingCampaigns) {
      const normalizedAddress = address?.toLowerCase?.() ?? '';
      const hasUserCampaign = projects.some(c => c.creator?.toLowerCase?.() === normalizedAddress);
      if (hasUserCampaign) {
        return; // Données déjà en cache
      }
    }

    setIsLoadingCampaigns(true);
    setError(null);

    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      const campaigns = data.campaigns || [];

      const campaignsData = campaigns.map(campaign => ({
        ...campaign,
        id: campaign.address
      }));

      const normalizedAddress = address?.toLowerCase?.() ?? '';
      const userOwnedCampaigns = campaignsData.filter(
        (campaign) => normalizedAddress && campaign.creator?.toLowerCase?.() === normalizedAddress
      );

      console.log(`[AppInterface] Wallet: ${normalizedAddress}`);
      console.log(`[AppInterface] Mes campagnes: ${userOwnedCampaigns.length}`, userOwnedCampaigns.map(c => c.address));

      setProjects(campaignsData);
      setHasCampaign(userOwnedCampaigns.length > 0);

      if (userOwnedCampaigns.length === 0 && activePage === 'campaign') {
        setActivePage('home');
      }

    } catch (err) {
      console.error('Erreur lors du chargement des campagnes:', err);
      setError('Impossible de charger les données. Veuillez réessayer plus tard.');
      setProjects([]);
      setHasCampaign(false);
    } finally {
      setIsLoadingCampaigns(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    loadCampaignsData();
  }, [loadCampaignsData]);

  // Gestionnaires d'événements optimisés
  const handleDisconnect = useCallback(() => {
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
    <div className={`flex flex-col h-screen overflow-hidden bg-background text-foreground ${theme === 'dark' ? 'dark' : ''}`}>
      <Header
        setShowMobileMenu={setShowMobileMenu}
        userAddress={address}
        onLogout={handleDisconnect}
        notifications={[]}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
          hasCampaign={hasCampaign}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent relative scroll-smooth focus:scroll-auto">
          {/* Contenu des pages */}
          <div className="relative z-10 w-full min-h-full p-4 md:p-6 lg:p-8 animate-fade-in">
            {renderActivePage()}
          </div>

          {/* Debug info en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 p-2 bg-card/80 backdrop-blur-md border border-white/10 text-xs rounded-lg max-w-xs shadow-lg z-50">
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
