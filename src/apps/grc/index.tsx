/**
 * GRC Application
 * 
 * Governance, Risk & Compliance Platform
 * Note: Audit functionality moved to /audit app (M12)
 * 
 * Status: Active
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import RiskDashboard from './pages/RiskDashboard';
import RiskRegister from './pages/RiskRegister';
import RiskDetails from './pages/RiskDetails';
import { ControlLibrary } from './pages/ControlLibrary';
import { ControlDetails } from './pages/ControlDetails';
import { ControlDashboard } from './pages/ControlDashboard';
import ComplianceDashboard from './pages/ComplianceDashboard';
import FrameworkLibrary from './pages/FrameworkLibrary';
import FrameworkDetails from './pages/FrameworkDetails';
import ComplianceRequirements from './pages/ComplianceRequirements';
import ComplianceGaps from './pages/ComplianceGaps';
import Reports from './pages/Reports';
import GRCDocumentsPage from './pages/documents';
import GateHActionsPage from './pages/actions/Actions';
import GateHActionDetailsPage from './pages/actions/ActionDetails';
import GateHActionPlanTracker from './pages/actions/ActionPlanTracker';

export default function GRCApp() {
  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route index element={<Navigate to="dashboard" replace />} />
      
      {/* Main Dashboard */}
      <Route path="dashboard" element={<RiskDashboard />} />
      
      {/* Risk Management */}
      <Route path="risks" element={<RiskRegister />} />
      <Route path="risks/:riskId" element={<RiskDetails />} />
      
      {/* Control Management */}
      <Route path="controls" element={<ControlLibrary />} />
      <Route path="controls/:id" element={<ControlDetails />} />
      <Route path="controls-dashboard" element={<ControlDashboard />} />
      
      {/* Compliance Management */}
      <Route path="compliance" element={<ComplianceDashboard />} />
      <Route path="frameworks" element={<FrameworkLibrary />} />
      <Route path="frameworks/:id" element={<FrameworkDetails />} />
      <Route path="requirements" element={<ComplianceRequirements />} />
      <Route path="gaps" element={<ComplianceGaps />} />
      
      {/* Reports */}
      <Route path="reports" element={<Reports />} />
      
      {/* Documents Repository */}
      <Route path="documents" element={<GRCDocumentsPage />} />
      
      {/* Gate-H: Action Plans */}
      <Route path="actions" element={<GateHActionsPage />} />
      <Route path="actions/:actionId" element={<GateHActionDetailsPage />} />
      <Route path="actions/:actionId/tracker" element={<GateHActionPlanTracker />} />
      
      {/* Redirect old audit routes to new app */}
      <Route path="audits" element={<Navigate to="/audit/audits" replace />} />
      <Route path="audits/:id" element={<Navigate to="/audit/audits" replace />} />
    </Routes>
  );
}
