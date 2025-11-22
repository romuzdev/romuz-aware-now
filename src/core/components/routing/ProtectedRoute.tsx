import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useQuery } from '@tanstack/react-query';
import { fetchMyProfile, isProfileComplete } from '@/core/tenancy/integration';

/**
 * Unified Protected Route Component
 * 
 * Sequential Guards Architecture:
 * 1. AuthGuard → checks user authentication
 * 2. TenantGuard → checks tenant association
 * 3. ProfileGuard → checks profile completion (EXCEPT for /admin/*, /platform/*)
 * 
 * IMPORTANT: Saves intended path in location.state.from for proper redirection
 * after completing auth flow (login → tenant → profile → original destination)
 */
export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, tenantId, loading } = useAppContext();
  const location = useLocation();

  // Fetch user profile to check if it's complete
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: fetchMyProfile,
    enabled: !!user,
  });

  // Loading state
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Guard 1: AuthGuard - Check authentication
  if (!user) {
    return <Navigate 
      to="/auth/login" 
      replace 
      state={{ from: location.pathname + location.search }} 
    />;
  }

  // Guard 2: TenantGuard - Check tenant association
  if (!tenantId) {
    return <Navigate 
      to="/auth/select-tenant" 
      replace 
      state={{ from: location.pathname + location.search }} 
    />;
  }

  // Guard 3: ProfileGuard - Check profile completion
  // EXEMPTIONS: /admin/*, /platform/*, /auth/complete-profile
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPlatformRoute = location.pathname.startsWith('/platform');
  const isCompleteProfilePage = location.pathname === '/auth/complete-profile';
  
  // Skip ProfileGuard for exempted routes
  const shouldCheckProfile = !isAdminRoute && !isPlatformRoute && !isCompleteProfilePage;

  if (shouldCheckProfile && !isProfileComplete(profile)) {
    return <Navigate 
      to="/auth/complete-profile" 
      replace 
      state={{ from: location.pathname + location.search }} 
    />;
  }

  // All guards passed → render protected content
  return children;
}
