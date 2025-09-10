import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Site, Job, User } from '../../types';
import { siteService } from '../../services/siteService';
import { jobService } from '../../services/jobService';
import { userService } from '../../services/userService';
import { Button } from '../Button';
import { LoadingSpinner } from '../LoadingSpinner';
import { ClipboardDocumentListIcon } from '../icons';


// Google Maps related declarations (window.google, etc.) removed.

export const AdminJobManagementPage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [jobsForSelectedSite, setJobsForSelectedSite] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Site Form State
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isEditingSite, setIsEditingSite] = useState(false);
  const [siteTitle, setSiteTitle] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteNumber, setSiteNumber] = useState('');
  // siteLatitude and siteLongitude state removed

  // Job Form State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobAssignedUserId, setJobAssignedUserId] = useState<string>('');
  const [jobStartDate, setJobStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobEndDate, setJobEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map related refs (mapRef, mapInstanceRef, markerInstanceRef) removed.


  // ---- Data Fetching ----
  const fetchSitesAndUsers = useCallback(async () => {
    setIsLoadingSites(true);
    setError(null);
    try {
      const [fetchedSites, fetchedUsers] = await Promise.all([
        siteService.getAllSites(),
        userService.getAllUsers(),
      ]);
      setSites(fetchedSites.sort((a,b) => a.title.localeCompare(b.title)));
      setAllUsers(fetchedUsers.filter(u => u.role === 'Field Worker' || u.role === 'Foreman')); 
    } catch (err) {
      setError('Failed to fetch sites or users.');
      console.error(err);
    } finally {
      setIsLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    fetchSitesAndUsers();
  }, [fetchSitesAndUsers]);

  const fetchJobsForSite = useCallback(async (siteId: string) => {
    setIsLoadingJobs(true);
    setError(null);
    try {
      const fetchedJobs = await jobService.getJobsBySiteId(siteId);
      setJobsForSelectedSite(fetchedJobs);
    } catch (err) {
      setError(`Failed to fetch jobs for site ${siteId}.`);
      console.error(err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  // Map Initialization and Geocoding functions (initMap, placeMarker, handleGeocodeAndSetPin) removed.
  // useEffect for map initialization removed.

  // ---- Site Form Handlers ----
  const resetSiteForm = () => {
    setIsEditingSite(false);
    setSiteTitle('');
    setSiteAddress('');
    setSiteDescription('');
    setSiteNumber('');
    // setSiteLatitude and setSiteLongitude removed
  };

  const handleSelectSiteForManagement = (site: Site) => {
    setSelectedSite(site);
    fetchJobsForSite(site.id);
    resetSiteForm(); 
    resetJobForm(); 
  };
  
  const handleEditSite = (site: Site) => {
    setSelectedSite(site); 
    setIsEditingSite(true);
    setSiteTitle(site.title);
    setSiteAddress(site.address);
    setSiteDescription(site.description);
    setSiteNumber(site.siteNumber);
    // setSiteLatitude and setSiteLongitude (from site object) removed
    setSubmitMessage(null);
    setError(null);
    setJobsForSelectedSite([]); 
  };

  const handleNewSiteClick = () => {
    resetSiteForm();
    setSelectedSite(null); 
    setIsEditingSite(true); 
    setJobsForSelectedSite([]);
  };


  const handleSiteFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);
    setError(null);
    const siteDataPayload = {
      title: siteTitle,
      siteNumber: siteNumber,
      address: siteAddress,
      description: siteDescription,
      // latitude and longitude removed from payload
    };
    try {
      if (selectedSite && selectedSite.id && isEditingSite) { 
        await siteService.updateSite(selectedSite.id, siteDataPayload);
        setSubmitMessage(`Site "${siteTitle}" updated successfully.`);
      } else { 
        const newSite = await siteService.createSite(siteDataPayload);
        setSubmitMessage(`Site "${siteTitle}" created successfully.`);
        setSelectedSite(newSite); 
        fetchJobsForSite(newSite.id);
      }
      fetchSitesAndUsers(); 
      resetSiteForm(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditingSite && selectedSite ? 'update' : 'create'} site.`);
      setSubmitMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Job Form Handlers ----
  const resetJobForm = () => {
    setIsEditingJob(false);
    setSelectedJob(null);
    setJobTitle('continue as per instruction');
    setJobDescription('continue as per instruction');
    setJobAssignedUserId('');
    setJobStartDate(new Date().toISOString().split('T')[0]);
    setJobEndDate(new Date().toISOString().split('T')[0]);
  };

  const handleEditJob = (job: Job) => {
    setIsEditingJob(true);
    setSelectedJob(job);
    setJobTitle(job.title);
    setJobDescription(job.description);
    setJobAssignedUserId(job.assignedUserId);
    setJobStartDate(job.startDate);
    setJobEndDate(job.endDate);
    setSubmitMessage(null);
    setError(null);
  };
  
  const handleJobFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) {
      setError("No site selected to add a job to.");
      return;
    }
    if (new Date(jobEndDate) < new Date(jobStartDate)) {
        setError("Job end date cannot be before start date.");
        setSubmitMessage(null);
        return;
    }
    setIsSubmitting(true);
    setSubmitMessage(null);
    setError(null);

    const jobDataPayload = {
        siteId: selectedSite.id, 
        title: jobTitle,
        description: jobDescription,
        assignedUserId: jobAssignedUserId,
        startDate: jobStartDate,
        endDate: jobEndDate,
    };

    try {
      if (isEditingJob && selectedJob) {
        await jobService.updateJob(selectedJob.id, jobDataPayload);
        setSubmitMessage(`Job "${jobTitle}" updated successfully.`);
      } else {
        await jobService.createJob(jobDataPayload);
        setSubmitMessage(`Job "${jobTitle}" created successfully for site ${selectedSite.title}.`);
      }
      resetJobForm();
      fetchJobsForSite(selectedSite.id); 
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditingJob ? 'update' : 'create'} job.`);
      setSubmitMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteJob = async (jobId: string) => {
    if (!selectedSite) return;
    if (window.confirm("Are you sure you want to delete this job?")) {
      setIsSubmitting(true);
      try {
        await jobService.deleteJob(jobId);
        setSubmitMessage("Job deleted successfully.");
        fetchJobsForSite(selectedSite.id);
      } catch (error) {
        setError("Failed to delete job.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };
   const handleDeleteSite = async (siteId: string) => {
    if (window.confirm("Are you sure you want to delete this site? This will also delete all associated jobs.")) {
        setIsSubmitting(true);
        try {
            const jobsToDelete = await jobService.getJobsBySiteId(siteId);
            for (const job of jobsToDelete) {
                await jobService.deleteJob(job.id);
            }
            await siteService.deleteSite(siteId);
            setSubmitMessage("Site and its jobs deleted successfully.");
            fetchSitesAndUsers(); 
            if (selectedSite && selectedSite.id === siteId) {
                setSelectedSite(null);
                setJobsForSelectedSite([]);
            }
        } catch (err) {
            setError("Failed to delete site.");
        } finally {
            setIsSubmitting(false);
        }
    }
};


  // ---- Render Logic ----
  if (isLoadingSites) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center text-gray-700 mb-6 pb-2 border-b-2 border-orange-500">
        <ClipboardDocumentListIcon className="w-8 h-8 mr-3 text-orange-600" />
        <h2 className="text-3xl font-bold">Site & Job Management</h2>
      </div>

      {submitMessage && <p className="mb-4 text-sm text-green-700 bg-green-100 p-3 rounded-md">{submitMessage}</p>}
      {error && <p className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded-md">{error}</p>}

      {/* --- Site Management Section --- */}
      <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-gray-800">
              {isEditingSite ? (selectedSite && selectedSite.id ? 'Edit Site' : 'Create New Site') : 'Manage Sites'}
            </h3>
            {!isEditingSite && (
                <Button onClick={handleNewSiteClick} variant="primary">Create New Site</Button>
            )}
        </div>

        {/* Site Create/Edit Form */}
        {isEditingSite && (
          <form onSubmit={handleSiteFormSubmit} className="space-y-6 mb-8 p-4 border rounded-md bg-slate-50">
            <div>
              <label htmlFor="siteTitle" className="block text-sm font-medium text-gray-700">Site Title</label>
              <input type="text" id="siteTitle" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} required className="mt-1 block w-full" />
            </div>
             <div>
                <label htmlFor="siteNumber" className="block text-sm font-medium text-gray-700">Site Number</label>
                <input type="text" id="siteNumber" value={siteNumber} onChange={(e) => setSiteNumber(e.target.value)} required placeholder="e.g. P-101" className="mt-1 block w-full" />
              </div>
            <div>
              <label htmlFor="siteAddress" className="block text-sm font-medium text-gray-700">Site Address</label>
              <input type="text" id="siteAddress" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} required className="mt-1 block w-full" />
            </div>
            {/* Map and coordinate input fields removed */}
            <div>
              <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">Site Description</label>
              <textarea id="siteDescription" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={3} className="mt-1 block w-full" />
            </div>
            <div className="flex items-center space-x-3 pt-3">
              <Button type="submit" isLoading={isSubmitting} variant="primary">
                {selectedSite && selectedSite.id ? 'Save Site Changes' : 'Create Site'}
              </Button>
              <Button type="button" onClick={resetSiteForm} variant="secondary" disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Sites List */}
        {!isEditingSite && sites.length === 0 && <p className="text-gray-500">No sites created yet. Click "Create New Site".</p>}
        {!isEditingSite && sites.length > 0 && (
          <div className="space-y-3">
            {sites.map(site => (
              <div key={site.id} className="p-4 border rounded-md hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <h4 className="font-semibold text-lg text-blue-700 flex items-center gap-3">
                            {site.title}
                            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">Site #: {site.siteNumber}</span>
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{site.address}</p>
                        <p className="text-xs text-gray-500 mt-1">{site.description}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <Button onClick={() => handleEditSite(site)} variant="ghost" size="sm" className="w-full sm:w-auto">Edit Site</Button>
                        <Button onClick={() => handleSelectSiteForManagement(site)} variant="primary" size="sm" className="w-full sm:w-auto">Manage Jobs</Button>
                        <Button onClick={() => handleDeleteSite(site.id)} variant="danger" size="sm" className="w-full sm:w-auto">Delete Site</Button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Job Management Section (for selected site) --- */}
      {selectedSite && !isEditingSite && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-2xl font-semibold text-gray-800">
                    Jobs for: <span className="text-blue-600">{selectedSite.title}</span>
                </h3>
                <span className="text-lg font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">Site #: {selectedSite.siteNumber}</span>
            </div>
          <p className="text-sm text-gray-500 mb-6 border-b pb-3">{selectedSite.address}</p>

          {/* Job Create/Edit Form */}
          <div className="mb-8 p-4 border rounded-md bg-slate-50">
             <h4 className="text-xl font-semibold mb-4 text-gray-700">
                {isEditingJob ? 'Edit Job' : 'Add New Job to this Site'}
             </h4>
            <form onSubmit={handleJobFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">Job Title / Task</label>
                <input type="text" id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required className="mt-1 block w-full" />
              </div>
              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">Job Description (Instructions for Employee)</label>
                <textarea id="jobDescription" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={3} required className="mt-1 block w-full" />
              </div>
              <div>
                <label htmlFor="jobAssignedUserId" className="block text-sm font-medium text-gray-700">Assign To User</label>
                <select id="jobAssignedUserId" value={jobAssignedUserId} onChange={(e) => setJobAssignedUserId(e.target.value)} required className="mt-1 block w-full">
                  <option value="" disabled>Select a user</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="jobStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input type="date" id="jobStartDate" value={jobStartDate} onChange={(e) => setJobStartDate(e.target.value)} required className="mt-1 block w-full" />
                </div>
                <div>
                  <label htmlFor="jobEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
                  <input type="date" id="jobEndDate" value={jobEndDate} onChange={(e) => setJobEndDate(e.target.value)} required className="mt-1 block w-full" />
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <Button type="submit" isLoading={isSubmitting} variant="primary">
                  {isEditingJob ? 'Save Job Changes' : 'Add Job'}
                </Button>
                {isEditingJob && (
                  <Button type="button" onClick={resetJobForm} variant="secondary" disabled={isSubmitting}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </div>
          
          {/* Jobs List for Selected Site */}
          {isLoadingJobs && <LoadingSpinner />}
          {!isLoadingJobs && jobsForSelectedSite.length === 0 && <p className="text-gray-500">No jobs created for this site yet.</p>}
          {!isLoadingJobs && jobsForSelectedSite.length > 0 && (
            <div className="space-y-3">
              {jobsForSelectedSite.map(job => (
                <div key={job.id} className="p-3 border rounded-md bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                        <h5 className="font-semibold text-md text-gray-700">{job.title}</h5>
                        <p className="text-xs text-gray-500">Assigned to: {allUsers.find(u=>u.id === job.assignedUserId)?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">Dates: {job.startDate} to {job.endDate}</p>
                        <p className="text-xs text-gray-500">Status: {job.status}</p>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <Button onClick={() => handleEditJob(job)} variant="ghost" size="sm" className="w-full sm:w-auto">Edit</Button>
                        <Button onClick={() => handleDeleteJob(job.id)} variant="danger" size="sm" isLoading={isSubmitting} className="w-full sm:w-auto">Delete</Button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{job.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};