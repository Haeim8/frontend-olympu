import React from 'react';
import HomePage from '@/components/pages/Home';
import WalletPage from '@/components/pages/Wallet';
import DiscussionsPage from '@/components/pages/Discussions';
import NewsPage from '@/components/pages/News';
import FavoritesPage from '@/components/pages/Favorites';
import Campaign from '@/components/Pages/Campaign';

export default function PageContent({ 
  activePage, 
  projects, 
  favorites, 
  toggleFavorite, 
  setSelectedProject, 
  setShowCreateCampaign,
  handleInvest
}) {
  const renderContent = () => {
    switch (activePage) {
      case 'home':
        return <HomePage projects={projects} setSelectedProject={setSelectedProject} setShowCreateCampaign={setShowCreateCampaign} />;
      case 'wallet':
        return <WalletPage />;
      case 'discussions':
        return <DiscussionsPage projects={projects} />;
      case 'news':
        return <NewsPage />;
      case 'favorites':
        return <FavoritesPage projects={projects} favorites={favorites} setSelectedProject={setSelectedProject} />;
      case 'campaign':
        return <Campaign 
          projects={projects}
          setSelectedProject={setSelectedProject}
          setShowCreateCampaign={setShowCreateCampaign}
          handleInvest={handleInvest}
        />;
      default:
        return <div>Page non trouvée</div>;
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {renderContent()}
    </main>
  );
}