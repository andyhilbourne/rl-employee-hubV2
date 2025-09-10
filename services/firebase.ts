import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

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
// FIX: Use v8 initialization pattern, checking for existing apps to prevent errors during hot-reloading.
const app: firebase.app.App = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Export Firebase services using the v8 namespaced pattern
export const auth = firebase.auth();
export const firestore = firebase.firestore();

export default app;
