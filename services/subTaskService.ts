
import { SubTask } from '../types';

const MOCK_SUBTASKS_STORAGE_KEY = 'rlAllSubTasks';

const initialMockSubTasks: SubTask[] = [
  // Example sub-tasks for job001 (Site Preparation - Phase 1)
  { id: 'sub001', jobId: 'job001', title: 'Clear North Quadrant', assignedUserId: 'emp001', status: 'Pending', description: 'Remove all large debris from the north section.' },
  { id: 'sub002', jobId: 'job001', title: 'Mark Utility Lines', assignedUserId: 'emp001', status: 'Pending', description: 'Identify and mark all known utility lines before digging.' },
  // Example sub-tasks for job002 (Foundation Pouring)
  { id: 'sub003', jobId: 'job002', title: 'Setup Concrete Forms', assignedUserId: 'emp001', status: 'In Progress' },
  { id: 'sub004', jobId: 'job002', title: 'Verify Rebar Placement', assignedUserId: 'emp002', status: 'Pending' },
];

const getStoredSubTasks = (): SubTask[] => {
  const stored = localStorage.getItem(MOCK_SUBTASKS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing sub-tasks from localStorage", e);
    }
  }
  localStorage.setItem(MOCK_SUBTASKS_STORAGE_KEY, JSON.stringify(initialMockSubTasks));
  return initialMockSubTasks;
};

const saveSubTasks = (subTasks: SubTask[]): void => {
  localStorage.setItem(MOCK_SUBTASKS_STORAGE_KEY, JSON.stringify(subTasks));
};

export const subTaskService = {
  getSubTasksByJobId: async (jobId: string): Promise<SubTask[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allSubTasks = getStoredSubTasks();
        resolve(allSubTasks.filter(st => st.jobId === jobId));
      }, 150);
    });
  },

  getSubTasksByJobIdAndUserId: async (jobId: string, userId: string): Promise<SubTask[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allSubTasks = getStoredSubTasks();
        resolve(allSubTasks.filter(st => st.jobId === jobId && st.assignedUserId === userId));
      }, 150);
    });
  },

  createSubTask: async (subTaskData: Omit<SubTask, 'id'>): Promise<SubTask> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allSubTasks = getStoredSubTasks();
        const newSubTask: SubTask = {
          ...subTaskData,
          id: `sub_${Date.now()}`,
        };
        const updatedSubTasks = [...allSubTasks, newSubTask];
        saveSubTasks(updatedSubTasks);
        resolve(newSubTask);
      }, 200);
    });
  },

  updateSubTask: async (subTaskId: string, updates: Partial<Omit<SubTask, 'id' | 'jobId'>>): Promise<SubTask | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let allSubTasks = getStoredSubTasks();
        const index = allSubTasks.findIndex(st => st.id === subTaskId);
        if (index > -1) {
          allSubTasks[index] = { ...allSubTasks[index], ...updates };
          saveSubTasks(allSubTasks);
          resolve(allSubTasks[index]);
        } else {
          resolve(undefined);
        }
      }, 200);
    });
  },

  deleteSubTask: async (subTaskId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let allSubTasks = getStoredSubTasks();
        const updatedSubTasks = allSubTasks.filter(st => st.id !== subTaskId);
        saveSubTasks(updatedSubTasks);
        resolve();
      }, 200);
    });
  },
};
