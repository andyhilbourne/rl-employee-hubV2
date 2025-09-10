import { User } from '../types';
import { auth, firestore } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  deleteDoc,
  arrayUnion,
} from 'firebase/firestore';
// FIX: Import v9 auth functions directly instead of using a namespace.
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';

const usersCollection = collection(firestore, 'users');
const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbya5gmaGfXD3Iy-ChHE9Ev67WuE8CAZROoCf6VhAuTn49RQMDZ2X3yANkvhRrC8YMjq/exec';


export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const q = query(usersCollection, where("disabled", "==", false));
    const querySnapshot = await getDocs(usersCollection); // fetch all to show disabled status
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  getUserById: async (userId: string): Promise<User | undefined> => {
    const docRef = doc(firestore, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return undefined;
  },

  createUser: async (userData: Omit<User, 'id'>, password: string): Promise<User> => {
      // Step 1: Create user in Firebase Authentication
      // FIX: Use imported v9 function directly.
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      const firebaseUser = userCredential.user;

      // Step 2: Create user profile in Firestore
      const newUserProfile: Omit<User, 'id'> = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        webhookUrl: userData.webhookUrl || DEFAULT_WEBHOOK_URL,
        disabled: false,
        submittedWeeks: [],
      };
      
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      await setDoc(userDocRef, newUserProfile);

      return { id: firebaseUser.uid, ...newUserProfile };
  },

  updateUser: async (userId: string, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined> => {
    const docRef = doc(firestore, 'users', userId);
    await updateDoc(docRef, updates);
    return await userService.getUserById(userId);
  },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    // FIX: Use imported v9 function directly.
    await sendPasswordResetEmail(auth, email);
  },

  toggleUserStatus: async (userId: string, isDisabled: boolean): Promise<void> => {
    const user = await userService.getUserById(userId);
    if (user?.email === 'andyhilbourne@example.com') { // Use a non-deletable identifier
        throw new Error("The primary admin account cannot be disabled.");
    }
    const docRef = doc(firestore, 'users', userId);
    await updateDoc(docRef, { disabled: isDisabled });
    // Note: This does not sign out an active user. For that, you'd need Firebase Functions.
  },

  // ---- Submitted Weeks Management for Timesheets ----
  
  addSubmittedWeek: async (userId: string, weekIdentifier: string) => {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, {
        submittedWeeks: arrayUnion(weekIdentifier)
    });
  },
};
