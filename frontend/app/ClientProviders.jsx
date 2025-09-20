"use client";

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import ThirdwebProviderWrapper from "./ThirdwebProviderWrapper";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { usePromotionListener } from "@/hooks/usePromotionListener";
import { useEnvironment } from '@/hooks/useEnvironment';
import { useAccount } from 'wagmi';
import { isSupabaseConfigured } from '@/lib/supabase/client';

function PromotionListenerProvider({ children }) {
  const { isMiniApp } = useEnvironment();
  const { address } = useAccount();

  const shouldStart = Boolean(!isMiniApp && address && isSupabaseConfigured);

  usePromotionListener('baseSepolia', shouldStart);
  return children;
}

export default function ClientProviders({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pas de return null pendant l'hydratation - on garde les providers

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <ThirdwebProviderWrapper>
          <PromotionListenerProvider>
            {children}
          </PromotionListenerProvider>
        </ThirdwebProviderWrapper>
      </LanguageProvider>
    </ThemeProvider>
  );
}
