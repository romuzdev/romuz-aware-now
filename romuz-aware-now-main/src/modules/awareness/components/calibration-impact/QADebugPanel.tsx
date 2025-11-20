// Gate-I • Part 4C — QA Hooks & Audit Logging for Awareness Insights
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { AlertCircle, Bug } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/core/components/ui/alert';

interface QADebugPanelProps {
  kpiData?: {
    totalParticipants?: number;
    started?: number;
    completed?: number;
    avgScore?: number | null;
    completionRate?: number | null;
  };
  trendDataCount?: number;
  errors?: string[];
  isVisible?: boolean;
}

export function QADebugPanel({ 
  kpiData, 
  trendDataCount, 
  errors = [], 
  isVisible = false 
}: QADebugPanelProps) {
  // Only render if QA mode is enabled
  if (!isVisible) return null;

  return (
    <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bug className="h-4 w-4 text-orange-600" />
            Gate-I QA Mode
          </CardTitle>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            Debug Panel
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* KPI Values */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Raw KPI Values:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-background p-2 rounded border">
              <span className="text-muted-foreground">Total Participants:</span>
              <span className="ml-2 font-mono">{kpiData?.totalParticipants ?? 'N/A'}</span>
            </div>
            <div className="bg-background p-2 rounded border">
              <span className="text-muted-foreground">Started:</span>
              <span className="ml-2 font-mono">{kpiData?.started ?? 'N/A'}</span>
            </div>
            <div className="bg-background p-2 rounded border">
              <span className="text-muted-foreground">Completed:</span>
              <span className="ml-2 font-mono">{kpiData?.completed ?? 'N/A'}</span>
            </div>
            <div className="bg-background p-2 rounded border">
              <span className="text-muted-foreground">Avg Score:</span>
              <span className="ml-2 font-mono">
                {kpiData?.avgScore !== null && kpiData?.avgScore !== undefined 
                  ? kpiData.avgScore.toFixed(2) 
                  : 'N/A'}
              </span>
            </div>
            <div className="bg-background p-2 rounded border col-span-2">
              <span className="text-muted-foreground">Completion Rate:</span>
              <span className="ml-2 font-mono">
                {kpiData?.completionRate !== null && kpiData?.completionRate !== undefined
                  ? `${kpiData.completionRate.toFixed(2)}%`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Trend Data Count */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Trend Data:</p>
          <div className="bg-background p-2 rounded border text-xs">
            <span className="text-muted-foreground">Data Points Loaded:</span>
            <span className="ml-2 font-mono">{trendDataCount ?? 0}</span>
          </div>
        </div>

        {/* Backend Errors */}
        {errors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Backend Errors:</p>
            {errors.map((error, idx) => (
              <Alert key={idx} variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs">Error {idx + 1}</AlertTitle>
                <AlertDescription className="text-xs font-mono">
                  {error}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {errors.length === 0 && (
          <div className="text-xs text-muted-foreground italic">
            ✓ No backend errors detected
          </div>
        )}
      </CardContent>
    </Card>
  );
}
