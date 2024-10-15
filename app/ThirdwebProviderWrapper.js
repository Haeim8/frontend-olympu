// frontend/components/ThirdwebProviderWrapper.js

import { ThirdwebProvider } from '@thirdweb-dev/react';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Sepolia, BaseGoerli, Ethereum } from "@thirdweb-dev/chains";

// Créez un objet pour Sepolia Base
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

// Ajoutez SepoliaBase à la liste des chaînes supportées
const supportedChains = [Sepolia, BaseGoerli, Ethereum, SepoliaBase];

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
