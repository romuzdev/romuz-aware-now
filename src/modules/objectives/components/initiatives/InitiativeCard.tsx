import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Progress } from "@/core/components/ui/progress";
import { Initiative } from "@/modules/objectives";
import { Calendar } from "lucide-react";

interface InitiativeCardProps {
  initiative: Initiative;
}

export function InitiativeCard({ initiative }: InitiativeCardProps) {
  const statusColors = {
    planned: "secondary",
    in_progress: "default",
    done: "default",
    cancelled: "secondary",
  } as const;

  const statusLabels = {
    planned: "مخطط",
    in_progress: "قيد التنفيذ",
    done: "مكتمل",
    cancelled: "ملغي",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{initiative.title}</CardTitle>
          <Badge variant={statusColors[initiative.status]}>
            {statusLabels[initiative.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(initiative.start_at || initiative.end_at) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {initiative.start_at && new Date(initiative.start_at).toLocaleDateString("ar-SA")}
              {initiative.start_at && initiative.end_at && " - "}
              {initiative.end_at && new Date(initiative.end_at).toLocaleDateString("ar-SA")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
