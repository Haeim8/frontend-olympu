"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { useTranslation } from "@/hooks/useLanguage";
import { 
  Bell, 
  Sun, 
  Moon, 
  ChevronDown, 
  Menu, 
  Settings,
  User,
  LogOut,
  Wallet,
  Activity,
  Sparkles
} from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';

export default function Header({ 
  darkMode, 
  toggleDarkMode, 
  showMobileMenu, 
  setShowMobileMenu, 
  username
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Nouveau projet disponible",
      message: "Un projet d'énergie renouvelable vient d'être publié",
      time: "Il y a 2 min",
      unread: true
    },
    {
      id: 2,
      title: "Transaction confirmée",
      message: "Votre investissement de 0.5 ETH a été confirmé",
      time: "Il y a 1h",
      unread: true
    },
    {
      id: 3,
      title: "Dividendes reçus",
      message: "Vous avez reçu 0.025 ETH de dividendes",
      time: "Il y a 2h",
      unread: false
    }
  ]);
  
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  // TODO: Implémenter useBalance avec wagmi si nécessaire
  const balance = null;
  const router = useRouter();
  
  
  const handleNotificationsToggle = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };


  const handleDisconnect = () => {
    disconnect();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, unread: false }
          : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Gestionnaire pour fermer les menus au clic extérieur
  const handleClickOutside = (e) => {
    if (!e.target.closest('.notifications-menu') && !e.target.closest('.notifications-trigger')) {
      setIsNotificationsOpen(false);
    }
    if (!e.target.closest('.user-menu') && !e.target.closest('.user-trigger')) {
      setIsUserMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="relative bg-gradient-to-r from-white via-gray-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 border-b border-gray-200 dark:border-neutral-800 shadow-sm">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 20">
          <defs>
            <pattern id="header-grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="currentColor" strokeWidth="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#header-grid)" />
        </svg>
      </div>

      <div className="relative px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <div className="flex justify-between items-center">
          {/* Left section - Logo and mobile menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200"
              aria-label={showMobileMenu ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-lime-500 to-emerald-600 bg-clip-text text-transparent">
                  Livar
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                  {t('investmentPlatform', 'Plateforme d\'investissement')}
                </p>
              </div>
            </div>
          </div>

          {/* Right section - Actions and user menu */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
            {/* Language Selector */}
            <LanguageSelector 
              compact={true}
            />

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNotificationsToggle}
                className="notifications-trigger text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200 relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-red-500 hover:bg-red-500 text-white text-xs flex items-center justify-center rounded-full border-2 border-white dark:border-neutral-950">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              
              {isNotificationsOpen && (
                <div className="notifications-menu absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-neutral-950 rounded-xl shadow-xl border border-gray-200 dark:border-neutral-800 z-50 max-w-[calc(100vw-1rem)]">
                  <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Bell className="h-5 w-5 text-lime-600" />
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <Badge className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                          {unreadCount} nouveau(x)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markNotificationAsRead(notification.id)}
                          className={`p-4 border-b border-gray-100 dark:border-neutral-800 last:border-0 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer ${
                            notification.unread ? 'bg-lime-50 dark:bg-lime-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.unread ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {notification.title}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200"
              aria-label={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <div className="[&>div>button]:text-sm [&>div>button]:px-2 [&>div>button]:py-1 sm:[&>div>button]:px-4 sm:[&>div>button]:py-2 [&>div>button]:truncate [&>div>button]:max-w-[120px] sm:[&>div>button]:max-w-none">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative gradient line */}
      <div className="h-1 bg-gradient-to-r from-lime-400 via-emerald-500 to-lime-400"></div>
    </header>
  );
}
