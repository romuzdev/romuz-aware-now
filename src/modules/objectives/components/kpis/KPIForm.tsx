import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useCreateKPI, useUpdateKPI } from "@/modules/objectives";
import { KPI } from "@/modules/objectives";

const formSchema = z.object({
  objective_id: z.string().min(1, "الهدف الاستراتيجي مطلوب"),
  code: z.string().min(1, "الرمز مطلوب"),
  title: z.string().min(1, "العنوان مطلوب"),
  unit: z.string().min(1, "وحدة القياس مطلوبة"),
  direction: z.enum(["up", "down"]),
});

interface KPIFormProps {
  kpi?: KPI;
  objectiveId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function KPIForm({ kpi, objectiveId, onSuccess, onCancel }: KPIFormProps) {
  const createMutation = useCreateKPI();
  const updateMutation = useUpdateKPI();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objective_id: kpi?.objective_id || objectiveId || "",
      code: kpi?.code || "",
      title: kpi?.title || "",
      unit: kpi?.unit || "",
      direction: kpi?.direction || "up",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (kpi) {
      updateMutation.mutate(
        { id: kpi.id, input: data },
        { onSuccess }
      );
    } else {
      createMutation.mutate(
        {
          objective_id: data.objective_id,
          code: data.code,
          title: data.title,
          unit: data.unit,
          direction: data.direction,
        },
        { onSuccess }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الرمز</FormLabel>
              <FormControl>
                <Input {...field} placeholder="KPI-001" />
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
              <FormLabel>العنوان</FormLabel>
              <FormControl>
                <Input {...field} placeholder="عنوان مؤشر الأداء" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>وحدة القياس</FormLabel>
              <FormControl>
                <Input {...field} placeholder="%" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="direction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاتجاه</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الاتجاه" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="up">أعلى أفضل</SelectItem>
                  <SelectItem value="down">أقل أفضل</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {kpi ? "تحديث" : "إضافة"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
