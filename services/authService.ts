import { User } from '../types';
import { auth, firestore } from './firebase';
import firebase from 'firebase/app';

export const authService = {
  login: async (email: string, passwordInput: string): Promise<User> => {
    // FIX: Use v8 namespaced auth API
    const userCredential = await auth.signInWithEmailAndPassword(email, passwordInput);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      // Fetch user profile from Firestore
      // FIX: Use v8 namespaced firestore API
      const userDocRef = firestore.collection("users").doc(firebaseUser.uid);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        if (userData.disabled) {
          // FIX: Use v8 namespaced auth API
          await auth.signOut();
          throw new Error("Your account has been disabled. Please contact an administrator.");
        }
        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        // FIX: Use v8 namespaced auth API
        await auth.signOut();
        throw new Error("User profile not found.");
      }
    }
    throw new Error("Login failed: could not retrieve user information.");
  },

  logout: async (): Promise<void> => {
    // FIX: Use v8 namespaced auth API
    await auth.signOut();
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    // FIX: Use v8 namespaced auth API and firebase.User type
    return auth.onAuthStateChanged(async (firebaseUser: firebase.User | null) => {
      if (firebaseUser) {
        // FIX: Use v8 namespaced firestore API
        const userDocRef = firestore.collection("users").doc(firebaseUser.uid);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            if (userData.disabled) {
                // FIX: Use v8 namespaced auth API
                await auth.signOut();
                callback(null);
            } else {
                 callback({ id: firebaseUser.uid, ...userData } as User);
            }
        } else {
          // User exists in Auth but not Firestore, log them out.
          // FIX: Use v8 namespaced auth API
          await auth.signOut();
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
};
