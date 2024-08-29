'use client'
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
 hardhat
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: '0f0b011f456e2fc37f8cf2cc696aed5c',
  chains: [hardhat],
  ssr: true, 
});

const queryClient = new QueryClient();

const RainbowKitAndWagmiProvider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme ({
         accentcolor: 'white',
          accentcolorForeground: 'black',})}>

          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
export default RainbowKitAndWagmiProvider;