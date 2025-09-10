import { User } from '../types';
import { auth, firestore } from './firebase';
import { doc, getDoc } from "firebase/firestore";
// FIX: Module '"firebase/auth"' has no exported member 'signInWithEmailAndPassword', 'signOut', 'onAuthStateChanged'. Switched to v8 compat syntax.
// import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

export const authService = {
  login: async (email: string, passwordInput: string): Promise<User> => {
    // FIX: Use v8 compat syntax for signInWithEmailAndPassword.
    const userCredential = await auth.signInWithEmailAndPassword(email, passwordInput);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      // Fetch user profile from Firestore
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        if (userData.disabled) {
          // FIX: Use v8 compat syntax for signOut.
          await auth.signOut();
          throw new Error("Your account has been disabled. Please contact an administrator.");
        }
        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        // This case should ideally not happen if user creation is handled correctly
        // FIX: Use v8 compat syntax for signOut.
        await auth.signOut();
        throw new Error("User profile not found.");
      }
    }
    throw new Error("Login failed: could not retrieve user information.");
  },

  logout: async (): Promise<void> => {
    // FIX: Use v8 compat syntax for signOut.
    await auth.signOut();
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    // FIX: Use v8 compat syntax for onAuthStateChanged.
    return auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            if (userData.disabled) {
                // FIX: Use v8 compat syntax for signOut.
                await auth.signOut();
                callback(null);
            } else {
                 callback({ id: firebaseUser.uid, ...userData } as User);
            }
        } else {
          // User exists in Auth but not Firestore, log them out.
          // FIX: Use v8 compat syntax for signOut.
          await auth.signOut();
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
};
