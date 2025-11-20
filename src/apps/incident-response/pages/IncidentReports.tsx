/**
 * M18: Incident Response - Reports & Analytics Page
 */

import { useState } from 'react';
import { PageHeader } from '@/core/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Calendar } from '@/core/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/ui/popover';
import { useIncidentStatistics } from '../hooks';
import { IncidentMetricsChart } from '../components';
import { Download, Calendar as CalendarIcon, TrendingUp, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/core/components/ui/skeleton';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function IncidentReports() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');
  const [period, setPeriod] = useState<'7days' | '30days' | 'month' | 'custom'>('30days');

  const { data: stats, isLoading } = useIncidentStatistics({
    startDate: dateRange.from.toISOString(),
    endDate: dateRange.to.toISOString(),
  });

  const handlePeriodChange = (value: string) => {
    setPeriod(value as any);
    
    const now = new Date();
    switch (value) {
      case '7days':
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case '30days':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case 'month':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Export PDF');
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log('Export Excel');
  };

  // Calculate KPIs
  const totalIncidents = stats?.total || 0;
  const criticalIncidents = stats?.bySeverity.critical || 0;
  const activeIncidents = (stats?.byStatus.open || 0) + (stats?.byStatus.investigating || 0);
  const resolvedIncidents = stats?.byStatus.resolved || 0;
  const avgResolutionTime = '4.2'; // TODO: Calculate from actual data

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? 'التقارير والتحليلات' : 'Reports & Analytics'}
        description={isRTL ? 'تقارير وتحليلات شاملة للحوادث الأمنية' : 'Comprehensive security incident reports and analytics'}
      />

      {/* Filters & Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isRTL ? 'خيارات التقرير' : 'Report Options'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Period Selection */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                {isRTL ? 'الفترة الزمنية' : 'Time Period'}
              </label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">
                    {isRTL ? 'آخر 7 أيام' : 'Last 7 Days'}
                  </SelectItem>
                  <SelectItem value="30days">
                    {isRTL ? 'آخر 30 يوم' : 'Last 30 Days'}
                  </SelectItem>
                  <SelectItem value="month">
                    {isRTL ? 'هذا الشهر' : 'This Month'}
                  </SelectItem>
                  <SelectItem value="custom">
                    {isRTL ? 'فترة مخصصة' : 'Custom Period'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            {period === 'custom' && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">
                  {isRTL ? 'من - إلى' : 'Date Range'}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from && dateRange.to ? (
                        <>
                          {format(dateRange.from, 'PP', { locale: isRTL ? ar : undefined })} -{' '}
                          {format(dateRange.to, 'PP', { locale: isRTL ? ar : undefined })}
                        </>
                      ) : (
                        <span>{isRTL ? 'اختر الفترة' : 'Pick a range'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range: any) => {
                        if (range?.from && range?.to) {
                          setDateRange({ from: range.from, to: range.to });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Report Type */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                {isRTL ? 'نوع التقرير' : 'Report Type'}
              </label>
              <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">
                    {isRTL ? 'تقرير ملخص' : 'Summary Report'}
                  </SelectItem>
                  <SelectItem value="detailed">
                    {isRTL ? 'تقرير تفصيلي' : 'Detailed Report'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Buttons */}
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? 'إجمالي الحوادث' : 'Total Incidents'}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalIncidents}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'في الفترة المحددة' : 'In selected period'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? 'حوادث حرجة' : 'Critical Incidents'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{criticalIncidents}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'تتطلب اهتماماً فورياً' : 'Require immediate attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? 'حوادث نشطة' : 'Active Incidents'}
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-warning">{activeIncidents}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'قيد المعالجة' : 'Under investigation'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? 'متوسط وقت الحل' : 'Avg Resolution Time'}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{avgResolutionTime}h</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'ساعة' : 'hours'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            {isRTL ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="severity">
            {isRTL ? 'حسب الخطورة' : 'By Severity'}
          </TabsTrigger>
          <TabsTrigger value="status">
            {isRTL ? 'حسب الحالة' : 'By Status'}
          </TabsTrigger>
          <TabsTrigger value="type">
            {isRTL ? 'حسب النوع' : 'By Type'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
              <>
                <Skeleton className="h-[300px]" />
                <Skeleton className="h-[300px]" />
              </>
            ) : (
              <>
                <IncidentMetricsChart type="severity" data={stats?.bySeverity} />
                <IncidentMetricsChart type="status" data={stats?.byStatus} />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="severity">
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <IncidentMetricsChart type="severity" data={stats?.bySeverity} height={400} />
          )}
        </TabsContent>

        <TabsContent value="status">
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <IncidentMetricsChart type="status" data={stats?.byStatus} height={400} />
          )}
        </TabsContent>

        <TabsContent value="type">
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <IncidentMetricsChart type="type" data={stats?.byType} height={400} />
          )}
        </TabsContent>
      </Tabs>

      {/* Detailed Statistics */}
      {reportType === 'detailed' && (
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? 'إحصائيات تفصيلية' : 'Detailed Statistics'}</CardTitle>
            <CardDescription>
              {isRTL ? 'تحليل شامل للحوادث في الفترة المحددة' : 'Comprehensive incident analysis for selected period'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Severity Breakdown */}
              <div>
                <h4 className="font-medium mb-2">{isRTL ? 'توزيع الخطورة' : 'Severity Breakdown'}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{isRTL ? 'حرج' : 'Critical'}</span>
                    <span className="font-bold text-destructive">{stats?.bySeverity.critical || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{isRTL ? 'عالي' : 'High'}</span>
                    <span className="font-bold text-destructive">{stats?.bySeverity.high || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{isRTL ? 'متوسط' : 'Medium'}</span>
                    <span className="font-bold">{stats?.bySeverity.medium || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{isRTL ? 'منخفض' : 'Low'}</span>
                    <span className="font-bold text-success">{stats?.bySeverity.low || 0}</span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div>
                <h4 className="font-medium mb-2">{isRTL ? 'توزيع الحالات' : 'Status Breakdown'}</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{isRTL ? 'مفتوح' : 'Open'}</span>
                    <span className="font-bold">{stats?.byStatus.open || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{isRTL ? 'قيد التحقيق' : 'Investigating'}</span>
                    <span className="font-bold">{stats?.byStatus.investigating || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{isRTL ? 'محتوى' : 'Contained'}</span>
                    <span className="font-bold">{stats?.byStatus.contained || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{isRTL ? 'محلول' : 'Resolved'}</span>
                    <span className="font-bold text-success">{stats?.byStatus.resolved || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{isRTL ? 'مغلق' : 'Closed'}</span>
                    <span className="font-bold text-muted-foreground">{stats?.byStatus.closed || 0}</span>
                  </div>
                </div>
              </div>

              {/* Type Breakdown */}
              <div>
                <h4 className="font-medium mb-2">{isRTL ? 'توزيع الأنواع' : 'Type Breakdown'}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stats?.byType && Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                      <span className="font-bold">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
