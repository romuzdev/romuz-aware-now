/**
 * GRC Module Routes
 */

import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import GRCLayout from './components/layout/GRCLayout';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Wrapper to add Suspense AND Layout to lazy components
const withLayout = (Component: React.LazyExoticComponent<() => JSX.Element>) => (
  <GRCLayout>
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  </GRCLayout>
);

const GRCDashboard = lazy(() => import('./pages/GRCDashboard'));
const GRCReports = lazy(() => import('./pages/GRCReports'));
const FrameworkMapping = lazy(() => import('./pages/FrameworkMapping'));

export const grcRoutes: RouteObject[] = [
  {
    path: '/grc/dashboard',
    element: withLayout(GRCDashboard),
  },
  {
    path: '/grc/reports',
    element: withLayout(GRCReports),
  },
  {
    path: '/grc/framework-mapping',
    element: withLayout(FrameworkMapping),
  },
];
