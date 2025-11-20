/**
 * Audit Analytics Dashboard Component
 * M12: Comprehensive analytics and insights for audit management
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Target,
  Shield,
  Activity,
  Calendar
} from 'lucide-react';

interface AuditAnalyticsDashboardProps {
  auditId?: string;
  timeframe?: 'month' | 'quarter' | 'year' | 'all';
}

export function AuditAnalyticsDashboard({
  auditId,
  timeframe = 'month'
}: AuditAnalyticsDashboardProps) {
  // Mock data - replace with actual data from hooks
  const stats = {
    totalAudits: 45,
    completedAudits: 32,
    inProgressAudits: 10,
    plannedAudits: 3,
    totalFindings: 127,
    criticalFindings: 8,
    resolvedFindings: 98,
    avgResolutionDays: 12,
    complianceRate: 85,
    riskScore: 65
  };

  const findingsBySeverity = [
    { severity: 'حرجة', count: 8, percentage: 6.3, color: '#ef4444' },
    { severity: 'عالية', count: 23, percentage: 18.1, color: '#f97316' },
    { severity: 'متوسطة', count: 56, percentage: 44.1, color: '#eab308' },
    { severity: 'منخفضة', count: 40, percentage: 31.5, color: '#3b82f6' }
  ];

  const findingsByCategory = [
    { category: 'التحكم في الوصول', count: 28 },
    { category: 'إدارة التكوين', count: 22 },
    { category: 'أمن الموظفين', count: 18 },
    { category: 'الاستجابة للحوادث', count: 15 },
    { category: 'حماية البيانات', count: 12 },
    { category: 'أخرى', count: 32 }
  ];

  const auditTimeline = [
    { month: 'يناير', planned: 4, completed: 3, findings: 12 },
    { month: 'فبراير', planned: 5, completed: 4, findings: 15 },
    { month: 'مارس', planned: 6, completed: 5, findings: 18 },
    { month: 'أبريل', planned: 5, completed: 5, findings: 14 },
    { month: 'مايو', planned: 4, completed: 3, findings: 11 },
    { month: 'يونيو', planned: 6, completed: 5, findings: 19 }
  ];

  const complianceRadar = [
    { category: 'الأمن السيبراني', score: 85 },
    { category: 'إدارة المخاطر', score: 78 },
    { category: 'الخصوصية', score: 92 },
    { category: 'التدقيق الداخلي', score: 88 },
    { category: 'الحوكمة', score: 81 },
    { category: 'الامتثال', score: 86 }
  ];

  const resolutionTrend = [
    { month: 'يناير', avgDays: 15, resolved: 8 },
    { month: 'فبراير', avgDays: 13, resolved: 12 },
    { month: 'مارس', avgDays: 11, resolved: 15 },
    { month: 'أبريل', avgDays: 12, resolved: 18 },
    { month: 'مايو', avgDays: 10, resolved: 22 },
    { month: 'يونيو', avgDays: 9, resolved: 23 }
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="إجمالي عمليات التدقيق"
          value={stats.totalAudits}
          icon={FileText}
          trend={+12}
          subtitle="مقارنة بالشهر الماضي"
        />
        <StatCard
          title="النتائج النشطة"
          value={stats.totalFindings - stats.resolvedFindings}
          icon={AlertCircle}
          trend={-8}
          subtitle="انخفاض 8% عن الشهر السابق"
          trendColor="text-green-600"
        />
        <StatCard
          title="معدل الامتثال"
          value={`${stats.complianceRate}%`}
          icon={Shield}
          trend={+5}
          subtitle="تحسن بنسبة 5%"
          trendColor="text-green-600"
        />
        <StatCard
          title="متوسط الحل"
          value={`${stats.avgResolutionDays} يوم`}
          icon={Clock}
          trend={-3}
          subtitle="أسرع بـ 3 أيام"
          trendColor="text-green-600"
        />
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="findings">النتائج</TabsTrigger>
          <TabsTrigger value="compliance">الامتثال</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Audit Status */}
            <Card>
              <CardHeader>
                <CardTitle>حالة عمليات التدقيق</CardTitle>
                <CardDescription>التوزيع حسب الحالة</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'مكتمل', value: stats.completedAudits, color: '#22c55e' },
                        { name: 'قيد التنفيذ', value: stats.inProgressAudits, color: '#f97316' },
                        { name: 'مخطط', value: stats.plannedAudits, color: '#3b82f6' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'مكتمل', value: stats.completedAudits, color: '#22c55e' },
                        { name: 'قيد التنفيذ', value: stats.inProgressAudits, color: '#f97316' },
                        { name: 'مخطط', value: stats.plannedAudits, color: '#3b82f6' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Findings by Severity */}
            <Card>
              <CardHeader>
                <CardTitle>النتائج حسب الأهمية</CardTitle>
                <CardDescription>إجمالي {stats.totalFindings} نتيجة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {findingsBySeverity.map((item) => (
                    <div key={item.severity} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.severity}</span>
                        <span className="text-muted-foreground">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>الجدول الزمني لعمليات التدقيق</CardTitle>
              <CardDescription>المخطط مقابل المُنفَّذ</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={auditTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="planned" name="مخطط" fill="#3b82f6" />
                  <Bar dataKey="completed" name="مكتمل" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Findings by Category */}
            <Card>
              <CardHeader>
                <CardTitle>النتائج حسب الفئة</CardTitle>
                <CardDescription>توزيع الفئات</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={findingsByCategory} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resolution Trend */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاه الحل</CardTitle>
                <CardDescription>متوسط أيام الحل والنتائج المحلولة</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resolutionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgDays"
                      name="متوسط الأيام"
                      stroke="#f97316"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="resolved"
                      name="النتائج المحلولة"
                      stroke="#22c55e"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Critical Findings Alert */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-900">النتائج الحرجة</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-red-600">{stats.criticalFindings}</p>
                  <p className="text-sm text-red-800">نتائج حرجة تتطلب اهتماماً فورياً</p>
                </div>
                <Badge variant="destructive" className="text-lg">
                  عاجل
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Compliance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>نظرة عامة على الامتثال</CardTitle>
                <CardDescription>التقييم عبر المجالات</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={complianceRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="النقاط"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compliance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>مؤشرات الامتثال</CardTitle>
                <CardDescription>المقاييس الرئيسية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {complianceRadar.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-muted-foreground">{item.score}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اتجاهات النتائج الشهرية</CardTitle>
              <CardDescription>النتائج المكتشفة على مدار الوقت</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={auditTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="findings"
                    name="النتائج"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="grid grid-cols-3 gap-4">
            <InsightCard
              icon={TrendingUp}
              title="تحسن الأداء"
              description="معدل الحل تحسن بنسبة 25% خلال الربع الأخير"
              color="text-green-600"
            />
            <InsightCard
              icon={Target}
              title="الهدف المحقق"
              description="تم إكمال 95% من عمليات التدقيق المخططة"
              color="text-blue-600"
            />
            <InsightCard
              icon={AlertCircle}
              title="مجال يحتاج تركيز"
              description="التحكم في الوصول يحتاج مزيد من الاهتمام"
              color="text-orange-600"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: number;
  subtitle?: string;
  trendColor?: string;
}

function StatCard({ title, value, icon: Icon, trend, subtitle, trendColor }: StatCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;
  const defaultTrendColor = trend && trend > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                <TrendIcon className={`h-4 w-4 ${trendColor || defaultTrendColor}`} />
                <span className={`text-sm ${trendColor || defaultTrendColor}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// Insight Card Component
interface InsightCardProps {
  icon: any;
  title: string;
  description: string;
  color: string;
}

function InsightCard({ icon: Icon, title, description, color }: InsightCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-6 w-6 ${color} flex-shrink-0`} />
          <div>
            <h4 className="font-semibold mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
