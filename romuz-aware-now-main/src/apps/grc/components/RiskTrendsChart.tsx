/**
 * Risk Trends Chart Component
 * Displays risk trends over time
 */

import React, { useState } from 'react';
import { useRiskTrendAnalysis } from '@/modules/grc/hooks/useReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Skeleton } from '@/core/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const RiskTrendsChart: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const { data: trendData, isLoading } = useRiskTrendAnalysis(period);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    if (!trendData) return <Minus className="h-4 w-4" />;
    
    switch (trendData.insights.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-success" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendText = () => {
    if (!trendData) return 'مستقر';
    
    switch (trendData.insights.trend) {
      case 'increasing':
        return 'متزايد';
      case 'decreasing':
        return 'متناقص';
      default:
        return 'مستقر';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>اتجاهات المخاطر</CardTitle>
              <CardDescription>
                تحليل المخاطر عبر الزمن
              </CardDescription>
            </div>
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">يومي</SelectItem>
                <SelectItem value="weekly">أسبوعي</SelectItem>
                <SelectItem value="monthly">شهري</SelectItem>
                <SelectItem value="quarterly">ربع سنوي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {trendData && (
            <>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalRisks" 
                      stroke="hsl(var(--primary))" 
                      name="إجمالي المخاطر"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="criticalRisks" 
                      stroke="hsl(var(--destructive))" 
                      name="المخاطر الحرجة"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgInherentScore" 
                      stroke="hsl(var(--warning))" 
                      name="متوسط الدرجة"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Insights */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  {getTrendIcon()}
                  <span className="font-semibold">الاتجاه: {getTrendText()}</span>
                  <span className="text-sm text-muted-foreground">
                    ({trendData.insights.percentChange.toFixed(1)}%)
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">التوصيات:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {trendData.insights.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
