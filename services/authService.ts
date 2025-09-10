import { User } from '../types';
import { auth, firestore } from './firebase';
import { doc, getDoc } from "firebase/firestore";
// Fix: Import firebase/auth as a namespace to avoid potential module resolution issues.
import * as firebaseAuth from 'firebase/auth';

export const authService = {
  login: async (email: string, passwordInput: string): Promise<User> => {
    // Fix: Use the namespace to access signInWithEmailAndPassword.
    const userCredential = await firebaseAuth.signInWithEmailAndPassword(auth, email, passwordInput);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      // Fetch user profile from Firestore
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        if (userData.disabled) {
          // Fix: Use the namespace to access signOut.
          await firebaseAuth.signOut(auth);
          throw new Error("Your account has been disabled. Please contact an administrator.");
        }
        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        // This case should ideally not happen if user creation is handled correctly
        // Fix: Use the namespace to access signOut.
        await firebaseAuth.signOut(auth);
        throw new Error("User profile not found.");
      }
    }
    throw new Error("Login failed: could not retrieve user information.");
  },

  logout: async (): Promise<void> => {
    // Fix: Use the namespace to access signOut.
    await firebaseAuth.signOut(auth);
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    // Fix: Use the namespace to access onAuthStateChanged.
    return firebaseAuth.onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            if (userData.disabled) {
                // Fix: Use the namespace to access signOut.
                await firebaseAuth.signOut(auth);
                callback(null);
            } else {
                 callback({ id: firebaseUser.uid, ...userData } as User);
            }
        } else {
          // User exists in Auth but not Firestore, log them out.
          // Fix: Use the namespace to access signOut.
          await firebaseAuth.signOut(auth);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
};
