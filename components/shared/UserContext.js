'use client';

import React, { createContext, useState, useContext } from 'react';

// Créer le contexte
const UserContext = createContext();

// Créer un fournisseur de contexte
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    username: '',
    wallet: '',
  });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useUser = () => useContext(UserContext);
