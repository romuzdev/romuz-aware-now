import { useState, useEffect } from "react";
import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Calendar, Clock, AlertCircle, CheckCircle2, XCircle, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useScheduledTransitionNotifications } from "@/core/hooks/utils/useScheduledTransitionNotifications";
import {
  fetchScheduledTransitions,
  cancelScheduledTransition,
  type ScheduledTransition,
  fetchTenants,
  type Tenant,
} from "@/core/tenancy/integration";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { ScheduleTransitionForm } from "./ScheduleTransitionForm";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-500" },
  executed: { label: "Executed", icon: CheckCircle2, color: "bg-green-500" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-gray-500" },
  failed: { label: "Failed", icon: AlertCircle, color: "bg-red-500" },
};

export function ScheduledTransitions() {
  const [transitions, setTransitions] = useState<ScheduledTransition[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  // Enable automatic notifications for all scheduled transitions
  useScheduledTransitionNotifications();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [transitionsData, tenantsData] = await Promise.all([
        fetchScheduledTransitions(),
        fetchTenants(),
      ]);
      setTransitions(transitionsData);
      setTenants(tenantsData);
    } catch (error: any) {
      toast({
        title: "Error Loading Data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async (transitionId: string) => {
    try {
      await cancelScheduledTransition(transitionId);
      toast({
        title: "Cancelled Successfully",
        description: "The scheduled transition has been cancelled",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Cancellation Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTenantName = (tenantId: string) => {
    return tenants.find((t) => t.id === tenantId)?.name || tenantId;
  };

  const filteredTransitions = transitions.filter((t) =>
    selectedStatus === "all" ? true : t.status === selectedStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Transitions</h2>
          <p className="text-muted-foreground">
            Manage automatic scheduled transitions for tenants
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule New Transition
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedStatus("all")}
        >
          All ({transitions.length})
        </Button>
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = transitions.filter((t) => t.status === status).length;
          return (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(status)}
            >
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Transitions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Transition</TableHead>
              <TableHead>Scheduled Time</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredTransitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No scheduled transitions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransitions.map((transition) => {
                const StatusIcon = statusConfig[transition.status].icon;
                return (
                  <TableRow key={transition.id}>
                    <TableCell className="font-medium">
                      {getTenantName(transition.tenant_id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{transition.from_state}</Badge>
                        <span>→</span>
                        <Badge variant="outline">{transition.to_state}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(new Date(transition.scheduled_at), "PPp")}
                        </span>
                        {transition.executed_at && (
                          <span className="text-xs text-muted-foreground">
                            Executed: {format(new Date(transition.executed_at), "PPp")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{transition.reason || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusConfig[transition.status].color} text-white`}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig[transition.status].label}
                      </Badge>
                      {transition.error_message && (
                        <p className="text-xs text-destructive mt-1">
                          {transition.error_message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {transition.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(transition.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Automatic Transition</DialogTitle>
            <DialogDescription>
              Select tenant, target state, and schedule time for automatic transition
            </DialogDescription>
          </DialogHeader>
          <ScheduleTransitionForm
            tenants={tenants}
            onSuccess={() => {
              setShowDialog(false);
              loadData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
