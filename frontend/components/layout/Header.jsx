"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Wallet
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header({
  setShowMobileMenu,
  userAddress,
  onLogout,
  notifications = []
}) {
  const { t, language, changeLanguage } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Format short address
  const shortAddress = userAddress
    ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
    : '';

  return (
    <header className="sticky top-0 z-40 w-full h-20 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl transition-all duration-200">
      <div className="h-full px-4 md:px-8 flex items-center justify-between gap-4">

        {/* Left: Mobile Menu Trigger & Search */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 focus-within:border-primary/50 focus-within:bg-white/10 transition-all w-full max-w-sm group">
            <Search className="w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t('header.search_placeholder', 'Rechercher un projet, une collection...')}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 text-gray-400 hover:text-white">
                <span className="uppercase font-medium">{language}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-[#1a1a1a] border-white/10 text-white">
              <DropdownMenuItem onClick={() => changeLanguage('fr')} className="cursor-pointer hover:bg-white/10">Français (FR)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')} className="cursor-pointer hover:bg-white/10">English (EN)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('es')} className="cursor-pointer hover:bg-white/10">Español (ES)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-400 hover:text-white hover:bg-white/5 rounded-full"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0a] animate-pulse" />
              )}
            </Button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <span className="font-semibold text-sm text-white">{t('header.notifications', 'Notifications')}</span>
                  {notifications.length > 0 && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 text-[10px]">
                      {notifications.length} New
                    </Badge>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      {t('header.no_notifications', 'Aucune nouvelle notification')}
                    </div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div key={idx} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm text-white font-medium">{notif.title}</p>
                          <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                          <p className="text-[10px] text-gray-600 mt-2">{notif.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="pl-2 pr-4 py-1.5 h-auto flex items-center gap-3 hover:bg-white/5 rounded-full border border-transparent hover:border-white/5 transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary p-[1px]">
                  <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-bold text-white leading-none">
                    {shortAddress || '0x00...0000'}
                  </span>
                  <span className="text-[10px] text-green-400 font-medium leading-none mt-1">
                    Connected
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-500 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/10 text-white p-1">
              <DropdownMenuLabel className="px-2 py-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">My Account</span>
              </DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-white/10 focus:bg-white/10 py-2.5 px-2 mb-1">
                <User className="w-4 h-4 mr-2 text-primary" />
                <span>{t('header.profile', 'Mon Profil')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-white/10 focus:bg-white/10 py-2.5 px-2 mb-1">
                <Wallet className="w-4 h-4 mr-2 text-secondary" />
                <span>{t('header.wallet', 'Portefeuille')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-white/10 focus:bg-white/10 py-2.5 px-2 mb-1">
                <Settings className="w-4 h-4 mr-2 text-gray-400" />
                <span>{t('header.settings', 'Paramètres')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10 my-1" />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer rounded-lg hover:bg-red-500/10 focus:bg-red-500/10 text-red-400 hover:text-red-300 py-2.5 px-2"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>{t('header.disconnect', 'Déconnexion')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
