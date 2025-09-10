// services/firebase.ts
import { initializeApp } from 'firebase/app';
// FIX: The modular auth imports are failing. Using the compat library for auth as a workaround.
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
const app = initializeApp(firebaseConfig); // for modular services
firebase.initializeApp(firebaseConfig); // for compat services

// Export Firebase services
export const auth = firebase.auth();
export const firestore = getFirestore(app);
