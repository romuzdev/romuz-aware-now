// ============================================================================
// Gate-K Hook: Import/Export Operations
// ============================================================================

import { useState } from "react";
import { toast } from "sonner";
import { getAdminImportHistory as getImportHistory } from "@/modules/analytics/integration";
import type { AdminImportHistory } from "@/modules/analytics";

export function useGateKImport() {
  const [history, setHistory] = useState<AdminImportHistory[]>([]);

  const loadHistory = async (limit: number = 20) => {
    try {
      const data = await getImportHistory(limit);
      setHistory(data);
    } catch (err: any) {
      toast.error("فشل تحميل سجل الاستيراد");
    }
  };

  return {
    history,
    loadHistory,
  };
}
