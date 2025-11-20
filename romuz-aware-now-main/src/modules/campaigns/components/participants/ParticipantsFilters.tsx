import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';
import type { ParticipantsFilters } from '@/modules/campaigns';

interface Props {
  filters: ParticipantsFilters;
  onChange: (patch: Partial<ParticipantsFilters>) => void;
  onClear: () => void;
  showIncludeDeleted?: boolean;
}

export function ParticipantsFilters({ filters, onChange, onClear, showIncludeDeleted = false }: Props) {
  return (
    <div className="space-y-3">
      {/* Row 1: Search + Status + Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input
          placeholder="Search employee ref..."
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />

        <Select value={filters.status} onValueChange={(v: any) => onChange({ status: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Min score (0-100)"
          value={filters.scoreGte ?? ''}
          onChange={(e) => onChange({ scoreGte: e.target.value ? Number(e.target.value) : null })}
          min={0}
          max={100}
        />
      </div>

      {/* Row 2: Date Range + Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
          <div className="space-y-1">
            <Label className="text-xs">Completed From</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => onChange({ from: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Completed To</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => onChange({ to: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showIncludeDeleted && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-deleted"
                checked={filters.includeDeleted}
                onCheckedChange={(checked) => onChange({ includeDeleted: !!checked })}
              />
              <Label htmlFor="include-deleted" className="text-sm cursor-pointer whitespace-nowrap">
                Include deleted
              </Label>
            </div>
          )}

          <Button variant="outline" onClick={onClear} className="whitespace-nowrap">
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
