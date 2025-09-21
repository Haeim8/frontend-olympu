"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';
import ThirdwebProviderWrapper from "./ThirdwebProviderWrapper";
import { LanguageProvider } from "@/contexts/LanguageContext";
export default function ClientProviders({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <ThirdwebProviderWrapper>
          {children}
        </ThirdwebProviderWrapper>
      </LanguageProvider>
    </ThemeProvider>
  );
}
