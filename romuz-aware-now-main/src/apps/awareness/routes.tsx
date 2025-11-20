/**
 * Awareness App Routes
 * 
 * Contains all routes for the Awareness application
 */

import { lazy, Suspense } from 'react';
import { Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/core/components';
import { AdminLayout } from '@/core/components/layout';
import { Skeleton } from '@/core/components/ui/skeleton';

// Lazy load pages - Campaigns
const CampaignsListPage = lazy(() => import('./pages/campaigns'));
const CampaignDetailPage = lazy(() => import('./pages/campaigns/Detail'));
const CampaignNewPage = lazy(() => import('./pages/campaigns/New'));
const CampaignEditPage = lazy(() => import('./pages/campaigns/Edit'));
const LearnerPreviewPage = lazy(() => import('./pages/campaigns/LearnerPreview'));
const AwarenessDashboard = lazy(() => import('./pages/Dashboard'));

// Lazy load pages - D2 Policies
const PoliciesPage = lazy(() => import('./pages/policies'));
const PolicyDetailsPage = lazy(() => import('./pages/policies/Details'));
const PolicyEditPage = lazy(() => import('./pages/policies/Edit'));
const AdvancedAnalytics = lazy(() => import('./pages/AdvancedAnalytics'));

// Lazy load pages - Settings & Content Hub
const AwarenessSettingsPage = lazy(() => import('./pages/settings'));
const ContentHubPage = lazy(() => import('./pages/content'));
const IntegrationsPage = lazy(() => import('./pages/integrations'));

// Lazy load pages - D3 Committees
const CommitteesPage = lazy(() => import('./pages/committees'));
const CommitteeDetailsPage = lazy(() => import('./pages/committees/Details'));
const CommitteeCreatePage = lazy(() => import('./pages/committees/Create'));
const CommitteeEditPage = lazy(() => import('./pages/committees/Edit'));
const CommitteesDocumentsPage = lazy(() => import('./pages/committees/Documents'));

// Lazy load pages - D3 Meetings
const MeetingDetailsPage = lazy(() => import('./pages/meetings/Details'));

// Lazy load pages - D4 Objectives & KPIs
const ObjectivesPage = lazy(() => import('./pages/objectives'));
const ObjectiveDetailsPage = lazy(() => import('./pages/objectives/Details'));
const KPIsPage = lazy(() => import('./pages/kpis'));
const KPIDetailsPage = lazy(() => import('./pages/kpis/Details'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="container mx-auto py-6 space-y-6">
    <Skeleton className="h-12 w-3/4" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);

// Wrapper component for shared layout
const AwarenessLayoutWrapper = () => (
  <ProtectedRoute>
    <AdminLayout>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </AdminLayout>
  </ProtectedRoute>
);

/**
 * Awareness Routes
 * 
 * All routes use /awareness prefix with shared AdminLayout
 */
export function getAwarenessRoutes() {
  return (
    <Route path="/awareness" element={<AwarenessLayoutWrapper />}>
      {/* Default redirect to dashboard */}
      <Route index element={<Navigate to="/awareness/dashboards/awareness" replace />} />
      
      {/* Dashboards redirect */}
      <Route path="dashboards" element={<Navigate to="/awareness/dashboards/awareness" replace />} />

      {/* Dashboard */}
      <Route path="dashboards/awareness" element={<AwarenessDashboard />} />

      {/* Campaigns CRUD */}
      <Route path="campaigns" element={<CampaignsListPage />} />
      <Route path="campaigns/new" element={<CampaignNewPage />} />
      <Route path="campaigns/:id" element={<CampaignDetailPage />} />
      <Route path="campaigns/:id/edit" element={<CampaignEditPage />} />
      <Route path="campaigns/:id/preview/:participantId" element={<LearnerPreviewPage />} />

      {/* D2 - Policies CRUD */}
      <Route path="policies" element={<PoliciesPage />} />
      <Route path="policies/:id" element={<PolicyDetailsPage />} />
      <Route path="policies/:id/edit" element={<PolicyEditPage />} />

      {/* D3 - Committees CRUD */}
      <Route path="committees" element={<CommitteesPage />} />
      <Route path="committees/new" element={<CommitteeCreatePage />} />
      <Route path="committees/:id" element={<CommitteeDetailsPage />} />
      <Route path="committees/:id/edit" element={<CommitteeEditPage />} />
      <Route path="committees/documents" element={<CommitteesDocumentsPage />} />

      {/* D3 - Meeting Details */}
      <Route path="meetings/:id" element={<MeetingDetailsPage />} />

      {/* D4 - Objectives & KPIs */}
      <Route path="objectives" element={<ObjectivesPage />} />
      <Route path="objectives/:id" element={<ObjectiveDetailsPage />} />
      <Route path="kpis" element={<KPIsPage />} />
      <Route path="kpis/:id" element={<KPIDetailsPage />} />

      {/* M15 - Integrations */}
      <Route path="integrations" element={<IntegrationsPage />} />

      {/* Settings */}
      <Route path="settings" element={<AwarenessSettingsPage />} />

      {/* Content Hub */}
      <Route path="content" element={<ContentHubPage />} />

      {/* Advanced Analytics */}
      <Route path="analytics" element={<AdvancedAnalytics />} />
    </Route>
  );
}
