import React, { useState, useEffect } from 'react';
import { User, AppView } from './types';
import { authService } from './services/authService';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { PageLayout } from './components/PageLayout';
import { LoadingSpinner } from './components/LoadingSpinner';

// Employee Pages
import { ClockInOutPage } from './components/ClockInOutPage';
import { DailyJobsPage } from './components/DailyJobsPage';
import { TimesheetsPage } from './components/TimesheetsPage';

// Admin Pages
import { AdminJobManagementPage } from './components/admin/AdminJobManagementPage';
import { AdminUserManagementPage } from './components/admin/AdminUserManagementPage';
import { AdminTimesheetReportsPage } from './components/admin/AdminTimesheetReportsPage';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true); // For initial auth check

  useEffect(() => {
    // This listener is the single source of truth for auth state. It runs only once.
    const unsubscribe = authService.onAuthStateChange(user => {
      setCurrentUser(user);
      // If user logs out, reset view to dashboard. The main render logic
      // will see the null user and redirect to the login form.
      if (!user) {
        setCurrentView(AppView.DASHBOARD);
      }
      setIsLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleLoginSuccess = (user: User) => {
    // The onAuthStateChange listener is the ultimate source of truth,
    // but we can set state here to make the UI transition faster.
    setCurrentUser(user);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = async () => {
    await authService.logout();
    // State will be cleared by onAuthStateChange listener
  };

  const navigateToDashboard = () => setCurrentView(AppView.DASHBOARD);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" color="text-blue-500" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  const pageTitles: Record<string, string> = {
    [AppView.LOGIN]: "Login",
    [AppView.DASHBOARD]: "Dashboard",
    [AppView.CLOCK_IN_OUT]: "Clock In/Out",
    [AppView.WEEKLY_SCHEDULE]: "Weekly Schedule",
    [AppView.TIMESHEETS]: "My Timesheets",
    [AppView.ADMIN_JOB_MANAGEMENT]: "Job Management",
    [AppView.ADMIN_USER_MANAGEMENT]: "User Management",
    [AppView.ADMIN_TIMESHEET_REPORTS]: "Timesheet Reports",
  };

  const renderView = () => {
    // Admin View Guard
    const isAdminView = [
        AppView.ADMIN_JOB_MANAGEMENT, 
        AppView.ADMIN_USER_MANAGEMENT, 
        AppView.ADMIN_TIMESHEET_REPORTS
    ].includes(currentView);

    if (isAdminView && currentUser.role !== 'Admin') {
        // Non-admin trying to access admin page, redirect to dashboard
        console.warn("Attempted admin access by non-admin user. Redirecting to dashboard.");
        setCurrentView(AppView.DASHBOARD); // This will cause a re-render
        return <Dashboard user={currentUser} setCurrentView={setCurrentView} />; // Show dashboard immediately
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard user={currentUser} setCurrentView={setCurrentView} />;
      // Employee Views
      case AppView.CLOCK_IN_OUT:
        return <ClockInOutPage user={currentUser} />;
      case AppView.WEEKLY_SCHEDULE:
        return <DailyJobsPage user={currentUser} />;
      case AppView.TIMESHEETS:
        return <TimesheetsPage user={currentUser} />;
      // Admin Views
      case AppView.ADMIN_JOB_MANAGEMENT:
        return <AdminJobManagementPage />;
      case AppView.ADMIN_USER_MANAGEMENT:
        return <AdminUserManagementPage />;
      case AppView.ADMIN_TIMESHEET_REPORTS:
        return <AdminTimesheetReportsPage />;
      default:
        // Fallback to dashboard if view is unknown or user somehow gets into an invalid state
        setCurrentView(AppView.DASHBOARD);
        return <Dashboard user={currentUser} setCurrentView={setCurrentView} />;
    }
  };
  
  const showBackButton = currentView !== AppView.DASHBOARD;

  return (
    <PageLayout 
      user={currentUser} 
      onLogout={handleLogout} 
      onNavigateBack={showBackButton ? navigateToDashboard : undefined}
      pageTitle={pageTitles[currentView] || "R&L Hub"}
    >
      {renderView()}
    </PageLayout>
  );
};

export default App;