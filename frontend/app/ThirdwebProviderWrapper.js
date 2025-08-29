"use client";

import React from 'react';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useTheme } from 'next-themes';

// Import des providers
import { WagmiProvider } from 'wagmi';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { base, baseSepolia } from 'wagmi/chains';
import { 
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
  lightTheme
} from '@rainbow-me/rainbowkit';

// Configuration RainbowKit v2 avec Singleton renforcé pour éviter multiples initialisations
let wagmiConfigInstance = null;
let queryClientInstance = null;

// Singleton sécurisé pour la config Wagmi
const getWagmiConfig = () => {
  if (!wagmiConfigInstance) {
    wagmiConfigInstance = getDefaultConfig({
      appName: 'Livar',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      chains: [baseSepolia, base],
      ssr: true, // Crucial pour Next.js et éviter hydratation mismatch
    });
  }
  return wagmiConfigInstance;
};

// Singleton sécurisé pour QueryClient
const getQueryClient = () => {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          // Éviter re-fetch automatique qui peut causer des réinitialisations
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: false,
          staleTime: 5 * 60 * 1000, // 5 minutes
        },
      },
    });
  }
  return queryClientInstance;
};

// Provider Web App (Wagmi + RainbowKit)
const WebAppProvider = ({ children }) => {
  const { theme } = useTheme();
  
  const rainbowTheme = theme === 'dark' 
    ? darkTheme({
        accentColor: '#84cc16', // lime-500
        accentColorForeground: 'white',
        borderRadius: 'medium',
        fontStack: 'system',
        overlayBlur: 'small',
      })
    : lightTheme({
        accentColor: '#84cc16', // lime-500
        accentColorForeground: 'white', 
        borderRadius: 'medium',
        fontStack: 'system',
        overlayBlur: 'small',
      });

  return (
    <WagmiProvider config={getWagmiConfig()}>
      <QueryClientProvider client={getQueryClient()}>
        <RainbowKitProvider 
          theme={rainbowTheme}
          locale="en"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Provider Mini App (OnchainKit + MiniKit)
const MiniAppProvider = ({ children }) => (
  <OnchainKitProvider
    chain={baseSepolia}
    rpcUrl={process.env.NEXT_PUBLIC_QUICKNODE_HTTP_URL || 'https://sepolia.base.org'}
    config={{
      appearance: {
        mode: 'dark',
        theme: 'base',
      },
      // FORCER désactivation télémétrie pour éviter erreurs 401 (pas de KYC requis)
      telemetry: false,
      analytics: false
    }}
  >
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  </OnchainKitProvider>
);

// Provider conditionnel principal
const ThirdwebProviderWrapper = ({ children }) => {
  const { isMiniApp, isLoading } = useEnvironment();

  // Pendant le chargement, on affiche le provider Web App par défaut
  if (isLoading) {
    return <WebAppProvider>{children}</WebAppProvider>;
  }

  // Choix du provider basé sur l'environnement
  if (isMiniApp) {
    return <MiniAppProvider>{children}</MiniAppProvider>;
  }

  return <WebAppProvider>{children}</WebAppProvider>;
};

export default ThirdwebProviderWrapper;