/**
 * TermFormPage
 * Gate-M: Term creation and editing page
 */

import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTerm, useCreateTerm, useUpdateTerm, useTerms, useCatalogs } from '@/modules/master-data/hooks';
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
import { Switch } from '@/core/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const termSchema = z.object({
  catalogId: z.string().min(1, 'يجب اختيار الكتالوج'),
  parentId: z.string().nullable().optional(),
  code: z.string().min(1, 'الرمز مطلوب').regex(/^[A-Z0-9_]+$/, 'يجب أن يحتوي الرمز على أحرف كبيرة وأرقام وشرطات سفلية فقط'),
  labelAr: z.string().min(1, 'الاسم بالعربية مطلوب'),
  labelEn: z.string().min(1, 'الاسم بالإنجليزية مطلوب'),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

type TermFormValues = z.infer<typeof termSchema>;

export default function TermFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const catalogIdParam = searchParams.get('catalogId');
  
  const isEditMode = Boolean(id);
  const { data: term, isLoading: isLoadingTerm } = useTerm(id || null);
  const { data: catalogs } = useCatalogs();
  const createTerm = useCreateTerm();
  const updateTerm = useUpdateTerm();

  const form = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      catalogId: catalogIdParam || '',
      parentId: null,
      code: '',
      labelAr: '',
      labelEn: '',
      sortOrder: 0,
      active: true,
    },
  });

  const selectedCatalogId = form.watch('catalogId');
  const { data: potentialParents } = useTerms(
    selectedCatalogId ? { catalogId: selectedCatalogId } : undefined
  );

  useEffect(() => {
    if (term && isEditMode) {
      form.reset({
        catalogId: term.catalogId,
        parentId: term.parentId,
        code: term.code,
        labelAr: term.labelAr,
        labelEn: term.labelEn,
        sortOrder: term.sortOrder,
        active: term.active,
      });
    }
  }, [term, isEditMode, form]);

  const onSubmit = async (data: TermFormValues) => {
    try {
      if (isEditMode && id) {
        await updateTerm.mutateAsync({
          id,
          changes: {
            parentId: data.parentId,
            labelAr: data.labelAr,
            labelEn: data.labelEn,
            sortOrder: data.sortOrder,
            active: data.active,
          },
        });
        toast.success('تم تحديث المصطلح بنجاح');
      } else {
        await createTerm.mutateAsync({
          catalogId: data.catalogId,
          parentId: data.parentId,
          code: data.code,
          labelAr: data.labelAr,
          labelEn: data.labelEn,
          sortOrder: data.sortOrder,
          active: data.active,
        });
        toast.success('تم إنشاء المصطلح بنجاح');
      }
      navigate('/platform/master-data/terms');
    } catch (error) {
      toast.error('حدث خطأ في حفظ المصطلح');
    }
  };

  if (isEditMode && isLoadingTerm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/platform/master-data/terms')}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'تعديل المصطلح' : 'إضافة مصطلح جديد'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'تعديل بيانات المصطلح' : 'إضافة مصطلح جديد للكتالوج'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="catalogId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الكتالوج *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEditMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الكتالوج" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {catalogs?.map((catalog) => (
                      <SelectItem key={catalog.id} value={catalog.id}>
                        {catalog.labelAr} ({catalog.code})
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
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المصطلح الأب (اختياري)</FormLabel>
                <Select
                  value={field.value || 'none'}
                  onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                  disabled={!selectedCatalogId || isEditMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="بدون أب (مصطلح رئيسي)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">بدون أب (مصطلح رئيسي)</SelectItem>
                    {potentialParents
                      ?.filter((t) => t.id !== id)
                      ?.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.labelAr} ({parent.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>اختر مصطلحاً أعلى في التسلسل الهرمي</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الرمز *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="TERM_CODE"
                    disabled={isEditMode}
                  />
                </FormControl>
                <FormDescription>
                  رمز فريد بأحرف كبيرة وأرقام وشرطات سفلية (مثل: HIGH_RISK)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="labelAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم بالعربية *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="أدخل الاسم بالعربية" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="labelEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم بالإنجليزية *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter name in English" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ترتيب العرض</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder="0"
                  />
                </FormControl>
                <FormDescription>
                  رقم يحدد ترتيب عرض المصطلح (الأصغر أولاً)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">نشط</FormLabel>
                  <FormDescription>
                    المصطلحات النشطة فقط تظهر في القوائم والمرشحات
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/platform/master-data/terms')}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createTerm.isPending || updateTerm.isPending}
            >
              {createTerm.isPending || updateTerm.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
