import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCFAa3m_0jVhEgGAOg7Jc9yjsMmoKdlhbk",
  authDomain: "aumnex-75da6.firebaseapp.com",
  projectId: "aumnex-75da6",
  storageBucket: "aumnex-75da6.firebasestorage.app",
  messagingSenderId: "641614624572",
  appId: "1:641614624572:web:03c28e6c52a3afa3f35039",
  measurementId: "G-QPRGF2TPMZ",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;