import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/core/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { Input } from "@/core/components/ui/input";
import { Textarea } from "@/core/components/ui/textarea";
import { Button } from "@/core/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAddActionUpdate } from "@/modules/actions";
import { GateHActionUpdateType, GateHActionStatus } from "@/modules/actions";

const addUpdateSchema = z.object({
  update_type: GateHActionUpdateType,
  body_ar: z.string().optional(),
  evidence_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  new_status: GateHActionStatus.optional(),
  progress_pct: z.coerce.number().min(0).max(100).optional(),
});

type AddUpdateForm = z.infer<typeof addUpdateSchema>;

interface AddUpdateDialogProps {
  actionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUpdateDialog({
  actionId,
  open,
  onOpenChange,
}: AddUpdateDialogProps) {
  const { mutate: addUpdate, isPending } = useAddActionUpdate();

  const form = useForm<AddUpdateForm>({
    resolver: zodResolver(addUpdateSchema),
    defaultValues: {
      update_type: "comment",
      body_ar: "",
      evidence_url: "",
      progress_pct: undefined,
    },
  });

  const updateType = form.watch("update_type");

  const onSubmit = (data: AddUpdateForm) => {
    addUpdate(
      {
        actionId: actionId,
        updateType: data.update_type,
        bodyAr: data.body_ar,
        evidenceUrl: data.evidence_url || undefined,
        newStatus: data.new_status,
        progressPct: data.progress_pct,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Update</DialogTitle>
          <DialogDescription>
            Add a comment, progress update, evidence, or change the action status
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Update Type */}
            <FormField
              control={form.control}
              name="update_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Update Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select update type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="comment">Comment</SelectItem>
                      <SelectItem value="progress">Progress Update</SelectItem>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="status_change">Status Change</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Body */}
            <FormField
              control={form.control}
              name="body_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Write update details..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progress (only for progress type) */}
            {updateType === "progress" && (
              <FormField
                control={form.control}
                name="progress_pct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        {...field}
                        value={field.value ?? ""}
                        placeholder="e.g., 75"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Evidence URL (only for evidence type) */}
            {updateType === "evidence" && (
              <FormField
                control={form.control}
                name="evidence_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence Link</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://..."
                        type="url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* New Status (only for status_change type) */}
            {updateType === "status_change" && (
              <FormField
                control={form.control}
                name="new_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="verify">Verified</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Update
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
