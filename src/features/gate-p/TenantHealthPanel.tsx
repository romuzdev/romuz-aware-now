import { Tenant, TenantHealthStatus } from "@/core/tenancy/integration";
import { Alert, AlertDescription, AlertTitle } from "@/core/components/ui/alert";
import { Badge } from "@/core/components/ui/badge";
import { CheckCircle2, AlertTriangle, AlertCircle, Activity } from "lucide-react";
import { format } from "date-fns";

interface TenantHealthPanelProps {
  tenant: Tenant;
  healthStatus: TenantHealthStatus | null | undefined;
}

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
  switch (status) {
    case 'HEALTHY':
      return <Badge className="bg-green-500">Healthy</Badge>;
    case 'WARNING':
      return <Badge className="bg-yellow-500">Warning</Badge>;
    case 'UNHEALTHY':
      return <Badge variant="destructive">Unhealthy</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export function TenantHealthPanel({ tenant, healthStatus }: TenantHealthPanelProps) {
  if (!healthStatus) {
    return (
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertTitle>No Health Data</AlertTitle>
        <AlertDescription>
          No health check has been run for this tenant yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getHealthIcon(healthStatus.health_status)}
          <div>
            <p className="text-sm font-medium">Health Status</p>
            <p className="text-xs text-muted-foreground">
              Last checked: {format(new Date(healthStatus.last_checked_at), 'PPp')}
            </p>
          </div>
        </div>
        {getHealthBadge(healthStatus.health_status)}
      </div>

      {healthStatus.drift_flag && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Drift Detected</AlertTitle>
          <AlertDescription>
            <strong>{healthStatus.drift_flag}</strong> - Configuration drift has been detected.
          </AlertDescription>
        </Alert>
      )}

      {healthStatus.details_json && Object.keys(healthStatus.details_json).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Health Details</p>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[300px] border">
            {JSON.stringify(healthStatus.details_json, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
