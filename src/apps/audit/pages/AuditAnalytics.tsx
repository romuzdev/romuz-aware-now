/**
 * Audit Analytics Page - Enhanced
 * M12: Comprehensive analytics dashboard with real-time data
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { AuditAnalyticsDashboard } from '@/modules/grc/components/audit';
import { 
  useAuditCompletionRate, 
  useFindingsSeverityDistribution,
  useAvgFindingClosureTime,
  useAuditTrends,
  useAuditComplianceGaps,
} from '@/modules/grc';
import { Download, FileText, TrendingUp, Calendar, AlertCircle, CheckCircle2, Clock, Target } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

type TimeframeType = 'month' | 'quarter' | 'year' | 'all';

const COLORS = {
  critical: 'hsl(var(--destructive))',
  high: 'hsl(var(--chart-5))',
  medium: 'hsl(var(--chart-3))',
  low: 'hsl(var(--chart-1))',
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
};

export default function AuditAnalytics() {
  const [timeframe, setTimeframe] = useState<TimeframeType>('month');
  const [selectedAuditId, setSelectedAuditId] = useState<string | undefined>(undefined);

  // Calculate date range based on timeframe
  const getDateRange = () => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date();
    
    switch (timeframe) {
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setFullYear(2020); // All time
    }
    
    return { start: start.toISOString().split('T')[0], end };
  };

  const { start, end } = getDateRange();

  // Fetch analytics data
  const { data: completionRate, isLoading: loadingCompletion } = useAuditCompletionRate(start, end);
  const { data: severityDist, isLoading: loadingSeverity } = useFindingsSeverityDistribution(selectedAuditId);
  const { data: closureTime, isLoading: loadingClosure } = useAvgFindingClosureTime(selectedAuditId);
  const { data: trends, isLoading: loadingTrends } = useAuditTrends(6);
  const { data: complianceGaps, isLoading: loadingCompliance } = useAuditComplianceGaps();

  const handleExportReport = () => {
    console.log('Exporting analytics report...', { timeframe, selectedAuditId });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            تحليلات التدقيق
          </h1>
          <p className="text-muted-foreground mt-1">
            تحليلات متقدمة ورؤى شاملة لعمليات التدقيق
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingCompletion ? (
          <Skeleton className="h-32" />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل الإنجاز</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate?.completion_rate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {completionRate?.completed_audits || 0} من {completionRate?.total_audits || 0} عمليات تدقيق
              </p>
            </CardContent>
          </Card>
        )}

        {loadingSeverity ? (
          <Skeleton className="h-32" />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النتائج الحرجة</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {severityDist?.find(s => s.severity === 'critical')?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                من أصل {severityDist?.reduce((sum, s) => sum + Number(s.count), 0) || 0} نتيجة
              </p>
            </CardContent>
          </Card>
        )}

        {loadingClosure ? (
          <Skeleton className="h-32" />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط وقت الحل</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closureTime?.avg_days?.toFixed(1) || 0} يوم</div>
              <p className="text-xs text-muted-foreground">
                الوسيط: {closureTime?.median_days?.toFixed(1) || 0} يوم
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مستوى الامتثال</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceGaps && complianceGaps.length > 0 
                ? Math.round(complianceGaps.reduce((sum, g) => sum + g.compliance_rate, 0) / complianceGaps.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              عبر {complianceGaps?.length || 0} أطر عمل
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>الفلاتر</CardTitle>
          <CardDescription>اختر الفترة الزمنية ونطاق التحليل</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">الفترة الزمنية</label>
              <Select value={timeframe} onValueChange={(value) => setTimeframe(value as TimeframeType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      الشهر الحالي
                    </div>
                  </SelectItem>
                  <SelectItem value="quarter">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      الربع الحالي
                    </div>
                  </SelectItem>
                  <SelectItem value="year">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      السنة الحالية
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      جميع الفترات
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <FileText className="w-4 h-4 ml-2" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="findings">النتائج والملاحظات</TabsTrigger>
          <TabsTrigger value="compliance">الامتثال</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AuditAnalyticsDashboard 
            auditId={selectedAuditId} 
            timeframe={timeframe} 
          />
        </TabsContent>

        <TabsContent value="findings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>توزيع النتائج حسب الخطورة</CardTitle>
                <CardDescription>
                  نسبة النتائج حسب مستوى الخطورة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSeverity ? (
                  <Skeleton className="h-64" />
                ) : severityDist && severityDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={severityDist}
                        dataKey="count"
                        nameKey="severity"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.severity}: ${entry.count}`}
                      >
                        {severityDist.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[entry.severity as keyof typeof COLORS] || COLORS.primary} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>لا توجد بيانات متاحة</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات وقت الحل</CardTitle>
                <CardDescription>
                  تحليل الوقت المستغرق لحل النتائج
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingClosure ? (
                  <Skeleton className="h-64" />
                ) : closureTime ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">المتوسط</p>
                        <p className="text-2xl font-bold">{closureTime.avg_days?.toFixed(1)} يوم</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">الوسيط</p>
                        <p className="text-2xl font-bold">{closureTime.median_days?.toFixed(1)} يوم</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">الأسرع</p>
                        <p className="text-2xl font-bold">{closureTime.min_days} يوم</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">الأبطأ</p>
                        <p className="text-2xl font-bold">{closureTime.max_days} يوم</p>
                      </div>
                    </div>
                    
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={[
                        { name: 'الأسرع', value: closureTime.min_days },
                        { name: 'الوسيط', value: closureTime.median_days },
                        { name: 'المتوسط', value: closureTime.avg_days },
                        { name: 'الأبطأ', value: closureTime.max_days },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS.primary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>لا توجد بيانات متاحة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تحليل فجوات الامتثال</CardTitle>
              <CardDescription>
                مستوى الامتثال عبر أطر العمل المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCompliance ? (
                <Skeleton className="h-64" />
              ) : complianceGaps && complianceGaps.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={complianceGaps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="framework" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="compliant" fill={COLORS.primary} name="متوافق" />
                    <Bar dataKey="gaps" fill={COLORS.critical} name="فجوات" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>لا توجد بيانات متاحة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اتجاهات عمليات التدقيق</CardTitle>
              <CardDescription>
                تتبع عمليات التدقيق المكتملة والجارية عبر الأشهر
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <Skeleton className="h-64" />
              ) : trends && trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke={COLORS.primary} 
                      name="مكتملة" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="in_progress" 
                      stroke={COLORS.secondary} 
                      name="جارية" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>لا توجد بيانات متاحة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
