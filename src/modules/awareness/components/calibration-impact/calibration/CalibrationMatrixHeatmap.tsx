// Gate-J Part 4.4: Calibration Matrix Heatmap
// Visual heatmap of predicted vs actual buckets

import { Card } from '@/core/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';
import type { CalibrationCell } from '@/modules/awareness';

interface CalibrationMatrixHeatmapProps {
  cells: CalibrationCell[];
}

const PREDICTED_BUCKETS = ['very_low_risk', 'low_risk', 'medium_risk', 'high_risk'];
const ACTUAL_BUCKETS = ['very_good_behavior', 'good_behavior', 'average_behavior', 'poor_behavior', 'very_poor_behavior'];

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
};

export function CalibrationMatrixHeatmap({ cells }: CalibrationMatrixHeatmapProps) {
  // Create a map for quick cell lookup
  const cellMap = new Map<string, CalibrationCell>();
  cells.forEach(cell => {
    const key = `${cell.predictedBucket}:${cell.actualBucket}`;
    cellMap.set(key, cell);
  });

  // Calculate color intensity based on gap and count
  const getHeatColor = (cell?: CalibrationCell) => {
    if (!cell || cell.countSamples === 0) return 'bg-muted/20';
    
    const gap = cell.avgGap || 0;
    
    // Green gradient for good alignment (low gap)
    if (gap <= 10) {
      const intensity = Math.min(100, (10 - gap) * 10);
      return `bg-green-500/${intensity}`;
    }
    
    // Yellow gradient for medium gap
    if (gap <= 20) {
      const intensity = Math.min(100, (20 - gap) * 5 + 50);
      return `bg-yellow-500/${intensity}`;
    }
    
    // Red gradient for large gap
    const intensity = Math.min(100, Math.min(gap * 2, 100));
    return `bg-red-500/${intensity}`;
  };

  const getTextColor = (cell?: CalibrationCell) => {
    if (!cell || cell.countSamples === 0) return 'text-muted-foreground';
    
    const gap = cell.avgGap || 0;
    if (gap <= 10) return 'text-green-900';
    if (gap <= 20) return 'text-yellow-900';
    return 'text-red-900';
  };

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row - Actual Buckets */}
          <div className="flex mb-2">
            <div className="w-32" /> {/* Empty corner */}
            <div className="flex-1 flex gap-2">
              {ACTUAL_BUCKETS.map(bucket => (
                <div key={bucket} className="flex-1 text-center text-sm font-medium">
                  {BUCKET_LABELS[bucket]}
                </div>
              ))}
            </div>
          </div>

          {/* Matrix Rows */}
          {PREDICTED_BUCKETS.map(predictedBucket => (
            <div key={predictedBucket} className="flex gap-2 mb-2">
              {/* Row Label - Predicted Bucket */}
              <div className="w-32 flex items-center justify-end text-sm font-medium px-2">
                {BUCKET_LABELS[predictedBucket]}
              </div>

              {/* Cells */}
              <div className="flex-1 flex gap-2">
                {ACTUAL_BUCKETS.map(actualBucket => {
                  const key = `${predictedBucket}:${actualBucket}`;
                  const cell = cellMap.get(key);

                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <Card
                          className={`flex-1 h-20 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${getHeatColor(cell)}`}
                        >
                          <div className={`text-lg font-bold ${getTextColor(cell)}`}>
                            {cell?.countSamples || 0}
                          </div>
                          {cell && (
                            <div className={`text-xs ${getTextColor(cell)}`}>
                              Δ {cell.avgGap?.toFixed(1)}
                            </div>
                          )}
                        </Card>
                      </TooltipTrigger>
                      {cell && (
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold">
                              {BUCKET_LABELS[predictedBucket]} × {BUCKET_LABELS[actualBucket]}
                            </p>
                            <p className="text-sm">
                              Sample Count: {cell.countSamples}
                            </p>
                            <p className="text-sm">
                              Avg Predicted: {cell.avgPredictedScore?.toFixed(1)}
                            </p>
                            <p className="text-sm">
                              Avg Actual: {cell.avgActualScore?.toFixed(1)}
                            </p>
                            <p className="text-sm">
                              Gap: {cell.avgGap?.toFixed(2)}
                            </p>
                            <p className="text-sm">
                              Direction: {
                                cell.gapDirection === 'overestimate' ? 'Overestimate' :
                                cell.gapDirection === 'underestimate' ? 'Underestimate' :
                                'Balanced'
                              }
                            </p>
                            {cell.isOutlierBucket && (
                              <p className="text-xs text-yellow-500 font-medium">
                                ⚠️ Outlier Cell
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="mt-6 flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>High Accuracy (Δ ≤ 10)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span>Medium Accuracy (Δ ≤ 20)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>Large Gap (Δ &gt; 20)</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}