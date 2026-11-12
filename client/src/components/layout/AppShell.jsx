import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { ErrorBoundary } from '../feedback/ErrorBoundary.jsx';

/**
 * Main application layout shell with responsive container and error boundary.
 */
export function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pb-16 pt-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ErrorBoundary>{children ? children : <Outlet />}</ErrorBoundary>
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          Sweety Blood Glucose Tracker &copy; {new Date().getFullYear()} — Clinical Diabetes Management
        </div>
      </footer>
    </div>
  );
}
