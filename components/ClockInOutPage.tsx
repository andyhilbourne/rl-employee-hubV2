
import React, { useState, useEffect, useCallback } from 'react';
import { User, TimeEntry } from '../types';
import { timeService } from '../services/timeService';
import { Button } from './Button';
import { ClockIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

interface ClockInOutPageProps {
  user: User;
}

export const ClockInOutPage: React.FC<ClockInOutPageProps> = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // FIX: Await the promise from timeService and construct a valid TimeEntry object for the state.
  const fetchCurrentStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const entry = await timeService.getCurrentClockInEntry(user.id);
      // The service returns an object without an ID, but the state requires one.
      // We add a temporary ID for the currently clocked-in entry.
      setCurrentEntry(entry ? { ...entry, id: 'current' } : null);
    } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to fetch status.');
    } finally {
        setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchCurrentStatus();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchCurrentStatus]);

  const handleClockIn = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const entry = await timeService.clockIn(user.id);
      setCurrentEntry(entry);
      setMessage(`Successfully clocked in at ${entry.clockInTime.toLocaleTimeString()}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to clock in.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const entry = await timeService.clockOut(user.id);
      setCurrentEntry(null); // Reset current entry as user is now clocked out
      setMessage(`Successfully clocked out at ${entry.clockOutTime?.toLocaleTimeString()}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to clock out.');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-8 bg-white shadow-xl rounded-xl max-w-lg mx-auto text-center">
      <ClockIcon className="w-20 h-20 text-blue-600 mx-auto mb-6" />
      
      <h2 className="text-4xl font-bold text-gray-800 mb-2">
        {currentTime.toLocaleTimeString()}
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {message && (
        <p className={`mb-6 p-3 rounded-md text-sm ${message.includes('Successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </p>
      )}

      {currentEntry ? (
        <div className="space-y-4">
          <p className="text-xl text-green-600 font-semibold">
            You are currently clocked in.
          </p>
          <p className="text-gray-700">
            Clocked in at: {currentEntry.clockInTime.toLocaleTimeString()}
          </p>
          <Button 
            onClick={handleClockOut} 
            isLoading={actionLoading} 
            variant="danger" 
            size="lg"
            className="w-full py-3"
          >
            Clock Out
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xl text-gray-700 font-semibold">
            You are currently clocked out.
          </p>
          <Button 
            onClick={handleClockIn} 
            isLoading={actionLoading} 
            variant="primary" 
            size="lg"
            className="w-full py-3"
          >
            Clock In
          </Button>
        </div>
      )}
    </div>
  );
};
