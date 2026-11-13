import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.jsx';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.jsx';
import { RoleRoute } from '../components/layout/RoleRoute.jsx';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner.jsx';
import { ROLES } from '@sweety/shared/constants/roles.js';

// Placeholder fallbacks until Module 8
const PageFallback = () => (
  <div className="flex h-64 items-center justify-center">
    <LoadingSpinner size="md" />
  </div>
);

// Feature Pages (Eagerly import auth entry pages to eliminate Suspense flicker on route switch)
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';

const DashboardPage = React.lazy(() => import('../features/readings/pages/DashboardPage.jsx'));
const ReadingsPage = React.lazy(() => import('../features/readings/pages/ReadingsPage.jsx'));
const ReadingEntryPage = React.lazy(() => import('../features/readings/pages/ReadingEntryPage.jsx'));
const ReportsPage = React.lazy(() => import('../features/reports/pages/ReportsPage.jsx'));
const SettingsPage = React.lazy(() => import('../features/settings/pages/SettingsPage.jsx'));
const PatientsPage = React.lazy(() => import('../features/doctor/pages/PatientsPage.jsx'));
const PatientReportPage = React.lazy(() => import('../features/doctor/pages/PatientReportPage.jsx'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'readings',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ReadingsPage />
          </Suspense>
        ),
      },
      {
        path: 'readings/new',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ReadingEntryPage />
          </Suspense>
        ),
      },
      {
        path: 'readings/:id/edit',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ReadingEntryPage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ReportsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: 'doctor',
        element: <RoleRoute allowedRole={ROLES.DOCTOR} />,
        children: [
          {
            path: 'patients',
            element: (
              <Suspense fallback={<PageFallback />}>
                <PatientsPage />
              </Suspense>
            ),
          },
          {
            path: 'patients/:patientId/reports',
            element: (
              <Suspense fallback={<PageFallback />}>
                <PatientReportPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '*',
        element: (
          <div className="py-16 text-center">
            <h2 className="text-2xl font-bold text-slate-900">404 — Page Not Found</h2>
            <p className="mt-2 text-sm text-slate-500">The requested page does not exist.</p>
          </div>
        ),
      },
    ],
  },
]);
