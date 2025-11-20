/**
 * M13.1 - Content Hub: Content Analytics Dashboard
 * لوحة تحليلات المحتوى المتقدمة
 */

import { useState } from 'react';
import { Download, TrendingUp, Eye, Heart, Share2, Users } from 'lucide-react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { useOverviewStats, useTimeSeriesData, useContentTypeDistribution, useTopPerformingContent, useAnalyticsExport } from '../hooks/useContentAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function ContentAnalytics() {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  });

  const { stats, loading: statsLoading } = useOverviewStats(dateRange.start, dateRange.end);
  const { data: timeSeriesData } = useTimeSeriesData(
    dateRange.start,
    dateRange.end,
    'day'
  );
  const { distribution } = useContentTypeDistribution();
  const { topContent } = useTopPerformingContent('engagement', 5);
  const { exportToCSV, exporting } = useAnalyticsExport();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const statCards = [
    {
      title: 'إجمالي المحتوى',
      value: stats?.totalContent || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'إجمالي المشاهدات',
      value: stats?.totalViews || 0,
      icon: Eye,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'إجمالي الإعجابات',
      value: stats?.totalLikes || 0,
      icon: Heart,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      title: 'المستخدمون الفريدون',
      value: stats?.uniqueUsers || 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">تحليلات المحتوى</h2>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على أداء المحتوى والتفاعل
          </p>
        </div>
        <Button
          onClick={() => exportToCSV(dateRange.start, dateRange.end)}
          disabled={exporting}
        >
          <Download className="h-4 w-4 ml-2" />
          {exporting ? 'جاري التصدير...' : 'تصدير CSV'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">النشاط عبر الزمن</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#8884d8" name="المشاهدات" />
              <Line type="monotone" dataKey="likes" stroke="#82ca9d" name="الإعجابات" />
              <Line type="monotone" dataKey="shares" stroke="#ffc658" name="المشاركات" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Content Type Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">توزيع أنواع المحتوى</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percentage }) => `${type}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Performing Content */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">أفضل المحتويات أداءً</h3>
        <div className="space-y-3">
          {topContent.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد بيانات كافية بعد
            </p>
          ) : (
            topContent.map((content, index) => (
              <div
                key={content.contentId}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{content.contentTitle}</h4>
                  <p className="text-sm text-muted-foreground">{content.contentType}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{content.totalViews.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>{content.totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <span>{content.totalShares.toLocaleString()}</span>
                  </div>
                  <div className="text-primary font-semibold">
                    {content.engagementScore} نقطة
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <h4 className="font-semibold mb-2">متوسط التفاعل</h4>
          <p className="text-3xl font-bold">{stats?.avgEngagement || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">تفاعل لكل محتوى</p>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold mb-2">معدل المشاركة</h4>
          <p className="text-3xl font-bold">
            {stats && stats.totalViews > 0
              ? ((stats.totalShares / stats.totalViews) * 100).toFixed(1)
              : 0}
            %
          </p>
          <p className="text-sm text-muted-foreground mt-1">من المشاهدات</p>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold mb-2">معدل الإعجاب</h4>
          <p className="text-3xl font-bold">
            {stats && stats.totalViews > 0
              ? ((stats.totalLikes / stats.totalViews) * 100).toFixed(1)
              : 0}
            %
          </p>
          <p className="text-sm text-muted-foreground mt-1">من المشاهدات</p>
        </Card>
      </div>
    </div>
  );
}
