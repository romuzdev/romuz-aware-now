/**
 * GRC Platform - Executive Reports Page
 * High-level executive summary reports
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Shield,
  Target,
  Calendar,
  Users,
  Activity
} from 'lucide-react';

export default function ExecutiveReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('quarter');

  // Mock executive data
  const executiveData = {
    overview: {
      total_risks: 142,
      critical_issues: 23,
      risk_reduction_rate: 12,
      control_effectiveness: 87,
    },
    top_risks: [
      { id: '1', title: 'مخاطر الأمن السيبراني - البنية التحتية', score: 95, status: 'critical', owner: 'أحمد محمد', trend: 'up' },
      { id: '2', title: 'مخاطر الامتثال التنظيمي', score: 88, status: 'high', owner: 'فاطمة علي', trend: 'stable' },
      { id: '3', title: 'مخاطر خصوصية البيانات', score: 82, status: 'high', owner: 'محمد سعيد', trend: 'down' },
      { id: '4', title: 'مخاطر استمرارية الأعمال', score: 75, status: 'medium', owner: 'سارة أحمد', trend: 'down' },
      { id: '5', title: 'مخاطر سلسلة التوريد', score: 68, status: 'medium', owner: 'خالد عبدالله', trend: 'stable' },
    ],
    key_actions: [
      { action: 'تحديث خطة استمرارية الأعمال', priority: 'high', deadline: '2025-04-15', responsible: 'إدارة المخاطر', status: 'in_progress' },
      { action: 'تنفيذ ضوابط أمن إضافية', priority: 'high', deadline: '2025-04-30', responsible: 'أمن المعلومات', status: 'pending' },
      { action: 'مراجعة السياسات التنظيمية', priority: 'medium', deadline: '2025-05-15', responsible: 'الامتثال', status: 'in_progress' },
      { action: 'تدريب الموظفين على الأمن', priority: 'medium', deadline: '2025-06-01', responsible: 'الموارد البشرية', status: 'pending' },
    ],
    trends: {
      risk_trend: 'improving',
      compliance_score: 87,
      risk_exposure: 234000,
    },
    departments: [
      { name: 'تقنية المعلومات', risks: 45, compliance: 82, kpis: 'ضعيف' },
      { name: 'المالية', risks: 28, compliance: 95, kpis: 'ممتاز' },
      { name: 'العمليات', risks: 35, compliance: 88, kpis: 'جيد' },
      { name: 'الموارد البشرية', risks: 19, compliance: 92, kpis: 'جيد' },
      { name: 'المبيعات', risks: 15, compliance: 78, kpis: 'مقبول' },
    ],
  };

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
    // TODO: Implement PDF export
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel...');
    // TODO: Implement Excel export
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">حرج</Badge>;
      case 'high':
        return <Badge className="bg-orange-600">عالي</Badge>;
      case 'medium':
        return <Badge variant="secondary">متوسط</Badge>;
      case 'low':
        return <Badge variant="outline">منخفض</Badge>;
      default:
        return <Badge>عادي</Badge>;
    }
  };

  const getActionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">مكتمل</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-600">قيد التنفيذ</Badge>;
      case 'pending':
        return <Badge variant="secondary">معلق</Badge>;
      default:
        return <Badge>غير محدد</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">التقارير التنفيذية</h1>
          <p className="text-muted-foreground mt-2">
            ملخص تنفيذي شامل لحالة إدارة المخاطر والامتثال
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="flex gap-2">
        <Button 
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('month')}
        >
          شهري
        </Button>
        <Button 
          variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('quarter')}
        >
          ربع سنوي
        </Button>
        <Button 
          variant={selectedPeriod === 'year' ? 'default' : 'outline'}
          onClick={() => setSelectedPeriod('year')}
        >
          سنوي
        </Button>
      </div>

      {/* Executive Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المخاطر</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executiveData.overview.total_risks}</div>
            <p className="text-xs text-muted-foreground">
              +12% عن الفترة السابقة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">القضايا الحرجة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {executiveData.overview.critical_issues}
            </div>
            <p className="text-xs text-muted-foreground">
              تتطلب اهتمام فوري
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تحسن المخاطر</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {executiveData.overview.risk_reduction_rate}%
            </div>
            <p className="text-xs text-muted-foreground">
              انخفاض في المخاطر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فعالية الضوابط</CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {executiveData.overview.control_effectiveness}%
            </div>
            <p className="text-xs text-muted-foreground">
              +5% عن الربع الماضي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="risks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="risks">أهم المخاطر</TabsTrigger>
          <TabsTrigger value="actions">الإجراءات الرئيسية</TabsTrigger>
          <TabsTrigger value="departments">أداء الإدارات</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
        </TabsList>

        {/* Top Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أهم 5 مخاطر</CardTitle>
              <CardDescription>المخاطر ذات الأولوية العالية التي تتطلب انتباه الإدارة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executiveData.top_risks.map((risk, index) => (
                  <div key={risk.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold">{risk.title}</h4>
                        {getStatusBadge(risk.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          المسؤول: {risk.owner}
                        </span>
                        <span className="flex items-center gap-1">
                          الاتجاه: {getTrendIcon(risk.trend)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{risk.score}</div>
                      <div className="text-xs text-muted-foreground">درجة المخاطرة</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات الرئيسية المطلوبة</CardTitle>
              <CardDescription>خطوات العمل الحرجة والمواعيد النهائية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executiveData.key_actions.map((action, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      {action.priority === 'high' ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Target className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold">{action.action}</h4>
                        {getActionStatusBadge(action.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {action.responsible}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          الموعد: {new Date(action.deadline).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Performance Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أداء الإدارات</CardTitle>
              <CardDescription>تقييم المخاطر والامتثال ومؤشرات الأداء حسب الإدارة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executiveData.departments.map((dept, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{dept.name}</h4>
                      <Badge variant={dept.kpis === 'ممتاز' ? 'default' : 'secondary'}>
                        {dept.kpis}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">المخاطر</p>
                        <p className="text-xl font-bold">{dept.risks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">الامتثال</p>
                        <p className="text-xl font-bold text-green-600">{dept.compliance}%</p>
                      </div>
                      <div className="flex items-center justify-end">
                        <Button variant="outline" size="sm">التفاصيل</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التوصيات الإستراتيجية</CardTitle>
              <CardDescription>توصيات الإدارة العليا لتحسين وضع المخاطر والامتثال</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">تعزيز الأمن السيبراني</h4>
                    <p className="text-sm text-muted-foreground">
                      تنفيذ ضوابط أمنية إضافية للبنية التحتية الحرجة وزيادة الاستثمار في تقنيات الحماية المتقدمة.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">تحديث برنامج التوعية</h4>
                    <p className="text-sm text-muted-foreground">
                      تطوير برامج تدريبية شاملة للموظفين حول المخاطر السيبرانية وأفضل الممارسات الأمنية.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">مراجعة السياسات التنظيمية</h4>
                    <p className="text-sm text-muted-foreground">
                      تحديث السياسات الحالية لتتماشى مع أحدث المتطلبات التنظيمية والمعايير الدولية.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">تعزيز خطط استمرارية الأعمال</h4>
                    <p className="text-sm text-muted-foreground">
                      إجراء اختبارات دورية لخطط استمرارية الأعمال والتعافي من الكوارث وتحديثها بناءً على السيناريوهات الحديثة.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
