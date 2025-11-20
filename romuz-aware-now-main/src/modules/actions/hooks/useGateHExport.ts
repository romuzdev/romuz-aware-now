// ============================================================================
// Gate-H Hooks: Export Actions (JSON/CSV)
// ============================================================================

import { useMutation } from "@tanstack/react-query";
import { exportActionsJSON, exportActionsCSV } from "../integration";
import type { GateHExportFilters } from "../types";
import { useToast } from "@/hooks/use-toast";

// ============================================================
// Download Helpers
// ============================================================

/**
 * Downloads JSON data as a file
 */
function downloadJSON(data: Record<string, any>[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads CSV text as a file
 */
function downloadCSV(csvText: string, filename: string) {
  const blob = new Blob([csvText], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates filename with timestamp
 */
function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
}

// ============================================================
// Export Hook - JSON
// ============================================================

/**
 * Hook for exporting Gate-H actions as JSON
 * 
 * @example
 * const exportJSON = useGateHExportJSON();
 * 
 * exportJSON.mutate({
 *   fromDate: '2024-01-01',
 *   statuses: ['new', 'in_progress']
 * });
 */
export function useGateHExportJSON() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (filters: GateHExportFilters = {}) => {
      const data = await exportActionsJSON(filters);
      return data;
    },
    onSuccess: (data) => {
      if (!data || data.length === 0) {
        toast({
          title: "لا توجد بيانات",
          description: "لا توجد إجراءات تطابق الفلاتر المحددة",
          variant: "default",
        });
        return;
      }

      const filename = generateFilename("gate_h_actions", "json");
      downloadJSON(data, filename);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${data.length} إجراء كملف JSON`,
      });
    },
    onError: (error: Error) => {
      console.error("Export JSON error:", error);
      toast({
        title: "فشل التصدير",
        description: error.message || "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    },
  });
}

// ============================================================
// Export Hook - CSV
// ============================================================

/**
 * Hook for exporting Gate-H actions as CSV
 * 
 * @example
 * const exportCSV = useGateHExportCSV();
 * 
 * exportCSV.mutate({
 *   fromDate: '2024-01-01',
 *   statuses: ['new', 'in_progress']
 * });
 */
export function useGateHExportCSV() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (filters: GateHExportFilters = {}) => {
      const csvText = await exportActionsCSV(filters);
      return csvText;
    },
    onSuccess: (csvText) => {
      if (!csvText || csvText.trim().split("\n").length <= 1) {
        toast({
          title: "لا توجد بيانات",
          description: "لا توجد إجراءات تطابق الفلاتر المحددة",
          variant: "default",
        });
        return;
      }

      const filename = generateFilename("gate_h_actions", "csv");
      downloadCSV(csvText, filename);

      const rowCount = csvText.trim().split("\n").length - 1;
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${rowCount} إجراء كملف CSV`,
      });
    },
    onError: (error: Error) => {
      console.error("Export CSV error:", error);
      toast({
        title: "فشل التصدير",
        description: error.message || "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    },
  });
}

// ============================================================
// Combined Export Hook (with format selection)
// ============================================================

export type ExportFormat = "json" | "csv";

export interface ExportParams {
  format: ExportFormat;
  filters?: GateHExportFilters;
}

/**
 * Combined hook for exporting in either JSON or CSV format
 * 
 * @example
 * const exportActions = useGateHExport();
 * 
 * exportActions.mutate({
 *   format: 'csv',
 *   filters: { statuses: ['new'] }
 * });
 */
export function useGateHExport() {
  const exportJSON = useGateHExportJSON();
  const exportCSV = useGateHExportCSV();

  return useMutation({
    mutationFn: async ({ format, filters = {} }: ExportParams) => {
      if (format === "json") {
        return exportJSON.mutateAsync(filters);
      } else {
        return exportCSV.mutateAsync(filters);
      }
    },
    onError: (error: Error) => {
      // Error handling already done in individual hooks
      console.error("Export error:", error);
    },
  });
}

