// Import Firebase functions (modular SDK for v9+)
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update, get } from "firebase/database";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updatePassword,
  signOut,
  updateProfile
} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtu5uxU0X9_19X5u01rOR082qDlbCOvf4",
  authDomain: "btsthesis-cdd38.firebaseapp.com",
  databaseURL: "https://btsthesis-cdd38-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "btsthesis-cdd38",
  storageBucket: "btsthesis-cdd38.firebasestorage.app",
  messagingSenderId: "695562557675",
  appId: "1:695562557675:web:f3545e1edf7444e21806ae",
  measurementId: "G-S96TBNS4YN"
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