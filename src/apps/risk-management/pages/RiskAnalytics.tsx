/**
 * Risk Analytics Page
 * Advanced analytics and visualizations for risk data
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { useRisks, useRiskStatistics } from '@/modules/grc/hooks';
import { RiskTrendsChart, RiskHeatMap } from '../components';
import { BarChart3, TrendingUp, Activity, AlertTriangle } from 'lucide-react';

export default function RiskAnalytics() {
  const { data: risks } = useRisks();
  const { data: stats } = useRiskStatistics();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">تحليلات المخاطر</h1>
        <p className="text-muted-foreground">
          تحليلات متقدمة واتجاهات المخاطر المؤسسية
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط النقاط الأولية</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.average_inherent_score?.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">قبل الضوابط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط النقاط المتبقية</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.average_residual_score?.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">بعد الضوابط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخاطر نشطة</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_risks || 0}</div>
            <p className="text-xs text-muted-foreground">تحت المراقبة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخاطر تحتاج مراجعة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.risks_needing_review || 0}
            </div>
            <p className="text-xs text-muted-foreground">متأخرة عن الجدول</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>اتجاهات المخاطر</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskTrendsChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الخريطة الحرارية للمخاطر</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskHeatMap />
          </CardContent>
        </Card>
      </div>

      {/* Distribution by Level */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع المخاطر حسب المستوى</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.by_level && Object.entries(stats.by_level).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{level}</span>
                <div className="flex items-center gap-2">
                  <div className="w-64 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${((count as number) / (stats.total_risks || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count as number} ({(((count as number) / (stats.total_risks || 1)) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
