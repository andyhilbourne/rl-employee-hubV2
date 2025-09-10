import { User } from '../types';
import { auth, firestore } from './firebase';
// FIX: The 'firebase/auth' module is not resolving correctly in this environment. Using the explicit browser entry point.
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth-browser';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';

const usersCollectionRef = collection(firestore, 'users');
const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbya5gmaGfXD3Iy-ChHE9Ev67WuE8CAZROoCf6VhAuTn49RQMDZ2X3yANkvhRrC8YMjq/exec';


export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const querySnapshot = await getDocs(usersCollectionRef);
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
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("Could not create user account.");
      }

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
    await sendPasswordResetEmail(auth, email);
  },

  toggleUserStatus: async (userId: string, isDisabled: boolean): Promise<void> => {
    const user = await userService.getUserById(userId);
    if (user?.email === 'andyhilbourne@example.com') { // Use a non-deletable identifier
        throw new Error("The primary admin account cannot be disabled.");
    }
    const docRef = doc(firestore, 'users', userId);
    await updateDoc(docRef, { disabled: isDisabled });
  },

  // ---- Submitted Weeks Management for Timesheets ----
  
  addSubmittedWeek: async (userId: string, weekIdentifier: string) => {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, {
        submittedWeeks: arrayUnion(weekIdentifier)
    });
  },
};