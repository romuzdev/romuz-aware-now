// ============================================================================
// Gate-H Hooks: Import Operations (D1 Standard)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  importActions,
  getImportHistory,
} from "../integration";
import { toast } from "@/hooks/use-toast";
import type { ImportActionsInput, ImportResult } from "../types";

/**
 * Query hook for import history
 */
export function useGateHImportHistory(limit: number = 20) {
  return useQuery({
    queryKey: ["gate-h", "import-history", limit],
    queryFn: () => getImportHistory(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Mutation hook for importing actions
 */
export function useGateHImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importActions,
    onSuccess: (result: ImportResult) => {
      if (result.status === "completed" && result.error_count === 0) {
        toast({
          title: "تم الاستيراد بنجاح",
          description: `تم استيراد ${result.success_count} إجراء من أصل ${result.total_rows}`,
        });
      } else if (result.success_count > 0) {
        toast({
          title: "تحذير",
          description: `تم استيراد ${result.success_count} إجراء، وفشل ${result.error_count} إجراء`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل الاستيراد",
          description: "فشل الاستيراد بالكامل",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["gate-h", "actions"] });
      queryClient.invalidateQueries({ queryKey: ["gate-h", "import-history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الاستيراد",
        description: error.message || "فشل استيراد الإجراءات",
        variant: "destructive",
      });
    },
  });
}
