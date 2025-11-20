import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tenant, fetchLifecycleLog, fetchHealthStatus, fetchAutomationActions } from "@/core/tenancy/integration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { TenantActions } from "./TenantActions";
import { LifecycleTimeline } from "./LifecycleTimeline";
import { TenantHealthPanel } from "./TenantHealthPanel";
import { ChannelsManagement } from "./ChannelsManagement";
import { DeprovisionPanel } from "./DeprovisionPanel";

interface TenantDetailTabsProps {
  tenant: Tenant;
}

export function TenantDetailTabs({ tenant }: TenantDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'state' | 'health' | 'log' | 'channels' | 'deprovision'>('state');
  const queryClient = useQueryClient();

  const { data: lifecycleLog, isLoading: isLoadingLog } = useQuery({
    queryKey: ['lifecycle-log', tenant.id],
    queryFn: () => fetchLifecycleLog(tenant.id),
  });

  const { data: healthStatus } = useQuery({
    queryKey: ['health-status', tenant.id],
    queryFn: () => fetchHealthStatus(tenant.id),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant Management</CardTitle>
        <CardDescription>Manage lifecycle, health, and configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="state">State</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="log">Log</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="deprovision">Deprovision</TabsTrigger>
          </TabsList>

          <TabsContent value="state" className="space-y-4 mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Manage lifecycle transitions safely with state validation.
              </p>
              <TenantActions tenant={tenant} />
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-4 mt-4">
            <TenantHealthPanel tenant={tenant} healthStatus={healthStatus} />
          </TabsContent>

          <TabsContent value="log" className="space-y-4 mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Complete history of state transitions and lifecycle events.
              </p>
              <LifecycleTimeline
                events={lifecycleLog || []}
                isLoading={isLoadingLog}
              />
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4 mt-4">
            <ChannelsManagement tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="deprovision" className="space-y-4 mt-4">
            <DeprovisionPanel tenantId={tenant.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
