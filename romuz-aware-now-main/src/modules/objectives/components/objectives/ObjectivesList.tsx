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
import { Objective } from "@/modules/objectives";
import { Eye } from "lucide-react";

interface ObjectivesListProps {
  objectives: Objective[];
}

export function ObjectivesList({ objectives }: ObjectivesListProps) {
  const navigate = useNavigate();

  if (objectives.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">لا توجد أهداف استراتيجية حالياً</p>
      </div>
    );
  }

  const statusLabels: Record<Objective["status"], string> = {
    active: "نشط",
    archived: "مؤرشف",
    on_hold: "معلق",
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الرمز</TableHead>
          <TableHead>العنوان</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead className="text-left">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {objectives.map((objective) => (
          <TableRow key={objective.id}>
            <TableCell className="font-medium">{objective.code}</TableCell>
            <TableCell>{objective.title}</TableCell>
            <TableCell>
              <Badge variant={objective.status === "active" ? "default" : "secondary"}>
                {statusLabels[objective.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-left">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/admin/objectives/${objective.id}`)}
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
