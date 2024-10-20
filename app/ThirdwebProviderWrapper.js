// frontend/ThirdwebProviderWrapper.js

"use client";

import { ThirdwebProvider } from '@thirdweb-dev/react';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Base,BaseSepoliaTestnet } from "@thirdweb-dev/chains";

// Définissez SepoliaBase manuellement si ce n'est pas une chaîne prédéfinie par Thirdweb
const SepoliaBase = {
  id: 84532, // Chain ID de Sepolia Base
  name: "Sepolia Base",
  network: "sepolia-base",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpc: ["https://84532.rpc.thirdweb.com"], // RPC URL fourni par Thirdweb
  blockExplorerUrls: ["https://sepolia-base.explorer.io"], // Remplacez par l'URL réelle si disponible
};

const queryClient = new QueryClient();

// Liste des chaînes supportées : uniquement Base et SepoliaBase
const supportedChains = [Base, BaseSepoliaTestnet, SepoliaBase];

const ThirdwebProviderWrapper = ({ children }) => {
  return (
    <ThirdwebProvider
      clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID} // Assurez-vous que cette variable d'environnement est définie
      supportedChains={supportedChains}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThirdwebProvider>
  );
};

export default ThirdwebProviderWrapper;