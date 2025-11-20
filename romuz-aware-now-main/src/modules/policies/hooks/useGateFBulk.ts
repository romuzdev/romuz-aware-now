// ============================================================================
// Gate-F Hook: Bulk Operations
// ============================================================================

import { useState } from "react";
import { toast } from "sonner";
import { 
  bulkUpdatePolicyStatusRPC, 
  bulkDeletePolicies,
  getBulkOperationsHistory 
} from "@/modules/policies/integration";
import type { PolicyStatus, PolicyBulkOperation } from "@/modules/policies";

export function useGateFBulk() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<PolicyBulkOperation[]>([]);

  const updateStatus = async (policyIds: string[], newStatus: PolicyStatus) => {
    setIsExecuting(true);
    try {
      const result = await bulkUpdatePolicyStatusRPC(policyIds, newStatus);

      if (result.status === "completed") {
        toast.success(`تم تحديث ${result.affected_count} سياسة بنجاح`);
      } else if (result.status === "partial") {
        toast.warning(
          `تم تحديث ${result.affected_count} من ${policyIds.length} سياسة`,
          { description: "حدثت أخطاء في بعض السياسات" }
        );
      } else {
        toast.error("فشل تحديث السياسات");
      }

      return result;
    } catch (err: any) {
      toast.error(`خطأ في التحديث الجماعي: ${err.message}`);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const deletePolicies = async (policyIds: string[]) => {
    setIsExecuting(true);
    try {
      const result = await bulkDeletePolicies(policyIds);

      if (result.status === "completed") {
        toast.success(`تم حذف ${result.affected_count} سياسة بنجاح`);
      } else if (result.status === "partial") {
        toast.warning(
          `تم حذف ${result.affected_count} من ${policyIds.length} سياسة`,
          { description: "حدثت أخطاء في بعض السياسات" }
        );
      } else {
        toast.error("فشل حذف السياسات");
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
    updateStatus,
    deletePolicies,
    loadHistory,
  };
}
