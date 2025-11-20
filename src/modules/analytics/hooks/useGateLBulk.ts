// ============================================================================
// Gate-L Hook: Bulk Operations
// ============================================================================

import { useState } from "react";
import { toast } from "sonner";
import { bulkGenerateReports, bulkScheduleReports, bulkDeleteReports, getBulkOperationsHistory } from "@/modules/awareness/integration";
import type { ReportBulkOperation, ReportScheduleConfig } from "../types";

export function useGateLBulk() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<ReportBulkOperation[]>([]);

  const generateReports = async (reportIds: string[]) => {
    setIsExecuting(true);
    try {
      const result = await bulkGenerateReports(reportIds);
      if (result.status === "completed") {
        toast.success(`تم توليد ${result.affected_count} تقرير بنجاح`);
      } else if (result.status === "partial") {
        toast.warning(`تم توليد ${result.affected_count} من ${reportIds.length} تقرير`, { description: "حدثت أخطاء في بعض التقارير" });
      } else {
        toast.error("فشل توليد التقارير");
      }
      return result;
    } catch (err: any) {
      toast.error(`خطأ في التوليد الجماعي: ${err.message}`);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const scheduleReports = async (reportIds: string[], scheduleConfig: ReportScheduleConfig) => {
    setIsExecuting(true);
    try {
      const result = await bulkScheduleReports(reportIds, scheduleConfig);
      if (result.status === "completed") {
        toast.success(`تم جدولة ${result.affected_count} تقرير بنجاح`);
      } else if (result.status === "partial") {
        toast.warning(`تم جدولة ${result.affected_count} من ${reportIds.length} تقرير`, { description: "حدثت أخطاء في بعض التقارير" });
      } else {
        toast.error("فشل جدولة التقارير");
      }
      return result;
    } catch (err: any) {
      toast.error(`خطأ في الجدولة الجماعية: ${err.message}`);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const deleteReports = async (reportIds: string[]) => {
    setIsExecuting(true);
    try {
      const result = await bulkDeleteReports(reportIds);
      if (result.status === "completed") {
        toast.success(`تم حذف ${result.affected_count} تقرير بنجاح`);
      } else if (result.status === "partial") {
        toast.warning(`تم حذف ${result.affected_count} من ${reportIds.length} تقرير`, { description: "حدثت أخطاء في بعض التقارير" });
      } else {
        toast.error("فشل حذف التقارير");
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

  return { isExecuting, history, generateReports, scheduleReports, deleteReports, loadHistory };
}
