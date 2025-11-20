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
  GitBranch,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Network,
} from 'lucide-react';
import {
  useJobDependencies,
  useDeleteJobDependency,
  useCheckJobDependencies,
  useGateNJobs,
} from '@/lib/api/gateN';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/core/components/ui/alert';
import { DependencyDialog } from './DependencyDialog';
import { DependencyTreeView } from './DependencyTreeView';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/core/components/ui/tabs';

export function JobDependenciesPanel() {
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDependency, setEditingDependency] = useState<any>(null);

  const { data: jobsData } = useGateNJobs();
  const { data: depsData, isLoading } = useJobDependencies(selectedJobId);
  const deleteMutation = useDeleteJobDependency();

  const jobs = jobsData?.data || [];
  const dependencies = depsData?.data?.dependencies || [];

  const handleDelete = async (depId: string) => {
    if (!confirm('Are you sure you want to delete this dependency?')) return;

    try {
      const result = await deleteMutation.mutateAsync(depId);
      if (result.success) {
        toast.success('Dependency deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete dependency');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during deletion');
    }
  };

  const getDependencyTypeColor = (type: string) => {
    switch (type) {
      case 'required':
        return 'destructive';
      case 'optional':
        return 'secondary';
      case 'conditional':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getDependencyTypeLabel = (type: string) => {
    switch (type) {
      case 'required':
        return 'Required';
      case 'optional':
        return 'Optional';
      case 'conditional':
        return 'Conditional';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Task Execution Order (Dependencies)
          </CardTitle>
          <CardDescription>
            Manage task execution sequence
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
              <GitBranch className="h-5 w-5" />
              Task Execution Order (Job Dependencies)
            </CardTitle>
            <CardDescription>
              Define which task must complete before another starts - {dependencies.length} active dependencies
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingDependency(null);
              setDialogOpen(true);
            }}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Dependency
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Dependency List</TabsTrigger>
            <TabsTrigger value="tree">
              <Network className="mr-2 h-4 w-4" />
              Visual Diagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {dependencies.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Dependencies</AlertTitle>
                <AlertDescription>
                  No dependencies defined between tasks. All tasks can run independently.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dependent Task</TableHead>
                      <TableHead>Depends On</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Settings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dependencies.map((dep) => (
                      <TableRow key={dep.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="flex items-center gap-2">
                              {dep.dependent_job?.job_key}
                              <Badge variant="outline" className="text-xs">
                                {dep.dependent_job?.job_type}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Will run after...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {dep.parent_job?.job_key}
                            <Badge variant="outline" className="text-xs">
                              {dep.parent_job?.job_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getDependencyTypeColor(dep.dependency_type)}>
                            {getDependencyTypeLabel(dep.dependency_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            {dep.wait_for_success && (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                Wait for success
                              </div>
                            )}
                            {dep.max_wait_minutes && (
                              <div className="text-muted-foreground">
                                Wait limit: {dep.max_wait_minutes} min
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {dep.is_active ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Disabled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(dep.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
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
              <AlertTitle>How does it work?</AlertTitle>
              <AlertDescription className="space-y-2">
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>
                    <strong>Required</strong>: Parent task must succeed before dependent starts
                  </li>
                  <li>
                    <strong>Optional</strong>: Prefer parent completion, but not mandatory
                  </li>
                  <li>
                    <strong>Conditional</strong>: Depends on a specific state or condition
                  </li>
                  <li>When parent task fails, dependent tasks will not start automatically</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="tree">
            <DependencyTreeView />
          </TabsContent>
        </Tabs>
      </CardContent>

      <DependencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dependency={editingDependency}
        jobs={jobs}
      />
    </Card>
  );
}
