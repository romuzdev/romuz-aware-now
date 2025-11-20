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
import { useCreateObjective, useUpdateObjective } from "@/modules/objectives";
import { Objective } from "@/modules/objectives";

const formSchema = z.object({
  code: z.string().min(1, "الرمز مطلوب"),
  title: z.string().min(1, "العنوان مطلوب"),
  status: z.enum(["active", "archived", "on_hold"]),
});

interface ObjectiveFormProps {
  objective?: Objective;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ObjectiveForm({ objective, onSuccess, onCancel }: ObjectiveFormProps) {
  const createMutation = useCreateObjective();
  const updateMutation = useUpdateObjective();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: objective?.code || "",
      title: objective?.title || "",
      status: objective?.status || "active",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (objective) {
      updateMutation.mutate(
        { id: objective.id, input: data },
        { onSuccess }
      );
    } else {
      createMutation.mutate(
        {
          code: data.code,
          title: data.title,
          status: data.status,
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
                <Input {...field} placeholder="OBJ-001" />
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
                <Input {...field} placeholder="عنوان الهدف الاستراتيجي" />
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
              <FormLabel>الحالة</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                  <SelectItem value="on_hold">معلق</SelectItem>
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
            {objective ? "تحديث" : "إضافة"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
