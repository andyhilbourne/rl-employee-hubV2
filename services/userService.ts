import { User } from '../types';
import { auth, firestore } from './firebase';
import firebase from 'firebase/app'; // Needed for FieldValue

// FIX: Use v8 namespaced firestore API
const usersCollection = firestore.collection('users');
const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbya5gmaGfXD3Iy-ChHE9Ev67WuE8CAZROoCf6VhAuTn49RQMDZ2X3yANkvhRrC8YMjq/exec';


export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    // FIX: Use v8 namespaced firestore API. The original code fetched all users, not just non-disabled ones.
    const querySnapshot = await usersCollection.get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  getUserById: async (userId: string): Promise<User | undefined> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = usersCollection.doc(userId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return undefined;
  },

  createUser: async (userData: Omit<User, 'id'>, password: string): Promise<User> => {
      // Step 1: Create user in Firebase Authentication
      // FIX: Use v8 namespaced auth API
      const userCredential = await auth.createUserWithEmailAndPassword(userData.email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("Could not create user account.");
      }

      // Step 2: Create user profile in Firestore
      const newUserProfile: Omit<User, 'id'> = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        webhookUrl: userData.webhookUrl || DEFAULT_WEBHOOK_URL,
        disabled: false,
        submittedWeeks: [],
      };
      
      // FIX: Use v8 namespaced firestore API
      const userDocRef = usersCollection.doc(firebaseUser.uid);
      await userDocRef.set(newUserProfile);

      return { id: firebaseUser.uid, ...newUserProfile };
  },

  updateUser: async (userId: string, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = usersCollection.doc(userId);
    await docRef.update(updates);
    return await userService.getUserById(userId);
  },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    // FIX: Use v8 namespaced auth API
    await auth.sendPasswordResetEmail(email);
  },

  toggleUserStatus: async (userId: string, isDisabled: boolean): Promise<void> => {
    const user = await userService.getUserById(userId);
    if (user?.email === 'andyhilbourne@example.com') { // Use a non-deletable identifier
        throw new Error("The primary admin account cannot be disabled.");
    }
    // FIX: Use v8 namespaced firestore API
    const docRef = usersCollection.doc(userId);
    await docRef.update({ disabled: isDisabled });
    // Note: This does not sign out an active user. For that, you'd need Firebase Functions.
  },

  // ---- Submitted Weeks Management for Timesheets ----
  
  addSubmittedWeek: async (userId: string, weekIdentifier: string) => {
    const userDocRef = usersCollection.doc(userId);
    // FIX: Use v8 namespaced firestore API for arrayUnion
    await userDocRef.update({
        submittedWeeks: firebase.firestore.FieldValue.arrayUnion(weekIdentifier)
    });
  },
};
