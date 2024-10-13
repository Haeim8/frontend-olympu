"use client"; // C'est un composant client !

import React from 'react';
import { ThemeProvider } from 'next-themes';
import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider";
import "@/app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { UserProvider } from "@/components/shared/UserContext";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <UserProvider>
            <RainbowKitAndWagmiProvider>
              {children}
            </RainbowKitAndWagmiProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
