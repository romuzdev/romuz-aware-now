/**
 * GRC Dashboard Page
 * Main entry point for GRC module
 */

import { Shield, AlertTriangle, CheckCircle2, FileCheck, TrendingUp } from 'lucide-react';
import { PageHeader, StatCard } from '@/core/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function GRCDashboard() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Shield}
        title="إدارة المخاطر والامتثال"
        description="منصة متكاملة لإدارة الحوكمة والمخاطر والامتثال"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المخاطر"
          value="24"
          icon={AlertTriangle}
          trend={{ value: 12, isPositive: false }}
          description="5 مخاطر عالية"
        />
        <StatCard
          title="الضوابط النشطة"
          value="156"
          icon={CheckCircle2}
          trend={{ value: 8, isPositive: true }}
          description="92% نسبة الفعالية"
        />
        <StatCard
          title="متطلبات الامتثال"
          value="48"
          icon={FileCheck}
          trend={{ value: 5, isPositive: true }}
          description="45 مكتملة"
        />
        <StatCard
          title="نسبة الامتثال"
          value="94%"
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
          description="+3% عن الشهر الماضي"
        />
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/grc/risks')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              إدارة المخاطر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              تحديد وتقييم وإدارة المخاطر التنظيمية
            </p>
            <Button variant="outline" className="mt-4 w-full">
              عرض المخاطر
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/grc/controls')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              الضوابط الأمنية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              إدارة ومراقبة فعالية الضوابط الأمنية
            </p>
            <Button variant="outline" className="mt-4 w-full">
              عرض الضوابط
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/grc/compliance')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              الامتثال التنظيمي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              متابعة الامتثال للمعايير واللوائح
            </p>
            <Button variant="outline" className="mt-4 w-full">
              عرض الامتثال
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/grc/reports')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              التقارير والتحليلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              تقارير شاملة عن المخاطر والامتثال
            </p>
            <Button variant="outline" className="mt-4 w-full">
              عرض التقارير
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/platform/alerts')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              التنبيهات والإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              إدارة التنبيهات التلقائية للمخاطر
            </p>
            <Button variant="outline" className="mt-4 w-full">
              عرض التنبيهات
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/platform/automation')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              الأتمتة وسير العمل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              أتمتة العمليات والإجراءات الأمنية
            </p>
            <Button variant="outline" className="mt-4 w-full">
              عرض الأتمتة
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-3 border-b">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">تم تحديث تقييم المخاطرة "R-2024-001"</p>
                <p className="text-xs text-muted-foreground">منذ ساعتين</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">تم اعتماد ضابط أمني جديد</p>
                <p className="text-xs text-muted-foreground">منذ 4 ساعات</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">تم إكمال تقرير الامتثال الشهري</p>
                <p className="text-xs text-muted-foreground">أمس</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
