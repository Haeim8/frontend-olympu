"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Pour rediriger l'utilisateur
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import Home from './Pages/Home';
import Wallet from './Pages/Wallet';
import Discussions from './Pages/Discussions';
import News from './Pages/News';
import Favorites from './Pages/Favorites';
import Campaign from './Pages/Campaign';
import { useDisconnect, useAddress } from '@thirdweb-dev/react'; // Importation de Thirdweb pour la déconnexion et l'adresse du wallet
import { doc, getDoc } from "firebase/firestore"; // Pour récupérer les données de l'utilisateur
import { db } from "@/lib/firebase/firebase"; // Assurez-vous que Firebase est bien importé

export default function AppInterface() {
  const [activePage, setActivePage] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [username, setUsername] = useState("Utilisateur"); // Par défaut, on met "Utilisateur"
  const disconnect = useDisconnect(); // Utilisation de Thirdweb pour déconnecter
  const address = useAddress(); // Récupérer l'adresse du wallet
  const router = useRouter(); // Utilisé pour rediriger l'utilisateur

  // Si l'utilisateur n'est pas connecté, rediriger vers la page Home
  useEffect(() => {
    if (!address) {
      router.push('/'); // Rediriger vers Home si pas connecté
    }
  }, [address, router]);

  // Fonction pour récupérer les infos utilisateur depuis Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      if (address) {
        const userDoc = await getDoc(doc(db, "users", address));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || "Utilisateur"); // Récupérer le pseudo
        }
      }
    };

    fetchUserData();
  }, [address]);

  const handleDisconnect = () => {
    disconnect();
    router.push('/'); // Redirige vers la page d'accueil après déconnexion
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
        username={username} // Passer le pseudo au Header
        disconnect={handleDisconnect} // Passer la fonction de déconnexion pour gérer la redirection
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
          {activePage === 'discussions' && <Discussions username={username} />}
          {activePage === 'news' && <News />}
          {activePage === 'favorites' && <Favorites />}
          {activePage === 'campaign' && <Campaign />}
        </main>
      </div>
    </div>
  );
}
