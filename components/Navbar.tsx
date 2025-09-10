
import React from 'react';
import { User } from '../types';
import { Button } from './Button';
import { LogoutIcon, BuildingOfficeIcon } from './icons';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onNavigateBack?: () => void; // For sub-pages
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigateBack, title }) => {
  return (
    <nav className="bg-gray-800 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          {onNavigateBack && (
            <button onClick={onNavigateBack} className="mr-3 p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
           <BuildingOfficeIcon className="h-8 w-8 mr-2 text-blue-400" />
          <span className="font-semibold text-xl tracking-tight">{title || 'R&L'}</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm mr-4 hidden sm:inline">Welcome, {user.name}!</span>
          <Button onClick={onLogout} variant="danger" size="sm" leftIcon={<LogoutIcon className="w-4 h-4"/>}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};