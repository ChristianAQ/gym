import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Las claves de un proyecto Firebase web no son secretas: están pensadas
// para viajar en el cliente. La seguridad la dan las reglas de Firestore
// (ver firestore.rules), no la privacidad de este objeto.
const firebaseConfig = {
  apiKey: "AIzaSyArRi6fYGM_zSQFdSPUyY0WA-B48K3R4Dg",
  authDomain: "gymrat-b52da.firebaseapp.com",
  projectId: "gymrat-b52da",
  storageBucket: "gymrat-b52da.firebasestorage.app",
  messagingSenderId: "575528958091",
  appId: "1:575528958091:web:fe9ef851cbe986f81a3c8e",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function registerWithEmail(email, password, displayName) {
  return createUserWithEmailAndPassword(auth, email, password).then((cred) =>
    updateProfile(cred.user, { displayName }).then(() => cred)
  );
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export function updateAuthProfile({ displayName, photoURL }) {
  return updateProfile(auth.currentUser, { displayName, photoURL: photoURL || null });
}
