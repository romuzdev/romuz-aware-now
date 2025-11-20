import { useNavigate } from "react-router-dom";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table";
import { KPI } from "@/modules/objectives";
import { Eye, TrendingUp, TrendingDown } from "lucide-react";

interface KPIsListProps {
  kpis: KPI[];
}

export function KPIsList({ kpis }: KPIsListProps) {
  const navigate = useNavigate();

  if (kpis.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">لا توجد مؤشرات أداء حالياً</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الرمز</TableHead>
          <TableHead>العنوان</TableHead>
          <TableHead>وحدة القياس</TableHead>
          <TableHead>الاتجاه</TableHead>
          <TableHead className="text-left">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {kpis.map((kpi) => (
          <TableRow key={kpi.id}>
            <TableCell className="font-medium">{kpi.code}</TableCell>
            <TableCell>{kpi.title}</TableCell>
            <TableCell>{kpi.unit}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {kpi.direction === "up" ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm">أعلى أفضل</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm">أقل أفضل</span>
                  </>
                )}
              </div>
            </TableCell>
            <TableCell className="text-left">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/admin/kpis/${kpi.id}`)}
            >
                <Eye className="h-4 w-4 ml-2" />
                عرض
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
