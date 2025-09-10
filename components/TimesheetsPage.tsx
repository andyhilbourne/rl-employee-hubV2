import React, { useState, useEffect, useCallback } from 'react';
import { User, TimeEntry, Job, Site } from '../types';
import { timeService } from '../services/timeService';
import { jobService } from '../services/jobService';
import { siteService } from '../services/siteService';
import { userService } from '../services/userService';
import { LoadingSpinner } from './LoadingSpinner';
import { ListBulletIcon, DownloadIcon, XMarkIcon } from './icons';
import { Button } from './Button';

const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 0) return 'N/A';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const toDateInputFormat = (date: Date): string => date.toISOString().split('T')[0];
const toTimeInputFormat = (date: Date): string => date.toTimeString().slice(0, 5);

// Helper function to get the Monday of a given date's week
const getWeekStartDate = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // Sunday - 0, Monday - 1, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Helper function to get the Sunday of a given date's week
const getWeekEndDate = (startDate: Date): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
};


interface TimeEntryRowProps {
  entry: TimeEntry;
  isEditing: boolean;
  onSave: (entryId: string, updates: Partial<TimeEntry>) => Promise<void>;
  onCancel: () => void;
  onEdit: (entryId: string) => void;
  onDelete: (entryId: string) => Promise<void>;
  onAllocate: (entry: TimeEntry) => void;
  jobMap: Record<string, Job>;
  siteMap: Record<string, Site>;
}

