"use client";

import React, { useMemo } from 'react';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useTheme } from 'next-themes';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'wagmi/chains';

const resolveMode = (theme) => (theme === 'dark' ? 'dark' : 'light');

const ThirdwebProviderWrapper = ({ children }) => {
  const { isMiniApp } = useEnvironment();
  const { theme } = useTheme();

  const appearanceMode = resolveMode(theme);

  const onchainConfig = useMemo(() => ({
    appearance: {
      name: 'Livar',
      logo: '/assets/miniapp-icon.png',
      mode: appearanceMode,
      theme: 'base',
    },
    wallet: {
      display: 'modal',
      preference: isMiniApp ? 'base' : 'smart',
      supportedWallets: {
        rabby: true,
        trust: true,
        frame: true,
      },
    },
  }), [appearanceMode, isMiniApp]);

  const chain = baseSepolia;
  const apiKey = process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
  const rpcUrl = apiKey
    ? `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${apiKey}`
    : 'https://sepolia.base.org';

  return (
    <OnchainKitProvider
      apiKey={apiKey ?? undefined}
      projectId={projectId ?? undefined}
      chain={chain}
      rpcUrl={rpcUrl}
      analytics={false}
      config={onchainConfig}
    >
      {children}
    </OnchainKitProvider>
  );
};

export default ThirdwebProviderWrapper;
