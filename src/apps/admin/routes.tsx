/**
 * Admin App Routes
 * 
 * Contains all routes for the Admin application
 */

import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/core/components';
import { AdminLayout } from '@/core/components/layout';
import { Skeleton } from '@/core/components/ui/skeleton';

// Lazy load admin pages
const AdminDashboard = lazy(() => import('./pages/Dashboard'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const AccessMatrix = lazy(() => import('./pages/AccessMatrix'));
const Health = lazy(() => import('./pages/Health'));
const AlertsSettings = lazy(() => import('./pages/AlertsSettings'));
const AutomationSettings = lazy(() => import('./pages/AutomationSettings'));
// GRC App Pages
const GRCApp = lazy(() => import('@/apps/grc'));
const UsersPage = lazy(() => import('./pages/Users'));
const DocumentsPage = lazy(() => import('./pages/DocumentsHub')); // Updated: Central Repository
const DocumentDetailsPage = lazy(() => import('./pages/DocumentDetails'));
const ReportsPage = lazy(() => import('./pages/Reports'));
const ReportsDashboard = lazy(() => import('./pages/ReportsDashboard'));

// Gate-E: Observability & Alerts
const AlertChannelsPage = lazy(() => import('./pages/observability/Channels'));
const AlertPoliciesPage = lazy(() => import('./pages/observability/Policies'));
const AlertTemplatesPage = lazy(() => import('./pages/observability/Templates'));
const AlertEventsPage = lazy(() => import('./pages/observability/Events'));

// Gate-J: Calibration
const CalibrationDashboard = lazy(() => import('./pages/awareness/impact/Calibration'));
const CalibrationDetails = lazy(() => import('./pages/awareness/impact/CalibrationDetails'));
const WeightSuggestionReview = lazy(() => import('./pages/awareness/impact/WeightSuggestionReview'));
const AwarenessInsightsPage = lazy(() => import('./pages/awareness/Insights'));

// Gate-K: KPI Analytics
const GateKOverview = lazy(() => import('./pages/gatek/Overview'));
const GateKRCA = lazy(() => import('./pages/gatek/RCA'));
const GateKRecommendations = lazy(() => import('./pages/gatek/Recommendations'));
const GateKQuarterly = lazy(() => import('./pages/gatek/Quarterly'));

// Gate-N: Admin Console
const GateNDashboard = lazy(() => import('./pages/gate-n/Dashboard'));
const GateNConsole = lazy(() => import('./pages/gate-n/Console'));

// Gate-P: Tenant Lifecycle
const GatePAuditLog = lazy(() => import('./pages/gate-p/AuditLog'));

// Gate-M: Master Data Management
const MasterDataOverview = lazy(() => import('./pages/master-data/MasterDataOverview'));
const CatalogsPage = lazy(() => import('./pages/master-data/CatalogsPage'));
const CatalogFormPage = lazy(() => import('./pages/master-data/CatalogFormPage'));
const CatalogViewPage = lazy(() => import('./pages/master-data/CatalogViewPage'));
const TermsPage = lazy(() => import('./pages/master-data/TermsPage'));
const TermFormPage = lazy(() => import('./pages/master-data/TermFormPage'));
const TermViewPage = lazy(() => import('./pages/master-data/TermViewPage'));
const MappingsPage = lazy(() => import('./pages/master-data/MappingsPage'));
const MappingFormPage = lazy(() => import('./pages/master-data/MappingFormPage'));
const MappingViewPage = lazy(() => import('./pages/master-data/MappingViewPage'));
const GateMAcceptancePage = lazy(() => import('./pages/master-data/GateMAcceptancePage'));

// Gate-M15: Integrations Framework
const IntegrationsHubPage = lazy(() => import('@/apps/platform/pages/IntegrationsHub'));

// M14: Unified KPI Dashboard
const UnifiedDashboardPage = lazy(() => import('./pages/UnifiedDashboardPage'));
// M23: Backup & Recovery
const BackupRecoveryPage = lazy(() => import('./pages/BackupRecoveryPage'));
// M13.1: Content Hub
const ContentHubPage = lazy(() => import('./pages/ContentHub'));
// M16: AI Advisory Engine
const AIRecommendationsPage = lazy(() => import('./pages/AIRecommendationsPage'));

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

/**
 * Admin Routes
 * 
 * Core admin functionality routes
 */
export function getAdminRoutes() {
  return (
    <>
      {/* Admin Dashboard */}
      <Route 
        path="/platform"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboard />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Audit Log */}
      <Route 
        path="/platform/audit-log"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AuditLog />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Access Matrix */}
      <Route 
        path="/platform/access-matrix"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AccessMatrix />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Health Monitor */}
      <Route 
        path="/platform/health"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <Health />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Alerts Settings */}
      <Route 
        path="/platform/alerts"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AlertsSettings />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Automation Settings */}
      <Route 
        path="/platform/automation"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AutomationSettings />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* GRC Application - Uses unified AdminLayout */}
      <Route 
        path="/grc/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <GRCApp />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Users Management */}
      <Route 
        path="/platform/users"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <UsersPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Documents Hub - Gate-G */}
      <Route 
        path="/platform/documents"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <DocumentsPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/platform/documents/:id"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <DocumentDetailsPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        } 
      />

      {/* Reports - Gate-F */}
      <Route 
        path="/platform/reports"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <ReportsPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/platform/reports-dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <ReportsDashboard />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        } 
      />

      {/* Observability - Gate-E */}
      <Route 
        path="/platform/observability/channels"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AlertChannelsPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/observability/policies"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AlertPoliciesPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/observability/templates"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AlertTemplatesPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/observability/events"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AlertEventsPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Awareness Insights - Gate-I */}
      <Route 
        path="/platform/awareness/insights"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AwarenessInsightsPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        } 
      />

      {/* Calibration - Gate-J */}
      <Route 
        path="/platform/awareness/impact/calibration"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <CalibrationDashboard />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/awareness/impact/calibration/:runId"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <CalibrationDetails />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/awareness/impact/weights/review/:suggestionId"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <WeightSuggestionReview />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* KPI Analytics - Gate-K */}
      <Route 
        path="/platform/gatek/overview"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <GateKOverview />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/platform/gatek/rca"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <GateKRCA />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/platform/gatek/recommendations"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <GateKRecommendations />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/platform/gatek/quarterly"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <GateKQuarterly />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        } 
      />

      {/* Admin Console - Gate-N */}
      <Route 
        path="/platform/gate-n/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <GateNDashboard />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/gate-n/console"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <GateNConsole />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Tenant Lifecycle - Gate-P */}
      <Route 
        path="/platform/gate-p/audit-log"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <GatePAuditLog />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Gate-M: Master Data Management */}
      <Route 
        path="/platform/master-data"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <MasterDataOverview />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/catalogs"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <CatalogsPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/catalogs/new"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <CatalogFormPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/catalogs/:id"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <CatalogViewPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/catalogs/:id/edit"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <CatalogFormPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/platform/master-data/terms"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <TermsPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/terms/new"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <TermFormPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/terms/:id"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <TermViewPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/terms/:id/edit"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <TermFormPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      
      <Route 
        path="/platform/master-data/mappings"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <MappingsPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/mappings/new"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <MappingFormPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/mappings/:id"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <MappingViewPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/mappings/:id/edit"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <MappingFormPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/platform/master-data/acceptance"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <GateMAcceptancePage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Gate-M15: Integrations Framework */}
      <Route 
        path="/platform/integrations"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <IntegrationsHubPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* M14: Unified KPI Dashboard */}
      <Route 
        path="/platform/admin/unified-dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <UnifiedDashboardPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* M23: Backup & Recovery */}
      <Route 
        path="/platform/admin/backup"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <BackupRecoveryPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* M16: AI Advisory Engine */}
      <Route 
        path="/platform/admin/ai-recommendations"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Suspense fallback={<LoadingFallback />}>
                <AIRecommendationsPage />
              </Suspense>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </>
  );
}
