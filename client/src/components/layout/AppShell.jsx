import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { PatientBottomNavigation } from './PatientBottomNavigation.jsx';
import { ErrorBoundary } from '../feedback/ErrorBoundary.jsx';

/**
 * Main application layout shell with Warm White canvas, responsive container, and mobile bottom nav.
 */
export function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F3EDE6] text-[#0F3336]">
      <Navbar />
      <main className="flex-1 pb-28 md:pb-16 pt-6 sm:pt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ErrorBoundary>{children ? children : <Outlet />}</ErrorBoundary>
        </div>
      </main>
      <footer className="hidden md:block border-t border-[#EAE3DB] bg-white/60 py-6 text-center text-xs text-[#4D6B6D]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          Sweety Blood Glucose Tracker &copy; {new Date().getFullYear()} — Clinical Diabetes Management
        </div>
      </footer>
      <PatientBottomNavigation />
    </div>
  );
}
