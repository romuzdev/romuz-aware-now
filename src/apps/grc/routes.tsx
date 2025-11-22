/**
 * GRC Module Routes
 */

import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const GRCDashboard = lazy(() => import('./pages/GRCDashboard'));
const GRCReports = lazy(() => import('./pages/GRCReports'));
const FrameworkMapping = lazy(() => import('./pages/FrameworkMapping'));

export const grcRoutes: RouteObject[] = [
  {
    path: 'grc',
    children: [
      {
        path: 'dashboard',
        element: <GRCDashboard />,
      },
      {
        path: 'reports',
        element: <GRCReports />,
      },
      {
        path: 'framework-mapping',
        element: <FrameworkMapping />,
      },
    ],
  },
];
