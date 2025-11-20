import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Progress } from "@/core/components/ui/progress";
import { Badge } from "@/core/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { GateHActionItem } from "@/modules/actions";

interface StatusTrackerProps {
  action: GateHActionItem;
}

export function StatusTracker({ action }: StatusTrackerProps) {
  const statusSteps = [
    { key: "new", label: "جديد", order: 1 },
    { key: "in_progress", label: "قيد التنفيذ", order: 2 },
    { key: "verify", label: "تم التحقق", order: 3 },
    { key: "closed", label: "مغلق", order: 4 },
  ];

  const currentStep = statusSteps.find((s) => s.key === action.status);
  const currentOrder = currentStep?.order ?? 1;

  const progressValue = ((currentOrder - 1) / (statusSteps.length - 1)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">تتبع الحالة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">التقدم</span>
            <span className="font-medium">{Math.round(progressValue)}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Status Steps */}
        <div className="relative">
          <div className="absolute top-5 right-5 left-5 h-0.5 bg-border" />
          <div className="relative flex justify-between">
            {statusSteps.map((step) => {
              const isCompleted = step.order < currentOrder;
              const isCurrent = step.key === action.status;
              const isBlocked = action.status === "blocked" && step.order > currentOrder;

              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center gap-2 relative z-10"
                >
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 
                      ${
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-background border-primary text-primary"
                          : isBlocked
                          ? "bg-background border-destructive text-destructive"
                          : "bg-background border-muted text-muted-foreground"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isCurrent ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs text-center max-w-[80px] ${
                      isCurrent ? "font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blocked Status */}
        {action.status === "blocked" && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">محظور</Badge>
              <span className="text-sm">هذا الإجراء محظور حالياً ويحتاج لمراجعة</span>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
