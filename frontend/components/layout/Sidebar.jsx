"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  Star,
  FileText,
  Settings,
  X,
  Menu,
  LogOut // Added missing import
} from "lucide-react";

export default function Sidebar({
  activePage,
  setActivePage,
  hasCampaign = false,
  showMobileMenu = false,
  setShowMobileMenu
}) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  // Gestion du clic menu
  const handleItemClick = (id) => {
    setActivePage(id);
    setShowMobileMenu(false);
  };

  const menuItems = [
    { icon: LayoutDashboard, title: t('nav.dashboard', 'Tableau de bord'), id: 'home' },
    { icon: Wallet, title: t('nav.wallet', 'Portefeuille'), id: 'wallet' },
    { icon: Star, title: t('nav.favorites', 'Favoris'), id: 'favorites' },
    ...(hasCampaign ? [{ icon: FileText, title: t('nav.campaign', 'Ma Campagne'), id: 'campaign' }] : []),
  ];

  return (
    <>
      {/* Overlay Mobile */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setShowMobileMenu(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50
          bg-card/95 backdrop-blur-xl border-r border-border
          transition-all duration-300 ease-in-out
          flex flex-col
          md:static md:translate-x-0 md:h-screen
          ${showMobileMenu ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full w-72 md:w-20'}
          ${!showMobileMenu && 'md:hover:w-72'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header / Logo */}
        <div className="h-20 flex items-center px-5 border-b border-border/50">
          <div className="flex items-center gap-4 w-full overflow-hidden">
            <div className="relative w-10 h-10 flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(112,0,255,0.1)]">
              <span className="font-bold text-primary text-xl">L</span>
            </div>

            <div className={`flex flex-col transition-opacity duration-300 whitespace-nowrap ${isHovered || showMobileMenu ? 'opacity-100' : 'opacity-0 md:hidden'
              }`}>
              <span className="font-bold text-xl tracking-tight text-foreground">Livar</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Finance</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="ml-auto md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setShowMobileMenu(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-8 px-3 space-y-2 overflow-y-auto scrollbar-none">
          <div className={`px-4 mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-opacity duration-300 ${isHovered || showMobileMenu ? 'opacity-100' : 'opacity-0 hidden md:block'
            }`}>
            {t('nav.main', 'Menu Principal')}
          </div>

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`
                w-full relative group flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200
                ${activePage === item.id
                  ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(112,0,255,0.05)] border border-primary/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                }
              `}
            >
              {/* Active Indicator */}
              {activePage === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_#7000FF]" />
              )}

              <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${activePage === item.id ? 'text-primary' : 'group-hover:text-foreground'
                }`} />

              <span className={`
                 font-medium whitespace-nowrap transition-all duration-300 overflow-hidden
                 ${isHovered || showMobileMenu ? 'opacity-100 w-auto' : 'opacity-0 w-0 md:hidden'}
              `}>
                {item.title}
              </span>
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/50 bg-muted/20 space-y-2">
          <button
            className="w-full relative group flex items-center gap-4 px-3 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className={`
                text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden
                ${isHovered || showMobileMenu ? 'opacity-100 w-auto' : 'opacity-0 w-0 md:hidden'}
             `}>
              {t('nav.settings', 'Paramètres')}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
