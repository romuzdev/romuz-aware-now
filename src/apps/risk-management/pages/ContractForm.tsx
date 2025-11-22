/**
 * Contract Form Page
 * Form for creating/editing vendor contracts
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/core/components/ui/form';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { 
  useVendorContractById, 
  useCreateVendorContract, 
  useUpdateVendorContract,
  useVendors
} from '@/modules/grc/hooks/useThirdPartyRisk';
import { Skeleton } from '@/core/components/ui/skeleton';

const contractSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  contract_code: z.string().min(1, 'Contract code is required'),
  contract_title_ar: z.string().min(1, 'Arabic title is required'),
  contract_title_en: z.string().optional().nullable(),
  contract_type: z.string().min(1, 'Contract type is required'),
  effective_date: z.string().min(1, 'Effective date is required'),
  expiry_date: z.string().optional().nullable(),
  contract_value: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().default('SAR'),
  payment_terms: z.string().optional().nullable(),
  auto_renewal: z.boolean().default(false),
  notice_period_days: z.coerce.number().int().min(0).optional().nullable(),
  has_termination_clause: z.boolean().default(false),
  has_data_protection_clause: z.boolean().default(false),
  has_liability_clause: z.boolean().default(false),
  has_confidentiality_clause: z.boolean().default(false),
  requires_legal_review: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  status: z.string().default('active'),
});

type ContractFormData = z.infer<typeof contractSchema>;

export default function ContractForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, tenantId } = useAppContext();
  const isEditMode = !!id;

  const { data: contract, isLoading: isLoadingContract } = useVendorContractById(id!);
  const { data: vendors, isLoading: isLoadingVendors } = useVendors();
  const createMutation = useCreateVendorContract();
  const updateMutation = useUpdateVendorContract();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      vendor_id: '',
      contract_code: '',
      contract_title_ar: '',
      contract_title_en: null,
      contract_type: 'service',
      effective_date: '',
      expiry_date: null,
      contract_value: null,
      currency: 'SAR',
      payment_terms: null,
      auto_renewal: false,
      notice_period_days: null,
      has_termination_clause: false,
      has_data_protection_clause: false,
      has_liability_clause: false,
      has_confidentiality_clause: false,
      requires_legal_review: false,
      notes: null,
      tags: null,
      status: 'active',
    },
  });

  useEffect(() => {
    if (contract && isEditMode) {
      form.reset({
        vendor_id: contract.vendor_id,
        contract_code: contract.contract_code,
        contract_title_ar: contract.contract_title_ar,
        contract_title_en: contract.contract_title_en,
        contract_type: contract.contract_type,
        effective_date: contract.effective_date,
        expiry_date: contract.expiry_date,
        contract_value: contract.contract_value,
        currency: contract.currency || 'SAR',
        payment_terms: contract.payment_terms,
        auto_renewal: contract.auto_renewal || false,
        notice_period_days: contract.notice_period_days,
        has_termination_clause: contract.has_termination_clause || false,
        has_data_protection_clause: contract.has_data_protection_clause || false,
        has_liability_clause: contract.has_liability_clause || false,
        has_confidentiality_clause: contract.has_confidentiality_clause || false,
        requires_legal_review: contract.requires_legal_review || false,
        notes: contract.notes,
        tags: contract.tags,
        status: contract.status || 'active',
      });
    }
  }, [contract, isEditMode, form]);

  const onSubmit = async (data: ContractFormData) => {
    if (!user?.id || !tenantId) {
      toast({
        title: t('common.error'),
        description: t('common.authRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload = {
        ...data,
        tenant_id: tenantId,
        created_by: user.id,
        updated_by: user.id,
      };

      if (isEditMode) {
        await updateMutation.mutateAsync({ id: id!, updates: payload });
        toast({
          title: t('common.success'),
          description: t('contract.updateSuccess'),
        });
      } else {
        await createMutation.mutateAsync(payload);
        toast({
          title: t('common.success'),
          description: t('contract.createSuccess'),
        });
      }
      navigate('/risk/contracts');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: isEditMode 
          ? t('contract.updateError')
          : t('contract.createError'),
        variant: 'destructive',
      });
    }
  };

  if (isLoadingContract || isLoadingVendors) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/risk/contracts')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? t('contract.editContract') : t('contract.newContract')}
          </h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contract.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('vendor.vendor')} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isEditMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('vendor.selectVendor')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendors?.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.vendor_name_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contract.contractNumber')} *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract_title_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contract.titleAr')} *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract_title_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contract.titleEn')}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contract.contractType')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="licensing">Licensing</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.status')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="effective_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contract.effectiveDate')} *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contract.expiryDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.notes')}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contract.financial')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contract_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contract.contractValue')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contract.currency')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SAR">SAR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notice_period_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('contract.noticePeriodDays')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>
                        {t('contract.noticePeriodDaysDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contract.paymentTerms')}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('contract.termsAndConditions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="auto_renewal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('contract.autoRenewal')}</FormLabel>
                        <FormDescription>
                          {t('contract.autoRenewalDesc')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_termination_clause"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('contract.terminationClause')}</FormLabel>
                        <FormDescription>
                          {t('contract.terminationClauseDesc')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_data_protection_clause"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('contract.dataProtection')}</FormLabel>
                        <FormDescription>
                          {t('contract.dataProtectionDesc')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_liability_clause"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('contract.liabilityClauses')}</FormLabel>
                        <FormDescription>
                          {t('contract.liabilityClausesDesc')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_confidentiality_clause"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('contract.confidentiality')}</FormLabel>
                        <FormDescription>
                          {t('contract.confidentialityDesc')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requires_legal_review"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('contract.legalReview')}</FormLabel>
                        <FormDescription>
                          {t('contract.legalReviewDesc')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/risk/contracts')}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
