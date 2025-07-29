"use client";

import { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';

// Hook personnalisé pour la gestion des langues
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage doit être utilisé dans un LanguageProvider');
  }
  
  return context;
};

// Hook simple pour récupérer une traduction
export const useTranslation = () => {
  const { currentLanguage, translations, t } = useLanguage();
  
  return {
    t, // Fonction de traduction
    language: currentLanguage,
    translations: translations[currentLanguage] || {}
  };
};

// Hook pour détecter la langue du navigateur
export const useBrowserLanguage = () => {
  const [detectedLanguage, setDetectedLanguage] = useState('fr');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language || navigator.languages[0];
      const langCode = browserLang.split('-')[0]; // Extraire le code de langue (ex: 'en' de 'en-US')
      
      // Langues supportées
      const supportedLanguages = ['fr', 'en', 'es', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'];
      
      if (supportedLanguages.includes(langCode)) {
        setDetectedLanguage(langCode);
      } else {
        setDetectedLanguage('en'); // Langue par défaut si non supportée
      }
    }
  }, []);
  
  return detectedLanguage;
};

// Hook pour persister la langue sélectionnée
export const useLanguagePersistence = () => {
  const [persistedLanguage, setPersistedLanguage] = useState(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        setPersistedLanguage(savedLanguage);
      }
    }
  }, []);
  
  const saveLanguage = (languageCode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', languageCode);
      setPersistedLanguage(languageCode);
    }
  };
  
  return {
    persistedLanguage,
    saveLanguage
  };
};