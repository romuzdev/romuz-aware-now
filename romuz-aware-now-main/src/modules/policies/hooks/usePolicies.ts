import { useQuery } from "@tanstack/react-query";
import type { Policy } from "../types";
import { fetchPoliciesForTenant, logPolicyReadAction } from "../integration";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePolicies() {
  const { tenantId } = useAppContext();

  // Use React Query for efficient caching
  const query = useQuery({
    queryKey: ['policies', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant not found');
      return await fetchPoliciesForTenant(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  // Real-time subscription for live updates
  useQuery({
    queryKey: ['policies-realtime', tenantId],
    queryFn: () => Promise.resolve(null),
    enabled: !!tenantId && !!query.data,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    meta: {
      setupRealtime: () => {
        if (!tenantId) return;

        const channel = supabase
          .channel('policies-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'policies',
              filter: `tenant_id=eq.${tenantId}`,
            },
            async (payload) => {
              console.log('📡 Real-time update received:', payload);

              const policy = payload.new as Policy | null;
              const oldPolicy = payload.old as Policy | null;

              switch (payload.eventType) {
                case 'INSERT':
                  if (policy) {
                    toast.success(`سياسة جديدة: ${policy.title}`, {
                      description: `تم إضافة السياسة ${policy.code}`,
                      duration: 4000,
                    });
                  }
                  break;
                case 'UPDATE':
                  if (policy) {
                    toast.info(`تم تحديث السياسة: ${policy.title}`, {
                      description: `السياسة ${policy.code} تم تحديثها`,
                      duration: 4000,
                    });
                  }
                  break;
                case 'DELETE':
                  if (oldPolicy) {
                    toast.warning(`تم حذف السياسة: ${oldPolicy.title}`, {
                      description: `السياسة ${oldPolicy.code} تم حذفها`,
                      duration: 4000,
                    });
                  }
                  break;
              }

              // Trigger refetch
              query.refetch();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  });

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
