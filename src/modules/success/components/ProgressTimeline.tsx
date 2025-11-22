/**
 * M25 - Progress Timeline Component
 */

import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useHealthScore } from '../hooks';

export function ProgressTimeline() {
  const { healthTrend } = useHealthScore();

  // Transform data for chart
  const chartData = healthTrend.map((snapshot) => ({
    date: new Date(snapshot.snapshot_date).toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
    }),
    'الإجمالي': snapshot.overall_score,
    'التبني': snapshot.adoption_score,
    'جودة البيانات': snapshot.data_quality_score,
    'الامتثال': snapshot.compliance_score,
    'المخاطر': snapshot.risk_hygiene_score,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          تطور نقاط الصحة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            لا توجد بيانات كافية لعرض التطور
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="الإجمالي"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="التبني"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="جودة البيانات"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="الامتثال"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="المخاطر"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
