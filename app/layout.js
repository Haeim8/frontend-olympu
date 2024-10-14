"use client";

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider";
import "@/app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { UserProvider } from "@/components/shared/UserContext";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Sepolia, BaseGoerli, Ethereum } from "@thirdweb-dev/chains";
import Head from 'next/head';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const supportedChains = [Sepolia, BaseGoerli, Ethereum];

export default function RootLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <Head>
        <title>Votre Application DeFi</title>
      </Head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ThirdwebProvider supportedChains={supportedChains}>
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