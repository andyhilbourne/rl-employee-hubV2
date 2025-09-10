import { Site } from '../types';
import { firestore } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

const sitesCollection = collection(firestore, 'sites');

export const siteService = {
  getAllSites: async (): Promise<Site[]> => {
    const querySnapshot = await getDocs(sitesCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
  },

  getSiteById: async (siteId: string): Promise<Site | undefined> => {
    const docRef = doc(firestore, 'sites', siteId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Site;
    }
    return undefined;
  },

  createSite: async (siteData: Omit<Site, 'id'>): Promise<Site> => {
    const docRef = await addDoc(sitesCollection, siteData);
    return { id: docRef.id, ...siteData };
  },

  updateSite: async (siteId: string, siteUpdateData: Partial<Omit<Site, 'id'>>): Promise<Site | undefined> => {
    const docRef = doc(firestore, 'sites', siteId);
    await updateDoc(docRef, siteUpdateData);
    return await siteService.getSiteById(siteId);
  },

  deleteSite: async (siteId: string): Promise<void> => {
    const docRef = doc(firestore, 'sites', siteId);
    await deleteDoc(docRef);
  }
};