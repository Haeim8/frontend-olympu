"use client";

import React, { useState } from 'react';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import Home from './Pages/Home';
import Wallet from './Pages/Wallet';
import Discussions from './Pages/Discussions';
import News from './Pages/News';
import Favorites from './Pages/Favorites';
import Campaign from './Pages/Campaign';
import { useDisconnect } from 'wagmi';

export default function AppInterface() {
  const [activePage, setActivePage] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { disconnect } = useDisconnect();

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
        disconnect={disconnect}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-950 p-6 md:p-8 transition-all duration-300 ease-in-out">
          {activePage === 'home' && <Home />}
          {activePage === 'wallet' && <Wallet />}
          {activePage === 'discussions' && <Discussions />}
          {activePage === 'news' && <News />}
          {activePage === 'favorites' && <Favorites />}
          {activePage === 'campaign' && <Campaign />}
        </main>
      </div>
    </div>
  );
}
