/**
 * CreateDocumentModal Component
 * 
 * Modal for creating a new document
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDocumentSchema, type CreateDocumentInput } from "@/schemas/documents";
import { createDocument } from "@/core/services";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (documentId: string) => void;
  appCode?: string | null;
}

const DOC_TYPES = [
  { value: "policy", label: "Policy" },
  { value: "procedure", label: "Procedure" },
  { value: "guideline", label: "Guideline" },
  { value: "form", label: "Form" },
  { value: "report", label: "Report" },
  { value: "other", label: "Other" },
];

export function CreateDocumentModal({ isOpen, onClose, onCreated, appCode }: CreateDocumentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateDocumentInput>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: {
      title: "",
      description: "",
      doc_type: "other",
    },
  });

  const handleSubmit = async (data: CreateDocumentInput) => {
    setIsSubmitting(true);
    try {
      const document = await createDocument({
        title: data.title,
        description: data.description || undefined,
        doc_type: data.doc_type,
        app_code: appCode,
      });
      
      toast.success("Document created successfully");
      form.reset();
      onClose();
      onCreated(document.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to create document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
          <DialogDescription>
            Create a new document to manage versions and attachments
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter document title"
                      disabled={isSubmitting}
                    />
                  </FormControl>
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
                      {...field}
                      value={field.value || ""}
                      placeholder="Enter document description"
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Type */}
            <FormField
              control={form.control}
              name="doc_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOC_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />


            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
