"use client";

import React, { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import ThirdwebProviderWrapper from "./ThirdwebProviderWrapper";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ToastProvider } from "@/contexts/ToastContext";

// Composant pour initialiser le SDK Farcaster Mini App
function FarcasterSDKInit() {
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
        console.log('[Farcaster] Mini App SDK Ready');
      } catch (e) {
        // Pas dans un contexte Farcaster (navigateur normal)
      }
    };
    initFarcaster();
  }, []);
  return null;
}

export default function ClientProviders({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <ToastProvider>
          <ThirdwebProviderWrapper>
            <FarcasterSDKInit />
            {children}
          </ThirdwebProviderWrapper>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
