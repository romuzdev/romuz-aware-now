/**
 * Risk Assessment Details Page
 * Displays detailed information about a vendor risk assessment
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Progress } from '@/core/components/ui/progress';
import { ArrowLeft, Edit, Shield, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { useVendorRiskAssessmentById } from '@/modules/grc/hooks/useThirdPartyRisk';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function RiskAssessmentDetails() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: assessment, isLoading } = useVendorRiskAssessmentById(id!);

  useEffect(() => {
    if (!isLoading && !assessment) {
      navigate('/risk/assessments');
    }
  }, [assessment, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!assessment) return null;

  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/risk/assessments')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">تفاصيل تقييم المخاطر</h1>
            <p className="text-muted-foreground">
              {assessment.assessment_code || assessment.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(assessment.status || 'pending')}>
            {assessment.status || 'pending'}
          </Badge>
          <Badge variant={getRiskLevelColor(assessment.overall_risk_level || 'low')}>
            {assessment.overall_risk_level || 'N/A'}
          </Badge>
          <Button
            onClick={() => navigate(`/risk/assessments/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            تعديل
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Shield className="h-4 w-4 mr-2" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="scores">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            الدرجات
          </TabsTrigger>
          <TabsTrigger value="findings">
            <AlertTriangle className="h-4 w-4 mr-2" />
            التوصيات
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">نوع التقييم</span>
                    <span className="font-medium">{assessment.assessment_type || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">تاريخ التقييم</span>
                    <span className="font-medium">
                      {assessment.assessment_date 
                        ? format(new Date(assessment.assessment_date), 'yyyy-MM-dd', { locale: ar })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">المقيّم</span>
                    <span className="font-medium">{assessment.assessor_name || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">تاريخ المراجعة</span>
                    <span className="font-medium">{assessment.reviewed_at ? format(new Date(assessment.reviewed_at), 'yyyy-MM-dd', { locale: ar }) : 'لم تتم المراجعة'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scores Tab */}
        <TabsContent value="scores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  الدرجة الإجمالية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {assessment.overall_risk_score ?? 'N/A'}
                  {assessment.overall_risk_score && <span className="text-lg text-muted-foreground">/10</span>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>فئات المخاطر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">المخاطر الأمنية</span>
                    <span className="text-sm font-bold">{assessment.security_risk_score}/10</span>
                  </div>
                  <Progress value={assessment.security_risk_score * 10} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">مخاطر الامتثال</span>
                    <span className="text-sm font-bold">{assessment.compliance_risk_score}/10</span>
                  </div>
                  <Progress value={assessment.compliance_risk_score * 10} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">المخاطر التشغيلية</span>
                    <span className="text-sm font-bold">{assessment.operational_risk_score}/10</span>
                  </div>
                  <Progress value={assessment.operational_risk_score * 10} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">المخاطر المالية</span>
                    <span className="text-sm font-bold">{assessment.financial_risk_score}/10</span>
                  </div>
                  <Progress 
                    value={assessment.financial_risk_score * 10} 
                    className="h-2" 
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">المخاطر السمعية</span>
                    <span className="text-sm font-bold">{assessment.reputational_risk_score}/10</span>
                  </div>
                  <Progress 
                    value={assessment.reputational_risk_score * 10} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          {/* Recommendations */}
          {assessment.recommendations_ar && (
            <Card>
              <CardHeader>
                <CardTitle>التوصيات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assessment.recommendations_ar}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}