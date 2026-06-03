import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, ADMIN_UID, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(undefined);
  const [partnerData, setPartnerData] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u || null);
      if (!u) { setPartnerData(null); return; }
      // Écoute les permissions partenaire en temps réel
      const r = ref(db, `users/${u.uid}/partnerPermission`);
      onValue(r, snap => setPartnerData(snap.exists() ? snap.val() : null));
    });
  }, []);

  const isAdmin   = user?.uid === ADMIN_UID;
  // isPartner = a une permission activée, mais n'est pas admin
  const isPartner = !isAdmin && partnerData?.enabled === true;

  if (user === undefined) return null;
  return (
    <AuthContext.Provider value={{ user, isAdmin, isPartner, partnerData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
