import { User } from '../types';
import { auth, firestore } from './firebase';
import { doc, getDoc } from "firebase/firestore";
// FIX: Import v9 auth functions directly instead of using a namespace.
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

export const authService = {
  login: async (email: string, passwordInput: string): Promise<User> => {
    // FIX: Use imported v9 function directly.
    const userCredential = await signInWithEmailAndPassword(auth, email, passwordInput);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      // Fetch user profile from Firestore
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        if (userData.disabled) {
          // FIX: Use imported v9 function directly.
          await signOut(auth);
          throw new Error("Your account has been disabled. Please contact an administrator.");
        }
        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        // This case should ideally not happen if user creation is handled correctly
        // FIX: Use imported v9 function directly.
        await signOut(auth);
        throw new Error("User profile not found.");
      }
    }
    throw new Error("Login failed: could not retrieve user information.");
  },

  logout: async (): Promise<void> => {
    // FIX: Use imported v9 function directly.
    await signOut(auth);
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    // FIX: Use imported v9 function directly.
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            if (userData.disabled) {
                // FIX: Use imported v9 function directly.
                await signOut(auth);
                callback(null);
            } else {
                 callback({ id: firebaseUser.uid, ...userData } as User);
            }
        } else {
          // User exists in Auth but not Firestore, log them out.
          // FIX: Use imported v9 function directly.
          await signOut(auth);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
};
