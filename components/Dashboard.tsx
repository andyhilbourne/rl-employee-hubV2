
import React from 'react';
import { User, AppView } from '../types';
import { Button } from './Button';
import { ClockIcon, CalendarDaysIcon, ListBulletIcon, UsersIcon, TableCellsIcon, ClipboardDocumentListIcon } from './icons';

interface DashboardProps {
  user: User;
  setCurrentView: (view: AppView) => void;
}

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  bgColorClass?: string;
  textColorClass?: string;
  ariaLabel?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, description, icon, onClick, bgColorClass = 'bg-white', textColorClass = 'text-gray-700', ariaLabel }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel || title}
    className={`${bgColorClass} ${textColorClass} p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
  >
    <div className="flex items-center mb-3">
      <div className="p-3 bg-blue-100 rounded-full mr-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
    </div>
    <p className="text-sm text-gray-600">{description}</p>
  </button>
);


export const Dashboard: React.FC<DashboardProps> = ({ user, setCurrentView }) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const isAdmin = user.role === 'Admin';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
        <h2 className="text-3xl font-bold">Welcome back, {user.name}!</h2>
        <p className="text-blue-100 mt-1">Role: {user.role}</p>
        <div className="mt-4 p-4 bg-black bg-opacity-20 rounded-lg">
            <p className="text-lg font-semibold">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-3xl font-mono tracking-wider">{currentTime.toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isAdmin ? (
          <>
            <DashboardCard
              title="Job Management"
              description="Create, assign, and track all company sites and jobs."
              icon={<ClipboardDocumentListIcon className="w-8 h-8 text-orange-600" />}
              onClick={() => setCurrentView(AppView.ADMIN_JOB_MANAGEMENT)}
            />
            <DashboardCard
              title="User Management"
              description="Add or manage employee and administrator accounts."
              icon={<UsersIcon className="w-8 h-8 text-teal-600" />}
              onClick={() => setCurrentView(AppView.ADMIN_USER_MANAGEMENT)}
            />
             <DashboardCard
              title="Timesheet Reports"
              description="View and filter timesheets for all employees."
              icon={<TableCellsIcon className="w-8 h-8 text-red-600" />}
              onClick={() => setCurrentView(AppView.ADMIN_TIMESHEET_REPORTS)}
            />
          </>
        ) : (
           <>
            <DashboardCard
              title="Clock In / Out"
              description="Start or end your work day with a single tap."
              icon={<ClockIcon className="w-8 h-8 text-green-600" />}
              onClick={() => setCurrentView(AppView.CLOCK_IN_OUT)}
            />
             <DashboardCard
              title="Weekly Schedule"
              description="View your assigned jobs for the upcoming week."
              icon={<CalendarDaysIcon className="w-8 h-8 text-blue-600" />}
              onClick={() => setCurrentView(AppView.WEEKLY_SCHEDULE)}
            />
            <DashboardCard
              title="My Timesheets"
              description="Review and manage your past time entries."
              icon={<ListBulletIcon className="w-8 h-8 text-purple-600" />}
              onClick={() => setCurrentView(AppView.TIMESHEETS)}
            />
           </>
        )}
      </div>
    </div>
  );
};