const TimeEntryRow: React.FC<TimeEntryRowProps> = ({ entry, isEditing, onSave, onCancel, onEdit, onDelete, onAllocate, jobMap, siteMap }) => {
  const [formData, setFormData] = useState({
    clockInDate: toDateInputFormat(entry.clockInTime),
    clockInTime: toTimeInputFormat(entry.clockInTime),
    clockOutDate: entry.clockOutTime ? toDateInputFormat(entry.clockOutTime) : '',
    clockOutTime: entry.clockOutTime ? toTimeInputFormat(entry.clockOutTime) : '',
    notes: entry.notes || '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Reset form data if the entry prop changes (e.g., after a save)
    setFormData({
      clockInDate: toDateInputFormat(entry.clockInTime),
      clockInTime: toTimeInputFormat(entry.clockInTime),
      clockOutDate: entry.clockOutTime ? toDateInputFormat(entry.clockOutTime) : '',
      clockOutTime: entry.clockOutTime ? toTimeInputFormat(entry.clockOutTime) : '',
      notes: entry.notes || '',
    });
  }, [entry]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsProcessing(true);
    const newClockInTime = new Date(`${formData.clockInDate}T${formData.clockInTime}`);
    const newClockOutTime = formData.clockOutDate && formData.clockOutTime
      ? new Date(`${formData.clockOutDate}T${formData.clockOutTime}`)
      : undefined;

    await onSave(entry.id, {
      clockInTime: newClockInTime,
      clockOutTime: newClockOutTime,
      notes: formData.notes,
    });
    setIsProcessing(false);
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this time entry? This action cannot be undone.')) {
        setIsProcessing(true);
        await onDelete(entry.id);
        setIsProcessing(false);
    }
  };
  
  const associatedJob = entry.jobId ? jobMap[entry.jobId] : null;
  const associatedSite = entry.siteId ? siteMap[entry.siteId] : null;


  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-2 py-3" colSpan={5}>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Clock In</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input type="date" name="clockInDate" value={formData.clockInDate} onChange={handleInputChange} className="input-field w-full" />
                  <input type="time" name="clockInTime" value={formData.clockInTime} onChange={handleInputChange} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Clock Out</label>
                 <div className="flex items-center space-x-2 mt-1">
                  <input type="date" name="clockOutDate" value={formData.clockOutDate} onChange={handleInputChange} className="input-field w-full" />
                  <input type="time" name="clockOutTime" value={formData.clockOutTime} onChange={handleInputChange} className="input-field w-full" />
                </div>
              </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Notes (Reason for change)</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} className="input-field w-full mt-1" placeholder="e.g., Forgot to clock out on Friday"></textarea>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <Button onClick={onCancel} variant="secondary" size="sm" disabled={isProcessing}>Cancel</Button>
              <Button onClick={handleSave} variant="primary" size="sm" isLoading={isProcessing}>Save Changes</Button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  let duration = entry.clockOutTime ? entry.clockOutTime.getTime() - entry.clockInTime.getTime() : 0;
  let breakDeducted = false;
  const sevenHoursInMillis = 7 * 60 * 60 * 1000;
  const thirtyMinutesInMillis = 30 * 60 * 1000;

  if (duration > sevenHoursInMillis) {
    duration -= thirtyMinutesInMillis;
    breakDeducted = true;
  }

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
      <td className="px-4 py-3 text-sm text-gray-700">
        <div>{new Date(entry.clockInTime).toLocaleDateString()}</div>
        {associatedJob ? (
          <div className="text-xs text-blue-600 font-semibold mt-1">
            <i className="fas fa-briefcase mr-1"></i>
            {associatedJob.title}
          </div>
        ) : associatedSite ? (
           <div className="text-xs text-indigo-600 font-semibold mt-1">
            <i className="fas fa-building mr-1"></i>
            {associatedSite.title} (Site Allocation)
          </div>
        ) : (
             entry.clockOutTime && <div className="text-xs text-yellow-600 font-semibold mt-1">Unallocated</div>
        )}
        {entry.notes && <div className="text-xs text-gray-500 italic mt-1"><i className="fas fa-sticky-note mr-1"></i>{entry.notes}</div>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{new Date(entry.clockInTime).toLocaleTimeString()}</td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {entry.clockOutTime ? new Date(entry.clockOutTime).toLocaleTimeString() : <span className="text-yellow-600 italic">Still Clocked In</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
        {entry.clockOutTime ? (
            <div>
              {formatDuration(duration)}
              {breakDeducted && <div className="text-xs text-gray-500 italic mt-1">(30m break deducted)</div>}
            </div>
          ) : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-right space-x-2">
         {!entry.jobId && entry.clockOutTime && (
             <Button onClick={() => onAllocate(entry)} variant="primary" size="sm">Allocate</Button>
         )}
         <Button onClick={() => onEdit(entry.id)} variant="ghost" size="sm" disabled={!entry.clockOutTime}>Edit</Button>
         <Button onClick={handleDelete} variant="danger" size="sm" leftIcon={<i className="fas fa-trash-alt"></i>} isLoading={isProcessing}></Button>
      </td>
    </tr>
  );
};


interface TimesheetsPageProps {
  user: User;
}

interface WeeklyTimeEntries {
  weekIdentifier: string;
  weekStart: Date;
  weekEnd: Date;
  entries: TimeEntry[];
  totalHours: number;
}

export const TimesheetsPage: React.FC<TimesheetsPageProps> = ({ user }) => {
  const [activeWeeklyEntries, setActiveWeeklyEntries] = useState<WeeklyTimeEntries[]>([]);
  const [archivedWeeklyEntries, setArchivedWeeklyEntries] = useState<WeeklyTimeEntries[]>([]);
  const [viewMode, setViewMode] = useState<'active' | 'archive'>('active');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [jobMap, setJobMap] = useState<Record<string, Job>>({});
  const [siteMap, setSiteMap] = useState<Record<string, Site>>({});
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allocatingEntry, setAllocatingEntry] = useState<TimeEntry | null>(null);

  const [submittingWeekId, setSubmittingWeekId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEditingEntryId(null);
    try {
      const [allEntries, fetchedAllJobs, allSites, currentUserDetails] = await Promise.all([
        timeService.getTimesheetEntries(user.id),
        jobService.getAllJobsForAdmin(),
        siteService.getAllSites(),
        userService.getUserById(user.id),
      ]);
      
      setAllJobs(fetchedAllJobs);

      const newJobMap: Record<string, Job> = {};
      fetchedAllJobs.forEach(job => { newJobMap[job.id] = job; });
      setJobMap(newJobMap);

      const newSiteMap: Record<string, Site> = {};
      allSites.forEach(site => { newSiteMap[site.id] = site; });
      setSiteMap(newSiteMap);
      
      const groupedByWeek: Record<string, { weekStart: Date; weekEnd: Date; entries: TimeEntry[]; }> = {};

      allEntries.forEach(entry => {
        const weekStart = getWeekStartDate(entry.clockInTime);
        const weekIdentifier = weekStart.toISOString().split('T')[0];

        if (!groupedByWeek[weekIdentifier]) {
          groupedByWeek[weekIdentifier] = {
            weekStart,
            weekEnd: getWeekEndDate(weekStart),
            entries: [],
          };
        }
        groupedByWeek[weekIdentifier].entries.push(entry);
      });
      
      const weeklyData: WeeklyTimeEntries[] = Object.values(groupedByWeek)
        .map(weekGroup => {
            weekGroup.entries.sort((a, b) => a.clockInTime.getTime() - b.clockInTime.getTime());
            
            let totalMillis = 0;
            const sevenHoursInMillis = 7 * 60 * 60 * 1000;
            const thirtyMinutesInMillis = 30 * 60 * 1000;
            weekGroup.entries.forEach(entry => {
                if (entry.clockOutTime) {
                    let duration = entry.clockOutTime.getTime() - entry.clockInTime.getTime();
                    if (duration > sevenHoursInMillis) {
                        duration -= thirtyMinutesInMillis;
                    }
                    totalMillis += duration;
                }
            });
            
            return {
                ...weekGroup,
                weekIdentifier: weekGroup.weekStart.toISOString().split('T')[0],
                totalHours: totalMillis / (1000 * 60 * 60),
            };
        })
        .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
      
      const submittedWeeks = currentUserDetails?.submittedWeeks || [];
      const active = weeklyData.filter(w => !submittedWeeks.includes(w.weekIdentifier));
      const archived = weeklyData.filter(w => submittedWeeks.includes(w.weekIdentifier));

      setActiveWeeklyEntries(active);
      setArchivedWeeklyEntries(archived);

    } catch (err) {
      setError('Failed to fetch timesheet entries.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (entryId: string, updates: Partial<TimeEntry>) => {
    setMessage(null);
    try {
        await timeService.updateTimesheetEntry(user.id, entryId, updates);
        setMessage({ type: 'success', text: 'Entry updated successfully.' });
        setEditingEntryId(null);
        await fetchData();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update entry.';
        setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleAllocateSite = async (entryId: string, siteId: string) => {
    setMessage(null);
    try {
        await timeService.updateTimesheetEntry(user.id, entryId, { siteId });
        setMessage({ type: 'success', text: 'Entry allocated successfully.' });
        setAllocatingEntry(null);
        await fetchData();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to allocate entry.';
        setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleDelete = async (entryId: string) => {
    setMessage(null);
    try {
        await timeService.deleteTimesheetEntry(user.id, entryId);
        setMessage({ type: 'success', text: 'Entry deleted successfully.' });
        await fetchData();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry.';
        setMessage({ type: 'error', text: errorMessage });
    }
  };
  
  const escapeCsvCell = (cell: string | number | undefined): string => {
    if (cell === undefined || cell === null) return '';
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const processWeekDataForExport = (weekData: WeeklyTimeEntries) => {
    const { entries: userEntries } = weekData;
    const dailyData = new Map<string, { entries: TimeEntry[], date: Date }>();
    userEntries.forEach(entry => {
        const dateStr = entry.clockInTime.toISOString().split('T')[0];
        if (!dailyData.has(dateStr)) {
            const entryDate = new Date(entry.clockInTime);
            entryDate.setHours(0,0,0,0);
            dailyData.set(dateStr, { entries: [], date: entryDate });
        }
        dailyData.get(dateStr)!.entries.push(entry);
    });
  
    const processedDays: { 
        date: string; 
        dayName: string; 
        clockInTime: string; 
        clockOutTime: string; 
        breakDuration: number; 
        totalHours: number; 
        siteHours: Record<string, number>; 
    }[] = [];

    const siteTotals = new Map<string, number>();
    let grandTotalHours = 0;
  
    dailyData.forEach((dayInfo) => {
        const { entries } = dayInfo;
        if (entries.length === 0) return;
        entries.sort((a, b) => a.clockInTime.getTime() - b.clockInTime.getTime());
  
        const earliestClockIn = entries[0].clockInTime;
        const latestClockOut = entries.reduce((latest, entry) => 
            (entry.clockOutTime && entry.clockOutTime.getTime() > latest.getTime()) ? entry.clockOutTime : latest, 
            new Date(0)
        );
  
        if (latestClockOut.getTime() === 0) return; // Skip days with open entries
  
        const siteDurations = new Map<string, number>();
        let totalDurationMillis = 0;
  
        entries.forEach(entry => {
            if (entry.clockOutTime) {
                const duration = entry.clockOutTime.getTime() - entry.clockInTime.getTime();
                totalDurationMillis += duration;
                if (entry.jobId) {
                    const job = jobMap[entry.jobId];
                    if (job && job.siteId) {
                        siteDurations.set(job.siteId, (siteDurations.get(job.siteId) || 0) + duration);
                    }
                } else if (entry.siteId) {
                    siteDurations.set(entry.siteId, (siteDurations.get(entry.siteId) || 0) + duration);
                }
            }
        });
  
        const totalHoursGross = totalDurationMillis / (1000 * 60 * 60);
        const breakDuration = totalHoursGross > 7 ? 0.5 : 0;
        const netWorkHours = totalHoursGross - breakDuration;
  
        const siteHours: Record<string, number> = {};
        siteDurations.forEach((duration, siteId) => {
            const site = siteMap[siteId];
            if (site) {
                const siteProportion = totalDurationMillis > 0 ? (duration / totalDurationMillis) : 0;
                const hoursForSite = siteProportion * netWorkHours;
                siteHours[site.title] = hoursForSite;
                siteTotals.set(site.title, (siteTotals.get(site.title) || 0) + hoursForSite);
            }
        });
        
        const assignedMillis = Array.from(siteDurations.values()).reduce((a, b) => a + b, 0);
        const unassignedMillis = totalDurationMillis - assignedMillis;
        if (unassignedMillis > 0 && netWorkHours > 0) {
            const unassignedProportion = totalDurationMillis > 0 ? (unassignedMillis / totalDurationMillis) : 0;
            const unassignedHours = unassignedProportion * netWorkHours;
            siteHours['Unassigned'] = (siteHours['Unassigned'] || 0) + unassignedHours;
            siteTotals.set('Unassigned', (siteTotals.get('Unassigned') || 0) + unassignedHours);
        }
  
        grandTotalHours += netWorkHours;
  
        processedDays.push({ 
          date: dayInfo.date.toLocaleDateString('en-GB'),
          dayName: dayInfo.date.toLocaleDateString('en-US', { weekday: 'long' }),
          clockInTime: earliestClockIn.toTimeString().slice(0, 5),
          clockOutTime: latestClockOut.toTimeString().slice(0, 5),
          breakDuration: breakDuration,
          totalHours: netWorkHours,
          siteHours: siteHours,
        });
    });
  
    const siteTotalsObject: Record<string, number> = {};
    siteTotals.forEach((hours, name) => {
      siteTotalsObject[name] = parseFloat(hours.toFixed(2));
    });
  
    return { processedDays, siteTotals: siteTotalsObject, grandTotalHours: parseFloat(grandTotalHours.toFixed(2)) };
  };

  const handleExportWeekToCsv = (weekData: WeeklyTimeEntries) => {
    const { weekStart, weekEnd } = weekData;
    const { processedDays, siteTotals, grandTotalHours } = processWeekDataForExport(weekData);

    const csvRows = [[`Timesheet for ${user.name}`].join(','), []];
    const headers = ['Week', 'Day', 'Date', 'Clock In', 'Clock Out', 'Break (Hours)', 'Site 1', 'Site 1 Hours', 'Site 2', 'Site 2 Hours', 'Site 3', 'Site 3 Hours', 'Daily Total Hours'];
    csvRows.push(headers.map(escapeCsvCell).join(','));

    csvRows.push([`Week 1`].join(','));
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStrGB = d.toLocaleDateString('en-GB');
        const dayData = processedDays.find(p => p.date === dateStrGB);

        let rowData;
        if (dayData) {
            const rowSites: string[] = [];
            const siteEntries = Object.entries(dayData.siteHours);
            for (let i = 0; i < 3; i++) {
                const [siteName, siteHours] = siteEntries[i] || [undefined, undefined];
                rowSites.push(siteName ? escapeCsvCell(siteName) : '');
                rowSites.push(siteHours !== undefined ? escapeCsvCell(siteHours.toFixed(2)) : '');
            }
            rowData = [
                '', // Week
                dayName,
                dateStrGB,
                dayData.clockInTime,
                dayData.clockOutTime,
                dayData.breakDuration.toFixed(2),
                ...rowSites,
                dayData.totalHours.toFixed(2)
            ];
        } else {
            rowData = ['', dayName, dateStrGB, '', '', '', '', '', '', '', '', '', ''];
        }
        csvRows.push(rowData.map(escapeCsvCell).join(','));
    }
    
    csvRows.push(...['', '', ''].map(r => r.split(',').map(escapeCsvCell).join(',')));
    const sortedSites = Object.keys(siteTotals).sort();
    sortedSites.forEach((siteName) => {
        const hours = siteTotals[siteName] || 0;
        const row = Array(headers.length).fill('');
        row[1] = escapeCsvCell(siteName);
        row[12] = escapeCsvCell(hours.toFixed(2));
        csvRows.push(row.join(','));
    });
    csvRows.push(...['', ''].map(r => r.split(',').map(escapeCsvCell).join(',')));
    
    const totalRow = Array(headers.length).fill('');
    totalRow[11] = 'Grand Total';
    totalRow[12] = escapeCsvCell(grandTotalHours.toFixed(2));
    csvRows.push(totalRow.join(','));

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const userName = user.name.replace(/\s/g, '_');
    const startDateStr = weekStart.toISOString().split('T')[0];
    const endDateStr = weekEnd.toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Timesheet-${userName}-${startDateStr}_to_${endDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmitAndExportWeek = async (weekData: WeeklyTimeEntries) => {
    setSubmittingWeekId(weekData.weekIdentifier);
    setMessage(null);

    // If webhook is configured, send data there
    if (user.webhookUrl) {
      try {
        const { processedDays, siteTotals, grandTotalHours } = processWeekDataForExport(weekData);
        const payload = {
            employee: { id: user.id, name: user.name },
            week: { 
                startDate: weekData.weekStart.toISOString().split('T')[0],
                endDate: weekData.weekEnd.toISOString().split('T')[0],
            },
            totalHours: grandTotalHours,
            dailyBreakdown: processedDays,
            siteTotals: siteTotals
        };
        
        // Use 'no-cors' mode and 'text/plain' to avoid CORS issues with Google Apps Script
        await fetch(user.webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload)
        });
        
        // With 'no-cors', we can't read the response. We assume success if fetch doesn't throw an error.
        setMessage({ type: 'success', text: 'Timesheet submitted! Please verify the data in your Google Sheet.' });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during submission.';
        setMessage({ type: 'error', text: `Submission Failed: ${errorMessage}` });
        setSubmittingWeekId(null);
        return; 
      }
    } else {
        // Fallback to CSV download
        handleExportWeekToCsv(weekData);
    }
    
    // Archive the week
    await userService.addSubmittedWeek(user.id, weekData.weekIdentifier);
    setActiveWeeklyEntries(prev => prev.filter(w => w.weekIdentifier !== weekData.weekIdentifier));
    setArchivedWeeklyEntries(prev => [...prev, weekData].sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime()));

    if (!user.webhookUrl) {
      setMessage({ type: 'success', text: 'Timesheet downloaded and moved to archive.' });
    }
    setTimeout(() => setMessage(null), 5000);
    setSubmittingWeekId(null);
  };

  const listToRender = viewMode === 'active' ? activeWeeklyEntries : archivedWeeklyEntries;

  return (
    <div className="space-y-6">
      <div className="flex items-center text-gray-700 pb-2 border-b-2 border-purple-500">
        <ListBulletIcon className="w-8 h-8 mr-3 text-purple-600" />
        <h2 className="text-3xl font-bold">My Timesheets</h2>
      </div>

       <div className="mb-6 border-b border-gray-300">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                  onClick={() => setViewMode('active')}
                  className={`${
                      viewMode === 'active'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-t-md`}
              >
                  Active Timesheets
              </button>
              <button
                  onClick={() => setViewMode('archive')}
                  className={`${
                      viewMode === 'archive'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-t-md`}
              >
                  Archived
              </button>
          </nav>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>
      ) : error ? (
         <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>
      ) : listToRender.length === 0 ? (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-7 5V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No {viewMode} timesheets found.</h3>
          <p className="mt-1 text-sm text-gray-500">
            {viewMode === 'active' ? 'Clock in to record your work hours.' : 'Submit an active timesheet to see it here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {listToRender.map(week => {
            const isArchive = viewMode === 'archive';
            const isSubmitting = submittingWeekId === week.weekIdentifier;
            let isOverdue = false;
            if (!isArchive) {
                const threeDaysAfterEnd = new Date(week.weekEnd);
                threeDaysAfterEnd.setDate(threeDaysAfterEnd.getDate() + 3);
                isOverdue = new Date() > threeDaysAfterEnd;
            }

            return (
              <div key={week.weekIdentifier} className="bg-white shadow-xl rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Week of {week.weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {week.weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <p className="text-sm text-gray-600">Total Hours (Est.): {week.totalHours.toFixed(2)}</p>
                  </div>
                  {isArchive ? (
                     <Button
                        onClick={() => handleExportWeekToCsv(week)}
                        variant="secondary"
                        leftIcon={<DownloadIcon className="w-5 h-5" />}
                        className="w-full sm:w-auto"
                     >
                        Download Again
                     </Button>
                  ) : (
                    <Button
                        onClick={() => handleSubmitAndExportWeek(week)}
                        variant={isOverdue ? 'danger' : 'primary'}
                        leftIcon={!isSubmitting && <DownloadIcon className="w-5 h-5" />}
                        isLoading={isSubmitting}
                        disabled={isSubmitting || week.entries.length === 0 || week.entries.some(e => !e.clockOutTime)}
                        className="w-full sm:w-auto"
                        title={week.entries.some(e => !e.clockOutTime) ? "Cannot submit with open entries" : (user.webhookUrl ? "Submit to Google Sheets" : "Download CSV")}
                    >
                        {isSubmitting ? "Submitting..." : (user.webhookUrl ? "Submit Timesheet" : "Submit & Download")}
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date, Job & Notes</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {week.entries.map(entry => (
                        <TimeEntryRow 
                            key={entry.id} 
                            entry={entry}
                            isEditing={editingEntryId === entry.id}
                            onEdit={setEditingEntryId}
                            onCancel={() => setEditingEntryId(null)}
                            onSave={handleSave}
                            onDelete={handleDelete}
                            onAllocate={setAllocatingEntry}
                            jobMap={jobMap}
                            siteMap={siteMap}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allocatingEntry && (
        <AllocateTimeModal
            entry={allocatingEntry}
            sites={Object.values(siteMap).sort((a,b) => a.title.localeCompare(b.title))}
            onSave={handleAllocateSite}
            onClose={() => setAllocatingEntry(null)}
        />
      )}
    </div>
  );
};

const AllocateTimeModal: React.FC<{
  entry: TimeEntry;
  sites: Site[];
  onSave: (entryId: string, siteId: string) => Promise<void>;
  onClose: () => void;
}> = ({ entry, sites, onSave, onClose }) => {
    const [selectedSiteId, setSelectedSiteId] = useState(entry.siteId || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!selectedSiteId) return;
        setIsSaving(true);
        await onSave(entry.id, selectedSiteId);
        setIsSaving(false); 
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 transform transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Allocate Time Entry</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Allocating entry:</p>
                        <p className="text-sm text-gray-600">
                            <strong>Date:</strong> {entry.clockInTime.toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Time:</strong> {entry.clockInTime.toLocaleTimeString()} - {entry.clockOutTime?.toLocaleTimeString()}
                        </p>
                    </div>
                    <div>
                        <label htmlFor="site-select" className="block text-sm font-medium text-gray-700">
                            Assign to Site
                        </label>
                        <select 
                            id="site-select"
                            value={selectedSiteId} 
                            onChange={e => setSelectedSiteId(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                        >
                            <option value="" disabled>-- Select a Site --</option>
                            {sites.map(site => (
                                <option key={site.id} value={site.id}>{site.title} ({site.siteNumber})</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end items-center space-x-3 pt-6">
                    <Button onClick={onClose} variant="secondary" disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} variant="primary" isLoading={isSaving} disabled={!selectedSiteId}>Allocate</Button>
                </div>
            </div>
        </div>
    );
};