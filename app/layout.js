// frontend/app/layout.js

"use client";

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import ThirdwebProviderWrapper from "@/app/ThirdwebProviderWrapper.js"; // Assurez-vous que le chemin est correct
import "@/app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { UserProvider } from "@/components/shared/UserContext";
import RainbowKitAndWagmiProvider from "@/app/RainbowKitAndWagmiProvider";
import Head from 'next/head';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
        <title>Devar </title>
      </Head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ThirdwebProviderWrapper> {/* Utilisez ThirdwebProviderWrapper ici */}
            <UserProvider>
              <RainbowKitAndWagmiProvider>
                {children}
              </RainbowKitAndWagmiProvider>
            </UserProvider>
          </ThirdwebProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
