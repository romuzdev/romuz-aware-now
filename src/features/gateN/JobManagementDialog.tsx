/**
 * Job Management Dialog
 * Form for creating and editing system jobs
 */

import { useState, useEffect } from 'react';
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
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Button } from '@/core/components/ui/button';
import { Switch } from '@/core/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Loader2 } from 'lucide-react';
import { SystemJob } from '@/lib/api/gateN';

const jobFormSchema = z.object({
  job_key: z.string().min(3, 'Job key must be at least 3 characters'),
  display_name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  gate_code: z.string().min(1, 'Select a gate'),
  job_type: z.string().min(1, 'Select job type'),
  schedule_cron: z.string().optional(),
  is_enabled: z.boolean().default(true),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: SystemJob | null;
  initialValues?: Partial<JobFormValues>;
  onSubmit: (values: JobFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export default function JobManagementDialog({
  open,
  onOpenChange,
  job,
  initialValues,
  onSubmit,
  isSubmitting,
}: JobManagementDialogProps) {
  const isEditMode = !!job;

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      job_key: '',
      display_name: '',
      description: '',
      gate_code: 'Gate-N',
      job_type: 'scheduled',
      schedule_cron: '',
      is_enabled: true,
    },
  });

  // Reset form when dialog opens/closes or job/initialValues changes
  useEffect(() => {
    if (open) {
      if (job) {
        // Edit mode - load from existing job
        form.reset({
          job_key: job.job_key,
          display_name: job.job_key,
          description: '',
          gate_code: 'Gate-N',
          job_type: job.job_type,
          schedule_cron: job.schedule_cron || '',
          is_enabled: job.is_enabled,
        });
      } else if (initialValues) {
        // Template mode - load from template
        form.reset({
          job_key: initialValues.job_key || '',
          display_name: initialValues.display_name || '',
          description: initialValues.description || '',
          gate_code: initialValues.gate_code || 'Gate-N',
          job_type: initialValues.job_type || 'scheduled',
          schedule_cron: initialValues.schedule_cron || '',
          is_enabled: initialValues.is_enabled !== undefined ? initialValues.is_enabled : true,
        });
      } else {
        // Empty mode - new job
        form.reset({
          job_key: '',
          display_name: '',
          description: '',
          gate_code: 'Gate-N',
          job_type: 'scheduled',
          schedule_cron: '',
          is_enabled: true,
        });
      }
    }
  }, [open, job, initialValues, form]);

  const handleSubmit = async (values: JobFormValues) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Job' : 'Add New Job'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Edit the job details below'
              : 'Enter the new job details'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Job Key */}
            <FormField
              control={form.control}
              name="job_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Key *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="refresh_kpis"
                      {...field}
                      disabled={isEditMode}
                      dir="ltr"
                      className="text-left"
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for the job (cannot be edited after creation)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Name */}
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Refresh KPIs"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Name that will appear in the user interface
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of what the job does..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Gate Code */}
              <FormField
                control={form.control}
                name="gate_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gate *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEditMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Gate-N">Gate-N (System)</SelectItem>
                        <SelectItem value="Gate-K">Gate-K (KPIs)</SelectItem>
                        <SelectItem value="Gate-H">Gate-H (Actions)</SelectItem>
                        <SelectItem value="Gate-D">Gate-D (Awareness)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Job Type */}
              <FormField
                control={form.control}
                name="job_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="event-driven">Event-driven</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedule Cron */}
            <FormField
              control={form.control}
              name="schedule_cron"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cron Schedule</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0 2 * * *"
                      {...field}
                      dir="ltr"
                      className="text-left font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Cron expression for scheduled jobs (e.g., 0 2 * * * = daily at 2 AM)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Enabled */}
            <FormField
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Job</FormLabel>
                    <FormDescription>
                      Enable or disable job execution
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Add Job'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
