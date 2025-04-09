// Import Firebase functions (modular SDK for v9+)
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update, get } from "firebase/database"; // Import onValue and get

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

export { db, ref, onValue, update, get }; // Export db, ref, and onValue to use in other files