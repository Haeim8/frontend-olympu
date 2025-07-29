"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Wallet, 
  MessageSquare, 
  Newspaper, 
  Star, 
  FileText, 
  TrendingUp,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const getMenuItems = (hasCampaign) => {
  const mainItems = [
    { 
      icon: Home, 
      title: 'Accueil', 
      id: 'home',
      description: 'Tableau de bord principal',
      badge: null
    },
    { 
      icon: Wallet, 
      title: 'Portefeuille', 
      id: 'wallet',
      description: 'Vos investissements',
      badge: null
    }
  ];

  const socialItems = [
    { 
      icon: MessageSquare, 
      title: 'Discussions', 
      id: 'discussions',
      description: 'Chat communautaire',
      badge: '5'
    },
    { 
      icon: Newspaper, 
      title: 'Actualités', 
      id: 'news',
      description: 'Dernières nouvelles',
      badge: null
    }
  ];

  const userItems = [
    { 
      icon: Star, 
      title: 'Favoris', 
      id: 'favorites',
      description: 'Projets sauvegardés',
      badge: null
    }
  ];

  if (hasCampaign) {
    userItems.push({ 
      icon: FileText, 
      title: 'Ma Campagne', 
      id: 'campaign',
      description: 'Gestion de campagne',
      badge: 'Actif'
    });
  }

  const settingsItems = [];

  return { mainItems, socialItems, userItems, settingsItems };
};

export default function Sidebar({ 
  showMobileMenu = true, 
  activePage = 'home', 
  setActivePage = () => {}, 
  setShowMobileMenu = () => {},
  hasCampaign = false,
  isExpanded = false,
  setIsExpanded = () => {}
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const { mainItems, socialItems, userItems, settingsItems } = getMenuItems(hasCampaign);

  const changePage = (page) => {
    setActivePage(page);
    setShowMobileMenu(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const SidebarItem = ({ item, section }) => {
    const isActive = activePage === item.id;
    const showTooltip = !isExpanded && hoveredItem === item.id;

    return (
      <div className="relative group">
        <Button
          key={item.id}
          variant="ghost"
          onClick={() => changePage(item.id)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`w-full h-12 rounded-xl transition-all duration-300 flex items-center justify-start ${
            isExpanded ? 'px-4' : 'px-0 justify-center'
          } ${
            isActive 
              ? 'bg-gradient-to-r from-lime-100 to-emerald-100 dark:from-lime-900/30 dark:to-emerald-900/30 border border-lime-200 dark:border-lime-800 shadow-lg' 
              : 'hover:bg-gray-100 dark:hover:bg-neutral-800 hover:scale-105'
          }`}
        >
          <div className="flex items-center space-x-3 w-full">
            <div className={`relative ${
              isActive ? 'transform scale-110' : ''
            }`}>
              <item.icon className={`h-5 w-5 transition-colors duration-300 ${
                isActive 
                  ? 'text-lime-600 dark:text-lime-400' 
                  : 'text-gray-600 dark:text-gray-400 group-hover:text-lime-600 dark:group-hover:text-lime-400'
              }`} />
              {isActive && (
                <div className="absolute -inset-1 bg-lime-200 dark:bg-lime-800 rounded-full opacity-30 animate-pulse"></div>
              )}
            </div>
            
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm transition-colors duration-300 ${
                  isActive 
                    ? 'text-lime-700 dark:text-lime-300' 
                    : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                }`}>
                  {item.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {item.description}
                </div>
              </div>
            )}
            
            {item.badge && (
              <Badge className={`ml-auto text-xs ${
                isExpanded ? 'block' : 'hidden'
              } ${
                item.badge === 'Actif' 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300'
              }`}>
                {item.badge}
              </Badge>
            )}
          </div>
        </Button>

        {/* Tooltip pour mode compact */}
        {showTooltip && (
          <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50">
            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs opacity-75">{item.description}</div>
              {item.badge && (
                <Badge className="mt-1 text-xs bg-lime-500 text-white">
                  {item.badge}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SidebarSection = ({ title, items, className = "" }) => (
    <div className={`space-y-2 ${className}`}>
      {isExpanded && (
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay pour mobile */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
      
      <aside className={`${
        showMobileMenu ? 'fixed z-50' : 'hidden'
      } md:relative md:block ${
        isExpanded ? 'w-72' : 'w-20'
      } h-full md:h-auto flex-shrink-0 bg-gradient-to-b from-white via-gray-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 border-r border-gray-200 dark:border-neutral-800 transition-all duration-500 ease-in-out relative overflow-hidden`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <svg className="w-full h-full" viewBox="0 0 40 100">
          <defs>
            <pattern id="sidebar-pattern" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="currentColor" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sidebar-pattern)" />
        </svg>
      </div>

      {/* Gradient line */}
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-lime-400 via-emerald-500 to-lime-400"></div>
      
      <div className="relative h-full flex flex-col">
        {/* Toggle button */}
        <div className="hidden md:flex justify-end p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpanded}
            className="w-8 h-8 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200"
          >
            {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-6 space-y-6 overflow-y-auto">
          <SidebarSection title="Principal" items={mainItems} />
          
          <div className="border-t border-gray-200 dark:border-neutral-800 pt-4">
            <SidebarSection title="Social" items={socialItems} />
          </div>
          
          <div className="border-t border-gray-200 dark:border-neutral-800 pt-4">
            <SidebarSection title="Personnel" items={userItems} />
          </div>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-200 dark:border-neutral-800 p-3 space-y-1">
          {settingsItems.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </div>

        {/* Status indicator */}
        {isExpanded && (
          <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
            <div className="bg-gradient-to-r from-lime-50 to-emerald-50 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Connecté au réseau
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Base Sepolia
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}