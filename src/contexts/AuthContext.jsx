import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  signInWithGoogle,
  registerWithEmail,
  loginWithEmail,
  resetPassword,
  logout as firebaseLogout,
} from "../firebase";
import { ensureUserProfile, ensureRoutinesMigrated, subscribeToUser } from "../lib/firestore";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const migratingRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await ensureUserProfile(firebaseUser);
        setUser(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        try {
          window.location.hash = "#/login";
        } catch (e) {
          // ignore in non-browser env
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeToUser(user.uid, (p) => {
      setProfile(p);
      // Perfiles de antes de soportar varias rutinas no tienen `routines`
      // todavía; se convierten una sola vez (ensureRoutinesMigrated es
      // idempotente, pero el guard evita disparar varias escrituras a la
      // vez mientras la primera todavía no ha llegado a Firestore).
      if (p && p.routines === undefined && !migratingRef.current) {
        migratingRef.current = true;
        ensureRoutinesMigrated(user.uid, p).finally(() => {
          migratingRef.current = false;
        });
      }
    });
  }, [user]);

  async function logout() {
    try {
      await firebaseLogout();
    } finally {
      try {
        window.location.hash = "#/login";
      } catch (e) {
        // ignore
      }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signInWithGoogle,
    registerWithEmail,
    loginWithEmail,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
