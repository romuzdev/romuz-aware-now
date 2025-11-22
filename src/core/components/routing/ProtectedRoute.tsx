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

  // Skip profile completion check for admin and platform routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPlatformRoute = location.pathname.startsWith('/platform');
  const isCompleteProfilePage = location.pathname === '/auth/complete-profile';

  // If user has tenant but profile is incomplete, redirect to complete-profile
  // EXCEPT for admin/platform routes which should always be accessible
  if (
    !isAdminRoute &&
    !isPlatformRoute &&
    !isCompleteProfilePage &&
    !isProfileComplete(profile)
  ) {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  return children;
}
