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
import { ArrowLeft, Edit, Shield, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { useVendorRiskAssessmentById } from '@/modules/grc/hooks/useThirdPartyRisk';
import { format } from 'date-fns';
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
            <h1 className="text-3xl font-bold">{t('riskAssessment.details')}</h1>
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
            {t('common.edit')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Shield className="h-4 w-4 mr-2" />
            {t('common.overview')}
          </TabsTrigger>
          <TabsTrigger value="scores">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t('riskAssessment.scores')}
          </TabsTrigger>
          <TabsTrigger value="findings">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('riskAssessment.findings')}
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            {t('common.documents')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('riskAssessment.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('riskAssessment.assessmentType')}</p>
                <p className="font-medium">{assessment.assessment_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('riskAssessment.assessmentDate')}</p>
                <p className="font-medium">
                  {assessment.assessment_date 
                    ? format(new Date(assessment.assessment_date), 'dd/MM/yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('riskAssessment.assessor')}</p>
                <p className="font-medium">{assessment.assessor_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('riskAssessment.nextReviewDate')}</p>
                <p className="font-medium">
                  {assessment.next_review_date 
                    ? format(new Date(assessment.next_review_date), 'dd/MM/yyyy')
                    : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          {assessment.executive_summary && (
            <Card>
              <CardHeader>
                <CardTitle>{t('riskAssessment.executiveSummary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{assessment.executive_summary}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scores Tab */}
        <TabsContent value="scores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t('riskAssessment.securityScore')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {assessment.security_score ?? 'N/A'}
                  {assessment.security_score && <span className="text-lg text-muted-foreground">/100</span>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {t('riskAssessment.complianceScore')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {assessment.compliance_score ?? 'N/A'}
                  {assessment.compliance_score && <span className="text-lg text-muted-foreground">/100</span>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  {t('riskAssessment.overallScore')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {assessment.overall_risk_score ?? 'N/A'}
                  {assessment.overall_risk_score && <span className="text-lg text-muted-foreground">/100</span>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('riskAssessment.riskCategories')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{t('riskAssessment.dataSecurity')}</span>
                    <span className="text-sm text-muted-foreground">
                      {assessment.data_security_score ?? 'N/A'}/100
                    </span>
                  </div>
                  {assessment.data_security_score && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${assessment.data_security_score}%` }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{t('riskAssessment.operationalRisk')}</span>
                    <span className="text-sm text-muted-foreground">
                      {assessment.operational_risk_score ?? 'N/A'}/100
                    </span>
                  </div>
                  {assessment.operational_risk_score && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${assessment.operational_risk_score}%` }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{t('riskAssessment.financialRisk')}</span>
                    <span className="text-sm text-muted-foreground">
                      {assessment.financial_risk_score ?? 'N/A'}/100
                    </span>
                  </div>
                  {assessment.financial_risk_score && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${assessment.financial_risk_score}%` }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{t('riskAssessment.reputationalRisk')}</span>
                    <span className="text-sm text-muted-foreground">
                      {assessment.reputational_risk_score ?? 'N/A'}/100
                    </span>
                  </div>
                  {assessment.reputational_risk_score && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${assessment.reputational_risk_score}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('riskAssessment.keyFindings')}</CardTitle>
            </CardHeader>
            <CardContent>
              {assessment.key_findings ? (
                <p className="whitespace-pre-wrap">{assessment.key_findings}</p>
              ) : (
                <p className="text-muted-foreground">{t('riskAssessment.noFindings')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('riskAssessment.recommendations')}</CardTitle>
            </CardHeader>
            <CardContent>
              {assessment.recommendations ? (
                <p className="whitespace-pre-wrap">{assessment.recommendations}</p>
              ) : (
                <p className="text-muted-foreground">{t('riskAssessment.noRecommendations')}</p>
              )}
            </CardContent>
          </Card>

          {assessment.remediation_plan && (
            <Card>
              <CardHeader>
                <CardTitle>{t('riskAssessment.remediationPlan')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{assessment.remediation_plan}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('common.documents')}</CardTitle>
            </CardHeader>
            <CardContent>
              {assessment.evidence_files && assessment.evidence_files.length > 0 ? (
                <div className="space-y-2">
                  {assessment.evidence_files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1">{file}</span>
                      <Button size="sm" variant="outline">
                        {t('common.download')}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t('common.noDocuments')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
