// FIX: Use Firebase v9 compat imports for Authentication.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
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
const app = firebase.initializeApp(firebaseConfig);

// Export Firebase services
// FIX: Use the compat syntax for getting the auth instance.
export const auth = firebase.auth();
export const firestore = getFirestore(app);
export default app;
