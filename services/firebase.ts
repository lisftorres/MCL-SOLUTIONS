import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Accès sécurisé aux variables d'environnement pour éviter le crash "Cannot read properties of undefined"
// Si import.meta.env n'est pas défini, on utilise un objet vide.
// @ts-ignore
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

let app;
let auth: any;
let db: any;
let storage: any;

try {
  // Vérification que la configuration est présente avant d'initialiser
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase configuration missing. Check your VITE_FIREBASE_* environment variables.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// Export des services (peuvent être undefined si la config échoue, ce qui est géré dans App.tsx)
export { auth, db, storage };