/**
 * Risk Management Dashboard
 * Main overview page for risk management
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { AlertTriangle, TrendingUp, Shield, Activity } from 'lucide-react';
import { useRisks, useRiskStatistics } from '@/modules/grc/hooks';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function RiskDashboard() {
  const navigate = useNavigate();
  const { data: risks } = useRisks();
  const { data: stats } = useRiskStatistics();

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة إدارة المخاطر</h1>
          <p className="text-muted-foreground">
            نظرة شاملة على المخاطر المؤسسية
          </p>
        </div>
        <Button onClick={() => navigate('/risk/register')}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          عرض سجل المخاطر
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المخاطر</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_risks || 0}</div>
            <p className="text-xs text-muted-foreground">مخاطرة مسجلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخاطر حرجة</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.high_critical_risks || 0}
            </div>
            <p className="text-xs text-muted-foreground">تحتاج معالجة فورية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخاطر عالية</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats?.by_level?.high || 0}
            </div>
            <p className="text-xs text-muted-foreground">تتطلب انتباه</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخاطر نشطة</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.by_status?.identified || 0}
            </div>
            <p className="text-xs text-muted-foreground">قيد المراقبة</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>توزيع المخاطر حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.by_category && Object.entries(stats.by_category).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${((count as number) / (stats.total_risks || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count as number}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أحدث المخاطر المسجلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {risks?.slice(0, 5).map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/risk/register/${risk.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{risk.risk_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {risk.risk_code}
                    </p>
                  </div>
                  <Badge
                    className={getRiskLevelColor(
                      risk.inherent_risk_score > 16
                        ? 'critical'
                        : risk.inherent_risk_score > 12
                        ? 'high'
                        : risk.inherent_risk_score > 8
                        ? 'medium'
                        : 'low'
                    )}
                  >
                    {risk.inherent_risk_score}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
