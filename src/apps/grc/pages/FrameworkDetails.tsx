/**
 * GRC Framework Details Page
 * Detailed view of a compliance framework with requirements
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card } from '@/core/components/ui/card';
import { Progress } from '@/core/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { useComplianceFrameworkById, useComplianceRequirements } from '@/modules/grc';

export default function FrameworkDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: framework, isLoading: frameworkLoading } = useComplianceFrameworkById(id!);
  const { data: requirements, isLoading: requirementsLoading } = useComplianceRequirements({ framework_id: id });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      deprecated: 'destructive',
      under_review: 'secondary',
    };
    const labels: Record<string, string> = {
      active: 'نشط',
      deprecated: 'متوقف',
      under_review: 'قيد المراجعة',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getComplianceStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      compliant: 'default',
      partially_compliant: 'secondary',
      non_compliant: 'destructive',
      not_assessed: 'secondary',
      not_applicable: 'secondary',
    };
    const labels: Record<string, string> = {
      compliant: 'ممتثل',
      partially_compliant: 'ممتثل جزئياً',
      non_compliant: 'غير ممتثل',
      not_assessed: 'لم يُقيّم',
      not_applicable: 'غير قابل للتطبيق',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'secondary',
    };
    const labels: Record<string, string> = {
      critical: 'حرج',
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
    };
    return <Badge variant={variants[priority]}>{labels[priority]}</Badge>;
  };

  if (frameworkLoading || requirementsLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  if (!framework) {
    return <div className="p-6">الإطار غير موجود</div>;
  }

  const compliantCount = requirements?.filter(r => r.compliance_status === 'compliant').length || 0;
  const partialCount = requirements?.filter(r => r.compliance_status === 'partially_compliant').length || 0;
  const nonCompliantCount = requirements?.filter(r => r.compliance_status === 'non_compliant').length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/grc/frameworks')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{framework.framework_name_ar || framework.framework_name}</h1>
              {getStatusBadge(framework.framework_status)}
            </div>
            <p className="text-muted-foreground">{framework.framework_code}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/grc/frameworks/${id}/edit`)}>
          <Edit className="ml-2 h-4 w-4" />
          تعديل
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">نسبة الامتثال</span>
          </div>
          <div className="text-2xl font-bold">{framework.overall_compliance_score || 0}%</div>
          <Progress value={framework.overall_compliance_score || 0} className="h-2 mt-2" />
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">إجمالي المتطلبات</span>
          </div>
          <div className="text-2xl font-bold">{requirements?.length || 0}</div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">ممتثل</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{compliantCount}</div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-muted-foreground">غير ممتثل</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{nonCompliantCount}</div>
        </Card>
      </div>

      {/* Framework Details & Requirements */}
      <Tabs defaultValue="requirements" className="w-full">
        <TabsList>
          <TabsTrigger value="requirements">المتطلبات</TabsTrigger>
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
          <TabsTrigger value="gaps">الفجوات</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرمز</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>حالة الامتثال</TableHead>
                  <TableHead>التقييم الأخير</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements && requirements.length > 0 ? (
                  requirements.map((req) => (
                    <TableRow key={req.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{req.requirement_code}</TableCell>
                      <TableCell className="font-medium">
                        {req.requirement_title_ar || req.requirement_title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{req.category}</Badge>
                      </TableCell>
                      <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                      <TableCell>{getComplianceStatusBadge(req.compliance_status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {req.last_assessment_date
                          ? new Date(req.last_assessment_date).toLocaleDateString('ar-SA')
                          : 'لم يُقيّم'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      لا توجد متطلبات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">الوصف</h3>
              <p className="text-muted-foreground">{framework.description_ar || framework.description || 'لا يوجد وصف'}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">النوع</h3>
                <p className="text-muted-foreground">{framework.framework_type}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">الإصدار</h3>
                <p className="text-muted-foreground">{framework.framework_version || 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">الجهة المصدرة</h3>
                <p className="text-muted-foreground">{framework.issuing_authority || 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">تاريخ السريان</h3>
                <p className="text-muted-foreground">
                  {framework.effective_date
                    ? new Date(framework.effective_date).toLocaleDateString('ar-SA')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card className="p-6 text-center text-muted-foreground">
            عرض فجوات الامتثال قريباً
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
