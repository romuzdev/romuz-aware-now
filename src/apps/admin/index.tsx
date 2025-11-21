/**
 * Admin App Routes
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import AccessMatrixPage from './pages/AccessMatrixPage';
import UnifiedDashboardPage from './pages/UnifiedDashboardPage';
import BackupRecoveryPage from './pages/BackupRecoveryPage';
import ContentHubPage from './pages/ContentHub';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import SecOpsDashboardPage from './pages/SecOpsDashboardPage';
import SecurityEventsPage from './pages/SecurityEventsPage';
import SOARPlaybooksPage from './pages/SOARPlaybooksPage';
import SecOpsConnectorsPage from './pages/SecOpsConnectorsPage';

export function AdminApp() {
  return (
    <Routes>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<UnifiedDashboardPage />} />
      <Route path="access-matrix" element={<AccessMatrixPage />} />
      <Route path="backup" element={<BackupRecoveryPage />} />
      <Route path="content-hub" element={<ContentHubPage />} />
      <Route path="ai-recommendations" element={<AIRecommendationsPage />} />
      <Route path="secops" element={<SecOpsDashboardPage />} />
      <Route path="secops/events" element={<SecurityEventsPage />} />
      <Route path="secops/playbooks" element={<SOARPlaybooksPage />} />
      <Route path="secops/connectors" element={<SecOpsConnectorsPage />} />
    </Routes>
  );
}
