"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  Star,
  FileText,
  X
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

  const isExpanded = showMobileMenu || isHovered;

  const handleItemClick = (id) => {
    setActivePage(id);
    setShowMobileMenu(false);
  };

  const menuItems = [
    { icon: LayoutDashboard, title: t('nav.market', 'Marché'), id: 'home' },
    { icon: Wallet, title: t('nav.investment', 'Investissement'), id: 'wallet' },
    { icon: Star, title: t('nav.favorites', 'Favoris'), id: 'favorites' },
    ...(hasCampaign ? [{ icon: FileText, title: t('nav.management', 'Gestion'), id: 'campaign' }] : []),
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setShowMobileMenu(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen
          bg-[#0a0a0a] border-r border-white/5
          transition-all duration-300 ease-out
          flex flex-col
          ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isExpanded ? 'w-56' : 'w-16'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Mobile Close */}
        <div className="md:hidden h-16 flex items-center justify-end px-4 border-b border-white/5">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white h-8 w-8"
            onClick={() => setShowMobileMenu(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto mt-2 md:mt-16">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  w-full relative flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive
                    ? 'bg-[#c8ff00]/10 text-white'
                    : 'text-gray-500 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                {/* Active Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#c8ff00]" />
                )}

                {/* Icon */}
                <div className={`w-8 h-8 flex items-center justify-center rounded-md transition-all flex-shrink-0 ${isActive ? 'bg-[#c8ff00]' : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
                </div>

                {/* Label */}
                <span className={`font-medium text-sm whitespace-nowrap transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  }`}>
                  {item.title}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
