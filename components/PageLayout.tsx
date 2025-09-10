
import React from 'react';
import { Navbar } from './Navbar';
import { User } from '../types';

interface PageLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  onNavigateBack?: () => void;
  pageTitle?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ user, onLogout, children, onNavigateBack, pageTitle }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar user={user} onLogout={onLogout} onNavigateBack={onNavigateBack} title={pageTitle} />
      <main className="flex-grow container mx-auto p-4 sm:p-6">
        {children}
      </main>
      <footer className="bg-gray-800 text-white text-center p-4 text-sm">
        R&L Employee Hub &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};