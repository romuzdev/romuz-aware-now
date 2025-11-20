// Gate-F: Reports Dashboard
import { useState } from 'react';
import { FileDown, RefreshCw, Trash2, Calendar, Filter } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useReports } from '@/features/gate-p/hooks/useReports';
import { useCampaignsList } from '@/modules/campaigns';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ReportsDashboard() {
  const { 
    exports, 
    dailyKPIs, 
    ctdKPIs, 
    isLoading, 
    filters, 
    setFilters, 
    exportReport,
    deleteExport,
    refreshViews,
    isExporting,
    isDeleting,
    isRefreshing,
  } = useReports();

  const { data: campaigns } = useCampaignsList({ 
    page: 1, 
    filters: { 
      q: '',
      status: 'all',
      from: undefined,
      to: undefined,
      owner: undefined,
      includeArchived: false,
      pageSize: 100, 
      sortBy: 'name', 
      sortDir: 'asc' 
    } 
  });

  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const [selectedReportType, setSelectedReportType] = useState<'performance' | 'deliverability' | 'engagement'>('performance');

  const handleExport = () => {
    exportReport(selectedReportType, selectedFormat);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  // Filter CTD KPIs based on selected campaign
  const filteredKPIs = filters.campaign 
    ? ctdKPIs.filter(k => k.campaignId === filters.campaign)
    : ctdKPIs;

  const totalCampaigns = filteredKPIs.length;
  const totalDeliveries = filteredKPIs.reduce((sum, k) => sum + k.totalDeliveries, 0);
  const avgOpenRate = filteredKPIs.length > 0 
    ? (filteredKPIs.reduce((sum, k) => sum + k.avgOpenRate, 0) / filteredKPIs.length * 100)
    : 0;
  const avgClickRate = filteredKPIs.length > 0
    ? (filteredKPIs.reduce((sum, k) => sum + k.avgCtr, 0) / filteredKPIs.length * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Exports</h1>
          <p className="text-muted-foreground">Manage reports and export data</p>
        </div>
        <Button onClick={() => refreshViews()} disabled={isRefreshing} variant="outline" size="sm">
          <RefreshCw className={`ml-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Select date range and campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input 
                type="date" 
                value={filters.startDate || ''} 
                onChange={e => setFilters({ startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input 
                type="date" 
                value={filters.endDate || ''} 
                onChange={e => setFilters({ endDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Campaign</label>
              <Select value={filters.campaign || 'all'} onValueChange={v => setFilters({ campaign: v === 'all' ? undefined : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => setFilters({ startDate: undefined, endDate: undefined, campaign: undefined })}
                variant="outline"
                className="w-full"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            New Export
          </CardTitle>
          <CardDescription>Create and export a report in selected format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={selectedReportType} onValueChange={(v: any) => setSelectedReportType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="deliverability">Deliverability</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">File Format</label>
              <Select value={selectedFormat} onValueChange={(v: any) => setSelectedFormat(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="w-full"
              >
                <FileDown className="ml-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCampaigns}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalDeliveries.toLocaleString('en')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgOpenRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Click Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgClickRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Exports History */}
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>All previous export requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : exports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exports yet
            </div>
          ) : (
            <div className="space-y-3">
              {exports.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{exp.reportType}</h4>
                      {getStatusBadge(exp.status)}
                      <Badge variant="outline">{exp.fileFormat.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {exp.totalRows.toLocaleString('en')} rows • {formatDistanceToNow(new Date(exp.createdAt), { addSuffix: true })}
                    </p>
                    {exp.errorMessage && (
                      <p className="text-sm text-destructive mt-1">Error: {exp.errorMessage}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {exp.status === 'completed' && exp.storageUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={exp.storageUrl} download>
                          <FileDown className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteExport(exp.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
