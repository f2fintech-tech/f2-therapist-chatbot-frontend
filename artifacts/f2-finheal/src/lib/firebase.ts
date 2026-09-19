import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
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
