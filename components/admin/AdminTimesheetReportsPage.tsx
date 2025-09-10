

import React, { useState, useEffect, useCallback } from 'react';
import { TimeEntry, User, Job, Site } from '../../types';
import { timeService } from '../../services/timeService';
import { userService } from '../../services/userService';
import { jobService } from '../../services/jobService';
import { siteService } from '../../services/siteService';
import { LoadingSpinner } from '../LoadingSpinner';
import { TableCellsIcon, DownloadIcon } from '../icons';
import { Button } from '../Button';

const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 0) return 'N/A';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const AdminTimesheetReportsPage: React.FC = () => {
  const [allTimesheetEntries, setAllTimesheetEntries] = useState<TimeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [jobMap, setJobMap] = useState<Record<string, Job>>({});
  const [siteMap, setSiteMap] = useState<Record<string, Site>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState<string>(''); // Empty string for all users

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedEntries, fetchedUsers, allJobs, allSites] = await Promise.all([
        timeService.getAllTimesheetEntriesForAdmin(
            startDate ? new Date(startDate) : undefined, 
            endDate ? new Date(endDate) : undefined,
            selectedUserId ? [selectedUserId] : undefined
        ),
        userService.getAllUsers(),
        jobService.getAllJobsForAdmin(),
        siteService.getAllSites()
      ]);
      
      setAllTimesheetEntries(fetchedEntries);
      setUsers(fetchedUsers);
      
      const newUserMap: Record<string, string> = {};
      fetchedUsers.forEach(u => newUserMap[u.id] = u.name);
      setUserMap(newUserMap);

      const newJobMap: Record<string, Job> = {};
      allJobs.forEach(j => newJobMap[j.id] = j);
      setJobMap(newJobMap);

      const newSiteMap: Record<string, Site> = {};
      allSites.forEach(s => newSiteMap[s.id] = s);
      setSiteMap(newSiteMap);

    } catch (err) {
      setError('Failed to fetch timesheet reports or users.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedUserId]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);
  
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const escapeCsvCell = (cell: string | number | undefined): string => {
    if (cell === undefined || cell === null) {
        return '';
    }
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExport = () => {
    if (!selectedUserId || !startDate || !endDate) return;

    // 1. Process data for the selected user
    const userEntries = allTimesheetEntries.filter(e => e.userId === selectedUserId);
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

    const processedDays: { date: Date, workingHours: string, sites: { siteName: string, hours: number }[], totalHours: number }[] = [];
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

        if (latestClockOut.getTime() === 0) return; // Skip days not fully clocked out
        
        const workingHours = `${earliestClockIn.toTimeString().slice(0, 5)} till ${latestClockOut.toTimeString().slice(0, 5)}`;
        
        const siteDurations = new Map<string, number>();
        let totalDurationMillis = 0;

        entries.forEach(entry => {
            if (entry.clockOutTime && entry.jobId) {
                const job = jobMap[entry.jobId];
                if (job && job.siteId) {
                    const duration = entry.clockOutTime.getTime() - entry.clockInTime.getTime();
                    siteDurations.set(job.siteId, (siteDurations.get(job.siteId) || 0) + duration);
                    totalDurationMillis += duration;
                }
            }
        });

        let totalHoursWithBreaks = totalDurationMillis / (1000 * 60 * 60);
        const breakableHours = totalDurationMillis / (1000 * 60 * 60);
        if (breakableHours > 7) {
            totalHoursWithBreaks -= 0.5;
        }

        const daySites: { siteName: string, hours: number }[] = [];
        siteDurations.forEach((duration, siteId) => {
            const site = siteMap[siteId];
            if (site) {
                const siteHours = (duration / totalDurationMillis) * totalHoursWithBreaks;
                daySites.push({ siteName: site.title, hours: siteHours });
                siteTotals.set(site.title, (siteTotals.get(site.title) || 0) + siteHours);
            }
        });

        grandTotalHours += totalHoursWithBreaks;
        processedDays.push({ date: dayInfo.date, workingHours, sites: daySites, totalHours: totalHoursWithBreaks });
    });

    // 2. Generate CSV String
    const csvRows = [];
    const headers = ['Week', 'Day', 'Date', 'Working Hours', 'Site 1 Job No', 'Hours Less Break', 'Site 2 Job No', 'Hours Less Break', 'Site 3 Job No', 'Hours Less Break', 'Total Hours'];
    csvRows.push(headers.map(escapeCsvCell).join(','));

    const loopStartDate = new Date(startDate);
    const loopEndDate = new Date(endDate);
    
    let currentWeek = 1;
    let inWeek = false;

    for (let d = new Date(loopStartDate); d <= loopEndDate; d.setDate(d.getDate() + 1)) {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (dayName === 'Monday' || !inWeek) {
            if(inWeek) csvRows.push(Array(headers.length).fill('').join(','));
            csvRows.push([`Week ${currentWeek}`].join(','));
            currentWeek++;
            inWeek = true;
        }

        const dateStr = d.toISOString().split('T')[0];
        const dayData = processedDays.find(p => p.date.toISOString().split('T')[0] === dateStr);

        let rowData;
        if (dayData) {
            const rowSites = [];
            for (let i = 0; i < 3; i++) {
                if (dayData.sites[i]) {
                    rowSites.push(escapeCsvCell(dayData.sites[i].siteName));
                    rowSites.push(escapeCsvCell(dayData.sites[i].hours.toFixed(2)));
                } else {
                    rowSites.push('');
                    rowSites.push('');
                }
            }
            rowData = ['', dayName, d.toLocaleDateString('en-GB'), dayData.workingHours, ...rowSites, dayData.totalHours.toFixed(2)];
        } else {
            rowData = ['', dayName, d.toLocaleDateString('en-GB'), '', '', '', '', '', '', '', ''];
        }
        csvRows.push(rowData.map(escapeCsvCell).join(','));
    }
    
    // Add Summary
    csvRows.push(...['', '', ''].map(r => r.split(',').map(escapeCsvCell).join(','))); // empty rows
    siteTotals.forEach((hours, siteName) => {
        csvRows.push([`Site ${siteTotals.size - Array.from(siteTotals.keys()).indexOf(siteName)}`, escapeCsvCell(siteName), '', '', '', '', '', '', '', escapeCsvCell(hours.toFixed(2))].join(','));
    });
     csvRows.push(...['', ''].map(r => r.split(',').map(escapeCsvCell).join(',')));
    csvRows.push(['', '', '', '', '', '', '', '', 'Total Hours', escapeCsvCell(grandTotalHours.toFixed(2))].join(','));

    // 3. Trigger Download
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const userName = userMap[selectedUserId].replace(/\s/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `Timesheet-${userName}-${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center text-gray-700 mb-6 pb-2 border-b-2 border-red-500">
        <TableCellsIcon className="w-8 h-8 mr-3 text-red-600" />
        <h2 className="text-3xl font-bold">Timesheet Reports</h2>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-lg shadow-md space-y-4 md:space-y-0 md:flex md:items-end md:space-x-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700">User</label>
          <select id="userFilter" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white">
            <option value="">All Users</option>
            {users.map(user => (
              // FIX: Changed user.username to user.email as username does not exist on the User type.
              <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="primary" isLoading={isLoading}>Apply Filters</Button>
        <div title={!selectedUserId ? "Please select a specific user to export their timesheet." : `Export timesheet for ${userMap[selectedUserId]}`}>
          <Button 
            type="button" 
            variant="secondary"
            onClick={handleExport}
            disabled={!selectedUserId}
            leftIcon={<DownloadIcon className="w-5 h-5" />}
          >
              Export to CSV
          </Button>
        </div>
      </form>


      {isLoading && <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>}
      {!isLoading && error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
      
      {!isLoading && !error && (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          {allTimesheetEntries.length === 0 ? (
            <p className="p-6 text-center text-gray-500">No timesheet entries found for the selected criteria.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User & Job</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allTimesheetEntries.map(entry => {
                   let duration = entry.clockOutTime ? entry.clockOutTime.getTime() - entry.clockInTime.getTime() : 0;
                   let breakDeducted = false;
                   const sevenHoursInMillis = 7 * 60 * 60 * 1000;
                   const thirtyMinutesInMillis = 30 * 60 * 1000;
                   const associatedJob = entry.jobId ? jobMap[entry.jobId] : null;
                 
                   if (duration > sevenHoursInMillis) {
                     duration -= thirtyMinutesInMillis;
                     breakDeducted = true;
                   }

                   return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{userMap[entry.userId] || entry.userId}</div>
                        {associatedJob && (
                          <div className="text-xs text-blue-600 font-semibold mt-1">
                            {associatedJob.title}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(entry.clockInTime).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(entry.clockInTime).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.clockOutTime ? new Date(entry.clockOutTime).toLocaleTimeString() : <span className="text-yellow-600 italic">Still Clocked In</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {entry.clockOutTime ? (
                            <div>
                                {formatDuration(duration)}
                                {breakDeducted && <div className="text-xs italic text-gray-400">(30m break)</div>}
                            </div>
                        ) : '-'}
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
