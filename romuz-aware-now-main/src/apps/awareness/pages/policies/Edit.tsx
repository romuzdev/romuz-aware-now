import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/components/ui/form";
import { Input } from "@/core/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { policyFormSchema, type PolicyFormData } from "@/schemas/policies";
import { fetchPolicyById, updatePolicy } from "@/modules/policies/integration";
import { useAppContext } from "@/lib/app-context/AppContextProvider";

export default function EditPolicy() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PolicyFormData>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      code: "",
      title: "",
      owner: "",
      status: "draft",
      category: "",
      last_review_date: null,
      next_review_date: null,
    },
  });

  useEffect(() => {
    async function loadPolicy() {
      if (!tenantId || !id) {
        toast.error("معرف السياسة أو المستأجر غير صحيح");
        navigate("/platform/policies");
        return;
      }

      try {
        const policy = await fetchPolicyById(tenantId, id);
        if (!policy) {
          toast.error("لم يتم العثور على السياسة");
          navigate("/platform/policies");
          return;
        }

        form.reset({
          code: policy.code,
          title: policy.title,
          owner: policy.owner || "",
          status: policy.status,
          category: policy.category || "",
          last_review_date: policy.last_review_date || null,
          next_review_date: policy.next_review_date || null,
        });
      } catch (error: any) {
        toast.error("فشل تحميل بيانات السياسة");
        navigate("/platform/policies");
      } finally {
        setIsLoading(false);
      }
    }

    loadPolicy();
  }, [tenantId, id, navigate, form]);

  const onSubmit = async (data: PolicyFormData) => {
    if (!tenantId || !id) {
      toast.error("معرف السياسة أو المستأجر غير صحيح");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePolicy(tenantId, id, {
        code: data.code,
        title: data.title,
        owner: data.owner || null,
        status: data.status,
        category: data.category || null,
        last_review_date: data.last_review_date || null,
        next_review_date: data.next_review_date || null,
      });
      toast.success("تم تحديث السياسة بنجاح");
      navigate(`/platform/policies/${id}`);
    } catch (error: any) {
      toast.error(error.message || "فشل تحديث السياسة");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/platform/policies/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">تعديل السياسة</h1>
          <p className="text-sm text-muted-foreground">
            تحديث بيانات السياسة الحالية
          </p>
        </div>
      </div>

      <div className="bg-background border rounded-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كود السياسة *</FormLabel>
                  <FormControl>
                    <Input placeholder="POL-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان *</FormLabel>
                  <FormControl>
                    <Input placeholder="سياسة أمن المعلومات" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المالك</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="اسم المسؤول"
                      {...field}
                      value={field.value || ""}
                    />
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="active">نشطة</SelectItem>
                      <SelectItem value="archived">مؤرشفة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الفئة</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="أمن المعلومات"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="last_review_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ آخر مراجعة</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_review_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ المراجعة القادمة</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/policies/${id}`)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جارٍ الحفظ...
                  </>
                ) : (
                  "حفظ التغييرات"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
