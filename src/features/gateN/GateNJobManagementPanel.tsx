/**
 * Gate-N Job Management Panel
 * Advanced CRUD interface for system jobs
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  useGateNJobs,
  useCreateGateNJob,
  useUpdateGateNJob,
  useDeleteGateNJob,
  useTriggerGateNJob,
  SystemJob,
} from '@/lib/api/gateN';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Play,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Library,
} from 'lucide-react';
import JobManagementDialog from './JobManagementDialog';
import JobTemplateSelector from './JobTemplateSelector';
import { type JobTemplate } from '@/lib/constants/jobTemplates';
import { usePlatformAdminProtection } from '@/core/hooks/utils/useRoleProtection';
import { RoleRequiredDialog } from '@/core/components/shared/RoleRequiredDialog';
import { logJobAction } from '@/lib/audit/gateP-audit';

export default function GateNJobManagementPanel() {
  const { data: response, isLoading, error } = useGateNJobs();
  const createMutation = useCreateGateNJob();
  const updateMutation = useUpdateGateNJob();
  const deleteMutation = useDeleteGateNJob();
  const triggerMutation = useTriggerGateNJob();
  const { toast } = useToast();
  const roleProtection = usePlatformAdminProtection();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<SystemJob | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<SystemJob | null>(null);
  const [runningJobKey, setRunningJobKey] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'update' | 'delete' | 'trigger' | 'toggle';
    data?: any;
  } | null>(null);

  const handleSelectTemplate = (template: JobTemplate) => {
    setSelectedTemplate(template);
    setSelectedJob(null);
    setDialogOpen(true);
  };

  const handleCreateJob = async (values: any) => {
    await roleProtection.executeProtectedAction(async () => {
      setPendingAction({ type: 'create', data: values });
      const createResult = await createMutation.mutateAsync(values);
      if (createResult.success && createResult.data) {
        await logJobAction(createResult.data.id, values.job_key, 'job_create', { config: values });
        toast({ title: 'Job Created', description: 'New job added successfully.' });
        setDialogOpen(false);
        setSelectedJob(null);
        setSelectedTemplate(null);
      }
    });
  };

  const handleUpdateJob = async (values: any) => {
    if (!selectedJob) return;
    await roleProtection.executeProtectedAction(async () => {
      const data = { job_id: selectedJob.id, ...values };
      const updateResult = await updateMutation.mutateAsync(data);
      if (updateResult.success) {
        await logJobAction(data.job_id, selectedJob.job_key, 'job_update', { changes: data });
        toast({ title: 'Updated', description: 'Job updated successfully.' });
        setDialogOpen(false);
        setSelectedJob(null);
      }
    });
  };

  const handleToggleEnabled = async (job: SystemJob) => {
    await roleProtection.executeProtectedAction(async () => {
      const newStatus = !job.is_enabled;
      await updateMutation.mutateAsync({ job_id: job.id, is_enabled: newStatus });
      await logJobAction(job.id, job.job_key, 'job_toggle_status', { new_status: newStatus ? 'enabled' : 'disabled' });
    });
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    await roleProtection.executeProtectedAction(async () => {
      await deleteMutation.mutateAsync(jobToDelete.id);
      await logJobAction(jobToDelete.id, jobToDelete.job_key, 'job_delete', {});
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    });
  };

  const handleTriggerJob = async (jobKey: string) => {
    await roleProtection.executeProtectedAction(async () => {
      setRunningJobKey(jobKey);
      await triggerMutation.mutateAsync(jobKey);
      await logJobAction('', jobKey, 'job_trigger', {});
      setRunningJobKey(null);
    });
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Job Management
              </CardTitle>
              <CardDescription>
                Add, edit, and delete scheduled system jobs
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setTemplateSelectorOpen(true)}
              >
                <Library className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              <Button onClick={() => {
                setSelectedJob(null);
                setSelectedTemplate(null);
                setDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Manually
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No jobs configured. Add a new job to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Key</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job: SystemJob) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        {job.job_key}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {job.job_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.tenant_id ? "default" : "secondary"}>
                          {job.tenant_id ? 'Tenant' : 'Global'}
                        </Badge>
                      </TableCell>
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
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {job.schedule_cron || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {job.last_run_at ? (
                          <div className="space-y-1">
                            <div>
                              {new Date(job.last_run_at).toLocaleString('ar-SA')}
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!job.is_enabled || runningJobKey === job.job_key}
                            onClick={() => handleTriggerJob(job.job_key)}
                          >
                            {runningJobKey === job.job_key ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>

                          {job.tenant_id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleEnabled(job)}
                                >
                                  {job.is_enabled ? (
                                    <>
                                      <PowerOff className="h-4 w-4 mr-2" />
                                      Disable
                                    </>
                                  ) : (
                                    <>
                                      <Power className="h-4 w-4 mr-2" />
                                      Enable
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setJobToDelete(job);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Selector */}
      <JobTemplateSelector
        open={templateSelectorOpen}
        onOpenChange={setTemplateSelectorOpen}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Create/Edit Dialog */}
      <JobManagementDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedTemplate(null);
          }
        }}
        job={selectedJob}
        initialValues={selectedTemplate?.default_config}
        onSubmit={selectedJob ? handleUpdateJob : handleCreateJob}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Job "{jobToDelete?.job_key}" will be permanently deleted and this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RoleRequiredDialog
        open={roleProtection.showDialog}
        onOpenChange={roleProtection.setShowDialog}
        requiredRole="platform_admin"
        title="تأكيد العملية"
        description="هذا الإجراء يتطلب دور platform_admin."
      />
    </>
  );
}
