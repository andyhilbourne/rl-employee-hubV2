import { User } from '../types';
import { auth, firestore } from './firebase';
// FIX: Add type import for firebase.User from compat library.
import type firebase from 'firebase/compat/app';
// FIX: Removed imports from 'firebase/auth' as they were causing errors. Switched to compat API.
/*
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
*/
import { doc, getDoc } from 'firebase/firestore';

export const authService = {
  login: async (email: string, passwordInput: string): Promise<User> => {
    // FIX: Switched to compat API `auth.signInWithEmailAndPassword`
    const userCredential = await auth.signInWithEmailAndPassword(email, passwordInput);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        if (userData.disabled) {
          // FIX: Switched to compat API `auth.signOut`
          await auth.signOut();
          throw new Error("Your account has been disabled. Please contact an administrator.");
        }
        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        // FIX: Switched to compat API `auth.signOut`
        await auth.signOut();
        throw new Error("User profile not found.");
      }
    }
    throw new Error("Login failed: could not retrieve user information.");
  },

  logout: async (): Promise<void> => {
    // FIX: Switched to compat API `auth.signOut`
    await auth.signOut();
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    // FIX: Switched to compat API `auth.onAuthStateChanged` and firebase.User type
    return auth.onAuthStateChanged(async (firebaseUser: firebase.User | null) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            if (userData.disabled) {
                // FIX: Switched to compat API `auth.signOut`
                await auth.signOut();
                callback(null);
            } else {
                 callback({ id: firebaseUser.uid, ...userData } as User);
            }
        } else {
          // User exists in Auth but not Firestore, log them out.
          // FIX: Switched to compat API `auth.signOut`
          await auth.signOut();
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
};
