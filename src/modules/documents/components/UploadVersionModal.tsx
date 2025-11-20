/**
 * UploadVersionModal Component
 * 
 * Modal for uploading a new document version
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadVersionSchema, type UploadVersionInput } from "@/schemas/documents";
import { uploadDocumentVersion } from "@/core/services";
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
import { Progress } from "@/core/components/ui/progress";
import { Upload, FileText } from "lucide-react";

interface UploadVersionModalProps {
  documentId: string;
  currentVersion?: number;
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export function UploadVersionModal({
  documentId,
  currentVersion = 0,
  isOpen,
  onClose,
  onUploaded,
}: UploadVersionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const suggestedVersion = currentVersion + 1;

  const form = useForm<UploadVersionInput>({
    resolver: zodResolver(uploadVersionSchema),
    defaultValues: {
      versionNumber: suggestedVersion,
      file: undefined as any,
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

  const handleSubmit = async (data: UploadVersionInput) => {
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Simulate progress (real progress would require server-sent events or polling)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const mimeType = data.file.type || "application/octet-stream";

      await uploadDocumentVersion(
        documentId,
        data.versionNumber,
        data.file,
        mimeType
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Version uploaded successfully");
      form.reset();
      setSelectedFile(null);
      onClose();
      onUploaded();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload version");
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
          <DialogTitle>Upload New Version</DialogTitle>
          <DialogDescription>
            Upload a new version of this document
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Version Number */}
            <FormField
              control={form.control}
              name="versionNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version Number *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={9999}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Suggested: {suggestedVersion} (current: {currentVersion})
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
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
