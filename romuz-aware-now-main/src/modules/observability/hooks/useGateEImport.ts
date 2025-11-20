// ============================================================================
// Gate-E Hooks: Import Alert Rules (D1 Standard)
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  importAlertRules,
  getAlertImportHistory,
} from "@/modules/observability/integration";
import { toast } from "@/hooks/use-toast";
import type { ImportAlertRulesInput, ImportAlertResult } from "../types";

/**
 * Query hook for alert rules import history
 */
export function useGateEImportHistory(limit: number = 20) {
  return useQuery({
    queryKey: ["gate-e", "import-history", limit],
    queryFn: () => getAlertImportHistory(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Mutation hook for importing alert rules
 */
export function useGateEImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importAlertRules,
    onSuccess: (result: ImportAlertResult) => {
      if (result.status === "completed" && result.error_count === 0) {
        toast({
          title: "تم الاستيراد بنجاح",
          description: `تم استيراد ${result.success_count} قاعدة من أصل ${result.total_rows}`,
        });
      } else if (result.success_count > 0) {
        toast({
          title: "تحذير",
          description: `تم استيراد ${result.success_count} قاعدة، وفشل ${result.error_count} قاعدة`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل الاستيراد",
          description: "فشل الاستيراد بالكامل",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["gate-e", "alert-rules"] });
      queryClient.invalidateQueries({ queryKey: ["gate-e", "import-history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الاستيراد",
        description: error.message || "فشل استيراد القواعد",
        variant: "destructive",
      });
    },
  });
}
