"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Wallet, 
  Star, 
  FileText, 
  TrendingUp,
  Settings,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  hasCampaign = false 
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { icon: Home, title: t('home'), id: 'home' },
    { icon: Wallet, title: t('wallet'), id: 'wallet' },
    { icon: Star, title: t('favorites'), id: 'favorites' },
    ...(hasCampaign ? [{ icon: FileText, title: t('campaign'), id: 'campaign' }] : []),
  ];

  const bottomItems = [];

  return (
    <div 
      className={`${
        isExpanded ? 'w-64' : 'w-16'
      } h-screen bg-white dark:bg-neutral-950 border-r border-gray-200 dark:border-neutral-800 transition-all duration-300 flex flex-col`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >

      {/* Menu Items */}
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setActivePage(item.id)}
              className={`w-full h-12 ${isExpanded ? 'justify-start px-3' : 'justify-center px-0'} ${
                activePage === item.id
                  ? 'bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="ml-3 font-medium">{item.title}</span>
              )}
            </Button>
          ))}
        </nav>
      </div>


    </div>
  );
}