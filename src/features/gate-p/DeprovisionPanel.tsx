import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/core/components/ui/badge";
import { Alert, AlertDescription } from "@/core/components/ui/alert";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface DeprovisionStep {
  id: string;
  tenant_id: string;
  step_code: string;
  sort_order: number;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface DeprovisionPanelProps {
  tenantId: string;
}

export function DeprovisionPanel({ tenantId }: DeprovisionPanelProps) {
  const { data: steps, isLoading } = useQuery({
    queryKey: ['deprovision-steps', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_deprovision_jobs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as DeprovisionStep[];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'RUNNING':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE':
        return <Badge className="bg-green-500">Done</Badge>;
      case 'RUNNING':
        return <Badge className="bg-blue-500">Running</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading deprovision steps...</div>;
  }

  if (!steps || steps.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No deprovision process has been initiated for this tenant yet.
        </AlertDescription>
      </Alert>
    );
  }

  const completedSteps = steps.filter(s => s.status === 'DONE').length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Deprovision Progress</p>
          <span className="text-sm text-muted-foreground">
            {completedSteps} / {totalSteps} steps completed
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="border rounded-lg p-4 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getStatusIcon(step.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Step {index + 1}: {step.step_code}
                    </span>
                    {getStatusBadge(step.status)}
                  </div>
                  {step.started_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Started: {format(new Date(step.started_at), 'PPp')}
                    </p>
                  )}
                  {step.completed_at && (
                    <p className="text-xs text-muted-foreground">
                      Completed: {format(new Date(step.completed_at), 'PPp')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {step.error_message && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">
                  {step.error_message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
