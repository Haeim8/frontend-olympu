"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Home from '@/components/home';
import AppInterface from '@/components/app-interface';

export default function Page() {
  const { isConnected } = useAccount();
  const [showInterface, setShowInterface] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setShowInterface(true);
    } else {
      setShowInterface(false);
    }
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-background">
      {showInterface ? (
        <AppInterface />
      ) : (
        <Home />
      )}
    </div>
  );
}