import { TimeEntry } from '../types';
import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  Timestamp, 
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';


const timeEntriesCollection = collection(firestore, 'timeEntries');

// Helper to convert Firestore Timestamps to Dates in entries
const mapEntry = (docSnap: DocumentSnapshot): TimeEntry => {
    const data = docSnap.data()!;
    const clockInTimestamp = data.clockInTime as Timestamp;
    const clockOutTimestamp = data.clockOutTime as Timestamp;

    return {
        id: docSnap.id,
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
    const currentClockInRef = doc(firestore, `users/${userId}/currentClockIn`, 'entry');
    await setDoc(currentClockInRef, newEntry);

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
    const docRef = await addDoc(timeEntriesCollection, finalEntryData);

    // Clear the current clock-in record
    const currentClockInRef = doc(firestore, `users/${userId}/currentClockIn`, 'entry');
    await deleteDoc(currentClockInRef);
    
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
    const docRef = await addDoc(timeEntriesCollection, completedEntryData);

    // Start a new clock-in segment immediately
    const newCurrentEntry: Omit<TimeEntry, 'id'> = {
      userId,
      clockInTime: clockOutTime, // New segment starts where the last one ended
    };
    const currentClockInRef = doc(firestore, `users/${userId}/currentClockIn`, 'entry');
    await setDoc(currentClockInRef, newCurrentEntry);

    return { id: docRef.id, ...completedEntryData };
  },

  getCurrentClockInEntry: async (userId: string): Promise<Omit<TimeEntry, 'id'> | null> => {
    const currentClockInRef = doc(firestore, `users/${userId}/currentClockIn`, 'entry');
    const docSnap = await getDoc(currentClockInRef);
    if (docSnap.exists()) {
        const data = docSnap.data()!;
        return {
            ...data,
            clockInTime: (data.clockInTime as Timestamp).toDate(),
        } as Omit<TimeEntry, 'id'>;
    }
    return null;
  },

  getTimesheetEntries: async (userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> => {
    const queryConstraints: QueryConstraint[] = [where('userId', '==', userId)];

    if (startDate) {
        queryConstraints.push(where('clockInTime', '>=', startDate));
    }
    if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        queryConstraints.push(where('clockInTime', '<=', endOfDay));
    }

    const q = query(timeEntriesCollection, ...queryConstraints, orderBy('clockInTime', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapEntry);
  },

  updateTimesheetEntry: async (userId: string, entryId: string, updates: Partial<Pick<TimeEntry, 'clockInTime' | 'clockOutTime' | 'notes' | 'jobId' | 'siteId'>>): Promise<TimeEntry> => {
    const docRef = doc(firestore, 'timeEntries', entryId);
    
    // Ensure we are not trying to update a non-existent entry that belongs to the user
    const entrySnap = await getDoc(docRef);
    if (!entrySnap.exists() || entrySnap.data()!.userId !== userId) {
        throw new Error("Time entry not found or permission denied.");
    }

    await updateDoc(docRef, updates);
    const updatedSnap = await getDoc(docRef);
    return mapEntry(updatedSnap);
  },

  deleteTimesheetEntry: async (userId: string, entryId: string): Promise<void> => {
    const docRef = doc(firestore, 'timeEntries', entryId);
    const entrySnap = await getDoc(docRef);
     if (!entrySnap.exists() || entrySnap.data()!.userId !== userId) {
        throw new Error("Time entry not found or permission denied.");
    }
    await deleteDoc(docRef);
  },

  getAllTimesheetEntriesForAdmin: async (startDate?: Date, endDate?: Date, filterUserIds?: string[]): Promise<TimeEntry[]> => {
    const queryConstraints: QueryConstraint[] = [];
    
    if (startDate) {
        queryConstraints.push(where('clockInTime', '>=', startDate));
    }
    if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        queryConstraints.push(where('clockInTime', '<=', endOfDay));
    }
     if (filterUserIds && filterUserIds.length > 0) {
        queryConstraints.push(where('userId', 'in', filterUserIds));
    }
    
    const q = query(timeEntriesCollection, ...queryConstraints, orderBy('clockInTime', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapEntry);
  }
};
