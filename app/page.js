'use client';

import { useState, useEffect } from 'react';
import { useAddress } from '@thirdweb-dev/react'; 
import Home from '@/components/home';
import AppInterface from '@/components/app-interface';
import { Button } from '@/components/ui/button';

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
        <>
          <Home />
          {address && (
            <div className="flex justify-center mt-4">
              <Button onClick={() => setShowInterface(true)} className="bg-blue-500 text-white">
                Accéder à l'interface de l'application
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
