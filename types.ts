export interface User {
  id: string; // This will be the Firebase Auth UID
  email: string;
  name: string;
  role: string;
  webhookUrl?: string;
  disabled?: boolean;
  submittedWeeks?: string[];
}

export interface Site {
  id:string;
  siteNumber: string;
  title: string;
  address: string;
  description: string;
}

export interface Job {
  id: string;
  siteId: string; // ID of the parent Site
  title: string; // Title of this specific task/job within the site
  description: string; // Specific instructions for the employee
  assignedUserId: string; // ID of the User assigned to this job
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: 'Pending' | 'In Progress' | 'Completed';
}

// For returning Job with its parent Site's essential info
export interface JobWithSiteInfo extends Job {
  siteTitle: string;
  siteAddress: string;
}


export interface SubTask {
  id: string;
  jobId: string; // ID of the parent Job (the new refactored Job)
  title: string;
  description?: string;
  assignedUserId: string; // ID of the User assigned to this specific sub-task (could be same as parent Job's user or different if sub-delegated)
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface TimeEntry {
  id: string;
  userId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  jobId?: string; // ID of the Job this time was logged against
  siteId?: string; // ID of the Site this time was logged against
  notes?: string; // Optional notes for manual edits
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  CLOCK_IN_OUT = 'CLOCK_IN_OUT',
  WEEKLY_SCHEDULE = 'WEEKLY_SCHEDULE',
  TIMESHEETS = 'TIMESHEETS',
  ADMIN_JOB_MANAGEMENT = 'ADMIN_JOB_MANAGEMENT',
  ADMIN_USER_MANAGEMENT = 'ADMIN_USER_MANAGEMENT',
  ADMIN_TIMESHEET_REPORTS = 'ADMIN_TIMESHEET_REPORTS',
}