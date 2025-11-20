// ============================================================================
// Gate-F Hook: Real-time Policy Updates
// ============================================================================

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context/AppContextProvider";
import type { Policy } from "@/modules/policies";

/**
 * Hook to subscribe to real-time policy changes
 * @param onPolicyChange - Callback when a policy is created/updated/deleted
 */
export function useGateFRealtime(
  onPolicyChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', policy: Policy | null) => void
) {
  const { tenantId } = useAppContext();

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('gate-f-policy-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'policies',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('📡 [Gate-F] Real-time policy update:', payload);

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

          // Call user callback
          if (onPolicyChange) {
            onPolicyChange(payload.eventType as any, policy);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, onPolicyChange]);
}
