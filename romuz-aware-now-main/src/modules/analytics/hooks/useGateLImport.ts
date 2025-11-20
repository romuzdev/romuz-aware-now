// ============================================================================
// Gate-L Hook: Import/Export Operations
// ============================================================================

import { useState } from "react";
import { toast } from "sonner";
import { getReportsImportHistory as getImportHistory } from "@/modules/awareness/integration";
import type { ReportImportHistory } from "../types";

export function useGateLImport() {
  const [history, setHistory] = useState<ReportImportHistory[]>([]);

  const loadHistory = async (limit: number = 20) => {
    try {
      const data = await getImportHistory(limit);
      setHistory(data);
    } catch (err: any) {
      toast.error("فشل تحميل سجل الاستيراد");
    }
  };

  return { history, loadHistory };
}
