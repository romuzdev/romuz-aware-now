/**
 * UploadAttachmentModal Component
 * 
 * Modal for uploading document attachments
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadAttachmentSchema, type UploadAttachmentInput } from "@/schemas/documents";
import { uploadAttachment } from "@/core/services";
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
  FormDescription,
} from "@/core/components/ui/form";
import { Input } from "@/core/components/ui/input";
import { Button } from "@/core/components/ui/button";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Progress } from "@/core/components/ui/progress";
import { Upload, FileText, Lock } from "lucide-react";

interface UploadAttachmentModalProps {
  linked_entity_id: string;
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export function UploadAttachmentModal({
  linked_entity_id,
  isOpen,
  onClose,
  onUploaded,
}: UploadAttachmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<UploadAttachmentInput>({
    resolver: zodResolver(uploadAttachmentSchema),
    defaultValues: {
      file: undefined as any,
      is_private: false,
    },
  });

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        form.setValue("file", file, { shouldValidate: true });
      }
    },
    [form]
  );

  const handleSubmit = async (data: UploadAttachmentInput) => {
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await uploadAttachment({
        linked_module: "document",
        linked_entity_id,
        file: data.file,
        is_private: data.is_private,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Attachment uploaded successfully");
      form.reset();
      setSelectedFile(null);
      onClose();
      onUploaded();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload attachment");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setSelectedFile(null);
      setUploadProgress(0);
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Attachment</DialogTitle>
          <DialogDescription>
            Upload a supporting file for this document
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* File Upload */}
            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, ...field } }) => (
                <FormItem>
                  <FormLabel>File *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          {...field}
                          type="file"
                          onChange={handleFileChange}
                          disabled={isSubmitting}
                        />
                      </div>
                      {selectedFile && (
                        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(selectedFile.size)} • {selectedFile.type || "Unknown"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Maximum file size: 20MB
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Privacy Toggle */}
            <FormField
              control={form.control}
              name="is_private"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private Attachment
                    </FormLabel>
                    <FormDescription>
                      Only compliance managers and the uploader can view this file
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />


            {/* Upload Progress */}
            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedFile}>
                <Upload className="h-4 w-4 mr-2" />
                {isSubmitting ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
