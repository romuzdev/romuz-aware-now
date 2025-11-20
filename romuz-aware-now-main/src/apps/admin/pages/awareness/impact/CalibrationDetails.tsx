// Gate-J Part 4.4: Calibration Run Details
// Detailed view of a single calibration run with matrix heatmap

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { CalibrationRunSummary } from '@/modules/awareness/components/calibration-impact/calibration/CalibrationRunSummary';
import { CalibrationMatrixHeatmap } from '@/modules/awareness/components/calibration-impact/calibration/CalibrationMatrixHeatmap';
import { ValidationGapsTrend } from '@/modules/awareness/components/calibration-impact/calibration/ValidationGapsTrend';
import { OutlierBucketsTable } from '@/modules/awareness/components/calibration-impact/calibration/OutlierBucketsTable';
import { useCalibrationRunDetails } from '@/modules/awareness/hooks/useCalibrationRunDetails';
import { useCalibrationCells } from '@/modules/awareness/hooks/useCalibrationCells';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function CalibrationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useAppContext();

  const { data: run, isLoading: isLoadingRun } = useCalibrationRunDetails(id!);
  const { data: cells, isLoading: isLoadingCells } = useCalibrationCells(tenantId, id!);

  if (isLoadingRun) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Calibration run not found</p>
            <Button onClick={() => navigate('/platform/awareness/impact/calibration')} className="mt-4">
              Back to List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const outlierCells = cells?.filter(cell => cell.isOutlierBucket) || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/platform/awareness/impact/calibration')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {run.runLabel || `Calibration - ${run.id.slice(0, 8)}`}
            </h1>
            <p className="text-muted-foreground mt-1">
              Model Version {run.modelVersion} • 
              {run.periodStart && run.periodEnd && (
                <> Period: {run.periodStart} to {run.periodEnd}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/awareness/impact/calibration/${id}/weights`)}
          >
            Review Weight Recommendations
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Run Summary */}
      <CalibrationRunSummary run={run} />

      {/* Tabs */}
      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matrix">Calibration Matrix</TabsTrigger>
          <TabsTrigger value="trend">Gap Trends</TabsTrigger>
          <TabsTrigger value="outliers">Outlier Cells</TabsTrigger>
        </TabsList>

        {/* Matrix Heatmap */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calibration Matrix (Heatmap)</CardTitle>
              <CardDescription>
                Distribution of predictions vs actual behavior with color-coded gaps
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCells ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <CalibrationMatrixHeatmap cells={cells || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Gaps Trend */}
        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Gap Trends</CardTitle>
              <CardDescription>
                Evolution of average gap and correlation score over time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ValidationGapsTrend tenantId={tenantId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outlier Buckets */}
        <TabsContent value="outliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outlier Cells</CardTitle>
              <CardDescription>
                Cells with low sample counts (&lt;3) or large gaps (&gt;25)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OutlierBucketsTable cells={outlierCells} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}