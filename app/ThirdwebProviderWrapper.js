import { ThirdwebProvider } from '@thirdweb-dev/react';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Sepolia, BaseGoerli, Ethereum } from "@thirdweb-dev/chains";

const queryClient = new QueryClient();

const supportedChains = [Sepolia, BaseGoerli, Ethereum];

const ThirdwebProviderWrapper = ({ children }) => {
  return (
    <ThirdwebProvider
      clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      secretKey={process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY} // Ajouter la clé secrète ici si nécessaire
      supportedChains={supportedChains}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThirdwebProvider>
  );
};

export default ThirdwebProviderWrapper;
