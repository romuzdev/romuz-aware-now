// Gate-J Part 4.4: Outlier Buckets Table
// Table showing calibration cells marked as outliers

import { Badge } from '@/core/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import type { CalibrationCell } from '@/modules/awareness';

interface OutlierBucketsTableProps {
  cells: CalibrationCell[];
}

const BUCKET_LABELS: Record<string, string> = {
  very_low_risk: 'Very Low',
  low_risk: 'Low',
  medium_risk: 'Medium',
  high_risk: 'High',
  very_good_behavior: 'Excellent',
  good_behavior: 'Good',
  average_behavior: 'Average',
  poor_behavior: 'Poor',
  very_poor_behavior: 'Very Poor',
  overestimate: 'Overestimate',
  underestimate: 'Underestimate',
  balanced: 'Balanced',
};

export function OutlierBucketsTable({ cells }: OutlierBucketsTableProps) {
  if (cells.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No outlier cells in this calibration</p>
        <p className="text-sm text-muted-foreground mt-2">
          All cells contain sufficient samples and gaps within acceptable limits
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Predicted</TableHead>
            <TableHead>Actual Behavior</TableHead>
            <TableHead>Samples</TableHead>
            <TableHead>Avg Gap</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cells.map((cell) => {
            const reason = cell.countSamples < 3 
              ? 'Low samples (< 3)' 
              : (cell.avgGap || 0) > 25 
                ? 'Large gap (> 25)' 
                : 'Outlier cell';

            return (
              <TableRow key={`${cell.predictedBucket}-${cell.actualBucket}`}>
                <TableCell className="font-medium">
                  {BUCKET_LABELS[cell.predictedBucket] || cell.predictedBucket}
                </TableCell>
                <TableCell>
                  {BUCKET_LABELS[cell.actualBucket] || cell.actualBucket}
                </TableCell>
                <TableCell>
                  <Badge variant={cell.countSamples < 3 ? 'destructive' : 'secondary'}>
                    {cell.countSamples}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={(cell.avgGap || 0) > 25 ? 'text-destructive font-semibold' : ''}>
                    {cell.avgGap?.toFixed(2) || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      cell.gapDirection === 'balanced' ? 'secondary' :
                      cell.gapDirection === 'overestimate' ? 'destructive' :
                      'default'
                    }
                  >
                    {BUCKET_LABELS[cell.gapDirection || ''] || cell.gapDirection || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {reason}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}