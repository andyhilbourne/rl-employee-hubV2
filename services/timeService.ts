import { TimeEntry } from '../types';
import { firestore } from './firebase';
import firebase from 'firebase/app'; // For Timestamp type

// FIX: Use v8 namespaced firestore API
const timeEntriesCollection = firestore.collection('timeEntries');

// Helper to convert Firestore Timestamps to Dates in entries
const mapEntry = (doc: firebase.firestore.DocumentSnapshot): TimeEntry => {
    const data = doc.data()!;
    // FIX: Reference v8 Timestamp type
    const clockInTimestamp = data.clockInTime as firebase.firestore.Timestamp;
    const clockOutTimestamp = data.clockOutTime as firebase.firestore.Timestamp;

    return {
        id: doc.id,
        ...data,
        clockInTime: clockInTimestamp.toDate(),
        clockOutTime: data.clockOutTime ? clockOutTimestamp.toDate() : undefined,
    } as TimeEntry;
};

export const timeService = {
  clockIn: async (userId: string): Promise<TimeEntry> => {
    const currentClockIn = await timeService.getCurrentClockInEntry(userId);
    if (currentClockIn) {
      throw new Error("Already clocked in.");
    }

    const newEntry: Omit<TimeEntry, 'id'> = {
      userId,
      clockInTime: new Date(),
    };

    // Store this as the "current" clock-in record for this user
    // FIX: Use v8 namespaced firestore API
    const currentClockInRef = firestore.collection(`users/${userId}/currentClockIn`).doc('entry');
    await currentClockInRef.set(newEntry);

    // The document ID will be generated when clocking out and saving to the main collection.
    // For now, we return a temporary object.
    return { id: 'pending', ...newEntry };
  },

  clockOut: async (userId: string, jobId?: string): Promise<TimeEntry> => {
    const currentClockIn = await timeService.getCurrentClockInEntry(userId);
    if (!currentClockIn) {
      throw new Error("Not clocked in.");
    }
    
    const finalEntryData: Omit<TimeEntry, 'id'> = {
        ...currentClockIn,
        clockOutTime: new Date(),
        jobId: jobId || currentClockIn.jobId,
    };

    // Add the completed entry to the main timesheet collection
    // FIX: Use v8 namespaced firestore API
    const docRef = await timeEntriesCollection.add(finalEntryData);

    // Clear the current clock-in record
    // FIX: Use v8 namespaced firestore API
    const currentClockInRef = firestore.collection(`users/${userId}/currentClockIn`).doc('entry');
    await currentClockInRef.delete();
    
    return { id: docRef.id, ...finalEntryData };
  },

  logJobCompletionAndContinue: async (userId: string, jobId: string): Promise<TimeEntry> => {
    const currentClockIn = await timeService.getCurrentClockInEntry(userId);
    if (!currentClockIn) {
        throw new Error("Cannot complete job because you are not clocked in.");
    }

    const clockOutTime = new Date();

    // Finalize the current time entry segment for the job
    const completedEntryData: Omit<TimeEntry, 'id'> = {
        ...currentClockIn,
        clockOutTime: clockOutTime,
        jobId: jobId,
    };

    // Add it to the main timesheet collection
    // FIX: Use v8 namespaced firestore API
    const docRef = await timeEntriesCollection.add(completedEntryData);

    // Start a new clock-in segment immediately
    const newCurrentEntry: Omit<TimeEntry, 'id'> = {
      userId,
      clockInTime: clockOutTime, // New segment starts where the last one ended
    };
    // FIX: Use v8 namespaced firestore API
    const currentClockInRef = firestore.collection(`users/${userId}/currentClockIn`).doc('entry');
    await currentClockInRef.set(newCurrentEntry);

    return { id: docRef.id, ...completedEntryData };
  },

  getCurrentClockInEntry: async (userId: string): Promise<Omit<TimeEntry, 'id'> | null> => {
    // FIX: Use v8 namespaced firestore API
    const currentClockInRef = firestore.collection(`users/${userId}/currentClockIn`).doc('entry');
    const docSnap = await currentClockInRef.get();
    if (docSnap.exists) {
        const data = docSnap.data()!;
        return {
            ...data,
            // FIX: Reference v8 Timestamp type
            clockInTime: (data.clockInTime as firebase.firestore.Timestamp).toDate(),
        } as Omit<TimeEntry, 'id'>;
    }
    return null;
  },

  getTimesheetEntries: async (userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> => {
    // FIX: Use v8 namespaced firestore API for querying
    let query: firebase.firestore.Query = timeEntriesCollection.where('userId', '==', userId);

    if (startDate) {
        query = query.where('clockInTime', '>=', startDate);
    }
    if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.where('clockInTime', '<=', endOfDay);
    }

    const querySnapshot = await query.orderBy('clockInTime', 'desc').get();
    return querySnapshot.docs.map(mapEntry);
  },

  updateTimesheetEntry: async (userId: string, entryId: string, updates: Partial<Pick<TimeEntry, 'clockInTime' | 'clockOutTime' | 'notes' | 'jobId' | 'siteId'>>): Promise<TimeEntry> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = timeEntriesCollection.doc(entryId);
    
    // Ensure we are not trying to update a non-existent entry that belongs to the user
    const entrySnap = await docRef.get();
    if (!entrySnap.exists || entrySnap.data()!.userId !== userId) {
        throw new Error("Time entry not found or permission denied.");
    }

    await docRef.update(updates);
    const updatedSnap = await docRef.get();
    return mapEntry(updatedSnap);
  },

  deleteTimesheetEntry: async (userId: string, entryId: string): Promise<void> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = timeEntriesCollection.doc(entryId);
    const entrySnap = await docRef.get();
     if (!entrySnap.exists || entrySnap.data()!.userId !== userId) {
        throw new Error("Time entry not found or permission denied.");
    }
    await docRef.delete();
  },

  getAllTimesheetEntriesForAdmin: async (startDate?: Date, endDate?: Date, filterUserIds?: string[]): Promise<TimeEntry[]> => {
    // FIX: Use v8 namespaced firestore API for querying
    let query: firebase.firestore.Query = timeEntriesCollection;
    
    if (startDate) {
        query = query.where('clockInTime', '>=', startDate);
    }
    if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.where('clockInTime', '<=', endOfDay);
    }
     if (filterUserIds && filterUserIds.length > 0) {
        query = query.where('userId', 'in', filterUserIds);
    }
    
    const querySnapshot = await query.orderBy('clockInTime', 'desc').get();
    return querySnapshot.docs.map(mapEntry);
  }
};
