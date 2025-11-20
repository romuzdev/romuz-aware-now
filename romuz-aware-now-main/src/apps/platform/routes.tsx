/**
 * Platform App Routes
 * 
 * Core platform routes including:
 * - Authentication (Login, Signup, etc.)
 * - Landing pages
 * - Settings & Help
 * - Gate-P Console
 */

import { lazy } from 'react';
import { Route } from 'react-router-dom';

// Lazy load pages
const IndexPage = lazy(() => import('./pages/Index'));
const LoginPage = lazy(() => import('./pages/auth/Login'));
const SignupPage = lazy(() => import('./pages/auth/Signup'));
const SelectTenantPage = lazy(() => import('./pages/auth/SelectTenant'));
const CompleteProfilePage = lazy(() => import('./pages/auth/CompleteProfile'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const HelpPage = lazy(() => import('./pages/Help'));
const GatePConsolePage = lazy(() => import('./pages/GatePConsole'));
const UnauthorizedPage = lazy(() => import('./pages/Unauthorized'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
const UserDashboardPage = lazy(() => import('./pages/user/UserDashboard'));
const IntegrationsHubPage = lazy(() => import('./pages/IntegrationsHub'));

export function PlatformRoutes() {
  return (
    <>
      {/* Public Routes */}
      <Route path="/" element={<IndexPage />} />
      
      {/* Auth Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/select-tenant" element={<SelectTenantPage />} />
      <Route path="/auth/complete-profile" element={<CompleteProfilePage />} />
      
      {/* User Routes */}
      <Route path="/user/dashboard" element={<UserDashboardPage />} />
      
      {/* Platform Routes */}
      <Route path="/app/settings" element={<SettingsPage />} />
      <Route path="/app/help" element={<HelpPage />} />
      <Route path="/admin/gate-p" element={<GatePConsolePage />} />
      <Route path="/platform/integrations" element={<IntegrationsHubPage />} />
      
      {/* Error Routes */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </>
  );
}
