import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tenant, triggerTenantEvent } from "@/core/tenancy/integration";
import { Button } from "@/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/ui/alert-dialog";
import { MoreVertical, PlayCircle, PauseCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { usePlatformAdminProtection } from "@/core/hooks/utils/useRoleProtection";
import { RoleRequiredDialog } from "@/core/components/shared/RoleRequiredDialog";
import { logTenantAction } from "@/lib/audit/gateP-audit";

interface TenantActionsProps {
  tenant: Tenant;
}

export function TenantActions({ tenant }: TenantActionsProps) {
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showDeprovisionDialog, setShowDeprovisionDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'suspend' | 'reactivate' | 'deprovision' | null>(null);
  const queryClient = useQueryClient();
  const roleProtection = usePlatformAdminProtection();

  const triggerEventMutation = useMutation({
    mutationFn: ({ event, payload }: { event: string; payload?: any }) =>
      triggerTenantEvent(tenant.id, event, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-p-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['lifecycle-log', tenant.id] });
      toast.success('Action completed successfully');
    },
    onError: (error: any) => {
      toast.error(`Action failed: ${error.message}`);
    },
  });

  const handleSuspend = async () => {
    await roleProtection.executeProtectedAction(async () => {
      await logTenantAction(tenant.id, tenant.name, 'tenant_suspend');
      triggerEventMutation.mutate({ event: 'BILLING_SUSPEND' });
      setShowSuspendDialog(false);
      setPendingAction(null);
    });
  };

  const handleReactivate = async () => {
    await roleProtection.executeProtectedAction(async () => {
      await logTenantAction(tenant.id, tenant.name, 'tenant_reactivate');
      triggerEventMutation.mutate({ event: 'BILLING_REACTIVATE' });
      setShowReactivateDialog(false);
      setPendingAction(null);
    });
  };

  const handleDeprovision = async () => {
    await roleProtection.executeProtectedAction(async () => {
      await logTenantAction(tenant.id, tenant.name, 'tenant_deprovision');
      triggerEventMutation.mutate({ event: 'EXTERNAL_DEPROVISION' });
      setShowDeprovisionDialog(false);
      setPendingAction(null);
    });
  };

  const canSuspend = tenant.status === 'ACTIVE';
  const canReactivate = tenant.status === 'SUSPENDED';
  const canDeprovision = ['ACTIVE', 'SUSPENDED'].includes(tenant.status);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            <MoreVertical className="h-4 w-4 mr-2" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Lifecycle Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!canReactivate}
            onClick={() => setShowReactivateDialog(true)}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Reactivate Tenant
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!canSuspend}
            onClick={() => setShowSuspendDialog(true)}
          >
            <PauseCircle className="h-4 w-4 mr-2" />
            Suspend Tenant
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!canDeprovision}
            onClick={() => setShowDeprovisionDialog(true)}
            className="text-destructive"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Start Deprovision
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend <strong>{tenant.name}</strong> and prevent access. You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend}>
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Dialog */}
      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reactivate <strong>{tenant.name}</strong> and restore full access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReactivate}>
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deprovision Dialog */}
      <AlertDialog open={showDeprovisionDialog} onOpenChange={setShowDeprovisionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Deprovision?</AlertDialogTitle>
            <AlertDialogDescription>
              This will start the deprovision process for <strong>{tenant.name}</strong>. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeprovision} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Start Deprovision
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RoleRequiredDialog
        open={roleProtection.showDialog}
        onOpenChange={roleProtection.setShowDialog}
        requiredRole="platform_admin"
        title="تأكيد العملية"
        description="هذا الإجراء يتطلب دور platform_admin. الرجاء الاتصال بمدير النظام إذا كنت تعتقد أنه يجب أن يكون لديك هذه الصلاحية."
      />
    </>
  );
}
