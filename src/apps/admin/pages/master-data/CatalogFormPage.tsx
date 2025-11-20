/**
 * CatalogFormPage
 * Gate-M: Create/Edit catalog form
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCatalog, useCreateCatalog, useUpdateCatalog } from '@/modules/master-data/hooks';
import { Button } from '@/core/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { ArrowRight, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';

const catalogFormSchema = z.object({
  code: z.string().min(1, 'الرمز مطلوب').regex(/^[A-Z0-9_]+$/, 'يجب أن يحتوي على أحرف كبيرة وأرقام فقط'),
  label_ar: z.string().min(1, 'الاسم بالعربية مطلوب'),
  label_en: z.string().min(1, 'الاسم بالإنجليزية مطلوب'),
  scope: z.enum(['GLOBAL', 'TENANT']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

type CatalogFormValues = z.infer<typeof catalogFormSchema>;

export default function CatalogFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: catalog, isLoading } = useCatalog(id || null);
  const createMutation = useCreateCatalog();
  const updateMutation = useUpdateCatalog();

  const form = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      code: '',
      label_ar: '',
      label_en: '',
      scope: 'TENANT',
      status: 'DRAFT',
    },
  });

  useEffect(() => {
    if (catalog) {
      form.reset({
        code: catalog.code,
        label_ar: catalog.labelAr,
        label_en: catalog.labelEn,
        scope: catalog.scope,
        status: catalog.status,
      });
    }
  }, [catalog, form]);

  const onSubmit = async (values: CatalogFormValues) => {
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ 
          id, 
          changes: {
            labelAr: values.label_ar,
            labelEn: values.label_en,
            status: values.status,
          }
        });
      } else {
        await createMutation.mutateAsync({
          code: values.code,
          labelAr: values.label_ar,
          labelEn: values.label_en,
          scope: values.scope,
          status: values.status,
        });
      }
      navigate('/platform/master-data/catalogs');
    } catch (error) {
      console.error('Failed to save catalog:', error);
    }
  };

  if (isLoading && isEdit) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/platform/master-data/catalogs')}
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          رجوع
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'تعديل الكتالوج' : 'إضافة كتالوج جديد'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرمز *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="EXAMPLE_CODE" disabled={isEdit} />
                      </FormControl>
                      <FormDescription>
                        أحرف كبيرة وأرقام وشرطة سفلية فقط
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>النطاق *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TENANT">خاص (Tenant)</SelectItem>
                          <SelectItem value="GLOBAL">عام (Global)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="label_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم بالعربية *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: تصنيفات المخاطر" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="label_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم بالإنجليزية *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Example: Risk Categories" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">مسودة</SelectItem>
                          <SelectItem value="PUBLISHED">منشور</SelectItem>
                          <SelectItem value="ARCHIVED">مؤرشف</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/platform/master-data/catalogs')}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Save className="h-4 w-4 ml-2" />
                  {isEdit ? 'حفظ التعديلات' : 'إنشاء الكتالوج'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
