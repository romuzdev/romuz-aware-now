/**
 * GRC Audit Details Page
 * Detailed view of an audit with findings
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { useAuditById, useAuditFindings } from '@/modules/grc';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function AuditDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: audit, isLoading: auditLoading } = useAuditById(id!);
  const { data: findings, isLoading: findingsLoading } = useAuditFindings({ audit_id: id });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      planned: 'secondary',
      in_progress: 'default',
      fieldwork_complete: 'default',
      report_draft: 'secondary',
      report_final: 'default',
      closed: 'secondary',
    };
    const labels: Record<string, string> = {
      planned: 'مخطط',
      in_progress: 'قيد التنفيذ',
      fieldwork_complete: 'العمل الميداني مكتمل',
      report_draft: 'مسودة التقرير',
      report_final: 'التقرير النهائي',
      closed: 'مغلق',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'secondary',
      informational: 'secondary',
    };
    const labels: Record<string, string> = {
      critical: 'حرجة',
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
      informational: 'معلوماتية',
    };
    return <Badge variant={variants[severity]}>{labels[severity]}</Badge>;
  };

  const getFindingStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      open: 'destructive',
      in_progress: 'default',
      resolved: 'default',
      verified: 'default',
      accepted_risk: 'secondary',
      closed: 'secondary',
    };
    const labels: Record<string, string> = {
      open: 'مفتوحة',
      in_progress: 'قيد المعالجة',
      resolved: 'تم الحل',
      verified: 'تم التحقق',
      accepted_risk: 'مخاطر مقبولة',
      closed: 'مغلقة',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (auditLoading || findingsLoading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  if (!audit) {
    return <div className="p-6">التدقيق غير موجود</div>;
  }

  const criticalFindings = findings?.filter(f => f.severity === 'critical').length || 0;
  const highFindings = findings?.filter(f => f.severity === 'high').length || 0;
  const openFindings = findings?.filter(f => f.finding_status === 'open').length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/grc/audits')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{audit.audit_title_ar || audit.audit_title}</h1>
              {getStatusBadge(audit.audit_status)}
            </div>
            <p className="text-muted-foreground">{audit.audit_code}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/grc/audits/${id}/edit`)}>
          <Edit className="ml-2 h-4 w-4" />
          تعديل
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-muted-foreground">نتائج حرجة</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{criticalFindings}</div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-muted-foreground">نتائج عالية</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{highFindings}</div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">إجمالي النتائج</span>
          </div>
          <div className="text-2xl font-bold">{findings?.length || 0}</div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-muted-foreground">نتائج مفتوحة</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{openFindings}</div>
        </Card>
      </div>

      {/* Audit Details & Findings */}
      <Tabs defaultValue="findings" className="w-full">
        <TabsList>
          <TabsTrigger value="findings">النتائج</TabsTrigger>
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
          <TabsTrigger value="schedule">الجدول الزمني</TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرمز</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الخطورة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الاكتشاف</TableHead>
                  <TableHead>تاريخ الإغلاق المستهدف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {findings && findings.length > 0 ? (
                  findings.map((finding) => (
                    <TableRow key={finding.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{finding.finding_code}</TableCell>
                      <TableCell className="font-medium">
                        {finding.finding_title_ar || finding.finding_title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{finding.finding_type}</Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(finding.severity)}</TableCell>
                      <TableCell>{getFindingStatusBadge(finding.finding_status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {finding.identified_date
                          ? format(new Date(finding.identified_date), 'dd/MM/yyyy', { locale: ar })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {finding.target_closure_date
                          ? format(new Date(finding.target_closure_date), 'dd/MM/yyyy', { locale: ar })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      لا توجد نتائج
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
              <p className="text-muted-foreground">
                {audit.audit_description_ar || audit.audit_description || 'لا يوجد وصف'}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">نوع التدقيق</h3>
                <p className="text-muted-foreground">{audit.audit_type}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">النطاق</h3>
                <p className="text-muted-foreground">{audit.audit_scope || 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">المدقق الرئيسي</h3>
                <p className="text-muted-foreground">{audit.lead_auditor_id || 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">التقييم الإجمالي</h3>
                <p className="text-muted-foreground">{audit.overall_rating || 'N/A'}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">تاريخ البدء المخطط</h3>
                  <p className="text-muted-foreground">
                    {audit.planned_start_date
                      ? format(new Date(audit.planned_start_date), 'dd MMMM yyyy', { locale: ar })
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">تاريخ الانتهاء المخطط</h3>
                  <p className="text-muted-foreground">
                    {audit.planned_end_date
                      ? format(new Date(audit.planned_end_date), 'dd MMMM yyyy', { locale: ar })
                      : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">تاريخ البدء الفعلي</h3>
                  <p className="text-muted-foreground">
                    {audit.actual_start_date
                      ? format(new Date(audit.actual_start_date), 'dd MMMM yyyy', { locale: ar })
                      : 'لم يبدأ بعد'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">تاريخ الانتهاء الفعلي</h3>
                  <p className="text-muted-foreground">
                    {audit.actual_end_date
                      ? format(new Date(audit.actual_end_date), 'dd MMMM yyyy', { locale: ar })
                      : 'لم ينته بعد'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
