/**
 * DocumentAttachmentsTab Component
 * 
 * Displays attachments table with download/delete actions
 */

import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Download, Trash2, Upload, Lock, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { getAttachmentDownloadUrl, triggerDownload } from "@/lib/documents/downloadUrls";
import { deleteAttachment } from "@/core/services";
import { useState } from "react";
import { FilePreviewModal } from "./FilePreviewModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/ui/alert-dialog";

interface Attachment {
  id: string;
  filename: string;
  file_size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
  storage_path: string;
  is_private: boolean;
  mime_type: string;
}

interface DocumentAttachmentsTabProps {
  attachments: Attachment[];
  onUploadClick: () => void;
  onRefresh: () => void;
  canUpload: boolean;
  canDelete: boolean;
}

export function DocumentAttachmentsTab({ 
  attachments, 
  onUploadClick, 
  onRefresh,
  canUpload,
  canDelete,
}: DocumentAttachmentsTabProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    mimeType: string;
  }>({
    isOpen: false,
    fileUrl: "",
    fileName: "",
    mimeType: "",
  });

  const handleDownload = async (attachment: Attachment) => {
    setDownloadingId(attachment.id);
    try {
      const url = await getAttachmentDownloadUrl(attachment.storage_path);
      triggerDownload(url, attachment.filename);
      toast.success("Download started");
    } catch (error: any) {
      toast.error(error.message || "Failed to download attachment");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (attachment: Attachment) => {
    try {
      const url = await getAttachmentDownloadUrl(attachment.storage_path);
      setPreviewModal({
        isOpen: true,
        fileUrl: url,
        fileName: attachment.filename,
        mimeType: attachment.mime_type,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load preview");
    }
  };

  const canPreview = (mimeType: string) => {
    return (
      mimeType === "application/pdf" ||
      mimeType.startsWith("image/")
    );
  };

  const handleDeleteClick = (attachmentId: string) => {
    setAttachmentToDelete(attachmentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!attachmentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteAttachment(attachmentToDelete);
      toast.success("Attachment deleted successfully");
      onRefresh();
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete attachment");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
        </p>
        {canUpload && (
          <Button onClick={onUploadClick}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Attachment
          </Button>
        )}
      </div>

      {attachments.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-base font-medium">No attachments yet</p>
          <p className="text-sm mt-1">Upload supporting files for this document</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/70">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">File Name</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold">Uploaded By</th>
                <th className="px-4 py-3 font-semibold">Uploaded At</th>
                <th className="px-4 py-3 font-semibold">Privacy</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attachments.map((attachment) => (
                <tr key={attachment.id} className="border-t hover:bg-muted/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate max-w-xs">
                        {attachment.filename}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatFileSize(attachment.file_size_bytes)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {attachment.uploaded_by}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(attachment.uploaded_at), "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    {attachment.is_private ? (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="outline">Public</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canPreview(attachment.mime_type) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(attachment)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                        disabled={downloadingId === attachment.id}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(attachment.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        fileUrl={previewModal.fileUrl}
        fileName={previewModal.fileName}
        mimeType={previewModal.mimeType}
      />
    </div>
  );
}
