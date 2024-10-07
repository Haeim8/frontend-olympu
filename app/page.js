"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Home from '@/components/home';
import AppInterface from '@/components/app-interface';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Page() {
  const { address, isConnected } = useAccount();
  const [showInterface, setShowInterface] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const checkRegistration = async () => {
      if (isConnected && address) {
        try {
          const userRef = doc(db, 'users', address);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setIsRegistered(true);
            setShowInterface(true);
          } else {
            setIsRegistered(false);
            setShowInterface(false);
          }
        } catch (error) {
          console.error("Erreur lors de la vérification de l'inscription :", error);
        }
      } else {
        setShowInterface(false);
      }
    };
    checkRegistration();
  }, [isConnected, address]);

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
