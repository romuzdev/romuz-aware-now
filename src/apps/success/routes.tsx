/**
 * M25 - Success Toolkit Routes
 */

import { lazy } from 'react';
import { Route } from 'react-router-dom';

const SuccessDashboardPage = lazy(() => import('@/pages/success/SuccessDashboardPage'));

export const getSuccessRoutes = () => {
  return (
    <>
      <Route index element={<SuccessDashboardPage />} />
    </>
  );
};
