import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { KPI } from "@/modules/objectives";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";

interface KPICardProps {
  kpi: KPI;
}

export function KPICard({ kpi }: KPICardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{kpi.title}</CardTitle>
          <Badge variant="outline">{kpi.code}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {kpi.direction === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm text-muted-foreground">{kpi.unit}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/admin/kpis/${kpi.id}`)}
        >
          <Eye className="h-4 w-4 ml-2" />
          عرض التفاصيل
        </Button>
      </CardContent>
    </Card>
  );
}
