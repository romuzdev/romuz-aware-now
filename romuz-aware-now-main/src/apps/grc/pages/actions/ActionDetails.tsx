import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Activity } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useGateHActionById, useGateHActionUpdates } from "@/modules/actions";
import { ActionHeader } from "@/core/components/gateh";
import { ActionTimeline } from "@/core/components/gateh";
import { StatusTracker } from "@/core/components/gateh";

export default function ActionDetails() {
  const { actionId } = useParams<{ actionId: string }>();
  const navigate = useNavigate();
  
  const { data: action, isLoading: actionLoading } = useGateHActionById(actionId ?? null);
  const { data: updates = [], isLoading: updatesLoading } = useGateHActionUpdates(actionId ?? null);

  if (!actionId) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <p className="text-destructive">معرّف الإجراء مفقود</p>
        </Card>
      </div>
    );
  }

  if (actionLoading || updatesLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <p className="text-destructive">الإجراء غير موجود</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/grc/actions')}
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للقائمة
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/grc/actions")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">تفاصيل الإجراء</h1>
        </div>
        <Button
          onClick={() => navigate(`/grc/actions/${actionId}/tracker`)}
          variant="outline"
        >
          <Activity className="h-4 w-4 ml-2" />
          متتبع خطة العمل
        </Button>
      </div>

      {/* Action Header */}
      <ActionHeader action={action} />

      {/* Status Tracker */}
      <StatusTracker action={action} />

      {/* Timeline */}
      <ActionTimeline action={action} updates={updates} />
    </div>
  );
}
