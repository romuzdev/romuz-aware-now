// ============================================================================
// Gate-E Hooks: Real-time Alert Updates (D1 Standard)
// ============================================================================

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Hook for subscribing to real-time alert updates
 * 
 * @example
 * // In your component
 * useGateERealtime();
 */
export function useGateERealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to alert_rules changes
    const rulesChannel = supabase
      .channel("gate-e-rules-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "observability",
          table: "alert_rules",
        },
        (payload) => {
          console.log("Gate-E alert rule changed:", payload);
          
          // Invalidate alert rules list
          queryClient.invalidateQueries({ queryKey: ["gate-e", "alert-rules"] });
          
          // If update/delete, invalidate specific rule
          if (payload.eventType === "UPDATE" || payload.eventType === "DELETE") {
            const oldRecord = payload.old as { id?: string } | null;
            const newRecord = payload.new as { id?: string } | null;
            const ruleId = oldRecord?.id || newRecord?.id;
            if (ruleId) {
              queryClient.invalidateQueries({ 
                queryKey: ["gate-e", "alert-rules", ruleId] 
              });
            }
          }
          
          // Show notification for INSERT
          if (payload.eventType === "INSERT") {
            toast({
              title: "قاعدة تنبيه جديدة",
              description: "تم إضافة قاعدة تنبيه جديدة",
            });
          }
        }
      )
      .subscribe();

    // Subscribe to alert_logs changes (for real-time alerts)
    const logsChannel = supabase
      .channel("gate-e-logs-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "observability",
          table: "alert_logs",
        },
        (payload) => {
          console.log("Gate-E alert triggered:", payload);
          
          // Invalidate alert logs
          queryClient.invalidateQueries({ queryKey: ["gate-e", "alert-logs"] });
          
          // Show real-time alert notification
          const alertLog = payload.new as any;
          if (alertLog) {
            toast({
              title: `تنبيه: ${alertLog.severity || "medium"}`,
              description: alertLog.message || "تم تشغيل تنبيه جديد",
              variant: alertLog.severity === "critical" || alertLog.severity === "high" 
                ? "destructive" 
                : "default",
            });
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(rulesChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [queryClient]);
}
