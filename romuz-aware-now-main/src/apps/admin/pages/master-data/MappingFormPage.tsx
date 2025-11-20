/**
 * MappingFormPage - Create/Edit Mapping
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/core/components/ui/page-header';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  useMapping,
  useCreateMapping,
  useUpdateMapping,
} from '@/modules/master-data/hooks/useMappings';
import { CatalogSelector, TermSelector } from '@/modules/master-data/components';

const mappingSchema = z.object({
  catalogId: z.string().min(1, 'يجب اختيار كتالوج'),
  termId: z.string().nullable(),
  sourceSystem: z.string().min(1, 'يجب إدخال النظام المصدر'),
  srcCode: z.string().min(1, 'يجب إدخال كود المصدر'),
  targetCode: z.string().min(1, 'يجب إدخال كود الهدف'),
  notes: z.string().optional(),
});

type MappingFormData = z.infer<typeof mappingSchema>;

export default function MappingFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: mapping, isLoading } = useMapping(id || null);
  const createMutation = useCreateMapping();
  const updateMutation = useUpdateMapping();

  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MappingFormData>({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      catalogId: '',
      termId: null,
      sourceSystem: '',
      srcCode: '',
      targetCode: '',
      notes: '',
    },
  });

  const watchedCatalogId = watch('catalogId');

  useEffect(() => {
    if (mapping && isEditMode) {
      setValue('catalogId', mapping.catalogId);
      setValue('termId', mapping.termId);
      setValue('sourceSystem', mapping.sourceSystem);
      setValue('srcCode', mapping.srcCode);
      setValue('targetCode', mapping.targetCode);
      setValue('notes', mapping.notes || '');
      setSelectedCatalogId(mapping.catalogId);
    }
  }, [mapping, isEditMode, setValue]);

  useEffect(() => {
    setSelectedCatalogId(watchedCatalogId);
  }, [watchedCatalogId]);

  const onSubmit = async (data: MappingFormData) => {
    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({
          id,
          changes: {
            termId: data.termId,
            targetCode: data.targetCode,
            notes: data.notes,
          },
        });
      } else {
        await createMutation.mutateAsync({
          catalogId: data.catalogId,
          termId: data.termId,
          sourceSystem: data.sourceSystem,
          srcCode: data.srcCode,
          targetCode: data.targetCode,
          notes: data.notes,
        });
      }
      navigate('/platform/master-data/mappings');
    } catch (error) {
      console.error('Error saving mapping:', error);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={isEditMode ? 'تعديل ربط' : 'إضافة ربط جديد'}
        description={isEditMode ? 'تعديل بيانات الربط' : 'إنشاء ربط جديد بين نظام خارجي والمصطلحات'}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/platform/master-data/mappings')}
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>بيانات الربط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="catalogId">الكتالوج *</Label>
                <CatalogSelector
                  value={watchedCatalogId}
                  onValueChange={(value) => setValue('catalogId', value)}
                  disabled={isEditMode}
                />
                {errors.catalogId && (
                  <p className="text-sm text-destructive">{errors.catalogId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="termId">المصطلح (اختياري)</Label>
                <TermSelector
                  catalogId={selectedCatalogId}
                  value={watch('termId') || ''}
                  onValueChange={(value) => setValue('termId', value || null)}
                  disabled={!selectedCatalogId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceSystem">النظام المصدر *</Label>
                <Input
                  id="sourceSystem"
                  {...register('sourceSystem')}
                  placeholder="مثال: SAP, Oracle, Custom"
                  disabled={isEditMode}
                />
                {errors.sourceSystem && (
                  <p className="text-sm text-destructive">{errors.sourceSystem.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="srcCode">كود المصدر *</Label>
                <Input
                  id="srcCode"
                  {...register('srcCode')}
                  placeholder="الكود في النظام الخارجي"
                  disabled={isEditMode}
                />
                {errors.srcCode && (
                  <p className="text-sm text-destructive">{errors.srcCode.message}</p>
                )}
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="targetCode">كود الهدف *</Label>
                <Input
                  id="targetCode"
                  {...register('targetCode')}
                  placeholder="الكود المقابل في النظام"
                />
                {errors.targetCode && (
                  <p className="text-sm text-destructive">{errors.targetCode.message}</p>
                )}
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="أي ملاحظات إضافية..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/platform/master-data/mappings')}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 ml-2" />
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
