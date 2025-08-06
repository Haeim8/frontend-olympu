"use client";

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import ThirdwebProviderWrapper from "./ThirdwebProviderWrapper";
import { UserProvider } from "@/components/shared/UserContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function ClientProviders({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <ThirdwebProviderWrapper>
          <UserProvider>
            {children}
          </UserProvider>
        </ThirdwebProviderWrapper>
      </LanguageProvider>
    </ThemeProvider>
  );
}