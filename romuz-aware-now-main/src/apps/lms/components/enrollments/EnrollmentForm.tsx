/**
 * Enrollment Form Component
 * 
 * Form for creating/editing course enrollments
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { createEnrollmentSchema } from '@/modules/training/types/enrollment.types.validation';
import type { z } from 'zod';

const enrollmentFormSchema = createEnrollmentSchema.omit({ 
  course_id: true
});

type EnrollmentFormData = z.infer<typeof enrollmentFormSchema>;

interface EnrollmentFormProps {
  courseId: string;
  onSubmit: (data: EnrollmentFormData & { course_id: string }) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<EnrollmentFormData>;
}

export function EnrollmentForm({
  courseId,
  onSubmit,
  onCancel,
  defaultValues,
}: EnrollmentFormProps) {
  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: defaultValues || {
      user_id: '',
      enrollment_type: 'required',
    },
  });

  const handleSubmit = async (data: EnrollmentFormData) => {
    await onSubmit({ ...data, course_id: courseId });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User ID</FormLabel>
              <FormControl>
                <Input placeholder="User UUID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enrollment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enrollment Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                  <SelectItem value="recommended">Recommended</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="datetime-local" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Additional notes..." 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Enrolling...' : 'Enroll Student'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
