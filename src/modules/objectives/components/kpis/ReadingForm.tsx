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
import { useCreateKPIReading } from "@/modules/objectives";

const formSchema = z.object({
  period: z.string().min(1, "الفترة مطلوبة"),
  actual_value: z.coerce.number().min(0, "القيمة الفعلية مطلوبة"),
});

interface ReadingFormProps {
  kpiId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReadingForm({ kpiId, onSuccess, onCancel }: ReadingFormProps) {
  const createMutation = useCreateKPIReading();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      period: "",
      actual_value: 0,
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(
      {
        period: data.period,
        actual_value: data.actual_value,
        kpi_id: kpiId,
      },
      { onSuccess }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الفترة</FormLabel>
              <FormControl>
                <Input {...field} type="month" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="actual_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>القيمة الفعلية</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            إضافة
          </Button>
        </div>
      </form>
    </Form>
  );
}
