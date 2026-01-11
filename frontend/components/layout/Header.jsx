"use client";

import React from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Bell,
  Menu,
  ChevronDown,
  Globe,
  Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header({
  setShowMobileMenu,
  notifications = []
}) {
  const { t, language, changeLanguage } = useTranslation();
  const [showNotifications, setShowNotifications] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">

        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-400 hover:text-white hover:bg-white/5"
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo Livar */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex-shrink-0">
              <div className="absolute inset-0 bg-[#c8ff00] rounded-lg opacity-20 blur-md" />
              <div className="relative w-full h-full bg-[#c8ff00]/10 rounded-lg flex items-center justify-center border border-[#c8ff00]/30">
                <Sparkles className="w-4 h-4 text-[#c8ff00]" />
              </div>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-lg text-white leading-none">Livar</span>
              <span className="text-[9px] text-[#c8ff00] font-semibold uppercase tracking-widest">Finance</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 flex items-center gap-1.5 text-gray-400 hover:text-[#c8ff00] hover:bg-white/5 rounded-lg"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase font-medium text-xs hidden sm:inline">{language}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-[#0a0a0a] border-white/10 text-white">
              <DropdownMenuItem onClick={() => changeLanguage('fr')} className="cursor-pointer hover:bg-[#c8ff00]/10 hover:text-[#c8ff00] text-sm">
                🇫🇷 Français
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')} className="cursor-pointer hover:bg-[#c8ff00]/10 hover:text-[#c8ff00] text-sm">
                🇬🇧 English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('es')} className="cursor-pointer hover:bg-[#c8ff00]/10 hover:text-[#c8ff00] text-sm">
                🇪🇸 Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-gray-400 hover:text-[#c8ff00] hover:bg-white/5 rounded-lg"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#c8ff00] rounded-full animate-pulse" />
              )}
            </Button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                  <span className="font-semibold text-sm text-white">{t('header.notifications', 'Notifications')}</span>
                  {notifications.length > 0 && (
                    <Badge className="bg-[#c8ff00]/20 text-[#c8ff00] text-[10px]">
                      {notifications.length}
                    </Badge>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      {t('header.no_notifications', 'Aucune notification')}
                    </div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div key={idx} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                        <p className="text-sm text-white font-medium">{notif.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* RainbowKit Connect Button */}
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </div>
    </header>
  );
}
