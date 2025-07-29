"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';

// Contexte pour la gestion des langues
export const LanguageContext = createContext();

// Traductions de base pour commencer
const translations = {
  fr: {
    // Navigation
    home: "Accueil",
    market: "Marché",
    wallet: "Portefeuille",
    analytics: "Analytiques",
    discussions: "Discussions",
    news: "Actualités",
    community: "Communauté",
    favorites: "Favoris",
    campaign: "Ma Campagne",
    settings: "Paramètres",
    help: "Aide",
    
    // Header
    notifications: "Notifications",
    darkMode: "Mode sombre",
    lightMode: "Mode clair",
    connect: "Se connecter",
    disconnect: "Se déconnecter",
    myWallet: "Mon portefeuille",
    activity: "Activité",
    
    // Common
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    cancel: "Annuler",
    confirm: "Confirmer",
    save: "Sauvegarder",
    delete: "Supprimer",
    edit: "Modifier",
    view: "Voir",
    close: "Fermer",
    
    // Projects
    investmentPlatform: "Plateforme d'investissement",
    projects: "Projets",
    invest: "Investir",
    shares: "Parts",
    raised: "Levé",
    goal: "Objectif",
    endDate: "Date de fin",
    progress: "Progression",
    
    // Language selector
    chooseLanguage: "Choisir la langue",
    selectLanguage: "Sélectionnez votre langue préférée",
    
    // Status
    connected: "Connecté au réseau",
    active: "Actif",
    newNotifications: "nouveau(x)",
    noNotifications: "Aucune notification"
  },
  
  en: {
    // Navigation
    home: "Home",
    market: "Market",
    wallet: "Wallet",
    analytics: "Analytics",
    discussions: "Discussions",
    news: "News",
    community: "Community",
    favorites: "Favorites",
    campaign: "My Campaign",
    settings: "Settings",
    help: "Help",
    
    // Header
    notifications: "Notifications",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    connect: "Connect",
    disconnect: "Disconnect",
    myWallet: "My wallet",
    activity: "Activity",
    
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    close: "Close",
    
    // Projects
    investmentPlatform: "Investment platform",
    projects: "Projects",
    invest: "Invest",
    shares: "Shares",
    raised: "Raised",
    goal: "Goal",
    endDate: "End date",
    progress: "Progress",
    
    // Language selector
    chooseLanguage: "Choose language",
    selectLanguage: "Select your preferred language",
    
    // Status
    connected: "Connected to network",
    active: "Active",
    newNotifications: "new",
    noNotifications: "No notifications"
  },
  
  es: {
    // Navigation
    home: "Inicio",
    market: "Mercado",
    wallet: "Cartera",
    analytics: "Analíticas",
    discussions: "Discusiones",
    news: "Noticias",
    community: "Comunidad",
    favorites: "Favoritos",
    campaign: "Mi Campaña",
    settings: "Configuración",
    help: "Ayuda",
    
    // Header
    notifications: "Notificaciones",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    connect: "Conectar",
    disconnect: "Desconectar",
    myWallet: "Mi cartera",
    activity: "Actividad",
    
    // Common
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    view: "Ver",
    close: "Cerrar",
    
    // Projects
    investmentPlatform: "Plataforma de inversión",
    projects: "Proyectos",
    invest: "Invertir",
    shares: "Acciones",
    raised: "Recaudado",
    goal: "Objetivo",
    endDate: "Fecha de fin",
    progress: "Progreso",
    
    // Language selector
    chooseLanguage: "Elegir idioma",
    selectLanguage: "Selecciona tu idioma preferido",
    
    // Status
    connected: "Conectado a la red",
    active: "Activo",
    newNotifications: "nuevo(s)",
    noNotifications: "Sin notificaciones"
  }
  
  // Vous pouvez ajouter d'autres langues ici...
};

// Provider pour le contexte de langue
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [isLoading, setIsLoading] = useState(true);
  
  // Charger la langue sauvegardée ou détecter la langue du navigateur
  useEffect(() => {
    const initializeLanguage = () => {
      try {
        // 1. Vérifier localStorage
        const savedLanguage = localStorage.getItem('selectedLanguage');
        if (savedLanguage && translations[savedLanguage]) {
          setCurrentLanguage(savedLanguage);
          setIsLoading(false);
          return;
        }
        
        // 2. Détecter la langue du navigateur
        if (typeof window !== 'undefined') {
          const browserLang = navigator.language || navigator.languages[0];
          const langCode = browserLang.split('-')[0];
          
          if (translations[langCode]) {
            setCurrentLanguage(langCode);
          } else {
            setCurrentLanguage('fr'); // Langue par défaut
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la langue:', error);
        setCurrentLanguage('fr');
        setIsLoading(false);
      }
    };
    
    initializeLanguage();
  }, []);
  
  // Fonction pour changer de langue
  const changeLanguage = useCallback((languageCode) => {
    if (translations[languageCode]) {
      setCurrentLanguage(languageCode);
      
      // Sauvegarder dans localStorage
      try {
        localStorage.setItem('selectedLanguage', languageCode);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la langue:', error);
      }
      
      // Émettre un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: languageCode }
      }));
    }
  }, []);
  
  // Fonction de traduction
  const t = useCallback((key, fallback = key) => {
    try {
      const keys = key.split('.');
      let value = translations[currentLanguage];
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      return value || fallback;
    } catch (error) {
      console.error('Erreur lors de la traduction:', error);
      return fallback;
    }
  }, [currentLanguage]);
  
  // Fonction pour ajouter des traductions dynamiquement
  const addTranslations = useCallback((languageCode, newTranslations) => {
    if (translations[languageCode]) {
      translations[languageCode] = {
        ...translations[languageCode],
        ...newTranslations
      };
    } else {
      translations[languageCode] = newTranslations;
    }
  }, []);
  
  // Fonction pour obtenir toutes les langues disponibles
  const getAvailableLanguages = useCallback(() => {
    return Object.keys(translations).map(code => ({
      code,
      name: getLanguageName(code),
      nativeName: getLanguageNativeName(code)
    }));
  }, []);
  
  const value = {
    currentLanguage,
    changeLanguage,
    t,
    translations,
    addTranslations,
    getAvailableLanguages,
    isLoading
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
      </div>
    );
  }
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Fonctions utilitaires pour obtenir les noms des langues
const getLanguageName = (code) => {
  const names = {
    fr: 'Français',
    en: 'English',
    es: 'Español',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic'
  };
  return names[code] || code;
};

const getLanguageNativeName = (code) => {
  const nativeNames = {
    fr: 'Français',
    en: 'English',
    es: 'Español',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
    ar: 'العربية'
  };
  return nativeNames[code] || code;
};