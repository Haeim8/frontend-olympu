"use client";

import React from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useLanguage';
import LanguageSelector from '@/components/ui/LanguageSelector';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

// Exemple de composant utilisant les traductions
const ExampleComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {t('home', 'Accueil')}
      </h1>
      <p className="text-gray-600 mb-4">
        {t('selectLanguage', 'Sélectionnez votre langue préférée')}
      </p>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Navigation:</h2>
          <ul className="space-y-1">
            <li>• {t('home', 'Accueil')}</li>
            <li>• {t('market', 'Marché')}</li>
            <li>• {t('wallet', 'Portefeuille')}</li>
            <li>• {t('analytics', 'Analytiques')}</li>
            <li>• {t('settings', 'Paramètres')}</li>
          </ul>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Actions:</h2>
          <ul className="space-y-1">
            <li>• {t('connect', 'Se connecter')}</li>
            <li>• {t('disconnect', 'Se déconnecter')}</li>
            <li>• {t('save', 'Sauvegarder')}</li>
            <li>• {t('cancel', 'Annuler')}</li>
            <li>• {t('confirm', 'Confirmer')}</li>
          </ul>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Statuts:</h2>
          <ul className="space-y-1">
            <li>• {t('loading', 'Chargement...')}</li>
            <li>• {t('success', 'Succès')}</li>
            <li>• {t('error', 'Erreur')}</li>
            <li>• {t('active', 'Actif')}</li>
            <li>• {t('connected', 'Connecté au réseau')}</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Sélecteur de langue:</h2>
        <LanguageSelector />
      </div>
    </div>
  );
};

// Application d'exemple complète
const ExampleApp = () => {
  const [darkMode, setDarkMode] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [activePage, setActivePage] = React.useState('home');
  const [isExpanded, setIsExpanded] = React.useState(true);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex">
        {/* Sidebar */}
        <Sidebar
          showMobileMenu={showMobileMenu}
          activePage={activePage}
          setActivePage={setActivePage}
          setShowMobileMenu={setShowMobileMenu}
          hasCampaign={true}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            showMobileMenu={showMobileMenu}
            setShowMobileMenu={setShowMobileMenu}
            username="Utilisateur Demo"
          />
          
          {/* Page content */}
          <main className="flex-1 p-6">
            <ExampleComponent />
          </main>
        </div>
      </div>
    </div>
  );
};

// Wrapper avec LanguageProvider
const LanguageExample = () => {
  return (
    <LanguageProvider>
      <ExampleApp />
    </LanguageProvider>
  );
};

export default LanguageExample;

// Instructions d'utilisation:
/*
1. Importez et utilisez le LanguageProvider au niveau racine de votre app:

import { LanguageProvider } from '@/contexts/LanguageContext';

function MyApp({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}

2. Utilisez le hook useTranslation dans vos composants:

import { useTranslation } from '@/hooks/useLanguage';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home', 'Accueil')}</h1>
      <p>{t('welcome', 'Bienvenue')}</p>
    </div>
  );
};

3. Ajoutez le LanguageSelector où vous voulez permettre le changement de langue:

import LanguageSelector from '@/components/ui/LanguageSelector';

const MyHeader = () => {
  return (
    <header>
      <h1>Mon App</h1>
      <LanguageSelector compact={true} />
    </header>
  );
};

4. Pour ajouter de nouvelles traductions:

import { useLanguage } from '@/hooks/useLanguage';

const MyComponent = () => {
  const { addTranslations } = useLanguage();
  
  useEffect(() => {
    addTranslations('fr', {
      myNewKey: 'Ma nouvelle traduction'
    });
    
    addTranslations('en', {
      myNewKey: 'My new translation'
    });
  }, [addTranslations]);
  
  return <div>...</div>;
};
*/