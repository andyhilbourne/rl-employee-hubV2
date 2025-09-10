import { User } from '../types';
import { auth, firestore } from './firebase';
// FIX: Changed import path to `firebase/auth/browser` to resolve module export errors.
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth/browser';
import { doc, getDoc } from 'firebase/firestore';

export const authService = {
  login: async (email: string, passwordInput: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, passwordInput);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        if (userData.disabled) {
          await signOut(auth);
          throw new Error("Your account has been disabled. Please contact an administrator.");
        }
        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        await signOut(auth);
        throw new Error("User profile not found.");
      }
    }
    throw new Error("Login failed: could not retrieve user information.");
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            if (userData.disabled) {
                await signOut(auth);
                callback(null);
            } else {
                 callback({ id: firebaseUser.uid, ...userData } as User);
            }
        } else {
          // User exists in Auth but not Firestore, log them out.
          await signOut(auth);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
};