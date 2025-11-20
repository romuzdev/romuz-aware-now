// Gate-J Part 4.4: Calibration Runs Table
// List all calibration runs with status and actions

import { useNavigate } from 'react-router-dom';
import { Eye, RefreshCw } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Skeleton } from '@/core/components/ui/skeleton';
import type { CalibrationRun } from '@/modules/awareness';

interface CalibrationRunsTableProps {
  runs: CalibrationRun[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function CalibrationRunsTable({ runs, isLoading, onRefresh }: CalibrationRunsTableProps) {
  const navigate = useNavigate();

  const getStatusBadge = (status?: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      good: { label: 'Good', className: 'bg-green-500 hover:bg-green-600' },
      needs_tuning: { label: 'Needs Tuning', className: 'bg-yellow-500 hover:bg-yellow-600' },
      bad: { label: 'Bad', className: 'bg-red-500 hover:bg-red-600' },
    };

    const variant = variants[status || ''] || { label: 'Unknown', className: 'bg-secondary' };
    
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No calibration runs yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Run a new calibration to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Model Version</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Sample Size</TableHead>
              <TableHead>Avg Gap</TableHead>
              <TableHead>Correlation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-medium">
                  {run.runLabel || `Calibration ${run.id.slice(0, 8)}`}
                </TableCell>
                <TableCell>v{run.modelVersion}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {run.periodStart && run.periodEnd ? (
                    <>
                      {run.periodStart} <br /> to {run.periodEnd}
                    </>
                  ) : (
                    'Not specified'
                  )}
                </TableCell>
                <TableCell>{run.sampleSize?.toLocaleString() || 0}</TableCell>
                <TableCell>
                  <span className={run.avgValidationGap && run.avgValidationGap <= 10 ? 'text-green-500' : ''}>
                    {run.avgValidationGap?.toFixed(2) || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  {run.correlationScore ? `${run.correlationScore.toFixed(1)}%` : 'N/A'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(run.overallStatus)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/awareness/impact/calibration/${run.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}