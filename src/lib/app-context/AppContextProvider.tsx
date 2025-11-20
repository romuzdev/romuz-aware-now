import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchMyRoles, type AppRole } from '@/core/rbac';

type AppCtx = {
  user: { id: string; email?: string } | null;
  tenantId: string | null;
  loading: boolean;
  roles: AppRole[];
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole) => void;
};

const AppContext = createContext<AppCtx>({ 
  user: null, 
  tenantId: null, 
  loading: true,
  roles: [],
  activeRole: null,
  setActiveRole: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppCtx['user']>(null);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role);
    localStorage.setItem('activeRole', role);
  };

  // Cached tenant query - only fetches when user changes
  const { data: tenantId = null } = useQuery({
    queryKey: ['user-tenant', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      return data?.tenant_id ?? null;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 15 * 60 * 1000,
  });

  // Cached roles query - shared with useRBAC
  const { data: roles = [] } = useQuery({
    queryKey: ['my-roles'],
    queryFn: fetchMyRoles,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  const loading = !user;

  // Set active role from localStorage or first role
  useEffect(() => {
    if (roles.length > 0 && !activeRole) {
      const savedRole = localStorage.getItem('activeRole') as AppRole | null;
      if (savedRole && roles.includes(savedRole)) {
        setActiveRoleState(savedRole);
      } else {
        setActiveRoleState(roles[0]);
      }
    }
  }, [roles, activeRole]);

  // Auth state management
  useEffect(() => {
    let mounted = true;
    
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (mounted) {
        setUser(authUser ? { id: authUser.id, email: authUser.email ?? undefined } : null);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) {
        const authUser = session?.user;
        setUser(authUser ? { id: authUser.id, email: authUser.email ?? undefined } : null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider value={{ user, tenantId, loading, roles, activeRole, setActiveRole }}>
      {children}
    </AppContext.Provider>
  );
}
