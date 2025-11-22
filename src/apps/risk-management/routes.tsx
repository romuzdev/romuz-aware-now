/**
 * Risk Management App Routes
 */

import { Route, Routes, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppShell } from '@/core/components/layout';
import { ProtectedRoute } from '@/core/components';

// Lazy load pages
const RiskDashboard = lazy(() => import('./pages/RiskDashboard'));
const RiskRegister = lazy(() => import('./pages/RiskRegister'));
const RiskDetails = lazy(() => import('./pages/RiskDetails'));
const RiskAnalytics = lazy(() => import('./pages/RiskAnalytics'));
const RiskHeatmap = lazy(() => import('./pages/RiskHeatmap'));
const RiskTrends = lazy(() => import('./pages/RiskTrends'));
const RiskReports = lazy(() => import('./pages/RiskReports'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

/**
 * Risk Management Routes
 */
export function getRiskManagementRoutes() {
  return (
    <Route path="/risk/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={
        <Suspense fallback={<PageLoader />}>
          <RiskDashboard />
        </Suspense>
      } />
      <Route path="register" element={
        <Suspense fallback={<PageLoader />}>
          <RiskRegister />
        </Suspense>
      } />
      <Route path="register/:riskId" element={
        <Suspense fallback={<PageLoader />}>
          <RiskDetails />
        </Suspense>
      } />
      <Route path="analytics" element={
        <Suspense fallback={<PageLoader />}>
          <RiskAnalytics />
        </Suspense>
      } />
      <Route path="heatmap" element={
        <Suspense fallback={<PageLoader />}>
          <RiskHeatmap />
        </Suspense>
      } />
      <Route path="trends" element={
        <Suspense fallback={<PageLoader />}>
          <RiskTrends />
        </Suspense>
      } />
      <Route path="reports" element={
        <Suspense fallback={<PageLoader />}>
          <RiskReports />
        </Suspense>
      } />
    </Route>
  );
}
