"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';
import ThirdwebProviderWrapper from "./ThirdwebProviderWrapper";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ToastProvider } from "@/contexts/ToastContext";

export default function ClientProviders({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <ToastProvider>
          <ThirdwebProviderWrapper>
            {children}
          </ThirdwebProviderWrapper>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
