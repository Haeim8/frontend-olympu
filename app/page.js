'use client';

import { useState, useEffect } from 'react';
import { useAddress } from '@thirdweb-dev/react'; 
import Home from '@/components/leanding';
import AppInterface from '@/components/app-interface';

export default function Page() {
  const address = useAddress(); 
  const [showInterface, setShowInterface] = useState(false);

  useEffect(() => {
    if (address) {
      setShowInterface(false); 
    }
  }, [address]);

  return (
    <div className="min-h-screen bg-background">
      {showInterface ? (
        <AppInterface />
      ) : (
        <Home onAccessInterface={() => setShowInterface(true)} />
      )}
    </div>
  );
}