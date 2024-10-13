"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';
import ThirdwebProviderWrapper from "./ThirdwebProviderWrapper"; // Assure-toi que l'importation est correcte
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
          <ThirdwebProviderWrapper>
            <UserProvider>
              {children}
            </UserProvider>
          </ThirdwebProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
