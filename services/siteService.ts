import { Site } from '../types';
import { firestore } from './firebase';

// FIX: Use v8 namespaced firestore API
const sitesCollection = firestore.collection('sites');

export const siteService = {
  getAllSites: async (): Promise<Site[]> => {
    // FIX: Use v8 namespaced firestore API
    const querySnapshot = await sitesCollection.get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
  },

  getSiteById: async (siteId: string): Promise<Site | undefined> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = sitesCollection.doc(siteId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Site;
    }
    return undefined;
  },

  createSite: async (siteData: Omit<Site, 'id'>): Promise<Site> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = await sitesCollection.add(siteData);
    return { id: docRef.id, ...siteData };
  },

  updateSite: async (siteId: string, siteUpdateData: Partial<Omit<Site, 'id'>>): Promise<Site | undefined> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = sitesCollection.doc(siteId);
    await docRef.update(siteUpdateData);
    return await siteService.getSiteById(siteId);
  },

  deleteSite: async (siteId: string): Promise<void> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = sitesCollection.doc(siteId);
    await docRef.delete();
  }
};
