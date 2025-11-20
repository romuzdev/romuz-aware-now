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
import { useCreateInitiative } from "@/modules/objectives";
import { Initiative } from "@/modules/objectives";

const formSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  status: z.enum(["planned", "in_progress", "done", "cancelled"]),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
});

interface InitiativeFormProps {
  objectiveId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InitiativeForm({ objectiveId, onSuccess, onCancel }: InitiativeFormProps) {
  const createMutation = useCreateInitiative();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      status: "planned",
      start_at: "",
      end_at: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(
      {
        title: data.title,
        objective_id: objectiveId,
        status: data.status,
        start_at: data.start_at,
        end_at: data.end_at,
      },
      { onSuccess }
    );
  };

  const statusLabels: Record<Initiative["status"], string> = {
    planned: "مخطط",
    in_progress: "قيد التنفيذ",
    done: "مكتمل",
    cancelled: "ملغي",
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العنوان</FormLabel>
              <FormControl>
                <Input {...field} placeholder="عنوان المبادرة" />
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
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
          name="start_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تاريخ البدء</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تاريخ الانتهاء</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
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
