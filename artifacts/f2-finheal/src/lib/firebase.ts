import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "[GCP_API_KEY]",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "finheal-59748.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "finheal-59748",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "finheal-59748.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "580523435709",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:580523435709:web:532e43023ccc670ff239d4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PKC2ZFWW9B",
};

export function getFirebaseAuth(): Auth {
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("Firebase API Key is missing. Please add VITE_FIREBASE_API_KEY to your .env file.");
  }
  const app = !getApps().length ? initializeApp({ ...firebaseConfig, apiKey }) : getApp();
  return getAuth(app);
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
