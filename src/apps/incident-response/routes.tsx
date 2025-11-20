/**
 * M18: Incident Response System - Routes
 */

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load pages
const IncidentDashboard = lazy(() => import('./pages/IncidentDashboard'));
const ActiveIncidents = lazy(() => import('./pages/ActiveIncidents'));
const IncidentDetails = lazy(() => import('./pages/IncidentDetails'));
const ResponsePlans = lazy(() => import('./pages/ResponsePlans'));
const IncidentReports = lazy(() => import('./pages/IncidentReports'));
const IncidentSettings = lazy(() => import('./pages/IncidentSettings'));

/**
 * Incident Response Routes Component
 */
export function IncidentResponseRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<IncidentDashboard />} />
        <Route path="active" element={<ActiveIncidents />} />
        <Route path="incident/:id" element={<IncidentDetails />} />
        <Route path="plans" element={<ResponsePlans />} />
        <Route path="reports" element={<IncidentReports />} />
        <Route path="settings" element={<IncidentSettings />} />
      </Routes>
    </Suspense>
  );
}

/**
 * Export for use in main App.tsx
 */
export const getIncidentResponseRoutes = () => <IncidentResponseRoutes />;
