"use client";

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import ThirdwebProviderWrapper from "./ThirdwebProviderWrapper";
import "@/app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { UserProvider } from "@/components/shared/UserContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
        <title>Livar</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <LanguageProvider>
            <ThirdwebProviderWrapper>
              <UserProvider>
                {children}
              </UserProvider>
            </ThirdwebProviderWrapper>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}