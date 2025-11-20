/**
 * Gate-N Status Panel (N1)
 * System Dashboard - Status snapshot with KPI cards
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Badge } from '@/core/components/ui/badge';
import { useGateNStatus } from '@/lib/api/gateN';
import { ReportsKPIsCard } from './components/ReportsKPIsCard';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  Settings,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GateNStatusPanel() {
  const { data: response, isLoading, error, isRefetching } = useGateNStatus();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !response?.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {response?.message || 'Failed to load system data. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  const statusData = response.data;
  const jobs = statusData?.jobs || { total: 0, enabled: 0, runs_last_24h: { succeeded: 0, failed: 0, running: 0 } };
  const adminSettings = statusData?.admin_settings || { updated_at: null };

  // Calculate statistics
  const totalRuns = jobs.runs_last_24h.succeeded + jobs.runs_last_24h.failed + jobs.runs_last_24h.running;
  const successRate = totalRuns > 0 
    ? Math.round((jobs.runs_last_24h.succeeded / totalRuns) * 100) 
    : 0;

  // Status indicators
  const systemHealthy = jobs.runs_last_24h.failed === 0 && jobs.enabled > 0;
  const hasRunningJobs = jobs.runs_last_24h.running > 0;
  const hasFailedJobs = jobs.runs_last_24h.failed > 0;

  return (
    <div className="space-y-6">
      {/* Info: Settings moved to Gate-P */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>إعدادات Tenant انتقلت:</strong> يمكنك الآن إدارة إعدادات Tenant (SLA، Feature Flags، Limits) من{' '}
          <a href="/admin/gate-p" className="font-semibold text-primary hover:underline">
            Gate-P Console → Tenant Configuration
          </a>
          {' '}(يتطلب صلاحية super_admin)
        </AlertDescription>
      </Alert>

      {/* System Health Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant={systemHealthy ? 'default' : hasFailedJobs ? 'destructive' : 'secondary'}
          className="text-sm px-3 py-1"
        >
          {systemHealthy ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              System Operating Normally
            </>
          ) : hasFailedJobs ? (
            <>
              <XCircle className="h-4 w-4 mr-1" />
              Failed Jobs Detected
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 mr-1" />
              No Active Jobs
            </>
          )}
        </Badge>

        {hasRunningJobs && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Clock className="h-4 w-4 mr-1 animate-pulse" />
            {jobs.runs_last_24h.running} jobs running
          </Badge>
        )}

        {isRefetching && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            Updating...
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Jobs
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {jobs.enabled} active jobs
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Successful Runs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Successful Runs (24h)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {jobs.runs_last_24h.succeeded}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Success rate: {successRate}%
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Failed Runs */}
        <Card className={cn(hasFailedJobs && "border-destructive/50")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed Runs (24h)
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              hasFailedJobs ? "text-destructive" : "text-muted-foreground"
            )}>
              {jobs.runs_last_24h.failed}
            </div>
            {hasFailedJobs && (
              <p className="text-xs text-destructive mt-1">
                Requires immediate attention
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Running Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Currently Running
            </CardTitle>
            <Clock className={cn(
              "h-4 w-4",
              hasRunningJobs && "text-blue-500 animate-pulse"
            )} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {jobs.runs_last_24h.running}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active jobs now
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Jobs Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Jobs Performance (Last 24h)
            </CardTitle>
            <CardDescription>Scheduled jobs execution summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Runs</span>
                <span className="font-medium">{totalRuns}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <Badge variant={successRate >= 90 ? "default" : successRate >= 70 ? "secondary" : "destructive"}>
                  {successRate}%
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Jobs</span>
                <span className="font-medium">{jobs.enabled} of {jobs.total}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Success</span>
                <span>Failed</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                {totalRuns > 0 && (
                  <>
                    <div
                      className="bg-green-500"
                      style={{ width: `${(jobs.runs_last_24h.succeeded / totalRuns) * 100}%` }}
                    />
                    <div
                      className="bg-destructive"
                      style={{ width: `${(jobs.runs_last_24h.failed / totalRuns) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(jobs.runs_last_24h.running / totalRuns) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              System Settings
            </CardTitle>
            <CardDescription>Administrative configuration information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Settings Update</span>
                <span className="font-medium">
                  {adminSettings.updated_at 
                    ? new Date(adminSettings.updated_at).toLocaleDateString('en-US')
                    : 'Not set'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">System Status</span>
                <Badge variant={systemHealthy ? "default" : "secondary"}>
                  {systemHealthy ? 'Active' : 'Needs Review'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auto Refresh</span>
                <Badge variant="outline">Every 30 seconds</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports & KPIs Integration */}
      <ReportsKPIsCard 
        kpiSummary={statusData?.kpi_summary}
        reportsSummary={statusData?.reports_summary}
      />

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Data refreshes automatically every 30 seconds. Last update: {new Date().toLocaleTimeString('en-US')}
        </AlertDescription>
      </Alert>
    </div>
  );
}
