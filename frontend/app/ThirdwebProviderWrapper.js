"use client";

import { useEffect, useMemo, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base, baseSepolia } from 'wagmi/chains';
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000';

export default function ThirdwebProviderWrapper({ children }) {
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const [wagmiConfig, setWagmiConfig] = useState(null);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const config = getDefaultConfig({
      appName: 'Livar',
      projectId,
      chains: [base], // Base Mainnet only
      ssr: false,
    });

    setWagmiConfig(config);
  }, []);

  const rainbowTheme = useMemo(
    () =>
    (theme === 'dark'
      ? darkTheme({
        accentColor: '#84cc16',
        accentColorForeground: 'white',
        borderRadius: 'medium',
        fontStack: 'system',
        overlayBlur: 'small',
      })
      : lightTheme({
        accentColor: '#84cc16',
        accentColorForeground: 'white',
        borderRadius: 'medium',
        fontStack: 'system',
        overlayBlur: 'small',
      })),
    [theme]
  );

  // Map language codes to RainbowKit supported locales
  const rainbowLocale = useMemo(() => {
    const localeMap = {
      fr: 'fr',
      en: 'en',
      es: 'es',
      de: 'de',
      pt: 'pt',
      zh: 'zh',
      ja: 'ja',
      ko: 'ko',
      ar: 'ar',
    };
    return localeMap[currentLanguage] || 'en';
  }, [currentLanguage]);

  if (!wagmiConfig) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} locale={rainbowLocale}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

