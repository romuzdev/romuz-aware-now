import { useState } from "react";
import { useKpiMonthlyFlags } from "@/features/gatek/hooks/useKpiFlags";
import { FlagBadge } from "@/features/gatek/components/FlagBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Skeleton } from "@/core/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TrendWindow } from "@/modules/analytics";

export default function GateKOverview() {
  const [trendWindow, setTrendWindow] = useState<TrendWindow>("M6");
  const { data, isLoading, error } = useKpiMonthlyFlags({ trend_window: trendWindow });

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gate-K — نظرة عامة</h1>
            <p className="text-muted-foreground mt-1">مؤشرات الأداء والتنبيهات الشهرية</p>
          </div>
          <Select value={trendWindow} onValueChange={(v) => setTrendWindow(v as TrendWindow)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="نافذة الاتجاه" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون نافذة</SelectItem>
              <SelectItem value="W12">12 أسبوع</SelectItem>
              <SelectItem value="M6">6 أشهر</SelectItem>
              <SelectItem value="Q4">4 أرباع</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">خطأ في تحميل البيانات: {error.message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.slice(0, 12).map((row, i) => {
              const deltaValue = row.delta_pct ?? 0;
              const TrendIcon = deltaValue > 0 ? TrendingUp : deltaValue < 0 ? TrendingDown : Minus;
              const trendColor = deltaValue > 0 ? "text-green-600" : deltaValue < 0 ? "text-red-600" : "text-muted-foreground";

              return (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{row.kpi_key}</CardTitle>
                    <FlagBadge flag={row.flag} />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">الشهر:</span>
                        <span className="text-sm font-medium">{row.month}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">القيمة:</span>
                        <span className="text-sm font-medium">{row.avg_value?.toFixed(3) ?? "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">التغيير %:</span>
                        <div className={`flex items-center gap-1 ${trendColor}`}>
                          <TrendIcon className="h-3 w-3" />
                          <span className="text-sm font-medium">{deltaValue.toFixed(2)}%</span>
                        </div>
                      </div>
                      {row.zscore !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Z-Score:</span>
                          <span className="text-sm font-medium">{row.zscore.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && data?.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">لا توجد بيانات متاحة</p>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
