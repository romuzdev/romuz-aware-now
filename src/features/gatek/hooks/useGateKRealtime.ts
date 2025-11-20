// ============================================================================
// Gate-K Hook: Real-time Job & Run Updates
// ============================================================================

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context/AppContextProvider";

/**
 * Hook to subscribe to real-time system job and job run changes
 * @param onJobChange - Callback when a job is created/updated
 * @param onRunChange - Callback when a job run is created/updated
 */
export function useGateKRealtime(
  onJobChange?: (eventType: 'INSERT' | 'UPDATE', job: any) => void,
  onRunChange?: (eventType: 'INSERT' | 'UPDATE', run: any) => void
) {
  const { tenantId } = useAppContext();

  useEffect(() => {
    if (!tenantId) return;

    // Subscribe to system_jobs changes
    const jobsChannel = supabase
      .channel('gate-k-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_jobs',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('📡 [Gate-K] Real-time job update:', payload);

          const job = payload.new as any;

          if (payload.eventType === 'INSERT' && job) {
            toast.info(`وظيفة جديدة: ${job.job_key}`, {
              description: `تم إضافة الوظيفة`,
              duration: 4000,
            });
          } else if (payload.eventType === 'UPDATE' && job) {
            toast.info(`تم تحديث الوظيفة: ${job.job_key}`, {
              description: job.is_enabled ? 'تم تفعيل الوظيفة' : 'تم تعطيل الوظيفة',
              duration: 4000,
            });
          }

          if (onJobChange) {
            onJobChange(payload.eventType as any, job);
          }
        }
      )
      .subscribe();

    // Subscribe to system_job_runs changes
    const runsChannel = supabase
      .channel('gate-k-runs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_job_runs',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('📡 [Gate-K] Real-time run update:', payload);

          const run = payload.new as any;

          if (payload.eventType === 'INSERT' && run) {
            if (run.status === 'queued') {
              toast.info(`تم جدولة تشغيل وظيفة`, {
                description: `الحالة: في الانتظار`,
                duration: 3000,
              });
            }
          } else if (payload.eventType === 'UPDATE' && run) {
            if (run.status === 'succeeded') {
              toast.success(`تم تنفيذ الوظيفة بنجاح`, {
                description: `المدة: ${run.duration_ms}ms`,
                duration: 4000,
              });
            } else if (run.status === 'failed') {
              toast.error(`فشل تنفيذ الوظيفة`, {
                description: run.error_message || 'خطأ غير معروف',
                duration: 5000,
              });
            }
          }

          if (onRunChange) {
            onRunChange(payload.eventType as any, run);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(runsChannel);
    };
  }, [tenantId, onJobChange, onRunChange]);
}
