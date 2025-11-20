# LMS Validation Schemas - دليل الاستخدام

## 📋 نظرة عامة

تم إضافة **Zod Validation Schemas** لجميع أنواع LMS لحماية النظام من:
- ✅ Injection Attacks (SQL, XSS, etc.)
- ✅ Data Corruption
- ✅ Invalid Input
- ✅ Type Mismatches

---

## 🎯 كيفية الاستخدام

### 1️⃣ **في الـ Forms (Client-Side)**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CourseValidation } from '@/modules/training/types';

function CourseForm() {
  const form = useForm({
    resolver: zodResolver(CourseValidation.createCourseSchema),
    defaultValues: {
      name: '',
      code: '',
      status: 'draft',
      // ...
    },
  });

  const onSubmit = (data) => {
    // data is already validated ✅
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* form fields */}
      </form>
    </Form>
  );
}
```

### 2️⃣ **في الـ Integration Layer (Server-Side)**

```typescript
import { CourseValidation } from '@/modules/training/types';

export async function createCourse(input: unknown) {
  // Validate input before calling Supabase
  const validation = CourseValidation.validateCourseCreate(input);
  
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.message}`);
  }

  // Now it's safe to use validated data
  const { data, error } = await supabase
    .from('lms_courses')
    .insert(validation.data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

### 3️⃣ **التحقق المباشر**

```typescript
import { CourseValidation } from '@/modules/training/types';

const result = CourseValidation.validateCourseCreate({
  name: 'Test Course',
  code: 'TEST-001',
  // ...
});

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.error('Validation errors:', result.error.issues);
}
```

---

## 📦 الـ Validation Namespaces المتاحة

```typescript
import {
  CourseValidation,        // Course schemas
  EnrollmentValidation,    // Enrollment schemas
  LessonValidation,        // Lesson schemas
  AssessmentValidation,    // Assessment schemas
  ModuleValidation,        // Module schemas
  ProgressValidation,      // Progress schemas
  CertificateValidation,   // Certificate schemas
  ResourceValidation,      // Resource schemas
} from '@/modules/training/types';
```

---

## 🔍 الـ Schemas المتاحة لكل Namespace

### **CourseValidation**
- `createCourseSchema` - لإنشاء دورة جديدة
- `updateCourseSchema` - لتحديث دورة
- `courseFiltersSchema` - لتصفية الدورات
- `publishCourseSchema` - لنشر دورة
- `archiveCourseSchema` - لأرشفة دورة

### **EnrollmentValidation**
- `createEnrollmentSchema` - تسجيل فردي
- `updateEnrollmentSchema` - تحديث تسجيل
- `bulkEnrollmentSchema` - تسجيل جماعي
- `enrollmentFiltersSchema` - تصفية
- `unenrollSchema` - إلغاء تسجيل

### **LessonValidation**
- `createLessonSchema` - إنشاء درس
- `updateLessonSchema` - تحديث درس
- `reorderLessonsSchema` - إعادة ترتيب

### **AssessmentValidation**
- `createAssessmentSchema` - إنشاء اختبار
- `updateAssessmentSchema` - تحديث اختبار
- `createQuestionSchema` - إضافة سؤال
- `updateQuestionSchema` - تحديث سؤال
- `submitAssessmentSchema` - تقديم إجابات

### **ModuleValidation**
- `createModuleSchema` - إنشاء وحدة
- `updateModuleSchema` - تحديث وحدة
- `reorderModulesSchema` - إعادة ترتيب

### **ProgressValidation**
- `updateProgressSchema` - تحديث تقدم
- `markLessonCompleteSchema` - إكمال درس
- `batchUpdateProgressSchema` - تحديث جماعي

### **CertificateValidation**
- `createCertificateSchema` - إنشاء شهادة
- `issueCertificateSchema` - إصدار شهادة
- `verifyCertificateSchema` - التحقق من شهادة
- `revokeCertificateSchema` - إلغاء شهادة
- `createCertificateTemplateSchema` - قالب جديد
- `updateCertificateTemplateSchema` - تحديث قالب

### **ResourceValidation**
- `createResourceSchema` - إضافة مورد
- `updateResourceSchema` - تحديث مورد
- `reorderResourcesSchema` - إعادة ترتيب
- `uploadResourceSchema` - رفع ملف

---

## 🛡️ قواعد الـ Validation

### **String Fields:**
```typescript
// ✅ صحيح
name: 'Course Name'                  // 3-255 characters
code: 'COURSE-001'                   // 2-50 characters, uppercase + numbers
description: 'This is a course...'   // max 5000 characters

