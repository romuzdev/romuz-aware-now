/**
 * Control Performance Chart Component
 * Displays control effectiveness and performance metrics
 */

import React from 'react';
import { useControlPerformanceReport } from '@/modules/grc/hooks/useReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const COLORS = {
  effective: 'hsl(var(--success))',
  ineffective: 'hsl(var(--destructive))',
  partiallyEffective: 'hsl(var(--warning))',
  notTested: 'hsl(var(--muted))',
};

export const ControlPerformanceChart: React.FC = () => {
  const { data: performanceData, isLoading } = useControlPerformanceReport();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!performanceData) return null;

  // Prepare data for charts
  const effectivenessData = [
    { name: 'فعالة', value: performanceData.effectiveRate, color: COLORS.effective },
    { name: 'غير مختبرة', value: 100 - performanceData.effectiveRate, color: COLORS.notTested },
  ];

  const byTypeData = Object.entries(performanceData.byType).map(([type, data]) => ({
    name: type,
    effective: data.effective,
    ineffective: data.ineffective,
    total: data.total,
  }));

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الضوابط
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.totalControls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              معدل الفعالية
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {performanceData.effectiveRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              نسبة التغطية
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.testingCoverage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ضوابط متأخرة
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {performanceData.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Effectiveness Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>معدل الفعالية الإجمالي</CardTitle>
            <CardDescription>
              نسبة الضوابط الفعالة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={effectivenessData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {effectivenessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Type Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الفعالية حسب النوع</CardTitle>
            <CardDescription>
              توزيع الضوابط حسب النوع والفعالية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="effective" fill={COLORS.effective} name="فعالة" />
                  <Bar dataKey="ineffective" fill={COLORS.ineffective} name="غير فعالة" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Category Table */}
      <Card>
        <CardHeader>
          <CardTitle>الفعالية حسب الفئة</CardTitle>
          <CardDescription>
            معدل الفعالية لكل فئة من الضوابط
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(performanceData.byCategory).map(([category, data]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium">{category}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {data.total} ضابطة
                  </span>
                  <span className={`text-sm font-bold ${
                    data.effectiveRate >= 80 ? 'text-success' :
                    data.effectiveRate >= 60 ? 'text-warning' :
                    'text-destructive'
                  }`}>
                    {data.effectiveRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
