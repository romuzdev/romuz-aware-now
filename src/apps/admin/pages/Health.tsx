import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Activity, Database, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { useHealthChecks } from '@/features/gate-p/hooks/useHealthChecks';
import { useHealthJobs } from '@/features/gate-p/hooks/useHealthJobs';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function Health() {
  const navigate = useNavigate();
  const { data: healthData, isLoading: isLoadingHealth } = useHealthChecks();
  const { data: jobsData, isLoading: isLoadingJobs } = useHealthJobs();

  useEffect(() => {
    // TODO: Add proper RBAC check for admin role
    // For now, allow access (implement role check when RBAC is ready)
  }, [navigate]);

  if (isLoadingHealth || isLoadingJobs) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const allChecks = [
    ...(healthData?.migrations || []),
    ...(healthData?.indexes || []),
    ...(healthData?.rls || []),
  ];

  const criticalIssues = allChecks.filter((c) => c.status === 'error').length;
  const warnings = allChecks.filter((c) => c.status === 'warning').length;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground mt-1">
            Internal diagnostics and drift detection
          </p>
        </div>
        <Badge variant={criticalIssues > 0 ? 'destructive' : warnings > 0 ? 'secondary' : 'default'}>
          {criticalIssues > 0 ? (
            <>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {criticalIssues} Critical
            </>
          ) : warnings > 0 ? (
            <>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {warnings} Warnings
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Healthy
            </>
          )}
        </Badge>
      </div>

      {criticalIssues > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {criticalIssues} critical issue{criticalIssues > 1 ? 's' : ''} detected. Review immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Migrations</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData?.migrations.filter((m) => m.status === 'success').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthData?.migrations.length || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RLS Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData?.rls.filter((r) => r.status === 'success').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthData?.rls.length || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Rate (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobsData?.auditRate24h || 0}
            </div>
            <p className="text-xs text-muted-foreground">events/hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Backlog</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobsData?.queueBacklog || 0}
            </div>
            <p className="text-xs text-muted-foreground">pending notifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Migrations Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Migrations
          </CardTitle>
          <CardDescription>
            Schema version and migration history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthData?.migrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No migration data available</p>
          ) : (
            <div className="space-y-2">
              {healthData?.migrations.map((migration, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {migration.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : migration.status === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{migration.name}</p>
                      <p className="text-xs text-muted-foreground">{migration.message}</p>
                    </div>
                  </div>
                  <Badge variant={migration.status === 'success' ? 'default' : 'secondary'}>
                    {migration.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indexes Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Database Indexes
          </CardTitle>
          <CardDescription>
            Performance optimization recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthData?.indexes.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>All recommended indexes are in place</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {healthData?.indexes.map((index, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {index.status === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{index.name}</p>
                      <p className="text-xs text-muted-foreground">{index.message}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Advisory</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RLS Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Row Level Security
          </CardTitle>
          <CardDescription>
            RLS policy coverage and enforcement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthData?.rls.length === 0 ? (
            <p className="text-sm text-muted-foreground">No RLS data available</p>
          ) : (
            <div className="space-y-2">
              {healthData?.rls.map((policy, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {policy.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{policy.name}</p>
                      <p className="text-xs text-muted-foreground">{policy.message}</p>
                    </div>
                  </div>
                  <Badge variant={policy.status === 'success' ? 'default' : 'destructive'}>
                    {policy.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Check:</span>
            <span className="font-medium">{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment:</span>
            <span className="font-medium">Production</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Auto-refresh:</span>
            <span className="font-medium">Disabled (manual only)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
