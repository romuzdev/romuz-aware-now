/**
 * Predictive Analytics App Routes
 */

import { Navigate, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import ModelsManagement from './pages/ModelsManagement';
import Predictions from './pages/Predictions';
import Models from './pages/Models';
import Performance from './pages/Performance';
import Settings from './pages/Settings';
import AdvancedAnalytics from './pages/AdvancedAnalytics';

export const predictiveAnalyticsRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="analytics" element={<PredictiveAnalytics />} />
    <Route path="advanced-analytics" element={<AdvancedAnalytics />} />
    <Route path="models-management" element={<ModelsManagement />} />
    <Route path="predictions" element={<Predictions />} />
    <Route path="models" element={<Models />} />
    <Route path="performance" element={<Performance />} />
    <Route path="settings" element={<Settings />} />
    <Route path="*" element={<Navigate to="/app/predictive-analytics" replace />} />
  </>
);
