"use client";

import React from 'react';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useLanguage';
import { Button } from "@/components/ui/button";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
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
  setShowMobileMenu
}) {
  const { t, language, changeLanguage } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">

        {/* Left: Logo (clickable on mobile to open menu) */}
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setShowMobileMenu(true)}
        >
          {/* Logo Livar */}
          <div className="relative w-9 h-9 flex-shrink-0">
            <Image
              src="/logo.png"
              alt=""
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-lg text-white leading-none"></span>
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
