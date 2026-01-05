"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useLandingStats } from '@/hooks/useLandingStats';

// Composants réutilisables - Version ShadCN
import { LandingHeader } from "./landing/LandingHeader";
import { LandingHero } from "./landing/LandingHero";
import { LandingInfoSection } from "./landing/LandingInfoSection";
import { BlockchainStats } from "./landing/BlockchainStats";
import { HowItWorks } from "./landing/HowItWorks";
import { ProjectsSection } from "./landing/ProjectsSection";
import { LandingFooter } from "./landing/LandingFooter";
import { LandingBackground } from "./landing/LandingBackground";

export default function Home({ onAccessInterface }) {
  const [darkMode, setDarkMode] = useState(false);
  const { address } = useAccount();
  const { stats, loading: statsLoading } = useLandingStats();

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(isDark);
  }, []);

  // Pas besoin de dupliquer la vérification - on utilise les props de app/page.js

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-white">

      <div className="flex flex-col min-h-screen relative z-10">

        <LandingBackground />

        <LandingHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />

        <LandingHero
          darkMode={darkMode}
          address={address}
          stats={stats}
          statsLoading={statsLoading}
          onAccessInterface={onAccessInterface}
        />

        <LandingInfoSection
          darkMode={darkMode}
          stats={stats}
          statsLoading={statsLoading}
        />

        <BlockchainStats
          darkMode={darkMode}
          stats={stats}
          statsLoading={statsLoading}
        />

        <HowItWorks darkMode={darkMode} />

        <ProjectsSection darkMode={darkMode} />

        <LandingFooter darkMode={darkMode} />

      </div>
    </div>
  );
}
