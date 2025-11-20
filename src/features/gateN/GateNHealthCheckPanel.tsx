/**
 * Gate-N Health Check Panel
 * Runs diagnostic checks and displays results
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/core/components/ui/alert';
import { Badge } from '@/core/components/ui/badge';
import { useGateNHealthCheck } from '@/lib/api/gateN';
import { AlertCircle, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import type { HealthCheckItem, HealthCheckStatus } from '@/lib/api/gateN';

function getStatusBadge(status: HealthCheckStatus) {
  switch (status) {
    case 'pass':
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Pass
        </Badge>
      );
    case 'warn':
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    case 'fail':
      return (
        <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'high':
      return <Badge variant="destructive">High</Badge>;
    case 'medium':
      return <Badge variant="secondary">Medium</Badge>;
    case 'low':
      return <Badge variant="outline">Low</Badge>;
    default:
      return <Badge variant="outline">{severity}</Badge>;
  }
}

export default function GateNHealthCheckPanel() {
  const { data, isLoading, refetch, isRefetching } = useGateNHealthCheck();

  const checks = data?.data?.checks ?? [];
  const isRunning = isLoading || isRefetching;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Health Check
        </CardTitle>
        <CardDescription>
          Run diagnostic checks to verify RPCs, Edge Functions, and RBAC status for this tenant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Run button */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => refetch()} 
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Activity className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                Run Health Check Now
              </>
            )}
          </Button>

          {data?.data?.finishedAt && !isRunning && (
            <div className="text-xs text-muted-foreground">
              Last check: {new Date(data.data.finishedAt).toLocaleString('en-US')}
            </div>
          )}
        </div>

        {/* Error alert */}
        {data?.success === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>An error occurred during check</AlertTitle>
            <AlertDescription>{data?.message ?? 'Unknown error'}</AlertDescription>
          </Alert>
        )}

        {/* Results table */}
        {checks.length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Check</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Severity</th>
                      <th className="text-left p-3 font-medium">Time (ms)</th>
                      <th className="text-left p-3 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((check: HealthCheckItem) => (
                      <tr key={check.code} className="border-t hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{check.label}</div>
                            <div className="text-xs text-muted-foreground">{check.code}</div>
                          </div>
                        </td>
                        <td className="p-3">{getStatusBadge(check.status)}</td>
                        <td className="p-3">{getSeverityBadge(check.severity)}</td>
                        <td className="p-3 font-mono text-muted-foreground">{check.latencyMs}</td>
                        <td className="p-3">
                          <div className="text-xs text-muted-foreground max-w-md">
                            {check.message ?? '-'}
                            {check.errorCode && (
                              <div className="text-destructive mt-1">
                                Error: {check.errorCode}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            {data?.data && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  {data.data.success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Check completed successfully</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Issues detected</span>
                    </>
                  )}
                </div>
                <div className="text-muted-foreground">
                  {checks.length} checks run
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isRunning && checks.length === 0 && (
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertTitle>No checks run yet</AlertTitle>
            <AlertDescription>
              Click "Run Health Check Now" to start the diagnostic check.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
