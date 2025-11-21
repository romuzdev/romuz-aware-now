/**
 * M16: AI Advisory Engine - Routes
 */

import { Route } from 'react-router-dom';
import AdvisoryDashboard from './pages/AdvisoryDashboard';

export const aiAdvisoryRoutes = (
  <>
    <Route index element={<AdvisoryDashboard />} />
    <Route path="dashboard" element={<AdvisoryDashboard />} />
  </>
);
