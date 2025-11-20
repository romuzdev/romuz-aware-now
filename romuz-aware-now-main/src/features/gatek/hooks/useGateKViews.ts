// ============================================================================
// Gate-K Hook: Saved Job Views Management
// ============================================================================

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  saveJobView, 
  listJobViews, 
  deleteJobView 
} from "@/modules/analytics/integration";
import type { JobView, JobFilters, JobSortConfig } from "@/modules/analytics";

export function useGateKViews() {
  const [views, setViews] = useState<JobView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load views on mount
  useEffect(() => {
    loadViews();
  }, []);

  const loadViews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listJobViews();
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
    filters: JobFilters,
    sortConfig: JobSortConfig,
    isDefault: boolean,
    isShared: boolean
  ) => {
    try {
      const view = await saveJobView(
        viewName,
        descriptionAr,
        filters,
        sortConfig,
        isDefault,
        isShared
      );
      
      // Update local state
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
      const success = await deleteJobView(viewId);
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

  return {
    views,
    loading,
    error,
    saveView,
    deleteView,
    refetch: loadViews,
  };
}
