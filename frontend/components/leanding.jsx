"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

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

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(isDark);
  }, []);

  // Pas besoin de dupliquer la vérification - on utilise les props de app/page.js

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""} text-sm`}>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 relative overflow-hidden">
        
        <LandingBackground darkMode={darkMode} />
        
        <LandingHeader 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
        />
        
        <LandingHero
          darkMode={darkMode}
          address={address}
          onAccessInterface={onAccessInterface}
        />
        
        <LandingInfoSection darkMode={darkMode} />
        
        <BlockchainStats darkMode={darkMode} />
        
        <HowItWorks darkMode={darkMode} />
        
        <ProjectsSection darkMode={darkMode} />
        
        <LandingFooter darkMode={darkMode} />
        
      </div>
    </div>
  );
}