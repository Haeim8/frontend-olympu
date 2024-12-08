//frontend/components/layout/hearder.jsx
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
import { formatUnits } from 'ethers/lib/utils';
import { useAddress, useBalance, useDisconnect, ConnectWallet } from '@thirdweb-dev/react';
import { useRouter } from 'next/navigation'; // Pour rediriger après déconnexion

export default function Header({ 
  darkMode, 
  toggleDarkMode, 
  showMobileMenu, 
  setShowMobileMenu, 
  username // On garde seulement username pour l'affichage
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const address = useAddress();  // On garde address pour l'affichage
  
  const handleNotificationsToggle = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  // Lors de la déconnexion, rediriger l'utilisateur vers Home
  const handleDisconnect = () => {
    disconnect(); // Déconnexion via Thirdweb
    router.push('/'); // Rediriger vers Home après déconnexion
  };

  return (
    <header className="p-0.5 md:p-6 flex justify-between items-center bg-white dark:bg-neutral-950 shadow-sm border-b-1 border-lime-50">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mr-2"
          aria-label={showMobileMenu ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-lime-400 dark:text-lime-400">Livar</h1>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotificationsToggle}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-950 rounded-md shadow-lg z-10">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-gray-100">Notifications</h3>
              </div>
              <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                {/* Notifications */}
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          aria-label={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <div className="relative">
          <ConnectWallet 
            theme={darkMode ? "dark" : "light"}
            btnTitle={username || 'Utilisateur'}
            hideTestnetFaucet={true}
            className="!bg-transparent hover:!bg-transparent"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0',
            }}
            customButton={() => (
              <Button 
                variant="ghost" 
                className="hidden md:flex items-center space-x-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700" aria-hidden="true" />
                <span className="text-gray-900 dark:text-gray-100">{username || 'Utilisateur'}</span>
                {address && (
                  <span className="text-gray-600 dark:text-gray-300 ml-2 truncate w-24" title={address}>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-gray-700 dark:text-gray-300" aria-hidden="true" />
              </Button>
            )}
          />
        </div>
      </div>
    </header>
  );
}
