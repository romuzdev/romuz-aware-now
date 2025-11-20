import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar, AlertCircle, User, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Separator } from "@/core/components/ui/separator";
import type { GateHActionItem } from "@/modules/actions";

interface ActionHeaderProps {
  action: GateHActionItem;
}

export function ActionHeader({ action }: ActionHeaderProps) {
  const priorityColors = {
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const statusColors = {
    new: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    blocked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    verify: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-2xl">{action.title_ar}</CardTitle>
            <p className="text-muted-foreground">{action.desc_ar}</p>
          </div>
          <div className="flex gap-2">
            <Badge className={priorityColors[action.priority]}>
              {action.priority === "low" && "منخفضة"}
              {action.priority === "medium" && "متوسطة"}
              {action.priority === "high" && "عالية"}
              {action.priority === "critical" && "حرجة"}
            </Badge>
            <Badge className={statusColors[action.status]}>
              {action.status === "new" && "جديد"}
              {action.status === "in_progress" && "قيد التنفيذ"}
              {action.status === "blocked" && "محظور"}
              {action.status === "verify" && "تم التحقق"}
              {action.status === "closed" && "مغلق"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Due Date */}
          {action.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">تاريخ الاستحقاق</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(action.due_date), "PPP", { locale: ar })}
                </p>
              </div>
            </div>
          )}

          {/* Assignee */}
          {action.assignee_display_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">المكلف</p>
                <p className="text-sm text-muted-foreground">{action.assignee_display_name}</p>
              </div>
            </div>
          )}

          {/* Effort */}
          {action.effort && (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">الجهد المقدر</p>
                <p className="text-sm text-muted-foreground">
                  {action.effort === "S" && "صغير"}
                  {action.effort === "M" && "متوسط"}
                  {action.effort === "L" && "كبير"}
                </p>
              </div>
            </div>
          )}

          {/* KPI */}
          {action.kpi_key && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">المؤشر</p>
                <p className="text-sm text-muted-foreground">{action.kpi_key}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {action.tags && action.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">الوسوم</p>
            <div className="flex flex-wrap gap-2">
              {action.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dimensions */}
        {(action.dim_key || action.dim_value) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">البُعد</p>
            <div className="flex gap-2">
              {action.dim_key && <Badge variant="outline">{action.dim_key}</Badge>}
              {action.dim_value && <Badge variant="outline">{action.dim_value}</Badge>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
