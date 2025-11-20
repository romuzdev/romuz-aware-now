import { useState } from "react";
import { useRecommendations, useGenerateRecommendations } from "@/features/gatek/hooks/useRecommendations";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import { Sparkles, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function GateKRecommendations() {
  const [selectedMonth, setSelectedMonth] = useState<string>();
  const { data, isLoading, error } = useRecommendations({
    month: selectedMonth,
  });
  const generateMutation = useGenerateRecommendations();

  const handleGenerate = async () => {
    await generateMutation.mutateAsync({
      month: selectedMonth,
      limit: 1000,
    });
  };

  const impactColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gate-K — التوصيات</h1>
            <p className="text-muted-foreground mt-1">التوصيات المولّدة تلقائيًا بناءً على تحليل RCA</p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {generateMutation.isPending ? "جاري التوليد..." : "توليد توصيات جديدة"}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">خطأ في تحميل البيانات: {error.message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.map((reco) => (
              <Card key={reco.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{reco.title_ar}</CardTitle>
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className={impactColors[reco.impact_level as keyof typeof impactColors]}
                      >
                        {reco.impact_level === "high" ? "تأثير عالي" : 
                         reco.impact_level === "medium" ? "تأثير متوسط" : "تأثير منخفض"}
                      </Badge>
                      <Badge variant="secondary">{reco.effort_estimate}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span>KPI: {reco.kpi_key}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(reco.month), "MMMM yyyy", { locale: ar })}
                    </span>
                    <span>•</span>
                    <span>{reco.dim_key}: {reco.dim_value}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{reco.body_ar}</p>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="outline">نوع الإجراء: {reco.action_type_code}</Badge>
                    <Badge variant="outline">الحالة: {reco.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && data?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-muted-foreground">لا توجد توصيات حاليًا</p>
              <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                <Sparkles className="h-4 w-4 ml-2" />
                توليد توصيات
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
