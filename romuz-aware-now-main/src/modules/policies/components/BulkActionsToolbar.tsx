import { useState } from "react";
import { CheckSquare, X } from "lucide-react";
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
import { toast } from "sonner";
import { bulkUpdatePolicyStatus } from "@/modules/policies/integration";
import type { PolicyStatus } from "../types/policy.types";

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedIds: string[];
  tenantId: string;
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  selectedIds,
  tenantId,
  onClearSelection,
  onActionComplete,
}: BulkActionsToolbarProps) {
  const [selectedStatus, setSelectedStatus] = useState<PolicyStatus | "">("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApplyStatus = () => {
    if (!selectedStatus) {
      toast.error("Please select the desired status");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedStatus) return;

    setIsUpdating(true);
    try {
      await bulkUpdatePolicyStatus(tenantId, selectedIds, selectedStatus);
      toast.success(`Successfully updated ${selectedCount} policies`);
      setShowConfirmDialog(false);
      setSelectedStatus("");
      onActionComplete();
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to update policies");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusLabels: Record<PolicyStatus, string> = {
    draft: "Draft",
    active: "Active",
    archived: "Archived",
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            {selectedCount} policies selected
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Change status to:</span>
          <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as PolicyStatus)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={handleApplyStatus}
            disabled={!selectedStatus || isUpdating}
          >
            Apply
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isUpdating}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of {selectedCount} policies to "
              {selectedStatus && statusLabels[selectedStatus]}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
