/**
 * Gate-N Jobs Panel (N4)
 * Operations & Scheduler Control - Manage and trigger system jobs
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useGateNJobs, useTriggerGateNJob, SystemJob } from '@/lib/api/gateN';
import { useToast } from '@/hooks/use-toast';
import { Play, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';

export default function GateNJobsPanel() {
  const { data: response, isLoading, error } = useGateNJobs();
  const triggerMutation = useTriggerGateNJob();
  const { toast } = useToast();
  const [runningJobKey, setRunningJobKey] = useState<string | null>(null);

  const handleTriggerJob = async (jobKey: string) => {
    setRunningJobKey(jobKey);
    
    try {
      const result = await triggerMutation.mutateAsync(jobKey);
      
      if (result.success) {
        toast({
          title: 'Job Queued for Execution',
          description: `Job "${jobKey}" added to queue successfully.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Trigger Job',
          description: result.message || 'An error occurred while attempting to trigger the job.',
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setRunningJobKey(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !response?.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {response?.message || 'Failed to load job list. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  const jobs = response.data || [];

  // Empty state
  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operations & Scheduling</CardTitle>
          <CardDescription>Manage and run system jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No jobs configured for this tenant.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Operations & Scheduling
        </CardTitle>
        <CardDescription>
          Manage and execute scheduled system jobs for the current tenant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Gate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job: SystemJob) => (
                <TableRow key={job.id}>
                  {/* Job Key */}
                  <TableCell className="font-medium">
                    {job.job_key}
                  </TableCell>

                  {/* Job Type */}
                  <TableCell>
                    <Badge variant="outline">
                      {job.job_type}
                    </Badge>
                  </TableCell>

                  {/* Gate Code */}
                  <TableCell>
                    <Badge variant="secondary">
                      {job.tenant_id ? 'Tenant' : 'Global'}
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={job.is_enabled ? "default" : "secondary"}>
                      {job.is_enabled ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        'Disabled'
                      )}
                    </Badge>
                  </TableCell>

                  {/* Schedule */}
                  <TableCell className="text-sm text-muted-foreground">
                    {job.schedule_cron || '-'}
                  </TableCell>

                  {/* Last Run */}
                  <TableCell className="text-sm">
                    {job.last_run_at ? (
                      <div className="space-y-1">
                        <div>
                          {new Date(job.last_run_at).toLocaleString('en-US')}
                        </div>
                        {job.last_run_status && (
                          <Badge 
                            variant={
                              job.last_run_status === 'succeeded' ? 'default' :
                              job.last_run_status === 'failed' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {job.last_run_status}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not run yet</span>
                    )}
                  </TableCell>

                  {/* Action */}
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!job.is_enabled || runningJobKey === job.job_key}
                      onClick={() => handleTriggerJob(job.job_key)}
                    >
                      {runningJobKey === job.job_key ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Now
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Info */}
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            When triggering a job manually, it will be added to the queue and executed as soon as possible.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
