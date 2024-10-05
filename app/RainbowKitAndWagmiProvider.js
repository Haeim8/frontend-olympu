'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets,RainbowKitProvider,darkTheme,} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet, sepolia, baseGoerli, hardhat } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { publicProvider } from 'wagmi/providers/public';

// Configuration des chaînes avec `publicProvider`
const { chains, publicClient } = configureChains(
  [mainnet, sepolia, baseGoerli, hardhat],
  [publicProvider()]
);

// Configuration des portefeuilles par défaut avec RainbowKit
const { connectors } = getDefaultWallets({
  appName: 'Devar',
  projectId: '0f0b011f456e2fc37f8cf2cc696aed5c',
  chains,
});

// Création de la configuration Wagmi
const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const queryClient = new QueryClient();

const RainbowKitAndWagmiProvider = ({ children }) => {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          chains={chains}
          theme={darkTheme({
            accentColor: 'white',
            accentColorForeground: 'black',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
};

export default RainbowKitAndWagmiProvider;
