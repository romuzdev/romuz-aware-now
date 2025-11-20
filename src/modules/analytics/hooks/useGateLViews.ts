// ============================================================================
// Gate-L Hook: Saved Report Views Management
// ============================================================================

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  saveReportView, 
  listReportViews, 
  deleteReportView 
} from "@/modules/awareness/integration";
import type { ReportView, ReportFilters, ReportSortConfig } from "../types";

export function useGateLViews() {
  const [views, setViews] = useState<ReportView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadViews();
  }, []);

  const loadViews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listReportViews();
      setViews(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("فشل تحميل العروض المحفوظة");
    } finally {
      setLoading(false);
    }
  };

  const saveView = async (
    viewName: string,
    descriptionAr: string | null,
    filters: ReportFilters,
    sortConfig: ReportSortConfig,
    isDefault: boolean,
    isShared: boolean
  ) => {
    try {
      const view = await saveReportView(viewName, descriptionAr, filters, sortConfig, isDefault, isShared);
      setViews((prev) => {
        const existing = prev.find((v) => v.id === view.id);
        if (existing) {
          return prev.map((v) => (v.id === view.id ? view : v));
        }
        return [...prev, view];
      });
      toast.success("تم حفظ العرض بنجاح");
      return view;
    } catch (err: any) {
      toast.error(`فشل حفظ العرض: ${err.message}`);
      throw err;
    }
  };

  const deleteView = async (viewId: string) => {
    try {
      const success = await deleteReportView(viewId);
      if (success) {
        setViews((prev) => prev.filter((v) => v.id !== viewId));
        toast.success("تم حذف العرض بنجاح");
      }
      return success;
    } catch (err: any) {
      toast.error(`فشل حذف العرض: ${err.message}`);
      throw err;
    }
  };

  return { views, loading, error, saveView, deleteView, refetch: loadViews };
}
