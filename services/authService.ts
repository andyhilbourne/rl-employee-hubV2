import { User } from '../types';
import { auth, firestore } from './firebase';
// FIX: Using Firebase compat auth, so modular imports are removed. The FirebaseUser type will be inferred.
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const authService = {
  login: async (email: string, passwordInput: string): Promise<User> => {
    // FIX: Use compat auth API
    const userCredential = await auth.signInWithEmailAndPassword(email, passwordInput);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      const userDocRef = doc(firestore, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        if (userData.disabled) {
          // FIX: Use compat auth API
          await auth.signOut();
          throw new Error("Your account has been disabled. Please contact an administrator.");
        }
        return { id: firebaseUser.uid, ...userData } as User;
      } else {
        // FIX: Use compat auth API
        await auth.signOut();
        throw new Error("User profile not found.");
      }
    }
    throw new Error("Login failed: could not retrieve user information.");
  },

  logout: async (): Promise<void> => {
    // FIX: Use compat auth API
    await auth.signOut();
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    // FIX: Use compat auth API
    return auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            if (userData.disabled) {
                // FIX: Use compat auth API
                await auth.signOut();
                callback(null);
            } else {
                 callback({ id: firebaseUser.uid, ...userData } as User);
            }
        } else {
          // User exists in Auth but not Firestore, log them out.
          // FIX: Use compat auth API
          await auth.signOut();
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
};
