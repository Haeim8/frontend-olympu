"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
import { formatUnits } from 'ethers/lib/utils';
import { useBalance } from 'wagmi';

export default function Header({ 
  darkMode, 
  toggleDarkMode, 
  showMobileMenu, 
  setShowMobileMenu, 
  isConnected, 
  disconnect, 
  user, 
  address
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const ethBalance = useBalance({ address, watch: true });
  const wethBalance = useBalance({ address, token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', watch: true });
  const usdtBalance = useBalance({ address, token: '0xdAC17F958D2ee523a2206206994597C13D831ec7', watch: true });

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

  // Exemple de notifications (à remplacer par vos vraies données)
  const notifications = [
    { id: 1, message: "Nouvelle campagne lancée : Projet X", date: "2023-09-25" },
    { id: 2, message: "Votre investissement dans Projet A a été confirmé", date: "2023-09-24" },
    { id: 3, message: "Rappel : La campagne Projet B se termine dans 3 jours", date: "2023-09-23" },
  ];

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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-lime-400">Devar</h1>
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
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-950 rounded-md shadow-lg z-10">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
              </div>
              <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((notification) => (
                  <div key={notification.id} className="text-sm text-gray-700 dark:text-gray-300">
                    <p>{notification.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{notification.date}</p>
                  </div>
                ))}
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
            <span className="text-gray-900 dark:text-gray-100">{user?.username || 'Utilisateur'}</span>
            {isConnected && address && (
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
                  onClick={() => { disconnect(); handleDropdownToggle(); }}
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
