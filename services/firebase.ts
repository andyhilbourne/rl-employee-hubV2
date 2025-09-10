// services/firebase.ts
import { initializeApp } from 'firebase/app';
// FIX: The 'firebase/auth' module is not resolving correctly in this environment. Using the explicit browser entry point.
import { getAuth } from 'firebase/auth-browser';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmvNlUJsBOV98elLXhhPQ6BI5CXDNEZuU",
  authDomain: "rl-employee-hub-v3.firebaseapp.com",
  projectId: "rl-employee-hub-v3",
  storageBucket: "rl-employee-hub-v3.firebasestorage.app",
  messagingSenderId: "940633526053",
  appId: "1:940633526053:web:ce9edfc0116d6681bf94cc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);