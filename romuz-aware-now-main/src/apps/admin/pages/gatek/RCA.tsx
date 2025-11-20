import { useState } from "react";
import { useRcaTopContributors } from "@/features/gatek/hooks/useRcaContributors";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Button } from "@/core/components/ui/button";
import { Skeleton } from "@/core/components/ui/skeleton";
import { Search } from "lucide-react";

export default function GateKRCA() {
  const [kpiKey, setKpiKey] = useState("kpi_completion_rate");
  const [month, setMonth] = useState("2024-09-01");
  const [searchParams, setSearchParams] = useState({ kpi_key: "kpi_completion_rate", month: "2024-09-01" });

  const { data, isLoading, error } = useRcaTopContributors({
    kpi_key: searchParams.kpi_key,
    month: searchParams.month,
    top_n: 10,
  });

  const handleSearch = () => {
    setSearchParams({ kpi_key: kpiKey, month });
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gate-K — تحليل السبب الجذري (RCA)</h1>
          <p className="text-muted-foreground mt-1">أهم المساهمين في تغيرات KPI</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>معايير البحث</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="kpi_key">مفتاح KPI</Label>
                <Input
                  id="kpi_key"
                  value={kpiKey}
                  onChange={(e) => setKpiKey(e.target.value)}
                  placeholder="kpi_completion_rate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">الشهر (YYYY-MM-DD)</Label>
                <Input
                  id="month"
                  type="date"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full">
                  <Search className="h-4 w-4 ml-2" />
                  بحث
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">خطأ في تحميل البيانات: {error.message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="py-6">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.map((contributor, i) => (
              <Card key={i}>
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                          #{contributor.rnk}
                        </span>
                        <div>
                          <p className="font-semibold text-lg">
                            {contributor.dim_key}: {contributor.dim_value}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            KPI: {contributor.kpi_key} • شهر: {contributor.month}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">التغيير: </span>
                        <span className="font-medium">{contributor.delta_pct?.toFixed(3) ?? "—"}%</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">نقاط المساهمة: </span>
                        <span className="font-medium">{contributor.contribution_score?.toFixed(3) ?? "—"}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">نسبة المشاركة: </span>
                        <span className="font-medium">{contributor.share_ratio?.toFixed(3) ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && data?.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">لا توجد بيانات متاحة للمعايير المحددة</p>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
