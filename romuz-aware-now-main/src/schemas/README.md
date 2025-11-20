# Validation Schemas Guide

هذا المجلد يحتوي على جميع schemas للتحقق من صحة المدخلات باستخدام Zod.

## 📁 الملفات

- `index.ts` - نقطة دخول مركزية لجميع schemas
- `common.schemas.ts` - schemas مشتركة (تواريخ، أسماء، أكواد، إلخ)
- `grc.schemas.ts` - GRC (المخاطر، الضوابط، الامتثال)
- `awareness.schemas.ts` - حملات التوعية
- `employee.schemas.ts` - ملفات الموظفين

---

## 🚀 كيفية الاستخدام

### 1. مع React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { riskSchema, type RiskFormData } from '@/schemas';

const form = useForm<RiskFormData>({
  resolver: zodResolver(riskSchema),
  defaultValues: {
    risk_code: '',
    risk_title: '',
    risk_category: 'operational',
    // ...
  },
});

const onSubmit = (data: RiskFormData) => {
  // Data is automatically validated ✅
  console.log(data);
};
```

### 2. للتحقق المباشر

```typescript
import { riskSchema } from '@/schemas';

const result = riskSchema.safeParse(formData);

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.error('Validation errors:', result.error);
}
```

### 3. في Edge Functions

```typescript
import { riskSchema } from '../schemas';

const requestSchema = riskSchema.pick({
  risk_code: true,
  risk_title: true,
});

const result = requestSchema.safeParse(await req.json());

if (!result.success) {
  return new Response(
    JSON.stringify({ 
      error: 'بيانات غير صحيحة', 
      details: result.error.format() 
    }), 
    { status: 400 }
  );
}
```

---

## 📚 الـ Schemas المتاحة

### Common Schemas

```typescript
import {
  arabicNameSchema,      // اسم عربي
  emailSchema,           // بريد إلكتروني
  codeSchema,            // كود (A-Z, 0-9, -)
  shortTextSchema,       // نص قصير (حتى 200 حرف)
  mediumTextSchema,      // نص متوسط (حتى 1000 حرف)
  longTextSchema,        // نص طويل (حتى 5000 حرف)
  scoreSchema,           // درجة رقمية
  prioritySchema,        // أولوية
  statusSchema,          // حالة
  dateRangeSchema,       // نطاق تواريخ
} from '@/schemas';
```

### GRC Schemas

```typescript
import {
  riskSchema,                         // مخاطر
  controlSchema,                      // ضوابط
  riskTreatmentSchema,                // معالجة المخاطر
  controlTestSchema,                  // اختبار الضوابط
  complianceRequirementSchema,        // متطلبات الامتثال
  type RiskFormData,
  type ControlFormData,
  // ...
} from '@/schemas';
```

### Awareness Schemas

```typescript
import {
  campaignSchema,                     // حملات
  campaignModuleSchema,               // وحدات الحملة
  campaignParticipantSchema,          // مشاركين
  campaignFeedbackSchema,             // التغذية الراجعة
  type CampaignFormData,
  // ...
} from '@/schemas';
```

### Employee Schemas

```typescript
import {
  employeeProfileSchema,              // ملف موظف
  employeeBulkImportSchema,           // استيراد جماعي
  type EmployeeProfileFormData,
  // ...
} from '@/schemas';
```

---

## ✨ مميزات

### ✅ التحقق التلقائي
- التحقق من النوع (string, number, date, email, url)
- التحقق من الطول (min, max)
- التحقق من النطاق للأرقام
- التحقق من التعبيرات النمطية (regex)

### ✅ رسائل خطأ بالعربية
```typescript
const arabicNameSchema = z.string()
  .trim()
  .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
  .max(100, 'الاسم طويل جداً')
  .regex(/^[\u0600-\u06FF\s]+$/, 'الاسم يجب أن يحتوي على أحرف عربية فقط');
```

### ✅ التحقق المتقدم
```typescript
const dateRangeSchema = z.object({
  start_date: z.date(),
  end_date: z.date(),
}).refine((data) => data.end_date >= data.start_date, {
  message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
  path: ['end_date'],
});
```

---

## 🛡️ الأمان

### لماذا نستخدم Zod؟

1. **منع حقن SQL**: التحقق من أنواع البيانات قبل إرسالها للـ database
2. **منع XSS**: التحقق من طول وصيغة النصوص
3. **منع IDOR**: التحقق من UUIDs
4. **Data Integrity**: ضمان صحة البيانات
5. **Type Safety**: TypeScript types تلقائياً

### مثال على الحماية

```typescript
// ❌ بدون validation
const risk = await supabase
  .from('grc_risks')
  .insert({ 
    risk_code: userInput // خطر! قد يكون SQL injection
  });

// ✅ مع validation
const result = riskSchema.safeParse(formData);
if (!result.success) {
  throw new Error('Invalid data');
}
const risk = await supabase
  .from('grc_risks')
  .insert(result.data); // آمن ✅
```

---

## 📝 إضافة Schema جديد

1. **اختر الملف المناسب** (common, grc, awareness, employee)
2. **أنشئ الـ schema:**

```typescript
export const myNewSchema = z.object({
  field_name: z.string()
    .trim()
    .min(1, 'الحقل مطلوب')
    .max(100, 'الحقل طويل جداً'),
  // ...
});

export type MyNewFormData = z.infer<typeof myNewSchema>;
```

3. **صدّره من `index.ts`:**

```typescript
export * from './my-module.schemas';
```

4. **استخدمه:**

```typescript
import { myNewSchema } from '@/schemas';
```

---

## 🔗 المراجع

- [Zod Documentation](https://zod.dev)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [TypeScript Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

**آخر تحديث:** 2025-11-16  
**الحالة:** ✅ جاهز للاستخدام
