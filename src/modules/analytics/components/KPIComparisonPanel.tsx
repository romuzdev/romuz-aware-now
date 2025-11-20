/**
 * KPI Comparison Panel
 * M14 Enhancement: Compare KPIs across time periods and modules
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedKPI } from '../types/unified-kpis.types';

interface KPIComparisonPanelProps {
  kpis?: UnifiedKPI[];
  className?: string;
}

type ComparisonPeriod = 'week' | 'month' | 'quarter' | 'year';

interface ComparisonData {
  kpiName: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  module: string;
}

export function KPIComparisonPanel({ kpis = [], className }: KPIComparisonPanelProps) {
  const [period, setPeriod] = useState<ComparisonPeriod>('month');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // Mock comparison data - في التطبيق الحقيقي سيتم جلبها من API
  const comparisonData: ComparisonData[] = kpis.slice(0, 8).map((kpi) => {
    const currentValue = kpi.current_value;
    const previousValue = currentValue * (0.8 + Math.random() * 0.4); // Mock previous value
    const change = currentValue - previousValue;
    const changePercent = (change / previousValue) * 100;
    
    return {
      kpiName: kpi.kpi_name,
      currentValue,
      previousValue,
      change,
      changePercent,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      module: kpi.module,
    };
  });

  const filteredData = selectedModule === 'all' 
    ? comparisonData 
    : comparisonData.filter(d => d.module === selectedModule);

  const modules = Array.from(new Set(kpis.map(k => k.module)));

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const periodLabels: Record<ComparisonPeriod, string> = {
    week: 'الأسبوع الماضي',
    month: 'الشهر الماضي',
    quarter: 'الربع الماضي',
    year: 'السنة الماضية',
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>مقارنة المؤشرات</CardTitle>
            <CardDescription>
              مقارنة الأداء الحالي مع {periodLabels[period]}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="اختر الموديول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموديولات</SelectItem>
                {modules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(v) => setPeriod(v as ComparisonPeriod)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">أسبوعياً</SelectItem>
                <SelectItem value="month">شهرياً</SelectItem>
                <SelectItem value="quarter">ربع سنوي</SelectItem>
                <SelectItem value="year">سنوياً</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات مقارنة متاحة
            </div>
          ) : (
            filteredData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{item.kpiName}</h4>
                  <Badge variant="outline" className="text-xs">
                    {item.module}
                  </Badge>
                </div>

                <div className="flex items-center gap-6">
                  {/* Previous Value */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">السابق</p>
                    <p className="text-sm font-medium">{item.previousValue.toFixed(0)}</p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />

                  {/* Current Value */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">الحالي</p>
                    <p className="text-sm font-bold">{item.currentValue.toFixed(0)}</p>
                  </div>

                  {/* Change */}
                  <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', getTrendColor(item.trend))}>
                    {getTrendIcon(item.trend)}
                    <div className="text-center">
                      <p className="text-xs font-medium">
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}
                      </p>
                      <p className="text-xs">
                        {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
