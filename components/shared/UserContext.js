'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAddress } from '@thirdweb-dev/react';
import { db } from '../../lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  let address = null;

  try {
    address = useAddress(); // Obtenir l'adresse via Thirdweb
  } catch (error) {
    console.warn("useAddress hook cannot be used outside of ThirdwebProvider");
  }

  useEffect(() => {
    const fetchUser = async () => {
      if (address) {
        // Récupérer les données utilisateur dans Firebase
        const userDoc = await getDoc(doc(db, "users", address));
        if (userDoc.exists()) {
          setUser(userDoc.data()); // Mettre à jour les données utilisateur
        } else {
          console.log("Aucun utilisateur trouvé pour cette adresse.");
        }
      }
    };

    fetchUser();
  }, [address]);

  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
