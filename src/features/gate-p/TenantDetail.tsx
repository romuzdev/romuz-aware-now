import { Tenant } from "@/core/tenancy/integration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { TenantDetailTabs } from "./TenantDetailTabs";
import { TenantScheduledTransitionsCard } from "./TenantScheduledTransitionsCard";
import { useScheduledTransitionNotifications } from "@/core/hooks/utils/useScheduledTransitionNotifications";
import { setDefaultTenant } from "@/core/tenancy";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface TenantDetailProps {
  tenant: Tenant;
}

export function TenantDetail({ tenant }: TenantDetailProps) {
  // Enable automatic notifications for scheduled transitions
  useScheduledTransitionNotifications(tenant.id);

  const queryClient = useQueryClient();

  const setDefaultMutation = useMutation({
    mutationFn: (tenantId: string) => setDefaultTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-p-tenants'] });
      toast.success('تم تعيين المؤسسة كافتراضية بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل تعيين المؤسسة الافتراضية: ' + error.message);
    },
  });

  const handleSetDefault = () => {
    if (tenant.status !== 'ACTIVE') {
      toast.error('يجب أن تكون المؤسسة نشطة (ACTIVE) لتعيينها كافتراضية');
      return;
    }
    setDefaultMutation.mutate(tenant.id);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tenant Overview</CardTitle>
              <CardDescription>{tenant.name}</CardDescription>
            </div>
            {tenant.is_default ? (
              <Badge variant="default" className="gap-1">
                <Star className="h-3 w-3" />
                المؤسسة الافتراضية
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetDefault}
                disabled={setDefaultMutation.isPending || tenant.status !== 'ACTIVE'}
                className="gap-2"
              >
                <Star className="h-4 w-4" />
                تعيين كافتراضي
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {tenant.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Domain</span>
              <span className="text-sm font-mono">{tenant.domain || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tenant ID</span>
              <span className="text-sm font-mono text-xs">{tenant.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">{format(new Date(tenant.created_at), 'PPp')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <TenantScheduledTransitionsCard tenantId={tenant.id} tenantName={tenant.name} />

      <TenantDetailTabs tenant={tenant} />
    </div>
  );
}
