import { useQuery } from "@tanstack/react-query";
import { getKpiMonthlyFlags } from "@/modules/analytics/integration";
import type { TrendWindow } from "@/modules/analytics";

export function useKpiMonthlyFlags(params: {
  kpi_key?: string;
  trend_window?: TrendWindow;
  flag?: string;
  from_month?: string;
  to_month?: string;
}) {
  return useQuery({
    queryKey: ["gatek", "flags", "monthly", params],
    queryFn: () => getKpiMonthlyFlags(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
