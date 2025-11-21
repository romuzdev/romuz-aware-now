/**
 * M20 - Threat Intelligence App Routes
 */

import { Navigate, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Indicators from './pages/Indicators';
import Feeds from './pages/Feeds';
import Matches from './pages/Matches';
import Settings from './pages/Settings';

export const threatIntelligenceRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="indicators" element={<Indicators />} />
    <Route path="feeds" element={<Feeds />} />
    <Route path="matches" element={<Matches />} />
    <Route path="settings" element={<Settings />} />
    <Route path="*" element={<Navigate to="/app/threat-intelligence" replace />} />
  </>
);
