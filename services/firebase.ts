// FIX: Import Firebase v9 modular functions instead of relying on a global window object.
import { initializeApp } from 'firebase/app';
// FIX: Import getAuth directly from 'firebase/auth'.
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: Replace this with your actual Firebase project configuration
// You can find this in your Firebase project console:
// Project settings > General > Your apps > Firebase SDK snippet > Config

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
// FIX: Use getAuth directly.
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export default app;
