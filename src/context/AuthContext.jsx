import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, ADMIN_UID } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u || null));
  }, []);
  const isAdmin = user?.uid === ADMIN_UID;
  if (user === undefined) return null; // loading
  return <AuthContext.Provider value={{ user, isAdmin }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
