import { initializeApp } from 'firebase/app';
// Fix: Import firebase/auth as a namespace to avoid potential module resolution issues.
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// This is restored from your previous input to fix the API key error.
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
// Fix: Use the namespace to access getAuth.
export const auth = firebaseAuth.getAuth(app);
export const firestore = getFirestore(app);
export default app;
