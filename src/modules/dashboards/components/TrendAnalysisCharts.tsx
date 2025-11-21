/**
 * M14 - Trend Analysis Charts Component
 * Display historical trends and comparisons
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendAnalysisChartsProps {
  period: '7d' | '30d' | '90d' | 'ytd' | '1y';
  refreshKey?: number;
}

export function TrendAnalysisCharts({ period, refreshKey }: TrendAnalysisChartsProps) {
  const { t } = useTranslation();

  // TODO: Replace with real data from API
  const performanceData = [
    { date: '2024-01', risks: 65, compliance: 88, campaigns: 72, audits: 78 },
    { date: '2024-02', risks: 68, compliance: 90, campaigns: 75, audits: 80 },
    { date: '2024-03', risks: 72, compliance: 92, campaigns: 78, audits: 82 },
    { date: '2024-04', risks: 75, compliance: 94, campaigns: 76, audits: 85 },
    { date: '2024-05', risks: 78, compliance: 94, campaigns: 80, audits: 87 },
    { date: '2024-06', risks: 80, compliance: 95, campaigns: 82, audits: 88 },
  ];

  const moduleComparisonData = [
    { module: 'المخاطر', current: 78, previous: 72, target: 85 },
    { module: 'الامتثال', current: 94, previous: 90, target: 95 },
    { module: 'الحملات', current: 76, previous: 70, target: 80 },
    { module: 'التدقيق', current: 85, previous: 80, target: 90 },
    { module: 'الأهداف', current: 70, previous: 65, target: 80 },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Trends Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('trends.performance_over_time', 'أداء الوحدات عبر الزمن')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="risks" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="المخاطر"
              />
              <Line 
                type="monotone" 
                dataKey="compliance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="الامتثال"
              />
              <Line 
                type="monotone" 
                dataKey="campaigns" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="الحملات"
              />
              <Line 
                type="monotone" 
                dataKey="audits" 
                stroke="#f97316" 
                strokeWidth={2}
                name="التدقيق"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Module Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('trends.module_comparison', 'مقارنة أداء الوحدات')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moduleComparisonData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="module" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar dataKey="previous" fill="#94a3b8" name="الفترة السابقة" />
              <Bar dataKey="current" fill="hsl(var(--primary))" name="الفترة الحالية" />
              <Bar dataKey="target" fill="#22c55e" name="الهدف" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Achievement Rate Trends */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('trends.achievement_rate', 'معدل الإنجاز')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="compliance" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
