//frontend/app/page.js
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Home from '@/components/landing';
import AppInterface from '@/components/app-interface';

export default function Page() {
  const { address } = useAccount();
  const [showInterface, setShowInterface] = useState(false);



  return (
    <div className="min-h-screen bg-background">
      {(showInterface || address) ? (
        <AppInterface />
      ) : (
        <Home
          onAccessInterface={() => setShowInterface(true)}
        />
      )}
    </div>
  );
}