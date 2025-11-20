import { z } from "zod";

export const policyFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { message: "كود السياسة مطلوب" })
    .max(50, { message: "الكود يجب أن يكون أقل من 50 حرف" }),
  title: z
    .string()
    .trim()
    .min(1, { message: "عنوان السياسة مطلوب" })
    .max(200, { message: "العنوان يجب أن يكون أقل من 200 حرف" }),
  owner: z
    .string()
    .trim()
    .max(100, { message: "اسم المالك يجب أن يكون أقل من 100 حرف" })
    .optional()
    .nullable(),
  status: z.enum(["draft", "active", "archived"] as const, {
    message: "الحالة مطلوبة",
  }),
  category: z
    .string()
    .trim()
    .max(100, { message: "الفئة يجب أن تكون أقل من 100 حرف" })
    .optional()
    .nullable(),
  last_review_date: z.string().optional().nullable(),
  next_review_date: z.string().optional().nullable(),
});

export type PolicyFormData = z.infer<typeof policyFormSchema>;
