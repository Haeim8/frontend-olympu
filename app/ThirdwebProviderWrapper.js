"use client";
import { ThirdwebProvider } from '@thirdweb-dev/react';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Base, BaseSepoliaTestnet } from "@thirdweb-dev/chains";

// Chain Base Sepolia avec les bonnes configurations
const BaseSepoliaConfig = {
  chainId: 84532,
  name: "Base Sepolia",
  network: "base-sepolia",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpc: ["https://sepolia.base.org"],
  blockExplorer: {
    name: "BaseScan",
    url: "https://sepolia.basescan.org",
  },
  testnet: true,
};

const queryClient = new QueryClient();

const ThirdwebProviderWrapper = ({ children }) => {
  return (
    <ThirdwebProvider
      clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      activeChain={BaseSepoliaConfig}
      autoSwitch={true}
      dAppMeta={{
        name: "Divar",
        description: "Plateforme de financement participatif",
        logoUrl: "https://votre-logo.com",
        url: "https://votre-site.com",
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThirdwebProvider>
  );
};

export default ThirdwebProviderWrapper;