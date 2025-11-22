/**
 * Contract Details Page
 * Displays detailed information about a vendor contract
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useVendorContractById } from '@/modules/grc/hooks/useThirdPartyRisk';
import { format } from 'date-fns';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useVendorContractById(id!);

  useEffect(() => {
    if (!isLoading && !contract) {
      navigate('/risk/contracts');
    }
  }, [contract, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!contract) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'expired': return 'destructive';
      case 'pending': return 'secondary';
      case 'terminated': return 'outline';
      default: return 'outline';
    }
  };

  const isExpiringSoon = contract.expiry_date && 
    new Date(contract.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/risk/contracts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('contract.details')}</h1>
            <p className="text-muted-foreground">
              {contract.contract_code}
            </p>
            <p className="text-sm text-muted-foreground">
              {contract.contract_title_ar || contract.contract_title_en}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(contract.status || 'pending')}>
            {contract.status || 'pending'}
          </Badge>
          {isExpiringSoon && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t('contract.expiringSoon')}
            </Badge>
          )}
          <Button
            onClick={() => navigate(`/risk/contracts/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4 mr-2" />
            {t('common.overview')}
          </TabsTrigger>
          <TabsTrigger value="terms">
            <Calendar className="h-4 w-4 mr-2" />
            {t('contract.terms')}
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="h-4 w-4 mr-2" />
            {t('contract.financial')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('contract.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('contract.contractNumber')}</p>
                <p className="font-medium">{contract.contract_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('contract.contractType')}</p>
                <p className="font-medium">{contract.contract_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('contract.effectiveDate')}</p>
                <p className="font-medium">
                  {contract.effective_date 
                    ? format(new Date(contract.effective_date), 'dd/MM/yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('contract.expiryDate')}</p>
                <p className="font-medium">
                  {contract.expiry_date 
                    ? format(new Date(contract.expiry_date), 'dd/MM/yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('contract.autoRenewal')}</p>
                <p className="font-medium">
                  {contract.auto_renewal ? t('common.yes') : t('common.no')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('contract.noticePeriodDays')}</p>
                <p className="font-medium">{contract.notice_period_days || 'N/A'} days</p>
              </div>
            </CardContent>
          </Card>

          {contract.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t('common.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{contract.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Terms Tab */}
        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('contract.contractTerms')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('contract.paymentTerms')}</p>
                  <p className="font-medium">{contract.payment_terms || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('contract.terminationClause')}</p>
                  <p className="font-medium">
                    {contract.has_termination_clause ? t('common.yes') : t('common.no')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('contract.dataProtection')}</p>
                  <p className="font-medium">
                    {contract.has_data_protection_clause ? t('common.yes') : t('common.no')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('contract.liabilityClauses')}</p>
                  <p className="font-medium">
                    {contract.has_liability_clause ? t('common.yes') : t('common.no')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('contract.confidentiality')}</p>
                  <p className="font-medium">
                    {contract.has_confidentiality_clause ? t('common.yes') : t('common.no')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('contract.legalReview')}</p>
                  <p className="font-medium">
                    {contract.requires_legal_review ? t('common.required') : t('common.notRequired')}
                  </p>
                </div>
              </div>

              {contract.legal_reviewed_at && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">{t('contract.legalReviewedAt')}</p>
                  <p className="font-medium">
                    {format(new Date(contract.legal_reviewed_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {contract.tags && contract.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('common.tags')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {contract.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  {t('contract.contractValue')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {contract.contract_value 
                    ? `${contract.contract_value.toLocaleString()}`
                    : 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {contract.currency || 'USD'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('contract.approvalStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contract.approved_at ? (
                    <>
                      <Badge variant="default">{t('common.approved')}</Badge>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(contract.approved_at), 'dd/MM/yyyy')}
                      </p>
                    </>
                  ) : (
                    <Badge variant="secondary">{t('common.pending')}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('contract.paymentTermsDetails')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {contract.payment_terms || t('contract.noPaymentTerms')}
              </p>
            </CardContent>
          </Card>

          {contract.document_urls && contract.document_urls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('common.documents')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contract.document_urls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1">{url}</span>
                      <Button size="sm" variant="outline">
                        {t('common.view')}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
