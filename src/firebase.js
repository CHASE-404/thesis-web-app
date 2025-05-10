import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update, get, set } from "firebase/database";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updatePassword,
  signOut,
  updateProfile
} from "firebase/auth";

// Your web app's Firebase configuration using Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Helper function to format phone number to email format for Firebase Auth
const formatPhoneToEmail = (number) => {
  // Remove any non-digit characters
  const digits = number.replace(/\D/g, '');
  
  // If it starts with 0, assume it's a Philippine number and replace with 63
  if (digits.startsWith('0')) {
    return '63' + digits.substring(1) + '@hydro.app';
  }
  
  // If it might already have the country code
  if (digits.startsWith('63')) {
    return digits + '@hydro.app';
  }
  
  // Default case
  return '63' + digits + '@hydro.app';
};

export { 
  db, 
  ref, 
  onValue, 
  update, 
  get, 
  set,
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updatePassword,
  signOut,
  updateProfile,
  formatPhoneToEmail
}; 