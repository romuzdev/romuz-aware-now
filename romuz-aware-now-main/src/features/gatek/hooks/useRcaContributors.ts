import { useQuery } from "@tanstack/react-query";
import { getRcaTopContributors } from "@/modules/analytics/integration";
import type { TrendWindow } from "@/modules/analytics";

export function useRcaTopContributors(params: {
  kpi_key: string;
  month: string;
  trend_window?: TrendWindow;
  dim_key?: string;
  top_n?: number;
}) {
  return useQuery({
    queryKey: ["gatek", "rca", "contributors", params],
    queryFn: () => getRcaTopContributors(params),
    enabled: Boolean(params.kpi_key && params.month),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
