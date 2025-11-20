// Gate-J Part 4.4: Calibration Dashboard
// Overview of all calibration runs with stats and management

import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { CalibrationStatsCards } from '@/modules/awareness/components/calibration-impact/calibration/CalibrationStatsCards';
import { CalibrationRunsTable } from '@/modules/awareness/components/calibration-impact/calibration/CalibrationRunsTable';
import { NewCalibrationRunDialog } from '@/modules/awareness/components/calibration-impact/calibration/NewCalibrationRunDialog';
import { useCalibrationRuns } from '@/modules/awareness/hooks/useCalibrationRuns';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/ui/popover';
import { Calendar as CalendarComponent } from '@/core/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { format } from 'date-fns';

export default function CalibrationDashboard() {
  const { tenantId } = useAppContext();
  const [isNewRunDialogOpen, setIsNewRunDialogOpen] = useState(false);
  const [modelVersionFilter, setModelVersionFilter] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const { data: runs, isLoading, refetch } = useCalibrationRuns(tenantId, {
    modelVersion: modelVersionFilter,
    periodStart: dateRange.from?.toISOString().split('T')[0],
    periodEnd: dateRange.to?.toISOString().split('T')[0],
  });

  const handleRunCreated = () => {
    refetch();
    setIsNewRunDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Awareness Impact Calibration Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage impact model calibration runs and verify prediction accuracy
            </p>
          </div>
          <Button onClick={() => setIsNewRunDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Run New Calibration
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {/* Model Version Filter */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Model Version
                </label>
                <Select
                  value={modelVersionFilter?.toString() || "all"}
                  onValueChange={(value) => setModelVersionFilter(value === "all" ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Versions" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Versions</SelectItem>
                    <SelectItem value="1">v1</SelectItem>
                    <SelectItem value="2">v2</SelectItem>
                    <SelectItem value="3">v3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Time Period
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'PPP')} - {format(dateRange.to, 'PPP')}
                          </>
                        ) : (
                          format(dateRange.from, 'PPP')
                        )
                      ) : (
                        'Select period'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Clear Filters */}
              <Button
                variant="ghost"
                onClick={() => {
                  setModelVersionFilter(undefined);
                  setDateRange({});
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <CalibrationStatsCards runs={runs || []} />

      {/* Calibration Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Calibration Runs History</CardTitle>
          <CardDescription>
            All executed calibration runs with their results and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalibrationRunsTable 
            runs={runs || []} 
            isLoading={isLoading}
            onRefresh={refetch}
          />
        </CardContent>
      </Card>

      {/* New Run Dialog */}
      <NewCalibrationRunDialog
        open={isNewRunDialogOpen}
        onOpenChange={setIsNewRunDialogOpen}
        onSuccess={handleRunCreated}
      />
    </div>
  );
}
