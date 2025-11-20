/**
 * GRC Reports Page
 * Advanced reporting and analytics dashboard
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { RiskHeatMap } from '../components/RiskHeatMap';
import { RiskTrendsChart } from '../components/RiskTrendsChart';
import { ControlPerformanceChart } from '../components/ControlPerformanceChart';
import { ReportExportDialog } from '../components/ReportExportDialog';
import { 
  FileText, 
  TrendingUp, 
  Shield, 
  BarChart3, 
  Download 
} from 'lucide-react';

export default function GRCReports() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التقارير والتحليلات</h1>
          <p className="text-muted-foreground mt-2">
            تقارير متقدمة وتحليلات شاملة لإدارة المخاطر والضوابط
          </p>
        </div>
        <Button onClick={() => setExportDialogOpen(true)}>
          <Download className="mr-2 h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المخاطر
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              +12% عن الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              المخاطر الحرجة
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">23</div>
            <p className="text-xs text-muted-foreground">
              تتطلب اهتمام فوري
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              فعالية الضوابط
            </CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              +5% عن الربع الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              خطط المعالجة النشطة
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">
              68% نسبة الإنجاز
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList>
          <TabsTrigger value="heatmap">خريطة المخاطر</TabsTrigger>
          <TabsTrigger value="trends">التوجهات</TabsTrigger>
          <TabsTrigger value="controls">أداء الضوابط</TabsTrigger>
          <TabsTrigger value="executive">ملخص تنفيذي</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="space-y-4">
          <RiskHeatMap />
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>توزيع المخاطر حسب الفئة</CardTitle>
                <CardDescription>
                  عدد المخاطر في كل فئة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">استراتيجية</span>
                    <span className="font-bold">28</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">تشغيلية</span>
                    <span className="font-bold">45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مالية</span>
                    <span className="font-bold">32</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">امتثال</span>
                    <span className="font-bold">21</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">تقنية</span>
                    <span className="font-bold">16</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع المخاطر حسب الحالة</CardTitle>
                <CardDescription>
                  الحالة الحالية للمخاطر
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">محددة</span>
                    <span className="font-bold">34</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مقيمة</span>
                    <span className="font-bold">56</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">معالجة</span>
                    <span className="font-bold">28</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مراقبة</span>
                    <span className="font-bold">24</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <RiskTrendsChart />
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <ControlPerformanceChart />
        </TabsContent>

        <TabsContent value="executive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الملخص التنفيذي</CardTitle>
              <CardDescription>
                نظرة عامة شاملة لحالة إدارة المخاطر
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">النقاط الرئيسية</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>تم تحديد 23 مخاطر حرجة تتطلب اهتمام فوري</li>
                    <li>معدل فعالية الضوابط عند 87% وهو مؤشر إيجابي</li>
                    <li>34 خطة معالجة نشطة بنسبة إنجاز 68%</li>
                    <li>انخفاض بنسبة 12% في المخاطر الجديدة مقارنة بالربع السابق</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">الإجراءات الموصى بها</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>تسريع تنفيذ خطط المعالجة للمخاطر الحرجة</li>
                    <li>زيادة تكرار اختبار الضوابط في المناطق عالية الخطورة</li>
                    <li>مراجعة استراتيجية إدارة المخاطر التقنية</li>
                    <li>تعزيز برامج التوعية للموظفين</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">التوجهات المستقبلية</h3>
                  <p className="text-sm text-muted-foreground">
                    من المتوقع استقرار مستوى المخاطر خلال الربع القادم مع استمرار
                    تنفيذ خطط المعالجة الحالية. يوصى بالتركيز على المخاطر
                    الاستراتيجية والتقنية نظراً لارتفاع تأثيرها المحتمل.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ReportExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
    </div>
  );
}
