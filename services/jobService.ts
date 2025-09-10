import { Job, JobWithSiteInfo } from '../types';
import { firestore } from './firebase';
import { siteService } from './siteService';

// FIX: Use v8 namespaced firestore API
const jobsCollection = firestore.collection('jobs');

export const jobService = {
  getUpcomingJobsForUser: async (userId: string): Promise<JobWithSiteInfo[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);
    
    // FIX: Use v8 namespaced firestore API for querying
    const q = jobsCollection
        .where('assignedUserId', '==', userId)
        .where('status', '!=', 'Completed')
        .where('startDate', '<=', sevenDaysFromNow.toISOString().split('T')[0]);
    
    const querySnapshot = await q.get();
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
    // FIX: Use v8 namespaced firestore API for querying
    const q = jobsCollection.where('siteId', '==', siteId).orderBy('startDate', 'desc');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
  },

  getAllJobsForAdmin: async (): Promise<Job[]> => {
    // FIX: Use v8 namespaced firestore API
    const querySnapshot = await jobsCollection.get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
  },

  getJobById: async (jobId: string): Promise<Job | undefined> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = jobsCollection.doc(jobId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Job;
    }
    return undefined;
  },

  createJob: async (jobData: Omit<Job, 'id' | 'status'>): Promise<Job> => {
    const newJobData = {
      ...jobData,
      status: 'Pending',
    };
    // FIX: Use v8 namespaced firestore API
    const docRef = await jobsCollection.add(newJobData);
    return { id: docRef.id, ...newJobData } as Job;
  },

  updateJob: async (jobId: string, jobUpdateData: Partial<Omit<Job, 'id' | 'status' | 'siteId'>>): Promise<Job | undefined> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = jobsCollection.doc(jobId);
    await docRef.update(jobUpdateData);
    return await jobService.getJobById(jobId);
  },
  
  deleteJob: async (jobId: string): Promise<void> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = jobsCollection.doc(jobId);
    await docRef.delete();
  },

  updateJobStatus: async (jobId: string, status: Job['status']): Promise<Job | undefined> => {
    // FIX: Use v8 namespaced firestore API
    const docRef = jobsCollection.doc(jobId);
    await docRef.update({ status });
    return await jobService.getJobById(jobId);
  }
};
