// ============================================================================
// Gate-F Hook: Import/Export Operations
// ============================================================================

import { useState } from "react";
import { toast } from "sonner";
import { 
  importPolicies, 
  getImportHistory 
} from "@/modules/policies/integration";
import type { PolicyImportData, PolicyImportHistory } from "@/modules/policies";

export function useGateFImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [history, setHistory] = useState<PolicyImportHistory[]>([]);

  const importFromFile = async (
    filename: string,
    format: 'csv' | 'json',
    policies: PolicyImportData[]
  ) => {
    setIsImporting(true);
    try {
      const result = await importPolicies(filename, format, policies);

      if (result.status === "completed") {
        if (result.error_count > 0) {
          toast.warning(
            `تم استيراد ${result.success_count} سياسة`,
            { 
              description: `فشل استيراد ${result.error_count} سياسة. راجع سجل الاستيراد للتفاصيل.` 
            }
          );
        } else {
          toast.success(`تم استيراد ${result.success_count} سياسة بنجاح`);
        }
      } else {
        toast.error("فشل الاستيراد بالكامل");
      }

      return result;
    } catch (err: any) {
      toast.error(`خطأ في الاستيراد: ${err.message}`);
      throw err;
    } finally {
      setIsImporting(false);
    }
  };

  const loadHistory = async (limit: number = 20) => {
    try {
      const data = await getImportHistory(limit);
      setHistory(data);
    } catch (err: any) {
      toast.error("فشل تحميل سجل الاستيراد");
    }
  };

  return {
    isImporting,
    history,
    importFromFile,
    loadHistory,
  };
}
