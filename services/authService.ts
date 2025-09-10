import { User } from '../types';
import { auth, firestore } from './firebase';
import { doc, getDoc } from "firebase/firestore";
// FIX: The project is using the Firebase v8 compat library for Auth.
// The modular v9 imports were incorrect and have been replaced with an import for the 'firebase/compat/app' to access the User type.
import firebase from 'firebase/compat/app';

export const authService = {
  login: async (email: string, passwordInput: string): Promise<User> => {
    // FIX: Changed to v8 compat syntax: auth.signInWithEmailAndPassword
    const userCredential = await auth.signInWithEmailAndPassword(email, passwordInput);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      // Fetch user profile from Firestore
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        if (userData.disabled) {
          // FIX: Changed to v8 compat syntax: auth.signOut
          await auth.signOut();
          throw new Error("Your account has been disabled. Please contact an administrator.");
        }
        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        // This case should ideally not happen if user creation is handled correctly
        // FIX: Changed to v8 compat syntax: auth.signOut
        await auth.signOut();
        throw new Error("User profile not found.");
      }
    }
    throw new Error("Login failed: could not retrieve user information.");
  },

  logout: async (): Promise<void> => {
    // FIX: Changed to v8 compat syntax: auth.signOut
    await auth.signOut();
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    // FIX: Changed to v8 compat syntax: auth.onAuthStateChanged
    return auth.onAuthStateChanged(async (firebaseUser: firebase.User | null) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            if (userData.disabled) {
                // FIX: Changed to v8 compat syntax: auth.signOut
                await auth.signOut();
                callback(null);
            } else {
                 callback({ id: firebaseUser.uid, ...userData } as User);
            }
        } else {
          // User exists in Auth but not Firestore, log them out.
          // FIX: Changed to v8 compat syntax: auth.signOut
          await auth.signOut();
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
};
