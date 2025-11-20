import { useState } from "react";
import { useQuarterlyInsights, useGenerateQuarterlyInsights } from "@/features/gatek/hooks/useQuarterlyInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export default function GateKQuarterly() {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(currentQuarter);

  const { data, isLoading, error, refetch } = useQuarterlyInsights({ year, quarter });
  const generateMutation = useGenerateQuarterlyInsights();

  const handleGenerate = async () => {
    await generateMutation.mutateAsync({ year, quarter, limit: 100 });
    await refetch();
  };

  const insight = data?.[0];

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gate-K — رؤى ربع سنوية</h1>
            <p className="text-muted-foreground mt-1">ملخص الأداء والمبادرات المقترحة</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>اختيار الربع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Label htmlFor="year">السنة</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min={2020}
                  max={2030}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="quarter">الربع</Label>
                <Input
                  id="quarter"
                  type="number"
                  value={quarter}
                  onChange={(e) => setQuarter(parseInt(e.target.value))}
                  min={1}
                  max={4}
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generateMutation.isPending ? "جاري التوليد..." : "توليد رؤى"}
              </Button>
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
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : insight ? (
          <div className="space-y-6">
            {/* KPIs Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  ملخص مؤشرات الأداء - Q{insight.quarter} {insight.year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(insight.kpis_summary).map(([kpiKey, kpiData]: [string, any]) => {
                    const StatusIcon = 
                      kpiData.status === "alert" ? AlertTriangle :
                      kpiData.status === "warn" ? AlertTriangle :
                      CheckCircle;
                    
                    const statusColor =
                      kpiData.status === "alert" ? "text-red-600" :
                      kpiData.status === "warn" ? "text-yellow-600" :
                      "text-green-600";

                    return (
                      <Card key={kpiKey}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{kpiKey}</p>
                              <p className="text-2xl font-bold">
                                {kpiData.quarter_avg_value?.toFixed(3) ?? "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                التغيير: {kpiData.quarter_delta_avg?.toFixed(2) ?? "—"}%
                              </p>
                            </div>
                            <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Initiatives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  أهم 3 مبادرات مقترحة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insight.top_initiatives.slice(0, 3).map((initiative: any, idx: number) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                            #{initiative.rank}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-lg">{initiative.title_ar}</h4>
                              <Badge variant="secondary">
                                نقاط الأولوية: {initiative.priority_score?.toFixed(2) ?? "—"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {initiative.body_ar}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">KPI: {initiative.kpi_key}</Badge>
                              <Badge variant="outline">{initiative.dim_key}: {initiative.dim_value}</Badge>
                              <Badge variant="outline">إجراء: {initiative.action_type_code}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* All Initiatives */}
            {insight.top_initiatives.length > 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>جميع المبادرات ({insight.top_initiatives.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                      {JSON.stringify(insight.top_initiatives, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-muted-foreground">لا توجد رؤى ربع سنوية بعد</p>
              <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                <Sparkles className="h-4 w-4 ml-2" />
                توليد رؤى للربع Q{quarter} {year}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
