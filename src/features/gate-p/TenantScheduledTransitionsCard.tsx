import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Calendar, Clock, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { fetchScheduledTransitions, cancelScheduledTransition, updateScheduledTransition, type ScheduledTransition } from "@/core/tenancy/integration";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { ScheduleTransitionForm } from "./ScheduleTransitionForm";
import { EditScheduledTransitionDialog } from "./EditScheduledTransitionDialog";
import { CountdownTimer } from "./CountdownTimer";

interface TenantScheduledTransitionsCardProps {
  tenantId: string;
  tenantName: string;
}

export function TenantScheduledTransitionsCard({ tenantId, tenantName }: TenantScheduledTransitionsCardProps) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransition, setEditingTransition] = useState<ScheduledTransition | null>(null);

  const { data: transitions, isLoading, refetch } = useQuery({
    queryKey: ['scheduled-transitions', tenantId],
    queryFn: () => fetchScheduledTransitions(tenantId, 'pending'),
  });

  const handleCancel = async (transitionId: string) => {
    try {
      await cancelScheduledTransition(transitionId);
      toast({
        title: "Cancelled Successfully",
        description: "The scheduled transition has been cancelled",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Cancellation Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Transitions
              </CardTitle>
              <CardDescription>
                Upcoming automatic transitions for this tenant
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowDialog(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Transition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : !transitions || transitions.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No upcoming scheduled transitions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transitions.map((transition) => (
                <div
                  key={transition.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{transition.from_state}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline">{transition.to_state}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(transition.scheduled_at), "PPp")}
                      </span>
                    </div>
                    <CountdownTimer targetDate={transition.scheduled_at} />
                    {transition.reason && (
                      <p className="text-xs text-muted-foreground">{transition.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTransition(transition)}
                      className="text-primary hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(transition.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Automatic Transition</DialogTitle>
            <DialogDescription>
              Schedule an automatic transition for tenant: {tenantName}
            </DialogDescription>
          </DialogHeader>
          <ScheduleTransitionForm
            tenants={[{ id: tenantId, name: tenantName } as any]}
            preselectedTenantId={tenantId}
            onSuccess={() => {
              setShowDialog(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      <EditScheduledTransitionDialog
        transition={editingTransition}
        onClose={() => setEditingTransition(null)}
        onSuccess={() => {
          setEditingTransition(null);
          refetch();
        }}
      />
    </>
  );
}
