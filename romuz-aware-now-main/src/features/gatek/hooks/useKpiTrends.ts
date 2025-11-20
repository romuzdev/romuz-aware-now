import { useQuery } from "@tanstack/react-query";
import {
  getKpiTrendsWeekly,
  getKpiTrendsMonthly,
  getKpiTrendsQuarterly,
} from "@/modules/analytics/integration";
import type { TrendWindow } from "@/modules/analytics";

export function useKpiTrendsWeekly(params: {
  kpi_key?: string;
  trend_window?: TrendWindow;
  from_week?: string;
  to_week?: string;
}) {
  return useQuery({
    queryKey: ["gatek", "trends", "weekly", params],
    queryFn: () => getKpiTrendsWeekly(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useKpiTrendsMonthly(params: {
  kpi_key?: string;
  trend_window?: TrendWindow;
  from_month?: string;
  to_month?: string;
}) {
  return useQuery({
    queryKey: ["gatek", "trends", "monthly", params],
    queryFn: () => getKpiTrendsMonthly(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useKpiTrendsQuarterly(params: {
  kpi_key?: string;
  trend_window?: TrendWindow;
  from_quarter?: string;
  to_quarter?: string;
}) {
  return useQuery({
    queryKey: ["gatek", "trends", "quarterly", params],
    queryFn: () => getKpiTrendsQuarterly(params),
    staleTime: 5 * 60 * 1000,
  });
}
