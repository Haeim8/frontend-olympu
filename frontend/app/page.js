//frontend/app/page.js
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi'; 
import Home from '@/components/leanding';
import AppInterface from '@/components/app-interface';

export default function Page() {
  const { address } = useAccount(); 
  const [showInterface, setShowInterface] = useState(false);

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