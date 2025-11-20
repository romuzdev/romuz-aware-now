/**
 * Action Plan Report Builder Component
 * M11: Advanced customizable report templates for action plans
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import {
  FileText,
  Download,
  Settings,
  Filter,
  Calendar,
  User,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { useGateHExportJSON, useGateHExportCSV } from '../hooks';
import type { GateHExportFilters } from '../types/actions.types';

interface ReportField {
  id: string;
  label: string;
  description: string;
  selected: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
}

const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'summary',
    name: 'تقرير ملخص',
    description: 'نظرة عامة سريعة على الإجراءات',
    fields: ['title', 'status', 'priority', 'assignee', 'due_date', 'progress'],
  },
  {
    id: 'detailed',
    name: 'تقرير تفصيلي',
    description: 'جميع التفاصيل والمعلومات',
    fields: ['title', 'description', 'status', 'priority', 'assignee', 'owner', 'due_date', 'created_at', 'updated_at', 'progress', 'milestones', 'dependencies'],
  },
  {
    id: 'executive',
    name: 'تقرير تنفيذي',
    description: 'للإدارة العليا',
    fields: ['title', 'status', 'priority', 'progress', 'health_score', 'blockers'],
  },
  {
    id: 'performance',
    name: 'تقرير الأداء',
    description: 'تحليل الأداء والإنتاجية',
    fields: ['title', 'status', 'progress', 'created_at', 'closed_at', 'cycle_time', 'assignee'],
  },
];

const AVAILABLE_FIELDS: ReportField[] = [
  { id: 'title', label: 'العنوان', description: 'عنوان الإجراء', selected: true },
  { id: 'description', label: 'الوصف', description: 'وصف تفصيلي', selected: false },
  { id: 'status', label: 'الحالة', description: 'حالة الإجراء الحالية', selected: true },
  { id: 'priority', label: 'الأولوية', description: 'مستوى الأولوية', selected: true },
  { id: 'assignee', label: 'المسؤول', description: 'الشخص المكلف', selected: true },
  { id: 'owner', label: 'المالك', description: 'مالك الإجراء', selected: false },
  { id: 'due_date', label: 'الموعد النهائي', description: 'تاريخ الاستحقاق', selected: true },
  { id: 'created_at', label: 'تاريخ الإنشاء', description: 'تاريخ إنشاء الإجراء', selected: false },
  { id: 'updated_at', label: 'آخر تحديث', description: 'تاريخ آخر تحديث', selected: false },
  { id: 'closed_at', label: 'تاريخ الإغلاق', description: 'تاريخ إتمام الإجراء', selected: false },
  { id: 'progress', label: 'نسبة الإنجاز', description: 'نسبة التقدم المئوية', selected: true },
  { id: 'milestones', label: 'المعالم', description: 'المعالم المحققة', selected: false },
  { id: 'dependencies', label: 'التبعيات', description: 'الإجراءات المرتبطة', selected: false },
  { id: 'health_score', label: 'مؤشر الصحة', description: 'مؤشر صحة الإجراء', selected: false },
  { id: 'blockers', label: 'المعوقات', description: 'العوائق والمشاكل', selected: false },
  { id: 'cycle_time', label: 'مدة التنفيذ', description: 'الوقت من البداية للنهاية', selected: false },
];

interface ActionPlanReportBuilderProps {
  tenantId?: string;
}

export function ActionPlanReportBuilder({ tenantId }: ActionPlanReportBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('summary');
  const [fields, setFields] = useState<ReportField[]>(AVAILABLE_FIELDS);
  const [reportName, setReportName] = useState('تقرير خطة العمل');
  
  // Filters
  const [filters, setFilters] = useState<GateHExportFilters>({
    fromDate: null,
    toDate: null,
    statuses: null,
    priorities: null,
    assigneeId: null,
    overdueOnly: false,
  });

  const exportJSON = useGateHExportJSON();
  const exportCSV = useGateHExportCSV();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFields(fields.map(f => ({
        ...f,
        selected: template.fields.includes(f.id),
      })));
    }
  };

  const handleFieldToggle = (fieldId: string) => {
    setFields(fields.map(f =>
      f.id === fieldId ? { ...f, selected: !f.selected } : f
    ));
  };

  const handleExportJSON = () => {
    const selectedFields = fields.filter(f => f.selected).map(f => f.id);
    exportJSON.mutate(filters);
  };

  const handleExportCSV = () => {
    const selectedFields = fields.filter(f => f.selected).map(f => f.id);
    exportCSV.mutate(filters);
  };

  const handlePreview = () => {
    // TODO: Implement preview functionality
    console.log('Preview report with filters:', filters);
  };

  const selectedFieldsCount = fields.filter(f => f.selected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                منشئ التقارير المتقدم
              </CardTitle>
              <CardDescription>
                قم بإنشاء تقارير مخصصة لخطط العمل مع خيارات تصدير متعددة
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              {selectedFieldsCount} حقل محدد
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="report-name">اسم التقرير</Label>
              <Input
                id="report-name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="أدخل اسم التقرير"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handlePreview} variant="outline" size="sm">
                <Eye className="h-4 w-4 ml-2" />
                معاينة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates & Fields Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                قوالب جاهزة
              </CardTitle>
              <CardDescription>
                اختر قالب جاهز أو قم بتخصيص الحقول بنفسك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DEFAULT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`p-4 rounded-lg border-2 text-right transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <h4 className="font-semibold text-foreground mb-1">
                      {template.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      {template.fields.length} حقل
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fields Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                الحقول المتاحة
              </CardTitle>
              <CardDescription>
                حدد الحقول التي تريد تضمينها في التقرير
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-start space-x-3 space-x-reverse"
                  >
                    <Checkbox
                      id={field.id}
                      checked={field.selected}
                      onCheckedChange={() => handleFieldToggle(field.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={field.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {field.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Export */}
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" />
                الفلاتر
              </CardTitle>
              <CardDescription>
                قم بتصفية البيانات المراد تضمينها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  النطاق الزمني
                </Label>
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={filters.fromDate || ''}
                    onChange={(e) =>
                      setFilters({ ...filters, fromDate: e.target.value || null })
                    }
                    placeholder="من تاريخ"
                  />
                  <Input
                    type="date"
                    value={filters.toDate || ''}
                    onChange={(e) =>
                      setFilters({ ...filters, toDate: e.target.value || null })
                    }
                    placeholder="إلى تاريخ"
                  />
                </div>
              </div>

              <Separator />

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm">الحالة</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="new">جديد</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="blocked">محظور</SelectItem>
                    <SelectItem value="verify">للتحقق</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label className="text-sm">الأولوية</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأولويات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأولويات</SelectItem>
                    <SelectItem value="critical">حرجة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Overdue Only */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="overdue"
                  checked={filters.overdueOnly || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, overdueOnly: checked as boolean })
                  }
                />
                <Label
                  htmlFor="overdue"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  المتأخرة فقط
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-4 w-4" />
                التصدير
              </CardTitle>
              <CardDescription>
                قم بتصدير التقرير بالصيغة المطلوبة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleExportJSON}
                disabled={exportJSON.isPending}
                className="w-full"
                variant="outline"
              >
                <FileText className="h-4 w-4 ml-2" />
                {exportJSON.isPending ? 'جاري التصدير...' : 'تصدير JSON'}
              </Button>
              
              <Button
                onClick={handleExportCSV}
                disabled={exportCSV.isPending}
                className="w-full"
                variant="outline"
              >
                <FileSpreadsheet className="h-4 w-4 ml-2" />
                {exportCSV.isPending ? 'جاري التصدير...' : 'تصدير Excel (CSV)'}
              </Button>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  سيتم تنزيل التقرير بناءً على الحقول والفلاتر المحددة
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
