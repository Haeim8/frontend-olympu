"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import Home from './Pages/Home';
import Wallet from './Pages/Wallet';
import Discussions from './Pages/Discussions';
import News from './Pages/News';
import Favorites from './Pages/Favorites';
import Campaign from './Pages/Campaign';
import { useDisconnect, useAddress } from '@thirdweb-dev/react';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { apiManager } from '@/lib/services/api-manager';

export default function AppInterface() {
  // États principaux
  const [hasCampaign, setHasCampaign] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [username, setUsername] = useState("Utilisateur");
  
  // États de chargement et données
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [projects, setProjects] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);
  
  // Hooks
  const disconnect = useDisconnect();
  const address = useAddress();
  const router = useRouter(); 
 
  // Redirection si pas d'adresse
  useEffect(() => {
    if (!address) {
      router.push('/');
    }
  }, [address, router]);

  // Chargement des données utilisateur avec optimisation
  useEffect(() => {
    const fetchUserData = async () => {
      if (!address) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", address));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || "Utilisateur");
          
          // Charger les favoris de l'utilisateur
          if (userData.favorites) {
            setFavorites(userData.favorites);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      }
    };

    fetchUserData();
  }, [address]);
  // Chargement intelligent des campagnes avec API Manager
  const loadCampaignsData = useCallback(async () => {
    if (!address) return;
    
    setIsLoadingCampaigns(true);
    setError(null);
    
    try {
      // Charger toutes les campagnes via API Manager avec cache intelligent
      const allCampaigns = await apiManager.getAllCampaigns();
      const campaignsData = await apiManager.getCampaignsBatch(allCampaigns);
      
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
      
      // Précharger les données importantes en arrière-plan
      await apiManager.warmupHomePageCache(campaignsData.slice(0, 6).map(c => c.id));
      
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
    setDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Sauvegarder la préférence dans localStorage
      localStorage.setItem('darkMode', newMode.toString());
      return newMode;
    });
  }, []);
  
  // Initialiser le mode sombre depuis localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === 'true';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    }
    
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
  
  // Gestionnaire de sélection de projet avec préchargement
  const handleSelectProject = useCallback((project) => {
    // Précharger les détails du projet
    if (project?.id) {
      apiManager.preloadCampaignDetails(project.id);
    }
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
      case 'discussions':
        return <Discussions username={username} />;
      case 'news':
        return <News />;
      case 'favorites':
        return <Favorites {...commonProps} />;
      case 'campaign':
        return hasCampaign ? <Campaign /> : <Home {...commonProps} />;
      default:
        return <Home {...commonProps} />;
    }
  }, [activePage, projects, favorites, toggleFavorite, handleSelectProject, isLoadingCampaigns, error, loadCampaignsData, address, username, hasCampaign]);

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'dark' : ''}`}>
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        username={username}
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