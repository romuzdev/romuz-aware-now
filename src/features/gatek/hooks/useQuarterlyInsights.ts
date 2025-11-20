import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getQuarterlyInsights,
  generateQuarterlyInsights,
} from "@/modules/analytics/integration";
import { toast } from "sonner";

export function useQuarterlyInsights(params: { year: number; quarter: number }) {
  return useQuery({
    queryKey: ["gatek", "quarterly", "insights", params],
    queryFn: () => getQuarterlyInsights(params),
    enabled: Boolean(params.year && params.quarter),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useGenerateQuarterlyInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { year: number; quarter: number; limit?: number }) =>
      generateQuarterlyInsights(params),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["gatek", "quarterly"] });
      const message = result.created
        ? `تم توليد insights للربع ${result.quarter}/${result.year} (${result.kpis_count} KPIs, ${result.initiatives_count} مبادرات)`
        : `تم تحديث insights للربع ${result.quarter}/${result.year}`;
      toast.success(message);
    },
    onError: (error) => {
      toast.error(`فشل توليد Quarterly Insights: ${error.message}`);
    },
  });
}
