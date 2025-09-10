// services/firebase.ts
// FIX: Switched to Firebase compat library for auth to resolve import errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
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
const app = firebase.initializeApp(firebaseConfig);

// Export Firebase services
// FIX: Use compat auth instance. Firestore remains modular.
export const auth = firebase.auth();
export const firestore = getFirestore(app);
