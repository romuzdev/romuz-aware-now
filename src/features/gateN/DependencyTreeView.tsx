import { useJobDependencyTree, useGateNJobs } from '@/lib/api/gateN';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Badge } from '@/core/components/ui/badge';
import { Loader2, AlertCircle, ArrowDown, CheckCircle2, XCircle, Clock } from 'lucide-react';

export function DependencyTreeView() {
  const { data: treeData, isLoading } = useJobDependencyTree();
  const { data: jobsData } = useGateNJobs();

  const jobs = jobsData?.data || [];
  const tree = treeData?.data?.tree || [];

  // Group by job and build hierarchy
  const buildHierarchy = () => {
    const jobMap = new Map();
    
    // Initialize all jobs
    jobs.forEach((job: any) => {
      jobMap.set(job.id, {
        ...job,
        children: [],
        parents: [],
      });
    });

    // Add parent-child relationships
    tree.forEach((item: any) => {
      if (item.parent_job_id && item.job_id) {
        const parent = jobMap.get(item.parent_job_id);
        const child = jobMap.get(item.job_id);
        
        if (parent && child) {
          parent.children.push(child);
          child.parents.push(parent);
        }
      }
    });

    // Find root jobs (no parents)
    const roots = Array.from(jobMap.values()).filter(
      (job: any) => job.parents.length === 0
    );

    return roots;
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <Clock className="h-4 w-4 text-muted-foreground" />;
    
    switch (status) {
      case 'succeeded':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderJobNode = (job: any, level: number = 0) => {
    return (
      <div key={job.id} className="space-y-2">
        <div
          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          style={{ marginLeft: `${level * 2}rem` }}
        >
          <div className="flex-shrink-0">
            {getStatusIcon(job.last_run_status)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{job.job_key}</span>
              <Badge variant="outline" className="text-xs">
                {job.job_type}
              </Badge>
              {job.is_enabled ? (
                <Badge variant="default" className="text-xs">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Disabled</Badge>
              )}
            </div>
            
            {job.last_run_at && (
              <div className="text-xs text-muted-foreground mt-1">
                Last run: {new Date(job.last_run_at).toLocaleString('en-US')}
              </div>
            )}
          </div>

          {job.children && job.children.length > 0 && (
            <div className="flex-shrink-0">
              <Badge variant="secondary">
                {job.children.length} dependent
              </Badge>
            </div>
          )}
        </div>

        {job.children && job.children.length > 0 && (
          <div className="flex items-center gap-2" style={{ marginLeft: `${level * 2}rem` }}>
            <ArrowDown className="h-4 w-4 text-muted-foreground ml-4" />
            <span className="text-xs text-muted-foreground">
              Must complete before:
            </span>
          </div>
        )}

        {job.children &&
          job.children.map((child: any) => renderJobNode(child, level + 1))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hierarchy = buildHierarchy();

  if (hierarchy.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No data to display. Add dependencies between tasks to see the visual diagram.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The visual diagram shows task execution order from top (parent) to bottom (dependent).
          Tasks at the top must complete before tasks below them can start.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {hierarchy.map((rootJob: any) => renderJobNode(rootJob))}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>Succeeded</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span>Failed</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-blue-500" />
          <span>Running</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Not run</span>
        </div>
      </div>
    </div>
  );
}
