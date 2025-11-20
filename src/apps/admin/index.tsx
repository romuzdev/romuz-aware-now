/**
 * Admin App Routes
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import AccessMatrixPage from './pages/AccessMatrixPage';
import UnifiedDashboardPage from './pages/UnifiedDashboardPage';
import BackupRecoveryPage from './pages/BackupRecoveryPage';

export function AdminApp() {
  return (
    <Routes>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<UnifiedDashboardPage />} />
      <Route path="access-matrix" element={<AccessMatrixPage />} />
      <Route path="backup" element={<BackupRecoveryPage />} />
    </Routes>
  );
}
