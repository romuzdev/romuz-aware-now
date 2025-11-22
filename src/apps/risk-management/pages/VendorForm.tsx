/**
 * Vendor Form
 * Unified form for creating and editing vendors
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Save, Building2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import { Skeleton } from '@/core/components/ui/skeleton';
import { vendorSchema, type VendorFormData } from '@/schemas/grc.schemas';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  useVendorById,
  useCreateVendor,
  useUpdateVendor,
} from '@/modules/grc/hooks/useThirdPartyRisk';

export default function VendorForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppContext();
  const navigate = useNavigate();
  const isEditMode = id !== 'new' && !!id;

  const { data: vendor, isLoading } = useVendorById(id || '');
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
  });

  useEffect(() => {
    if (vendor && isEditMode) {
      Object.keys(vendor).forEach((key) => {
        const value = vendor[key as keyof typeof vendor];
        if (value !== null && value !== undefined && key in vendorSchema.shape) {
          setValue(key as keyof VendorFormData, value as any);
        }
      });
    }
  }, [vendor, setValue, isEditMode]);

  const onSubmit = async (data: VendorFormData) => {
    try {
      if (isEditMode) {
        await updateVendor.mutateAsync({
          id: id!,
          updates: {
            ...data,
            updated_by: user?.id || '',
          },
        });
      } else {
        await createVendor.mutateAsync({
          vendor_name_ar: data.vendor_name_ar,
          vendor_name_en: data.vendor_name_en,
          vendor_code: data.vendor_code || `VND-${Date.now()}`,
          vendor_type: data.vendor_type || 'supplier',
          status: data.status,
          risk_tier: data.risk_tier,
          overall_risk_level: data.overall_risk_level,
          country: data.country,
          city: data.city,
          address: data.address,
          website: data.website,
          industry: data.industry,
          notes: data.notes,
          contract_start_date: data.contract_start_date,
          contract_end_date: data.contract_end_date,
          created_by: user?.id || '',
          updated_by: user?.id || '',
        });
      }
      navigate('/risk/vendors');
    } catch (error) {
      console.error('Error saving vendor:', error);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/risk/vendors')}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'تعديل المورد' : 'إضافة مورد جديد'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'تحديث معلومات المورد' : 'إضافة مورد جديد لإدارة مخاطر الطرف الثالث'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">المعلومات الأساسية</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vendor_name_ar">اسم المورد (عربي) *</Label>
              <Input
                id="vendor_name_ar"
                {...register('vendor_name_ar')}
                placeholder="أدخل اسم المورد بالعربية"
              />
              {errors.vendor_name_ar && (
                <p className="text-sm text-destructive">{errors.vendor_name_ar.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor_name_en">اسم المورد (إنجليزي)</Label>
              <Input
                id="vendor_name_en"
                {...register('vendor_name_en')}
                placeholder="Enter vendor name in English"
              />
              {errors.vendor_name_en && (
                <p className="text-sm text-destructive">{errors.vendor_name_en.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor_code">رمز المورد *</Label>
              <Input
                id="vendor_code"
                {...register('vendor_code')}
                placeholder="VND-001"
              />
              {errors.vendor_code && (
                <p className="text-sm text-destructive">{errors.vendor_code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor_type">نوع المورد *</Label>
              <Input
                id="vendor_type"
                {...register('vendor_type')}
                placeholder="مورد / مقدم خدمة"
              />
              {errors.vendor_type && (
                <p className="text-sm text-destructive">{errors.vendor_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Input
                id="status"
                {...register('status')}
                placeholder="active / inactive"
              />
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">القطاع</Label>
              <Input
                id="industry"
                {...register('industry')}
                placeholder="تقنية المعلومات"
              />
              {errors.industry && (
                <p className="text-sm text-destructive">{errors.industry.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Risk Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">معلومات المخاطر</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="risk_tier">مستوى التصنيف</Label>
              <Input
                id="risk_tier"
                {...register('risk_tier')}
                placeholder="tier_1 / tier_2 / tier_3 / tier_4"
              />
              {errors.risk_tier && (
                <p className="text-sm text-destructive">{errors.risk_tier.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="overall_risk_level">مستوى المخاطر الإجمالي</Label>
              <Input
                id="overall_risk_level"
                {...register('overall_risk_level')}
                placeholder="critical / high / medium / low"
              />
              {errors.overall_risk_level && (
                <p className="text-sm text-destructive">{errors.overall_risk_level.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">معلومات الاتصال</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="website">الموقع الإلكتروني</Label>
              <Input
                id="website"
                type="url"
                {...register('website')}
                placeholder="https://www.vendor.com"
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">الدولة</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="المملكة العربية السعودية"
              />
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="الرياض"
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="أدخل العنوان الكامل"
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Contract Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">معلومات العقد</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contract_start_date">تاريخ بداية العقد</Label>
              <Input
                id="contract_start_date"
                type="date"
                {...register('contract_start_date')}
              />
              {errors.contract_start_date && (
                <p className="text-sm text-destructive">{errors.contract_start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_end_date">تاريخ انتهاء العقد</Label>
              <Input
                id="contract_end_date"
                type="date"
                {...register('contract_end_date')}
              />
              {errors.contract_end_date && (
                <p className="text-sm text-destructive">{errors.contract_end_date.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">ملاحظات</h2>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات إضافية</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="أضف أي ملاحظات أو معلومات إضافية"
              rows={5}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/risk/vendors')}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={createVendor.isPending || updateVendor.isPending}
          >
            <Save className="h-4 w-4 ml-2" />
            {isEditMode ? 'حفظ التغييرات' : 'إنشاء المورد'}
          </Button>
        </div>
      </form>
    </div>
  );
}
