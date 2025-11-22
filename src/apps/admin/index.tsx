/**
 * Admin App Routes
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import AccessMatrixPage from './pages/AccessMatrixPage';
import UnifiedDashboardPage from './pages/UnifiedDashboardPage';
import BackupRecoveryPage from './pages/BackupRecoveryPage';
import ContentHubPage from './pages/ContentHub';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import IntegrationMarketplace from './pages/IntegrationMarketplace';
import SystemCommand from './pages/SystemCommand';
import TenantLifecycle from './pages/TenantLifecycle';
import AdvancedSettings from './pages/AdvancedSettings';

export function AdminApp() {
  return (
    <Routes>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<UnifiedDashboardPage />} />
      <Route path="access-matrix" element={<AccessMatrixPage />} />
      <Route path="backup" element={<BackupRecoveryPage />} />
      <Route path="content-hub" element={<ContentHubPage />} />
      <Route path="ai-recommendations" element={<AIRecommendationsPage />} />
      <Route path="integrations" element={<IntegrationMarketplace />} />
      <Route path="system-command" element={<SystemCommand />} />
      <Route path="tenant-lifecycle" element={<TenantLifecycle />} />
      <Route path="advanced-settings" element={<AdvancedSettings />} />
    </Routes>
  );
}
