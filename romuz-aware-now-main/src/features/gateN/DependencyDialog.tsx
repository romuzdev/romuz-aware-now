import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import { Switch } from '@/core/components/ui/switch';
import { Input } from '@/core/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreateJobDependency, useUpdateJobDependency } from '@/lib/api/gateN';

const dependencySchema = z.object({
  parent_job_id: z.string().min(1, 'Select parent task'),
  dependent_job_id: z.string().min(1, 'Select dependent task'),
  dependency_type: z.enum(['required', 'optional', 'conditional']),
  wait_for_success: z.boolean(),
  retry_on_parent_failure: z.boolean(),
  max_wait_minutes: z.coerce.number().min(1).max(1440),
  is_active: z.boolean(),
});

type DependencyFormData = z.infer<typeof dependencySchema>;

interface DependencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dependency?: any;
  jobs: any[];
}

export function DependencyDialog({
  open,
  onOpenChange,
  dependency,
  jobs,
}: DependencyDialogProps) {
  const createMutation = useCreateJobDependency();
  const updateMutation = useUpdateJobDependency();

  const form = useForm<DependencyFormData>({
    resolver: zodResolver(dependencySchema),
    defaultValues: {
      parent_job_id: '',
      dependent_job_id: '',
      dependency_type: 'required',
      wait_for_success: true,
      retry_on_parent_failure: false,
      max_wait_minutes: 60,
      is_active: true,
    },
  });

  useEffect(() => {
    if (dependency) {
      form.reset({
        parent_job_id: dependency.parent_job_id,
        dependent_job_id: dependency.dependent_job_id,
        dependency_type: dependency.dependency_type,
        wait_for_success: dependency.wait_for_success,
        retry_on_parent_failure: dependency.retry_on_parent_failure,
        max_wait_minutes: dependency.max_wait_minutes,
        is_active: dependency.is_active,
      });
    } else {
      form.reset();
    }
  }, [dependency, form]);

  const onSubmit = async (data: DependencyFormData) => {
    try {
      if (data.parent_job_id === data.dependent_job_id) {
        toast.error('A task cannot depend on itself');
        return;
      }

      const result = dependency
        ? await updateMutation.mutateAsync({
            dependency_id: dependency.id,
            dependency_type: data.dependency_type,
            wait_for_success: data.wait_for_success,
            retry_on_parent_failure: data.retry_on_parent_failure,
            max_wait_minutes: data.max_wait_minutes,
            is_active: data.is_active,
          })
        : await createMutation.mutateAsync({
            parent_job_id: data.parent_job_id,
            dependent_job_id: data.dependent_job_id,
            dependency_type: data.dependency_type,
            wait_for_success: data.wait_for_success,
            retry_on_parent_failure: data.retry_on_parent_failure,
            max_wait_minutes: data.max_wait_minutes,
            is_active: data.is_active,
          });

      if (result.success) {
        toast.success(dependency ? 'Dependency updated successfully' : 'Dependency added successfully');
        onOpenChange(false);
        form.reset();
      } else {
        if (result.error_code === 'CIRCULAR_DEPENDENCY') {
          toast.error('Circular dependency detected! This would cause an infinite loop.');
        } else {
          toast.error(result.message || 'Operation failed');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {dependency ? 'Edit Dependency' : 'Add New Dependency'}
          </DialogTitle>
          <DialogDescription>
            Specify the parent task that must complete before the dependent task starts
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="parent_job_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Task (must finish first)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent task" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.job_key} ({job.job_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The task that must complete before the dependent task starts
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dependent_job_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dependent Task (will wait)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dependent task" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.job_key} ({job.job_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The task that will wait until the parent task completes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dependency_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dependency Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="required">Required</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Required: Must succeed | Optional: Preferred | Conditional: Based on condition
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_wait_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Wait Time (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximum time to wait before treating as failure
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wait_for_success"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Wait for Success</FormLabel>
                    <FormDescription>
                      Parent task must complete successfully (succeeded)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="retry_on_parent_failure"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Retry on Failure</FormLabel>
                    <FormDescription>
                      Attempt to run task even if parent task failed
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Dependency</FormLabel>
                    <FormDescription>
                      Enable or temporarily disable this dependency
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : dependency ? (
                  'Update'
                ) : (
                  'Add'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
