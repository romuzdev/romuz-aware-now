import { Button } from '@/core/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import type { ParticipantStatus } from '@/modules/campaigns';

interface Props {
  selectedCount: number;
  onChangeStatus: (status: ParticipantStatus) => void;
  onSetScore: () => void;
  onSetNotes: () => void;
  onDelete: () => void;
  onUndelete?: () => void;
  disabled: boolean;
  showUndelete?: boolean;
}

export function ParticipantsBulkToolbar({
  selectedCount,
  onChangeStatus,
  onSetScore,
  onSetNotes,
  onDelete,
  onUndelete,
  disabled,
  showUndelete = false,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="flex-1" />

      <Select
        disabled={disabled}
        onValueChange={(v) => onChangeStatus(v as ParticipantStatus)}
      >
        <SelectTrigger className="w-40" title={disabled ? 'Insufficient permissions' : ''}>
          <SelectValue placeholder="Change Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="not_started">Not Started</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant="outline"
        onClick={onSetScore}
        disabled={disabled}
        title={disabled ? 'Insufficient permissions' : 'Set score for selected'}
      >
        Set Score
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onSetNotes}
        disabled={disabled}
        title={disabled ? 'Insufficient permissions' : 'Add/clear notes'}
      >
        Set Notes
      </Button>

      {showUndelete && onUndelete && (
        <Button
          size="sm"
          variant="outline"
          onClick={onUndelete}
          disabled={disabled}
          title={disabled ? 'Insufficient permissions' : 'Restore deleted participants'}
        >
          Restore
        </Button>
      )}

      <Button
        size="sm"
        variant="destructive"
        onClick={onDelete}
        disabled={disabled}
        title={disabled ? 'Insufficient permissions' : 'Soft delete selected'}
      >
        Delete
      </Button>
    </div>
  );
}
