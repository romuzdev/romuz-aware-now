/**
 * M16: AI Advisory Engine - Routes
 */

import { Route } from 'react-router-dom';
import AdvisoryDashboard from './pages/AdvisoryDashboard';

export const aiAdvisoryRoutes = (
  <>
    <Route path="/ai-advisory" element={<AdvisoryDashboard />} />
    <Route path="/ai-advisory/dashboard" element={<AdvisoryDashboard />} />
  </>
);
