// ============================================================================
// Gate-K Hook: Bulk Operations
// ============================================================================

import { useState } from "react";
import { toast } from "sonner";
import {
  bulkToggleJobs,
  bulkTriggerJobs,
  bulkDeleteJobRuns,
  getBulkOperationsHistory 
} from "@/modules/analytics/integration";
import type { AdminBulkOperation } from "@/modules/analytics";

export function useGateKBulk() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<AdminBulkOperation[]>([]);

  const toggleJobs = async (jobIds: string[], isEnabled: boolean) => {
    setIsExecuting(true);
    try {
      const result = await bulkToggleJobs(jobIds, isEnabled);

      const action = isEnabled ? "تفعيل" : "تعطيل";
      
      if (result.status === "completed") {
        toast.success(`تم ${action} ${result.affected_count} وظيفة بنجاح`);
      } else if (result.status === "partial") {
        toast.warning(
          `تم ${action} ${result.affected_count} من ${jobIds.length} وظيفة`,
          { description: "حدثت أخطاء في بعض الوظائف" }
        );
      } else {
        toast.error(`فشل ${action} الوظائف`);
      }

      return result;
    } catch (err: any) {
      toast.error(`خطأ في العملية الجماعية: ${err.message}`);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const triggerJobs = async (jobIds: string[]) => {
    setIsExecuting(true);
    try {
      const result = await bulkTriggerJobs(jobIds);

      if (result.status === "completed") {
        toast.success(`تم تشغيل ${result.affected_count} وظيفة بنجاح`);
      } else if (result.status === "partial") {
        toast.warning(
          `تم تشغيل ${result.affected_count} من ${jobIds.length} وظيفة`,
          { description: "حدثت أخطاء في بعض الوظائف" }
        );
      } else {
        toast.error("فشل تشغيل الوظائف");
      }

      return result;
    } catch (err: any) {
      toast.error(`خطأ في التشغيل الجماعي: ${err.message}`);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const deleteRuns = async (runIds: string[]) => {
    setIsExecuting(true);
    try {
      const result = await bulkDeleteJobRuns(runIds);

      if (result.status === "completed") {
        toast.success(`تم حذف ${result.affected_count} سجل تشغيل بنجاح`);
      } else if (result.status === "partial") {
        toast.warning(
          `تم حذف ${result.affected_count} من ${runIds.length} سجل`,
          { description: "حدثت أخطاء في بعض السجلات" }
        );
      } else {
        toast.error("فشل حذف السجلات");
      }

      return result;
    } catch (err: any) {
      toast.error(`خطأ في الحذف الجماعي: ${err.message}`);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const loadHistory = async (limit: number = 20) => {
    try {
      const data = await getBulkOperationsHistory(limit);
      setHistory(data);
    } catch (err: any) {
      toast.error("فشل تحميل سجل العمليات");
    }
  };

  return {
    isExecuting,
    history,
    toggleJobs,
    triggerJobs,
    deleteRuns,
    loadHistory,
  };
}
