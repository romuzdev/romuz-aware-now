import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/core/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/components/ui/form";
import { Input } from "@/core/components/ui/input";
import { Textarea } from "@/core/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateScheduledTransition, type ScheduledTransition } from "@/core/tenancy/integration";
import { Calendar } from "@/core/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";

const formSchema = z.object({
  scheduledDate: z.date({
    message: "Must select date",
  }),
  scheduledTime: z.string().min(1, "Must enter time"),
  reason: z.string().optional(),
});

interface EditScheduledTransitionDialogProps {
  transition: ScheduledTransition | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditScheduledTransitionDialog({ 
  transition, 
  onClose, 
  onSuccess 
}: EditScheduledTransitionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduledTime: "00:00",
      reason: "",
    },
  });

  useEffect(() => {
    if (transition) {
      const scheduledDate = new Date(transition.scheduled_at);
      form.reset({
        scheduledDate: scheduledDate,
        scheduledTime: format(scheduledDate, "HH:mm"),
        reason: transition.reason || "",
      });
    }
  }, [transition, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!transition) return;

    try {
      setIsSubmitting(true);

      // Combine date and time
      const [hours, minutes] = values.scheduledTime.split(":");
      const scheduledDateTime = new Date(values.scheduledDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await updateScheduledTransition(transition.id, {
        scheduled_at: scheduledDateTime.toISOString(),
        reason: values.reason,
      });

      toast({
        title: "Updated Successfully",
        description: "The scheduled transition time has been updated",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Update Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transition) return null;

  return (
    <Dialog open={!!transition} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Scheduled Transition Time</DialogTitle>
          <DialogDescription>
            Edit transition time from {transition.from_state} to {transition.to_state}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Example: Postpone for one week"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
