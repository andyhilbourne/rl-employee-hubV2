import { Job, JobWithSiteInfo } from '../types';
import { firestore } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { siteService } from './siteService';

const jobsCollection = collection(firestore, 'jobs');

export const jobService = {
  getUpcomingJobsForUser: async (userId: string): Promise<JobWithSiteInfo[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);
    
    const q = query(
        jobsCollection,
        where('assignedUserId', '==', userId),
        where('status', '!=', 'Completed'),
        where('startDate', '<=', sevenDaysFromNow.toISOString().split('T')[0])
    );
    
    const querySnapshot = await getDocs(q);
    const jobs: Job[] = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        const jobEndDate = new Date(data.endDate + 'T23:59:59');
        if (jobEndDate >= today) {
            jobs.push({ id: doc.id, ...data } as Job);
        }
    });

    const jobsWithSiteInfo: JobWithSiteInfo[] = [];
    for (const job of jobs) {
      const site = await siteService.getSiteById(job.siteId);
      if (site) {
        jobsWithSiteInfo.push({
          ...job,
          siteTitle: site.title,
          siteAddress: site.address,
        });
      } else {
        jobsWithSiteInfo.push({
          ...job,
          siteTitle: 'Unknown Site',
          siteAddress: 'N/A',
        });
      }
    }

    jobsWithSiteInfo.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return jobsWithSiteInfo;
  },
  
  getJobsBySiteId: async (siteId: string): Promise<Job[]> => {
    const q = query(jobsCollection, where('siteId', '==', siteId), orderBy('startDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
  },

  getAllJobsForAdmin: async (): Promise<Job[]> => {
    const querySnapshot = await getDocs(jobsCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
  },

  getJobById: async (jobId: string): Promise<Job | undefined> => {
    const docRef = doc(firestore, 'jobs', jobId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Job;
    }
    return undefined;
  },

  createJob: async (jobData: Omit<Job, 'id' | 'status'>): Promise<Job> => {
    const newJobData = {
      ...jobData,
      status: 'Pending',
    };
    const docRef = await addDoc(jobsCollection, newJobData);
    return { id: docRef.id, ...newJobData } as Job;
  },

  updateJob: async (jobId: string, jobUpdateData: Partial<Omit<Job, 'id' | 'status' | 'siteId'>>): Promise<Job | undefined> => {
    const docRef = doc(firestore, 'jobs', jobId);
    await updateDoc(docRef, jobUpdateData);
    return await jobService.getJobById(jobId);
  },
  
  deleteJob: async (jobId: string): Promise<void> => {
    const docRef = doc(firestore, 'jobs', jobId);
    await deleteDoc(docRef);
  },

  updateJobStatus: async (jobId: string, status: Job['status']): Promise<Job | undefined> => {
    const docRef = doc(firestore, 'jobs', jobId);
    await updateDoc(docRef, { status });
    return await jobService.getJobById(jobId);
  }
};