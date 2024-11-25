//frontend/components/layout/hearder.jsx
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
import { formatUnits } from 'ethers/lib/utils';
import { useAddress, useBalance, useDisconnect } from '@thirdweb-dev/react';
import { useRouter } from 'next/navigation'; // Pour rediriger après déconnexion

export default function Header({ 
  darkMode, 
  toggleDarkMode, 
  showMobileMenu, 
  setShowMobileMenu, 
  username, // On reçoit le pseudo en tant que prop
  disconnect // Utilisation de la fonction de déconnexion
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const address = useAddress();
  const router = useRouter(); // Pour rediriger l'utilisateur

  const ethBalance = useBalance({ address });
  const wethBalance = useBalance({ address, token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' });
  const usdtBalance = useBalance({ address, token: '0xdAC17F958D2ee523a2206206994597C13D831ec7' });

  const formatBalance = (balance, decimals) => {
    if (!balance || balance.isLoading) return '...';
    if (!balance.data) return '0.0000';
    return parseFloat(formatUnits(balance.data.value, decimals)).toFixed(decimals === 6 ? 2 : 4);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  // Lors de la déconnexion, rediriger l'utilisateur vers Home
  const handleDisconnect = () => {
    disconnect(); // Déconnexion via Thirdweb
    router.push('/'); // Rediriger vers Home après déconnexion
  };

  return (
    <header className="p-4 md:p-6 flex justify-between items-center bg-white dark:bg-neutral-950 shadow-sm border-b-2 border-lime-400">
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-lime-400">Livar</h1>
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
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-gray-100">Notifications</h3>
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
          <Button 
            variant="ghost" 
            className="hidden md:flex items-center space-x-2 cursor-pointer" 
            onClick={handleDropdownToggle}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
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
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-950 rounded-md shadow-lg z-10">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Solde des Tokens</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">ETH</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {formatBalance(ethBalance, 18)} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">WETH</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {formatBalance(wethBalance, 18)} WETH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">USDT</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {formatBalance(usdtBalance, 6)} USDT
                  </span>
                </div>
              </div>
              <div className="p-4">
                <Button 
                  onClick={handleDisconnect} // Utilisation de handleDisconnect pour déconnecter et rediriger
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold"
                >
                  Déconnecter
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
