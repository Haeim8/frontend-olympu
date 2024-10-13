"use client"; // Le composant est bien un composant client

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider"; // Ton provider Web3
import "@/app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { UserProvider } from "@/components/shared/UserContext";
import { ThirdwebProvider } from "@thirdweb-dev/react"; // Assurez-vous d'importer le ThirdwebProvider
import { Sepolia, BaseGoerli, Ethereum } from "@thirdweb-dev/chains"; // Chaînes prises en charge

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Chaînes prises en charge pour Thirdweb
const supportedChains = [Sepolia, BaseGoerli, Ethereum];

export default function RootLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Empêche le rendu côté client avant que le composant ne soit monté
  if (!mounted) {
    return null;
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ThirdwebProvider supportedChains={supportedChains}> {/* Assure que ThirdwebProvider entoure tout */}
            <UserProvider>
              <RainbowKitAndWagmiProvider>
                {children}
              </RainbowKitAndWagmiProvider>
            </UserProvider>
          </ThirdwebProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
