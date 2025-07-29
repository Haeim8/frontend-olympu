//frontend/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAddress } from '@thirdweb-dev/react'; 
import Home from '@/components/leanding';
import AppInterface from '@/components/app-interface';
import { apiManager } from '@/lib/services/api-manager';

export default function Page() {
  const address = useAddress(); 
  const [showInterface, setShowInterface] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Vérifier le statut utilisateur avec API Manager
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!address) {
        setUserExists(false);
        setIsRegistered(false);
        return;
      }

      try {
        // Utiliser API Manager pour vérifier Firebase et contrat
        const [userProfile, contractStatus] = await Promise.all([
          apiManager.checkUserProfile(address),
          apiManager.checkUserRegistration(address)
        ]);

        setUserExists(userProfile.exists);
        setIsRegistered(contractStatus.isRegistered);

        console.log('User status via API Manager:', {
          address,
          userExists: userProfile.exists,
          isRegistered: contractStatus.isRegistered
        });

      } catch (error) {
        console.error('Erreur lors de la vérification du statut utilisateur:', error);
      }
    };

    checkUserStatus();
  }, [address]);

  // Pas de loading screen, afficher directement la landing

  return (
    <div className="min-h-screen bg-background">
      {showInterface ? (
        <AppInterface />
      ) : (
        <Home 
          onAccessInterface={() => setShowInterface(true)}
          userExists={userExists}
          isRegistered={isRegistered}
        />
      )}
    </div>
  );
}