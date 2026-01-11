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

      // getAllCampaigns retourne déjà les données complètes, pas besoin de reboucler
      const campaignsData = allCampaigns.map(campaign => ({
        ...campaign,
        id: campaign.address // Ajouter l'id pour les favoris
      }));

      // Filtrer les campagnes de l'utilisateur
      const normalizedAddress = address?.toLowerCase?.() ?? '';
      const userOwnedCampaigns = campaignsData.filter(
        (campaign) => normalizedAddress && campaign.creator?.toLowerCase?.() === normalizedAddress
      );

      console.log(`[AppInterface] Wallet: ${normalizedAddress}`);
      console.log(`[AppInterface] Mes campagnes: ${userOwnedCampaigns.length}`, userOwnedCampaigns.map(c => c.address));

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
