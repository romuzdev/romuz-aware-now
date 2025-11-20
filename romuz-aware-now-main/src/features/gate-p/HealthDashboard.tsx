import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tenant, fetchHealthStatus } from "@/core/tenancy/integration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import { Button } from "@/core/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { CheckCircle2, AlertTriangle, AlertCircle, Activity, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePlatformAdminProtection } from "@/core/hooks/utils/useRoleProtection";
import { RoleRequiredDialog } from "@/core/components/shared/RoleRequiredDialog";
import { logHealthCheckTrigger } from "@/lib/audit/gateP-audit";

interface HealthDashboardProps {
  tenants: Tenant[];
}

export function HealthDashboard({ tenants }: HealthDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const queryClient = useQueryClient();
  const roleProtection = usePlatformAdminProtection();

  const healthQueries = useQuery({
    queryKey: ['all-health-statuses'],
    queryFn: async () => {
      const results = await Promise.allSettled(
        tenants.map(t => fetchHealthStatus(t.id))
      );
      return results.map((r, i) => ({
        tenant: tenants[i],
        status: r.status === 'fulfilled' ? r.value : null,
      }));
    },
    enabled: tenants.length > 0,
  });

  const runHealthCheckMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('fn_job_check_tenant_health');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-health-statuses'] });
      toast.success('تم تشغيل فحص الصحة بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل فحص الصحة: ' + error.message);
    },
  });

  const handleRefreshClick = async () => {
    await roleProtection.executeProtectedAction(async () => {
      try {
        await logHealthCheckTrigger({
          tenant_count: tenants.length,
          trigger_method: 'manual',
        });
        runHealthCheckMutation.mutate();
      } catch (error) {
        console.error('Failed to log health check trigger:', error);
        runHealthCheckMutation.mutate(); // Still proceed with the check
      }
    });
  };

  const getHealthIcon = (status: string | undefined) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'UNHEALTHY':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getHealthBadge = (status: string | undefined) => {
    const variants: Record<string, any> = {
      HEALTHY: { variant: "default", className: "bg-green-500" },
      WARNING: { variant: "secondary", className: "bg-yellow-500" },
      UNHEALTHY: { variant: "destructive", className: "" },
    };
    const config = variants[status || ''] || { variant: "outline", className: "" };
    return <Badge variant={config.variant} className={config.className}>{status || 'Unknown'}</Badge>;
  };

  if (healthQueries.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  const healthData = healthQueries.data || [];
  
  const filteredData = healthData.filter(h => {
    if (activeTab === "all") return true;
    if (activeTab === "healthy") return h.status?.health_status === "HEALTHY";
    if (activeTab === "warning") return h.status?.health_status === "WARNING";
    if (activeTab === "unhealthy") return h.status?.health_status === "UNHEALTHY";
    return true;
  });

  const warningCount = healthData.filter(h => h.status?.health_status === 'WARNING').length;
  const healthyCount = healthData.filter(h => h.status?.health_status === 'HEALTHY').length;
  const unhealthyCount = healthData.filter(h => h.status?.health_status === 'UNHEALTHY').length;

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">لوحة الصحة</h2>
          <p className="text-muted-foreground">مراقبة حالة جميع المؤسسات</p>
        </div>
        <Button
          onClick={handleRefreshClick}
          disabled={runHealthCheckMutation.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${runHealthCheckMutation.isPending ? 'animate-spin' : ''}`} />
          {runHealthCheckMutation.isPending ? 'جاري الفحص...' : 'تشغيل فحص صحي'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {healthyCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((healthyCount / healthData.length) * 100).toFixed(1)}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {warningCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              يحتاج إلى انتباه
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unhealthy</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {unhealthyCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              يتطلب تدخل فوري
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            الكل ({healthData.length})
          </TabsTrigger>
          <TabsTrigger value="healthy">
            سليمة ({healthyCount})
          </TabsTrigger>
          <TabsTrigger value="warning" className="text-yellow-600">
            تحذيرات ({warningCount})
          </TabsTrigger>
          <TabsTrigger value="unhealthy" className="text-red-600">
            غير صحية ({unhealthyCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredData.map(({ tenant, status }) => (
          <Card key={tenant.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{tenant.name}</CardTitle>
                  <CardDescription>{tenant.domain || 'No domain'}</CardDescription>
                </div>
                {getHealthIcon(status?.health_status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Health Status</span>
                {getHealthBadge(status?.health_status)}
              </div>

              {status?.drift_flag && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">انحراف مكتشف</span>
                  <Badge variant="outline" className="text-yellow-600">
                    {status.drift_flag}
                  </Badge>
                </div>
              )}

              {status?.last_checked_at && (
                <div className="text-xs text-muted-foreground">
                  آخر فحص: {format(new Date(status.last_checked_at), 'PPp')}
                </div>
              )}

              {status?.details_json && status.health_status === 'WARNING' && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-2">تفاصيل التحذير:</div>
                  <div className="text-xs bg-muted/50 p-2 rounded font-mono">
                    {JSON.stringify(status.details_json, null, 2)}
                  </div>
                </div>
              )}

              {!status && (
                <div className="text-xs text-muted-foreground">
                  لا توجد بيانات فحص صحي متاحة
                </div>
              )}
            </CardContent>
          </Card>
            ))}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مؤسسات بهذه الحالة الصحية</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <RoleRequiredDialog
        open={roleProtection.showDialog}
        onOpenChange={roleProtection.setShowDialog}
        requiredRole="platform_admin"
        title="تأكيد فحص الصحة"
        description="هذا الإجراء يتطلب دور platform_admin. الرجاء الاتصال بمدير النظام إذا كنت تعتقد أنه يجب أن يكون لديك هذه الصلاحية."
      />
    </div>
  );
}
