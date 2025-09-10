import { initializeApp } from 'firebase/app';
// FIX: Changed import path to `firebase/auth/browser` to resolve module export error for `getAuth`.
import { getAuth } from 'firebase/auth/browser';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-6Y5V_c6ePDe-nqjiMPi-PlSnVMGEBgo",
  authDomain: "rl-employee-hub-v2.firebaseapp.com",
  projectId: "rl-employee-hub-v2",
  storageBucket: "rl-employee-hub-v2.appspot.com",
  messagingSenderId: "386245536917",
  appId: "1:386245536917:web:ad4a354c95ee8e6d063f9c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);