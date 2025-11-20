// Gate-I • Part 3A — Awareness Insights Dashboard Page Skeleton
// Gate-I • Part 4A — RBAC & Access Control for Awareness Insights
// Gate-I • Part 4B — Export Integration with Gate-F Reports Engine
// Gate-I • Part 4C — QA Hooks & Audit Logging for Awareness Insights
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/core/components/ui/dropdown-menu';
import { RefreshCw, ShieldAlert, AlertCircle, Download } from 'lucide-react';
import { useCan } from '@/core/rbac';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useAwarenessKPIs } from '@/modules/analytics/hooks/useAwarenessKPIs';
import { useAwarenessTrend } from '@/modules/analytics/hooks/useAwarenessTrend';
import { useCampaignsList } from '@/modules/campaigns';
import { useAwarenessExport } from '@/modules/awareness/hooks/useAwarenessExport';
import { useAuditLog } from '@/lib/audit/log-event';
import { getDateRangeFromPreset } from '@/lib/analytics/dateRangePresets';
import type { AwarenessFilters } from '@/modules/campaigns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/core/components/ui/alert';
import KpiCard from '@/modules/analytics/components/KpiCard';
import { QADebugPanel } from '@/modules/awareness/components/calibration-impact/QADebugPanel';

export default function AwarenessInsightsPage() {
  // Gate-I • Part 4A — RBAC & Access Control for Awareness Insights
  const can = useCan();
  const { tenantId } = useAppContext();

  // Check permission for awareness insights
  const hasInsightsPermission = can('awareness.insights.view');
  const canExport = can('export_reports');
  
  // Gate-I • Part 4B — Export Integration
  const { exportCampaignInsights, exportTimeseries, isExporting } = useAwarenessExport();
  
  // Gate-I • Part 4C — Audit Logging
  const { logAwarenessInsights } = useAuditLog();
  
  // Gate-I • Part 4C — QA Mode (enabled via env or localStorage)
  const [qaMode] = useState(() => {
    // Check localStorage first (for manual QA testing)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('GATE_I_QA_MODE') === 'true';
    }
    return false;
  });

  const [filters, setFilters] = useState<AwarenessFilters>({
    dateRange: '30d',
    status: 'all',
  });

  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Compute actual date range
  const actualFilters = useMemo(() => {
    const dateRange =
      filters.dateRange === 'custom'
        ? { dateFrom: filters.dateFrom, dateTo: filters.dateTo }
        : getDateRangeFromPreset(filters.dateRange);

    return {
      ...filters,
      ...dateRange,
      campaignId: selectedCampaign === 'all' ? undefined : selectedCampaign,
    };
  }, [filters, selectedCampaign]);

  // Fetch campaigns for dropdown (tenant-isolated via RLS)
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useCampaignsList({
    page: 1,
    filters: {
      q: '',
      status: 'all',
      from: '',
      to: '',
      owner: '',
      includeArchived: false,
      pageSize: 1000,
      sortBy: 'created_at',
      sortDir: 'desc',
    },
  });

  // Fetch analytics data (tenant-isolated via context and RLS)
  const {
    data: kpisData,
    isLoading: isLoadingKPIs,
    refetch: refetchKPIs,
    error: kpisError,
  } = useAwarenessKPIs(actualFilters);

  const {
    data: trendData,
    isLoading: isLoadingTrend,
    refetch: refetchTrend,
    error: trendError,
  } = useAwarenessTrend(actualFilters);

  // Gate-I • Part 4C — Collect errors for QA panel
  const errors = useMemo(() => {
    const errorList: string[] = [];
    if (kpisError) errorList.push(`KPI Error: ${kpisError}`);
    if (trendError) errorList.push(`Trend Error: ${trendError}`);
    return errorList;
  }, [kpisError, trendError]);

  // Format trend data for charts - MUST be before early returns
  const chartData = useMemo(() => {
    if (!trendData) return [];
    
    // TODO: Replace with actual engagement_rate and completion_rate from awareness_insights_timeseries_view
    return trendData.map((item) => {
      const started = item.started_delta || 0;
      const completed = item.completed_delta || 0;
      
      // Mock calculation for engagement/completion rates (0-100 scale)
      // This should be replaced with actual rate columns from the view
      const engagementRate = started > 0 ? Math.min(started * 2.5, 100) : 0;
      const completionRate = completed > 0 ? Math.min(completed * 3, 100) : 0;
      
      return {
        date: format(new Date(item.day), 'MMM dd'),
        engagementRate: parseFloat(engagementRate.toFixed(1)),
        completionRate: parseFloat(completionRate.toFixed(1)),
      };
    });
  }, [trendData]);

  // Gate-I • Part 4C — Audit log page view on mount
  useEffect(() => {
    if (hasInsightsPermission && tenantId) {
      logAwarenessInsights('awareness_insights.viewed', 'page_view', {
        selected_campaign_id: selectedCampaign === 'all' ? null : selectedCampaign,
        date_range: filters.dateRange,
        timestamp: new Date().toISOString(),
      });
    }
  }, []); // Only on mount

  // Handle refresh
  const handleRefresh = () => {
    refetchKPIs();
    refetchTrend();
    setLastRefreshed(new Date());
  };

  // Gate-I • Part 4B — Export handlers
  const handleExportCampaignInsights = (format: 'csv' | 'json') => {
    exportCampaignInsights(format, {
      campaignId: selectedCampaign === 'all' ? undefined : selectedCampaign,
      dateFrom: getDateRangeStart(filters.dateRange),
      dateTo: undefined,
    });
  };

  const handleExportTimeseries = (format: 'csv' | 'json') => {
    exportTimeseries(format, {
      campaignId: selectedCampaign === 'all' ? undefined : selectedCampaign,
      dateFrom: getDateRangeStart(filters.dateRange),
      dateTo: undefined,
    });
  };

  // Helper to get date range start
  const getDateRangeStart = (range: string): string | undefined => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
      case '30d':
        return new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
      case '90d':
        return new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
      case 'this_month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      default:
        return undefined;
    }
  };

  // Gate-I • Part 4A — Access Denied UI
  if (!hasInsightsPermission) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to view Awareness Insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Insufficient Permissions</AlertTitle>
              <AlertDescription>
                This page requires one of the following roles: Admin, Analyst, Manager, or Viewer.
                Please contact your system administrator to request access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gate-I • Part 4A — Tenant Validation
  if (!tenantId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Tenant Required</CardTitle>
            <CardDescription className="text-center">
              Unable to load tenant context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>
                No tenant context found. Please log out and log back in, or contact support if the issue persists.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gate-I • Part 4C — Error State (Data Fetch Failures)
  if (kpisError || trendError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Awareness Insights Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Campaign performance, engagement, and awareness metrics
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-center">Failed to Load Analytics Data</CardTitle>
              <CardDescription className="text-center">
                We encountered an error while fetching your awareness insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className="text-xs font-mono mt-2">
                  {kpisError ? `KPI Error: ${kpisError}` : ''}
                  {kpisError && trendError ? <br /> : ''}
                  {trendError ? `Trend Error: ${trendError}` : ''}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/admin'} className="flex-1">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Gate-I • Part 4A — Empty State (No Data)
  // Show empty state ONLY if there are truly no campaigns in the system
  // Don't show empty state just because totalParticipants is 0 - show the dashboard with 0 values instead
  const hasNoCampaigns = !isLoadingCampaigns && (!campaignsData || campaignsData.length === 0);

  if (hasNoCampaigns) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Awareness Insights Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Campaign performance, engagement, and awareness metrics
          </p>
        </div>

        {/* Empty State */}
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-muted p-3">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <CardTitle className="text-center">No Awareness Insights Yet</CardTitle>
              <CardDescription className="text-center">
                Create and run at least one awareness campaign to see analytics here
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Once you create a campaign and participants start engaging with it,
                you'll see comprehensive analytics and insights on this page.
              </p>
              <Button asChild>
                <a href="/admin/campaigns/new">Create Your First Campaign</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // TODO: Replace with actual data from awareness_feedback_insights_view
  // Mock feedback distribution data (scores 1-5)
  const feedbackDistribution = [
    { score: '1 Star', count: 5 },
    { score: '2 Stars', count: 12 },
    { score: '3 Stars', count: 28 },
    { score: '4 Stars', count: 45 },
    { score: '5 Stars', count: 67 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Awareness Insights Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Campaign performance, engagement, and awareness metrics
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Last refreshed: {format(lastRefreshed, 'PPp')}
          </p>
        </div>
        
        {/* Gate-I • Part 4B — Export Menu */}
        {canExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isExporting || isLoadingKPIs}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Campaign Insights</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => handleExportCampaignInsights('csv')}
                disabled={isExporting}
              >
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExportCampaignInsights('json')}
                disabled={isExporting}
              >
                Export as JSON
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Timeseries Data</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => handleExportTimeseries('csv')}
                disabled={isExporting}
              >
                Export Trends (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExportTimeseries('json')}
                disabled={isExporting}
              >
                Export Trends (JSON)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Campaign Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Campaign</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaignsData?.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select
                value={filters.dateRange}
                onValueChange={(value: any) =>
                  setFilters((prev) => ({ ...prev, dateRange: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last Quarter</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <Button onClick={handleRefresh} disabled={isLoadingKPIs || isLoadingTrend}>
              <RefreshCw className={`mr-2 h-4 w-4 ${(isLoadingKPIs || isLoadingTrend) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Engagement Rate Card */}
        <KpiCard
          title="Engagement Rate"
          value={((kpisData?.aggregated?.started || 0) / (kpisData?.aggregated?.totalParticipants || 1) * 100)}
          change={8.5}
          loading={isLoadingKPIs}
        />

        {/* Completion Rate Card */}
        <KpiCard
          title="Completion Rate"
          value={((kpisData?.aggregated?.completed || 0) / (kpisData?.aggregated?.totalParticipants || 1) * 100)}
          change={12.3}
          loading={isLoadingKPIs}
        />

        {/* Active Participants % Card */}
        <KpiCard
          title="Active Participants"
          value={(((kpisData?.aggregated?.started || 0) + (kpisData?.aggregated?.completed || 0)) / 
            (kpisData?.aggregated?.totalParticipants || 1) * 100)}
          change={-3.2}
          loading={isLoadingKPIs}
        />

        {/* Feedback Coverage Card */}
        <KpiCard
          title="Average Feedback Score"
          value={kpisData?.aggregated?.avgScore || 0}
          change={5.7}
          suffix=""
          loading={isLoadingKPIs}
        />
      </div>

      {/* Gate-I • Part 3C — Charts and Trends Section Implementation */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Engagement & Completion Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement & Completion Trend</CardTitle>
            <CardDescription>Daily engagement and completion rates over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTrend ? (
              <Skeleton className="h-[350px] w-full" />
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No trend data available for the selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: '%', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="engagementRate" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    name="Engagement Rate"
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2.5}
                    name="Completion Rate"
                    dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Feedback Score Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Score Distribution</CardTitle>
            <CardDescription>Distribution of participant feedback scores (1-5 scale)</CardDescription>
          </CardHeader>
          <CardContent>
            {/* TODO: Connect to awareness_feedback_insights_view once API ready */}
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={feedbackDistribution} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="score" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Score', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]}
                  fill="hsl(var(--primary))"
                >
                  {feedbackDistribution.map((entry, index) => {
                    // Color gradient from red (low) to green (high)
                    const colors = [
                      'hsl(0, 70%, 50%)',      // Score 1: Red
                      'hsl(30, 70%, 50%)',     // Score 2: Orange
                      'hsl(45, 70%, 50%)',     // Score 3: Yellow
                      'hsl(90, 60%, 50%)',     // Score 4: Light Green
                      'hsl(120, 60%, 40%)',    // Score 5: Green
                    ];
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[index] || 'hsl(var(--primary))'} 
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gate-I • Part 4C — QA Debug Panel */}
      {qaMode && (
        <QADebugPanel
          kpiData={kpisData?.aggregated}
          trendDataCount={trendData?.length}
          errors={errors}
          isVisible={qaMode}
        />
      )}

      {/* Data Table Section (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Summary</CardTitle>
          <CardDescription>Overview of all campaigns with key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: Add data table with sorting and pagination */}
          <div className="text-center py-8 text-muted-foreground">
            Campaign summary table - coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
