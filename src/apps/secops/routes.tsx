/**
 * SecOps App Routes
 * M18.5 - Security Operations Center
 * 
 * Contains all routes for the SecOps application
 */

import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/core/components';
import { AppShell } from '@/core/components/layout';
import { Skeleton } from '@/core/components/ui/skeleton';

// Lazy load SecOps pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SecurityEvents = lazy(() => import('./pages/SecurityEvents'));
const SOARPlaybooks = lazy(() => import('./pages/SOARPlaybooks'));
const Connectors = lazy(() => import('./pages/Connectors'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="container mx-auto py-6 space-y-6">
    <Skeleton className="h-12 w-3/4" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);

/**
 * SecOps Routes
 * M18.5 - Full Security Operations Center
 */
export function getSecOpsRoutes() {
  return (
    <>
      {/* SecOps - Inside AppShell */}
      <Route path="/secops" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
        <Route path="events" element={<Suspense fallback={<LoadingFallback />}><SecurityEvents /></Suspense>} />
        <Route path="playbooks" element={<Suspense fallback={<LoadingFallback />}><SOARPlaybooks /></Suspense>} />
        <Route path="connectors" element={<Suspense fallback={<LoadingFallback />}><Connectors /></Suspense>} />
      </Route>
    </>
  );
}
