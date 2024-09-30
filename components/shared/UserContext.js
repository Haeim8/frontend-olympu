// components/shared/UserContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase/firebase'; // Chemin corrigé
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Se connecter anonymement à Firebase
    signInAnonymously(auth)
      .then(() => {
        console.log("Connecté anonymement à Firebase");
      })
      .catch((error) => {
        console.error("Erreur lors de la connexion anonyme:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Vérifier si l'utilisateur existe dans Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data());
        } else {
          // Créer un nouvel utilisateur dans Firestore
          const newUser = {
            uid: firebaseUser.uid,
            address: "", // À mettre à jour lors de l'inscription via wallet
            username: "Utilisateur"
          };
          await setDoc(doc(db, "users", firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateUser = async (updatedFields) => {
    if (user) {
      const updatedUser = { ...user, ...updatedFields };
      setUser(updatedUser);
      await setDoc(doc(db, "users", user.uid), updatedUser);
    }
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
