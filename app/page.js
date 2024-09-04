"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import HomePageComponent from '@/components/home'; 
import AppInterface from '@/components/app-interface';

export default function Page() { // Renommé de Home à Page
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
      <div className="p-4 flex justify-end">
        <ConnectButton />
      </div>
      {showInterface ? (
        <AppInterface />
      ) : (
        <HomePageComponent />
      )}
    </div>
  );
}