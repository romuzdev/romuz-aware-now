import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Badge } from '@/core/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { Participant } from '@/modules/campaigns';

interface Props {
  data: Participant[];
  selected: string[];
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
}

export function ParticipantsTable({ data, selected, onToggleAll, onToggleOne }: Props) {
  const allSelected = data.length > 0 && selected.length === data.length;

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
            </TableHead>
            <TableHead>Employee Ref</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No participants found
              </TableCell>
            </TableRow>
          )}
          {data.map((p) => (
            <TableRow key={p.id} className={p.deletedAt ? 'opacity-50' : ''}>
              <TableCell>
                <Checkbox
                  checked={selected.includes(p.id)}
                  onCheckedChange={() => onToggleOne(p.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{p.employeeRef}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(p.status)}>
                  {p.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>{p.score !== null ? p.score.toFixed(1) : '—'}</TableCell>
              <TableCell>
                {p.completedAt ? (
                  <span title={new Date(p.completedAt).toLocaleString()}>
                    {formatDistanceToNow(new Date(p.completedAt), { addSuffix: true })}
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="max-w-xs truncate">{p.notes || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    default:
      return 'outline';
  }
}
