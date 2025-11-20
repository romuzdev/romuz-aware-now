import { Toaster } from "@/core/components/ui/toaster";
import { Toaster as Sonner } from "@/core/components/ui/sonner";
import { TooltipProvider } from "@/core/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppContextProvider } from "@/lib/app-context/AppContextProvider";
import { useThemeSync } from "@/core/hooks/use-theme-sync";
import { useRTLSupport } from "@/core/hooks/use-rtl-support";
import { Suspense, lazy } from "react";

// Lazy load pages for better initial load performance
const Index = lazy(() => import("./apps/platform/pages/Index"));
const NotFound = lazy(() => import("./apps/platform/pages/NotFound"));
const LoginPage = lazy(() => import("./apps/platform/pages/auth/Login"));
const SignupPage = lazy(() => import("./apps/platform/pages/auth/Signup"));
const SelectTenantPage = lazy(() => import("./apps/platform/pages/auth/SelectTenant"));
const CompleteProfilePage = lazy(() => import("./apps/platform/pages/auth/CompleteProfile"));
const UserDashboard = lazy(() => import("./apps/platform/pages/user/UserDashboard"));
const EventMonitor = lazy(() => import("./pages/EventMonitor"));
const AutomationRules = lazy(() => import("./pages/AutomationRules"));

import { ProtectedRoute, RoleGuard } from "@/core/components";

// App Routes
import { getAwarenessRoutes } from "@/apps/awareness";
import { getAdminRoutes } from "@/apps/admin";
import { getAuditRoutes } from "@/apps/audit";
import { lmsRoutes } from "@/apps/lms";
import { getIncidentResponseRoutes } from "@/apps/incident-response";
import * as KnowledgeHub from "@/apps/knowledge-hub/routes";

// Gate-U: Unified App Shell & Personas
import { AppShell } from "@/core/components/layout";
const Unauthorized = lazy(() => import("./apps/platform/pages/Unauthorized"));

// Gate-P: Tenant Lifecycle & Automation Engine
const GatePConsole = lazy(() => import("./apps/platform/pages/GatePConsole"));

// General Pages
const Settings = lazy(() => import("./apps/platform/pages/Settings"));
const Help = lazy(() => import("./apps/platform/pages/Help"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Inner component to use theme sync hook after providers are mounted
const AppContent = () => {
  useThemeSync();
  useRTLSupport();
  
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Auth Routes */}
            <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/select-tenant" element={<SelectTenantPage />} />
            <Route path="/auth/complete-profile" element={<CompleteProfilePage />} />

            {/* Protected User Routes */}
            <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />

            {/* Gate-U: Unified App Shell Routes with RBAC Guards */}
            <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              {/* General Routes - Settings & Help */}
              <Route path="settings" element={<Settings />} />
              <Route path="help" element={<Help />} />
            </Route>
            
            {/* Event Monitor Dashboard */}
            <Route path="/events/monitor" element={<ProtectedRoute><EventMonitor /></ProtectedRoute>} />
            
            {/* Automation Rules Management */}
            <Route path="/automation/rules" element={<ProtectedRoute><AutomationRules /></ProtectedRoute>} />

            {/* Unauthorized Page */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Redirects for old URLs - maintain backward compatibility */}
            <Route path="/lms" element={<Navigate to="/admin/lms" replace />} />
            <Route path="/admin/grc/*" element={<Navigate to="/grc" replace />} />
            <Route path="/admin/backup" element={<Navigate to="/platform/admin/backup" replace />} />
            <Route path="/admin/*" element={<Navigate to="/platform" replace />} />
            <Route path="/audits" element={<Navigate to="/audit/audits" replace />} />
            <Route path="/audits/*" element={<Navigate to="/audit/audits" replace />} />
            <Route path="/auditors" element={<Navigate to="/audit/auditors" replace />} />

            {/* Awareness App Routes - includes D2, D3, D4 */}
            {getAwarenessRoutes()}
            
            {/* Admin App Routes - includes all admin functionality + Gate-M */}
            {getAdminRoutes()}
            
            {/* Audit App Routes - M12: Complete Audit Management */}
            {getAuditRoutes()}
            
            {/* LMS App Routes */}
            {lmsRoutes.map((route, index) => (
              <Route 
                key={index}
                path={route.path} 
                element={<ProtectedRoute>{route.element as any}</ProtectedRoute>} 
              />
            ))}
            
            {/* M17: Knowledge Hub + RAG Routes - Inside AppShell */}
            <Route path="/knowledge-hub" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<KnowledgeHub.KnowledgeHubIndex />} />
              <Route path="documents" element={<KnowledgeHub.DocumentsPage />} />
              <Route path="documents/create" element={<KnowledgeHub.CreateDocumentPage />} />
              <Route path="documents/:id" element={<KnowledgeHub.DocumentDetailPage />} />
              <Route path="qa" element={<KnowledgeHub.QAPage />} />
              <Route path="graph" element={<KnowledgeHub.GraphPage />} />
            </Route>

            {/* M18: Incident Response System Routes - Inside AppShell */}
            <Route path="/incident-response/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="*" element={getIncidentResponseRoutes()} />
            </Route>
            
            {/* Gate-P: Tenant Lifecycle & Automation Engine Routes */}
            <Route path="/admin/gate-p" element={<ProtectedRoute><GatePConsole /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

// D1 – Common Infra – Part 2: AppContextProvider wraps the app to provide tenantId & actorId.
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AppContextProvider>
          <AppContent />
        </AppContextProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
