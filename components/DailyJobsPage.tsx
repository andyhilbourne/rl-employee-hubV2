import React, { useState, useEffect, useCallback } from 'react';
import { User, JobWithSiteInfo, TimeEntry } from '../types';
import { jobService } from '../services/jobService';
import { timeService } from '../services/timeService';
import { LoadingSpinner } from './LoadingSpinner';
import { CalendarDaysIcon } from './icons';
import { Button } from './Button';

interface DailyJobsPageProps {
  user: User;
}

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface JobCardProps {
  job: JobWithSiteInfo;
  onMarkComplete: (jobId: string) => Promise<void>;
  onCopyAddress: (address: string) => void;
  isCompleting: boolean;
  isLogged: boolean;
  isToday: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onMarkComplete, onCopyAddress, isCompleting, isLogged, isToday }) => {
  const statusColors: Record<JobWithSiteInfo['status'], string> = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
  };
  
  const isSingleDayJob = job.startDate === job.endDate;
  const formattedStartDate = new Date(job.startDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const formattedEndDate = new Date(job.endDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const isLogButtonDisabled = !isToday || isLogged || isCompleting || job.status === 'Completed';
  const buttonText = isLogged ? "Work Logged" : (isToday ? "Log Today's Work" : "Log Work");

  return (
    <div className="bg-white shadow-md rounded-lg border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-300 flex flex-col mb-4">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{job.siteTitle}</p>
            <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
          </div>
          <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColors[job.status]}`}>
            {job.status}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{job.description}</p>
        <div className="flex items-center text-sm text-gray-500">
           <i className="fas fa-calendar-alt mr-2"></i>
           <span>{isSingleDayJob ? formattedStartDate : `${formattedStartDate} - ${formattedEndDate}`}</span>
        </div>
      </div>
      
      <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-3">
         <div className="text-sm text-gray-600">
          <i className="fas fa-map-marker-alt mr-2 text-gray-400"></i>
          {job.siteAddress}
        </div>
        <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
          <Button
            onClick={() => onMarkComplete(job.id)}
            variant={isLogged ? 'secondary' : 'primary'}
            size="sm"
            className="w-full"
            isLoading={isCompleting}
            disabled={isLogButtonDisabled}
            leftIcon={<i className="fas fa-check-circle"></i>}
          >
            {buttonText}
          </Button>
          <Button
            onClick={() => onCopyAddress(job.siteAddress)}
            variant="secondary"
            size="sm"
            className="w-full"
            leftIcon={<i className="fas fa-copy"></i>}
          >
            Copy Address
          </Button>
        </div>
      </div>
    </div>
  );
};

export const DailyJobsPage: React.FC<DailyJobsPageProps> = ({ user }) => {
  const [allJobs, setAllJobs] = useState<JobWithSiteInfo[]>([]);
  const [loggedJobDays, setLoggedJobDays] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [completingJobId, setCompletingJobId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
       const [upcomingJobs, timesheetEntries] = await Promise.all([
        jobService.getUpcomingJobsForUser(user.id),
        timeService.getTimesheetEntries(user.id)
      ]);

      setAllJobs(upcomingJobs);

      const loggedSet = new Set<string>();
      timesheetEntries.forEach(entry => {
        if (entry.jobId) {
            // Store as 'jobId-YYYY-MM-DD' using local date
            const dateString = toLocalDateString(new Date(entry.clockInTime));
            loggedSet.add(`${entry.jobId}-${dateString}`);
        }
      });
      setLoggedJobDays(loggedSet);

    } catch (err) {
      setError('Failed to fetch weekly schedule data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleMarkComplete = async (jobId: string) => {
    setCompletingJobId(jobId);
    setError(null);
    setSuccessMessage(null);
    try {
      await timeService.logJobCompletionAndContinue(user.id, jobId);
      
      const todayString = toLocalDateString(new Date());
      setLoggedJobDays(prev => new Set(prev).add(`${jobId}-${todayString}`));

      setSuccessMessage("Time for this job logged successfully. You are still clocked in.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to log work for job.`;
      setError(errorMessage);
    } finally {
      setCompletingJobId(null);
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
      .then(() => {
        setSuccessMessage("Address copied to clipboard!");
        setTimeout(() => setSuccessMessage(null), 2000);
      })
      .catch(err => {
        setError("Could not copy address.");
      });
  };

  const renderSchedule = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    }
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setHours(0,0,0,0); // Normalize to start of day
      date.setDate(date.getDate() + i);
      return date;
    });

    const isScheduleEmpty = !days.some(day => {
        const dayStart = new Date(day);
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23,59,59,999);

        return allJobs.some(job => {
            const jobStart = new Date(job.startDate + 'T00:00:00');
            const jobEnd = new Date(job.endDate + 'T23:59:59');
            return jobStart <= dayEnd && jobEnd >= dayStart;
        });
    });

    if (isScheduleEmpty && !isLoading) {
        return (
            <div className="text-center py-10 bg-white shadow rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No jobs assigned for the upcoming week.</h3>
                <p className="mt-1 text-sm text-gray-500">Enjoy your break or check back later!</p>
            </div>
        );
    }

    const todayDateString = toLocalDateString(new Date());

    return (
      <div className="space-y-6">
        {days.map((day, index) => {
          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);

          const jobsForDay = allJobs.filter(job => {
            const jobStart = new Date(job.startDate + 'T00:00:00');
            const jobEnd = new Date(job.endDate + 'T23:59:59');
            return jobStart <= dayEnd && jobEnd >= dayStart;
          });

          const dayString = toLocalDateString(day);
          const isToday = dayString === todayDateString;

          return (
            <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">
                {day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {jobsForDay.length > 0 ? (
                jobsForDay.map(job => {
                  const isLoggedForThisDay = loggedJobDays.has(`${job.id}-${dayString}`);
                  return (
                    <JobCard
                      key={`${job.id}-${dayString}`}
                      job={job}
                      onMarkComplete={handleMarkComplete}
                      onCopyAddress={handleCopyAddress}
                      isCompleting={completingJobId === job.id}
                      isLogged={isLoggedForThisDay}
                      isToday={isToday}
                    />
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No jobs scheduled for this day.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center text-gray-700 mb-4 pb-2 border-b-2 border-green-500">
        <CalendarDaysIcon className="w-8 h-8 mr-3 text-green-600" />
        <h2 className="text-3xl font-bold">My Weekly Schedule</h2>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 rounded-md text-sm bg-green-100 text-green-700">{successMessage}</div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-md text-sm bg-red-100 text-red-700">{error}</div>
      )}

      {renderSchedule()}
    </div>
  );
};