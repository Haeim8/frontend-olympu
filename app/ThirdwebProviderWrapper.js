"use client";

import { ThirdwebProvider } from '@thirdweb-dev/react';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Sepolia, BaseGoerli, Ethereum } from "@thirdweb-dev/chains";

const queryClient = new QueryClient();

const supportedChains = [Sepolia, BaseGoerli, Ethereum];

const ThirdwebProviderWrapper = ({ children }) => {
  return (
    <ThirdwebProvider 
      clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID} 
      supportedChains={supportedChains}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThirdwebProvider>
  );
};

export default ThirdwebProviderWrapper;
