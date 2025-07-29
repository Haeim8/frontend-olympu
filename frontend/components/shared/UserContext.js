'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAddress } from '@thirdweb-dev/react';
import { db } from '../../lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const address = useAddress();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (address) {
        try {
          const userDoc = await getDoc(doc(db, "users", address));
          if (userDoc.exists()) {
            setUser(userDoc.data());
          } else {
            console.log("Aucun utilisateur trouvé pour cette adresse.");
            setUser(null);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du profil Firebase:", error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    fetchUser();
  }, [address]);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
