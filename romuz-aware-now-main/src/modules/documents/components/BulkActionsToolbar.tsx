/**
 * BulkActionsToolbar Component
 * 
 * Toolbar for performing bulk actions on selected documents
 */

import { useState } from "react";
import { Button } from "@/core/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
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
import { Trash2, FileEdit, X } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkStatusChange: (status: string) => Promise<void>;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkStatusChange,
}: BulkActionsToolbarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete();
      setShowDeleteDialog(false);
      onClearSelection();
      toast.success(`Successfully deleted ${selectedCount} document(s)`);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete documents");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setSelectedStatus(status);
    setIsProcessing(true);
    try {
      await onBulkStatusChange(status);
      toast.success(`Successfully updated ${selectedCount} document(s)`);
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to update documents");
    } finally {
      setIsProcessing(false);
      setSelectedStatus("");
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-primary text-primary-foreground shadow-lg rounded-lg border border-border/50 px-4 py-3 flex items-center gap-4">
          {/* Selected Count */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedCount} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-6 w-6 p-0 hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-primary-foreground/20" />

          {/* Change Status */}
          <div className="flex items-center gap-2">
            <FileEdit className="h-4 w-4" />
            <Select
              value={selectedStatus}
              onValueChange={handleStatusChange}
              disabled={isProcessing}
            >
              <SelectTrigger className="h-8 w-[140px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-primary-foreground/20" />

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isProcessing}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Document(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected document(s)?
              This will also delete all versions and attachments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
