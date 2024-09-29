// /Lib/wagmiConfig.js

import { configureChains, createClient } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';

// Configurer les chaînes que vous souhaitez supporter
const { chains, provider, webSocketProvider } = configureChains(
  [mainnet, polygon, optimism, arbitrum],
  [publicProvider()]
);

// Créer le client wagmi
const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
    // Vous pouvez ajouter d'autres connecteurs ici si nécessaire
  ],
  provider,
  webSocketProvider,
});

export default wagmiClient;
