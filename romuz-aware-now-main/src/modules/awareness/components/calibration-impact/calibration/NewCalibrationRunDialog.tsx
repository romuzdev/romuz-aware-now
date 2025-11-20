// Gate-J Part 4.4: New Calibration Run Dialog
// Modal for creating a new calibration run

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
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
import { Calendar as CalendarComponent } from '@/core/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/core/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { toast } from 'sonner';

const formSchema = z.object({
  modelVersion: z.coerce.number().min(1, 'Model version must be a positive number'),
  periodStart: z.date().optional(),
  periodEnd: z.date().optional(),
  runLabel: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewCalibrationRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewCalibrationRunDialog({
  open,
  onOpenChange,
  onSuccess,
}: NewCalibrationRunDialogProps) {
  const { tenantId } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelVersion: 1,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Call the edge function to run calibration
      const { data, error } = await supabase.functions.invoke('run-calibration', {
        body: {
          tenantId,
          modelVersion: values.modelVersion,
          periodStart: values.periodStart ? format(values.periodStart, 'yyyy-MM-dd') : undefined,
          periodEnd: values.periodEnd ? format(values.periodEnd, 'yyyy-MM-dd') : undefined,
          runLabel: values.runLabel,
          description: values.description,
        },
      });

      if (error) throw error;

      toast.success('Calibration run started successfully');
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to create calibration run:', error);
      toast.error('Failed to start calibration run');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Run New Calibration</DialogTitle>
          <DialogDescription>
            Create a new calibration run to evaluate the accuracy of the impact model
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="modelVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Version</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Model version to calibrate (usually 1)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodStart"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Select date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Start date of the period to calibrate
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodEnd"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Select date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          !!form.watch('periodStart') && date < form.watch('periodStart')!
                        }
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    End date of the period to calibrate
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="runLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Example: Q1 2025 Calibration" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description of the calibration run and its purpose"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
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
                {isSubmitting ? 'Running...' : 'Start Calibration'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}