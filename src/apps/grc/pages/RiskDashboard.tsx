/**
 * GRC Platform - Risk Dashboard Page
 * Overview dashboard for risk management
 */

import { Card } from '@/core/components/ui/card';
import { useRiskStatistics } from '@/modules/grc/hooks/useRisks';
import { AlertTriangle, TrendingUp, Shield, Activity } from 'lucide-react';

export default function RiskDashboard() {
  const { data: stats, isLoading } = useRiskStatistics();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">لوحة معلومات المخاطر</h1>
        <p className="text-muted-foreground">
          نظرة عامة على حالة المخاطر المؤسسية
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                إجمالي المخاطر
              </p>
              <p className="text-3xl font-bold">{stats?.total_risks || 0}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                مخاطر نشطة
              </p>
              <p className="text-3xl font-bold">{stats?.active_risks || 0}</p>
            </div>
            <Activity className="h-12 w-12 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                مخاطر عالية/حرجة
              </p>
              <p className="text-3xl font-bold text-destructive">
                {stats?.high_critical_risks || 0}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-destructive" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                تحتاج مراجعة
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {stats?.risks_needing_review || 0}
              </p>
            </div>
            <Shield className="h-12 w-12 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* By Category */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">المخاطر حسب الفئة</h3>
          <div className="space-y-3">
            {stats &&
              Object.entries(stats.by_category).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(count / (stats.total_risks || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* By Level */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">المخاطر حسب المستوى</h3>
          <div className="space-y-3">
            {stats &&
              Object.entries(stats.by_level).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm">{level}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          level === 'very_high'
                            ? 'bg-destructive'
                            : level === 'high'
                            ? 'bg-orange-500'
                            : level === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${(count / (stats.total_risks || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Risk Scores */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">متوسط نقاط المخاطر</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              المخاطر الأساسية (Inherent)
            </p>
            <p className="text-4xl font-bold">
              {stats?.average_inherent_score.toFixed(1) || '0.0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              المخاطر المتبقية (Residual)
            </p>
            <p className="text-4xl font-bold text-green-600">
              {stats?.average_residual_score.toFixed(1) || '0.0'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
