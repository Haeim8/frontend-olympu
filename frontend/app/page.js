//frontend/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Home from '@/components/landing';
import AppInterface from '@/components/app-interface';

export default function Page() {
  const { address, isConnected } = useAccount();
  const [showInterface, setShowInterface] = useState(false);

  // Check existing connection on mount
  useEffect(() => {
    if (isConnected && address) {
      setShowInterface(true);
    }
  }, [isConnected, address]);

  // Pas de loading screen, afficher directement la landing

  return (
    <div className="min-h-screen bg-background">
      {showInterface ? (
        <AppInterface />
      ) : (
        <Home
          onAccessInterface={() => setShowInterface(true)}
        />
      )}
    </div>
  );
}