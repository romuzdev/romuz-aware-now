/**
 * Compliance Automation Dashboard
 * Phase 3: GRC Enhancement
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { useComplianceDashboard } from '@/modules/grc';

export default function ComplianceAutomationDashboard() {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading } = useComplianceDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  const totalFrameworks = dashboardData?.length || 0;
  const avgComplianceScore = dashboardData?.reduce((sum, f) => sum + f.compliance_score, 0) / totalFrameworks || 0;
  const improvingFrameworks = dashboardData?.filter(f => f.trend_direction === 'improving').length || 0;
  const decliningFrameworks = dashboardData?.filter(f => f.trend_direction === 'declining').length || 0;

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendLabel = (direction: string) => {
    switch (direction) {
      case 'improving':
        return 'تحسن';
      case 'declining':
        return 'تراجع';
      default:
        return 'مستقر';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">أتمتة الامتثال</h1>
            <p className="text-muted-foreground">
              اكتشاف وإدارة فجوات الامتثال تلقائياً
            </p>
          </div>
          <Button onClick={() => navigate('/grc/automation/gaps')}>
            <Zap className="ml-2 h-4 w-4" />
            إدارة الفجوات
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الامتثال</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgComplianceScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              عبر {totalFrameworks} إطار عمل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أطر العمل النشطة</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFrameworks}</div>
            <p className="text-xs text-muted-foreground">
              قيد المراقبة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التحسن</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{improvingFrameworks}</div>
            <p className="text-xs text-muted-foreground">
              إطار عمل في تحسن
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التراجع</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{decliningFrameworks}</div>
            <p className="text-xs text-muted-foreground">
              إطار عمل في تراجع
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Frameworks Compliance Details */}
      <Card>
        <CardHeader>
          <CardTitle>حالة الامتثال حسب الإطار</CardTitle>
          <CardDescription>
            نظرة عامة مفصلة على حالة الامتثال لكل إطار عمل
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dashboardData && dashboardData.length > 0 ? (
            dashboardData.map((framework) => (
              <div key={framework.framework_id} className="space-y-3 pb-6 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{framework.framework_name}</h3>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getTrendIcon(framework.trend_direction)}
                        {getTrendLabel(framework.trend_direction)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        آخر تقييم: {new Date(framework.last_assessment_date).toLocaleDateString('ar-SA')}
                      </span>
                      <span>
                        {framework.total_requirements} متطلب
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{framework.compliance_score}%</div>
                    <p className="text-xs text-muted-foreground">نسبة الامتثال</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress value={framework.compliance_score} className="h-2" />
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">
                        ممتثل: <strong>{framework.compliant_count}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-muted-foreground">
                        جزئي: <strong>{framework.partial_compliant_count}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-muted-foreground">
                        غير ممتثل: <strong>{framework.non_compliant_count}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-gray-600" />
                      <span className="text-muted-foreground">
                        غير مقيّم: <strong>{framework.not_assessed_count}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/grc/automation/gaps?framework=${framework.framework_id}`)}
                  >
                    عرض الفجوات
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/grc/frameworks/${framework.framework_id}`)}
                  >
                    التفاصيل
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد بيانات امتثال متاحة</p>
              <p className="text-sm mt-2">قم بإضافة أطر عمل وتقييم المتطلبات للبدء</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
