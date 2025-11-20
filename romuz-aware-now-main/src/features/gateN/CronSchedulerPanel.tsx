import { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  Play, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useGateNJobs, useSyncAllCronJobs, useSyncCronJob } from '@/lib/api/gateN';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/core/components/ui/alert';

export function CronSchedulerPanel() {
  const { data: jobsData, isLoading } = useGateNJobs();
  const syncAllMutation = useSyncAllCronJobs();
  const syncJobMutation = useSyncCronJob();
  const [syncingJobKey, setSyncingJobKey] = useState<string | null>(null);

  const handleSyncAll = async () => {
    try {
      const result = await syncAllMutation.mutateAsync();
      if (result.data?.success) {
        toast.success(result.data.message || 'All jobs synchronized successfully');
      } else {
        toast.error(result.data?.message || 'Synchronization failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during synchronization');
    }
  };

  const handleSyncJob = async (jobKey: string, scheduleCron: string, jobId: string) => {
    setSyncingJobKey(jobKey);
    try {
      const result = await syncJobMutation.mutateAsync({
        action: 'update',
        job_id: jobId,
        job_key: jobKey,
        schedule_cron: scheduleCron,
      });
      
      if (result.data?.success) {
        toast.success(`${jobKey} synchronized successfully`);
      } else {
        toast.error(result.data?.message || 'Synchronization failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during synchronization');
    } finally {
      setSyncingJobKey(null);
    }
  };

  const scheduledJobs = jobsData?.data?.filter(
    (job) => job.schedule_cron && job.is_enabled
  ) || [];

  const getCronDescription = (cron: string) => {
    const descriptions: Record<string, string> = {
      '*/5 * * * *': 'Every 5 minutes',
      '*/15 * * * *': 'Every 15 minutes',
      '0 * * * *': 'Every hour',
      '0 */4 * * *': 'Every 4 hours',
      '0 0 * * *': 'Daily at midnight',
      '0 2 * * *': 'Daily at 2 AM',
      '0 0 * * 0': 'Weekly on Sunday',
      '0 0 1 * *': 'Monthly on the 1st',
      '0 0 1 */3 *': 'Every 3 months',
    };
    return descriptions[cron] || cron;
  };

  const getNextRunEstimate = (cron: string) => {
    // Simple estimation - in production, use a library like cronstrue
    if (cron.startsWith('*/5')) return 'In 5 minutes';
    if (cron.startsWith('*/15')) return 'In 15 minutes';
    if (cron.startsWith('0 *')) return 'Within an hour';
    if (cron.startsWith('0 0')) return 'Tomorrow';
    return 'Soon';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Task Scheduler (pg_cron)
          </CardTitle>
          <CardDescription>
            Manage automated task scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Task Scheduler (pg_cron)
            </CardTitle>
            <CardDescription>
              Manage automated task scheduling - {scheduledJobs.length} scheduled tasks
            </CardDescription>
          </div>
          <Button
            onClick={handleSyncAll}
            disabled={syncAllMutation.isPending}
            size="sm"
          >
            {syncAllMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync All
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {scheduledJobs.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No scheduled tasks</AlertTitle>
            <AlertDescription>
              No enabled tasks with a schedule defined. Add schedule_cron to required tasks.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{job.job_key}</div>
                        <div className="text-xs text-muted-foreground">
                          {job.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.job_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {job.schedule_cron}
                        </code>
                        <div className="text-xs text-muted-foreground mt-1">
                          {getCronDescription(job.schedule_cron)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {getNextRunEstimate(job.schedule_cron)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.last_run_at ? (
                        <div className="text-sm">
                          <div>{new Date(job.last_run_at).toLocaleString('en-US')}</div>
                          {job.last_run_status && (
                            <Badge
                              variant={
                                job.last_run_status === 'succeeded'
                                  ? 'default'
                                  : 'destructive'
                              }
                              className="mt-1"
                            >
                              {job.last_run_status}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not run yet</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Active</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSyncJob(job.job_key, job.schedule_cron, job.id)}
                        disabled={syncingJobKey === job.job_key}
                      >
                        {syncingJobKey === job.job_key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Play className="mr-1 h-4 w-4" />
                            Re-sync
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important Notes</AlertTitle>
          <AlertDescription className="space-y-2">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Tasks run automatically according to the defined schedule</li>
              <li>Task must be enabled (is_enabled = true) to run</li>
              <li>Use "Sync All" after modifying schedules</li>
              <li>gate-n-trigger edge function is called automatically</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
