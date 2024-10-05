'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useUser } from '@/components/shared/UserContext';
import { formatUnits } from '/lib/utils.js';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import MainContent from './layout/PageContent';
import ProjectDetails from './shared/ProjectDetails';
import CampaignModal from './Pages/CampaignModal';
import CampaignManagement from './Pages/Campaign.jsx';


export default function AppInterface() {
  const { user } = useUser();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [activePage, setActivePage] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [projects, setProjects] = useState([
    { id: 1, name: "Projet A", sector: "Tech", unitPrice: 100, currentRaise: 500, goal: 1000 },
    { id: 2, name: "Projet B", sector: "Finance", unitPrice: 50, currentRaise: 200, goal: 500 },
  ]);

  const toggleFavorite = (projectId) => {
    setFavorites(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleCreateCampaign = (campaignData) => {
    console.log("Nouvelle campagne:", campaignData);
    setShowCreateCampaign(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'dark' : ''}`}>
      <Header 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        isConnected={isConnected}
        disconnect={disconnect}
        user={user}
        address={address}
        setShowNotifications={setShowNotifications}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activePage={activePage}
          setActivePage={setActivePage}
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-950">
          <MainContent
            activePage={activePage}
            projects={projects}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            setSelectedProject={setSelectedProject}
            setShowCreateCampaign={setShowCreateCampaign}
          />
        </main>
      </div>
      {showCreateCampaign && (
        <CampaignModal
          showCreateCampaign={showCreateCampaign}
          setShowCreateCampaign={setShowCreateCampaign}
          handleCreateCampaign={handleCreateCampaign}
        />
      )}
      {selectedProject && (
        <ProjectDetails
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}