// ❌ خطأ
name: 'AB'                           // أقل من 3 أحرف
code: 'course-001'                   // lowercase (not allowed)
description: '...(10000 chars)'      // أكثر من الحد المسموح
```

### **Number Fields:**
```typescript
// ✅ صحيح
passing_score: 70                    // 0-100
max_attempts: 3                      // 1-10
duration_minutes: 120                // 1-10080

// ❌ خطأ
passing_score: 110                   // > 100
max_attempts: 0                      // < 1
duration_minutes: -5                 // سالب
```

### **UUID Fields:**
```typescript
// ✅ صحيح
course_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

// ❌ خطأ
course_id: '12345'                   // not UUID format
course_id: null                      // when required
```

### **Array Fields:**
```typescript
// ✅ صحيح
tags: ['security', 'compliance']     // max 10 items
user_ids: ['uuid1', 'uuid2']         // 1-1000 items

// ❌ خطأ
tags: ['tag1', 'tag2', ..., 'tag15'] // > 10 items
user_ids: []                         // empty when required
```

---

## 🔥 أمثلة متقدمة

### **استخدام مع React Query:**

```typescript
import { useMutation } from '@tanstack/react-query';
import { CourseValidation } from '@/modules/training/types';
import { createCourse } from '@/modules/training/integration';

function useCreateCourse() {
  return useMutation({
    mutationFn: async (input: unknown) => {
      // Validate before sending
      const validation = CourseValidation.validateCourseCreate(input);
      
      if (!validation.success) {
        throw new Error(validation.error.issues[0].message);
      }

      return createCourse(validation.data);
    },
  });
}
```

### **معالجة الأخطاء:**

```typescript
const result = CourseValidation.validateCourseCreate(userInput);

if (!result.success) {
  // Show all validation errors
  result.error.issues.forEach(issue => {
    console.error(`${issue.path.join('.')}: ${issue.message}`);
  });
  
  // Or get formatted errors
  const errors = result.error.format();
  console.log(errors);
}
```

### **Validation في API Routes:**

```typescript
// في Edge Function أو API route
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate
  const validation = CourseValidation.validateCourseCreate(body);
  
  if (!validation.success) {
    return Response.json(
      { error: validation.error.issues },
      { status: 400 }
    );
  }

  // Process validated data
  const course = await createCourse(validation.data);
  
  return Response.json(course);
}
```

---

## ⚠️ ملاحظات مهمة

1. **دائماً استخدم Validation** في:
   - ✅ Forms (Client-side)
   - ✅ Integration Layer (Server-side)
   - ✅ API Routes / Edge Functions

2. **لا تثق في البيانات القادمة من:**
   - ❌ User Input
   - ❌ External APIs
   - ❌ URL Parameters
   - ❌ LocalStorage

3. **استخدم TypeScript Types:**
   ```typescript
   // استخدم الـ inferred types من Zod
   type CourseInput = z.infer<typeof CourseValidation.createCourseSchema>;
   
   // أو استخدم exported types
   import { CourseValidation } from '@/modules/training/types';
   type CourseInput = CourseValidation.CourseCreateInput;
   ```

---

## 🎯 الخطوات التالية

- [ ] تحديث جميع Forms لاستخدام zodResolver
- [ ] إضافة validation في Integration Layer
- [ ] كتابة Unit Tests للـ validation schemas
- [ ] إضافة custom error messages بالعربية

---

**تم الإنشاء:** 2025-11-15  
**الإصدار:** 1.0  
**الحالة:** ✅ جاهز للاستخدام
