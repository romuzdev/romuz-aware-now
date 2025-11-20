/**
 * Audit App Routes
 * 
 * Contains all routes for the Audit Management application
 * M12: Complete audit workflow management
 */

import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/core/components';
import { AdminLayout } from '@/core/components/layout';
import { Skeleton } from '@/core/components/ui/skeleton';

// Lazy load audit pages
const AuditApp = lazy(() => import('./index.tsx'));

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
 * Audit Routes
 * 
 * Internal & External Audit Management routes
 */
export function getAuditRoutes() {
  return (
    <Route
      path="/audit/*"
      element={
        <ProtectedRoute>
          <AdminLayout>
            <Suspense fallback={<LoadingFallback />}>
              <AuditApp />
            </Suspense>
          </AdminLayout>
        </ProtectedRoute>
      }
    />
  );
}
