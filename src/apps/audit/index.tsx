/**
 * Audit Application
 * 
 * Internal & External Audit Management System
 * M12: Complete audit workflow from planning to reporting
 * 
 * Status: Active (100%)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import AuditsPage from './pages/AuditsPage';
import AuditDetails from './pages/AuditDetails';
import AuditDashboard from './pages/AuditDashboard';
import AuditWorkflows from './pages/AuditWorkflows';
import AuditFindings from './pages/AuditFindings';
import AuditReports from './pages/AuditReports';
import ComplianceGaps from './pages/ComplianceGaps';
import Auditors from './pages/Auditors';
import AuditNew from './pages/AuditNew';
import AuditDocumentsPage from './pages/documents';
import AuditAnalytics from './pages/AuditAnalytics';

export default function AuditApp() {
  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route index element={<Navigate to="dashboard" replace />} />
      
      {/* Main Dashboard */}
      <Route path="dashboard" element={<AuditDashboard />} />
      
      {/* Analytics Dashboard */}
      <Route path="analytics" element={<AuditAnalytics />} />
      
      {/* Audit Plans Management */}
      <Route path="audits" element={<AuditsPage />} />
      <Route path="audits/new" element={<AuditNew />} />
      <Route path="audits/:id" element={<AuditDetails />} />
      
      {/* Audit Workflows */}
      <Route path="workflows" element={<AuditWorkflows />} />
      
      {/* Findings Management */}
      <Route path="findings" element={<AuditFindings />} />
      
      {/* Reports Generation */}
      <Route path="reports" element={<AuditReports />} />
      
      {/* Compliance Gap Analysis */}
      <Route path="compliance-gaps" element={<ComplianceGaps />} />
      
      {/* Auditors Management */}
      <Route path="auditors" element={<Auditors />} />
      
      {/* Documents Repository */}
      <Route path="documents" element={<AuditDocumentsPage />} />
    </Routes>
  );
}
