import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useQuery } from '@tanstack/react-query';
import { fetchMyProfile, isProfileComplete } from '@/core/tenancy/integration';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, tenantId, loading } = useAppContext();
  const location = useLocation();

  // Fetch user profile to check if it's complete
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: fetchMyProfile,
    enabled: !!user,
  });

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // If user is logged in but has no tenant, redirect to tenant selection
  if (!tenantId) {
    return <Navigate to="/auth/select-tenant" replace />;
  }

  // If user has tenant but profile is incomplete, redirect to complete-profile
  // Skip this check for admin/platform routes to avoid blocking platform admins
  if (
    !isProfileComplete(profile) &&
    location.pathname !== '/auth/complete-profile' &&
    !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/platform')
  ) {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  return children;
}
