"use client";

import React, { useState, useEffect } from 'react';
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

export default function AppInterface() {
  const [activePage, setActivePage] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [username, setUsername] = useState("Utilisateur");
  const disconnect = useDisconnect();
  const address = useAddress();
  const router = useRouter();

  useEffect(() => {
    if (!address) {
      router.push('/');
    }
  }, [address, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (address) {
        const userDoc = await getDoc(doc(db, "users", address));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || "Utilisateur");
        }
      }
    };

    fetchUserData();
  }, [address]);

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return <Home />;
      case 'wallet':
        return <Wallet />;
      case 'discussions':
        return <Discussions username={username} />;
      case 'news':
        return <News />;
      case 'favorites':
        return <Favorites />;
      case 'campaign':
        return <Campaign />;
      case 'pinata-test':
        return <PinataTest />;
      default:
        return <Home />;
    }
  };

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
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-950 p-6 md:p-8 transition-all duration-300 ease-in-out">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}