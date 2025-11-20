// ============================================================================
// Gate-H Hooks: Real-time Updates (D1 Standard)
// ============================================================================

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Hook for subscribing to real-time action updates
 * 
 * @example
 * // In your component
 * useGateHRealtime();
 */
export function useGateHRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to action_items changes
    const actionsChannel = supabase
      .channel("gate-h-actions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "gate_h",
          table: "action_items",
        },
        (payload) => {
          console.log("Gate-H action changed:", payload);
          
          // Invalidate actions list
          queryClient.invalidateQueries({ queryKey: ["gate-h", "actions"] });
          
          // If update/delete, invalidate specific action
          if (payload.eventType === "UPDATE" || payload.eventType === "DELETE") {
            const oldRecord = payload.old as { id?: string } | null;
            const newRecord = payload.new as { id?: string } | null;
            const actionId = oldRecord?.id || newRecord?.id;
            if (actionId) {
              queryClient.invalidateQueries({ 
                queryKey: ["gate-h", "actions", actionId] 
              });
            }
          }
          
          // Show notification for INSERT
          if (payload.eventType === "INSERT") {
            toast({
              title: "إجراء جديد",
              description: "تم إضافة إجراء جديد",
            });
          }
        }
      )
      .subscribe();

    // Subscribe to action_updates changes
    const updatesChannel = supabase
      .channel("gate-h-updates-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "gate_h",
          table: "action_updates",
        },
        (payload) => {
          console.log("Gate-H update added:", payload);
          
          // Invalidate specific action updates
          const actionId = (payload.new as any)?.action_id;
          if (actionId) {
            queryClient.invalidateQueries({ 
              queryKey: ["gate-h", "actions", actionId, "updates"] 
            });
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(actionsChannel);
      supabase.removeChannel(updatesChannel);
    };
  }, [queryClient]);
}
