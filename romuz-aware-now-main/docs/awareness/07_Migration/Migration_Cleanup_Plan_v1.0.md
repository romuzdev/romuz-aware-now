# 📋 Migration & Cleanup Plan v1.0

**تاريخ الإنشاء:** 2025-11-15  
**الحالة:** Draft - قيد المراجعة  
**الهدف:** إعادة هيكلة النظام بالكامل ليتوافق مع التصور الجديد للمنصة الموحدة

---

## 📑 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [الحالة الحالية للنظام](#الحالة-الحالية-للنظام)
3. [البنية المستهدفة](#البنية-المستهدفة)
4. [خطة التنفيذ التفصيلية](#خطة-التنفيذ-التفصيلية)
5. [قائمة الملفات الكاملة](#قائمة-الملفات-الكاملة)
6. [إدارة المخاطر](#إدارة-المخاطر)
7. [معايير النجاح](#معايير-النجاح)
8. [الجدول الزمني](#الجدول-الزمني)

---

## 🎯 نظرة عامة

### الهدف الرئيسي
إعادة هيكلة المشروع بالكامل للانتقال من بنية غير منظمة إلى **بنية منصة موحدة (Unified Platform Architecture)** تتبع معايير D1 Standard وتدعم:

- **Multi-App Platform**: منصة تدعم عدة تطبيقات (Awareness, Platform Console, LMS, Phishing...)
- **Reusable Modules**: وحدات قابلة لإعادة الاستخدام عبر التطبيقات
- **Core Services**: خدمات أساسية مشتركة (RBAC, Auth, Tenancy...)
- **Clean Architecture**: فصل واضح بين الطبقات والمسؤوليات

### النطاق
- ✅ نقل وإعادة تنظيم جميع الملفات (عدا `src/features` - سيعالج لاحقاً)
- ✅ إنشاء بنية Modules كاملة
- ✅ إنشاء بنية Apps كاملة
- ✅ توحيد Core Services
- ✅ حذف الملفات المكررة والقديمة
- ✅ تحديث جميع الـ imports

### خارج النطاق
- ❌ مجلد `src/features` (سيعالج في مرحلة لاحقة)
- ❌ تعديل منطق الأعمال (Business Logic)
- ❌ تعديل قاعدة البيانات
- ❌ تعديل Edge Functions

---

## 📊 الحالة الحالية للنظام

### البنية الحالية

```
src/
├── apps/                    ✅ موجود - جزئياً منظم
│   ├── awareness/          ✅ منظم جيداً
│   └── platform/           ✅ منظم جيداً
├── core/                    ✅ موجود - جزئياً منظم
│   ├── auth/               ✅ منظم
│   ├── rbac/               ✅ منظم
│   ├── tenancy/            ✅ منظم
│   └── ...
├── modules/                 ⚠️ غير مكتمل - فقط campaigns
│   └── campaigns/          ✅ منظم (D1 Standard)
├── components/              ❌ غير منظم - مختلط
│   ├── ui/                 ✅ قابل للنقل إلى core
│   ├── committees/         ⚠️ يجب نقله إلى modules
│   ├── documents/          ⚠️ يجب نقله إلى modules
│   ├── policies/           ⚠️ يجب نقله إلى modules
│   ├── gateh/              ⚠️ يجب نقله إلى core
│   └── admin/              ⚠️ يجب نقله إلى apps
├── hooks/                   ❌ غير منظم - مختلط
│   ├── useRBAC.ts          ✅ يجب نقله إلى core/rbac
│   ├── gatee/              ⚠️ غير واضح الاستخدام
│   ├── gatef/              ⚠️ غير واضح الاستخدام
│   ├── gatei/              ⚠️ غير واضح الاستخدام
│   └── ...
├── pages/                   ❌ غير منظم - يجب نقله إلى apps
├── integrations/            ⚠️ يحتاج إعادة تنظيم
│   └── supabase/
│       ├── client.ts       ✅ (read-only)
│       ├── types.ts        ✅ (read-only)
│       └── rbac.ts         ⚠️ يجب نقله إلى core/rbac
├── layouts/ + layout/       ❌ مكرر - دمج
├── lib/                     ✅ منظم
└── features/               ⏸️ سيعالج لاحقاً (خارج النطاق)
```

### المشاكل الرئيسية

#### 1. **Modules غير مكتملة**
```
❌ المشكلة:
- فقط campaigns موجود في modules
- committees, documents, policies, alerts في components

✅ الحل:
- إنشاء modules كاملة لكل وحدة
- نقل components, hooks, types, integration لكل module
```

#### 2. **Components مختلطة**
```
❌ المشكلة:
src/components/
├── ui/              → يجب أن يكون في core
├── committees/      → يجب أن يكون في modules
├── documents/       → يجب أن يكون في modules
├── policies/        → يجب أن يكون في modules
├── admin/           → يجب أن يكون في apps
└── gateh/           → يجب أن يكون في core

✅ الحل: نقل كل مجموعة إلى مكانها الصحيح
```

#### 3. **Hooks مختلطة**
```
❌ المشكلة:
src/hooks/
├── useRBAC.ts       → يجب أن يكون في core/rbac/hooks
├── gatee/           → غير واضح
├── gatef/           → غير واضح
└── gatei/           → غير واضح

✅ الحل: 
- نقل core hooks إلى core/
- نقل module hooks إلى modules/
- حذف/دمج gate hooks الغامضة
```

#### 4. **Pages يجب نقلها إلى Apps**
```
❌ المشكلة:
src/pages/ → كلها app-specific pages

✅ الحل:
- نقل admin pages → apps/platform/pages/
- نقل awareness pages → apps/awareness/pages/
```

#### 5. **Integration Layer مزدحمة**
```
❌ المشكلة:
src/integrations/supabase/
├── rbac.ts          → يجب في core/rbac/integration
└── 20+ ملف         → يجب توزيعها

✅ الحل: توزيع الملفات على modules و core
```

---

## 🏗️ البنية المستهدفة

### الهيكل النهائي المطلوب

```
src/
├── core/                           # Core Platform Services
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   ├── rbac/
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── useRBAC.ts         ← من src/hooks/useRBAC.ts
│   │   ├── integration/
│   │   │   └── rbac.integration.ts ← من src/integrations/supabase/rbac.ts
│   │   ├── permissions.ts
│   │   ├── roles.ts
│   │   ├── types/
│   │   └── index.ts
│   ├── tenancy/
│   ├── services/
│   │   ├── bulk-operations/
│   │   ├── import-export/
│   │   └── saved-views/
│   ├── components/
│   │   ├── ui/                    ← من src/components/ui/
│   │   ├── layout/                ← دمج من src/layouts/ + src/layout/
│   │   ├── gateh/                 ← من src/components/gateh/
│   │   └── shared/
│   ├── hooks/
│   │   ├── useAppContext.ts
│   │   ├── useDebounce.ts
│   │   └── ...
│   ├── config/
│   └── index.ts
│
├── modules/                        # Reusable Business Modules
│   ├── campaigns/                  ✅ موجود - منظم (D1 Standard)
│   │   ├── types/
│   │   ├── integration/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── index.ts
│   ├── committees/                 ← جديد - من src/components/committees/
│   │   ├── types/
│   │   │   └── committee.types.ts
│   │   ├── integration/
│   │   │   └── committees.integration.ts
│   │   ├── hooks/
│   │   │   ├── useCommitteesList.ts
│   │   │   ├── useCommitteeById.ts
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── CommitteeCard.tsx
│   │   │   ├── CommitteeForm.tsx
│   │   │   └── ...
│   │   └── index.ts
│   ├── documents/                  ← جديد - من src/components/documents/
│   │   ├── types/
│   │   ├── integration/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── index.ts
│   ├── policies/                   ← جديد - من src/components/policies/
│   │   ├── types/
│   │   ├── integration/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── index.ts
│   ├── alerts/                     ← جديد
│   │   ├── types/
│   │   ├── integration/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── index.ts
│   ├── content-hub/
│   └── culture-index/
│
├── apps/                           # Applications
│   ├── awareness/                  ✅ موجود - منظم
│   │   ├── pages/
│   │   │   ├── campaigns/         ← استخدام من modules/campaigns
│   │   │   ├── dashboard/
│   │   │   └── ...
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── platform/                   ✅ موجود - منظم
│   │   ├── pages/
│   │   │   ├── admin/             ← من src/pages/admin/
│   │   │   ├── tenants/           ← من src/pages/tenants/
│   │   │   └── ...
│   │   ├── components/
│   │   │   └── admin/             ← من src/components/admin/
│   │   └── index.ts
│   └── index.ts
│
├── integrations/                   # External Integrations
│   └── supabase/
│       ├── client.ts              ✅ (read-only - لا يعدل)
│       ├── types.ts               ✅ (read-only - لا يعدل)
│       └── index.ts
│
├── lib/                           ✅ منظم - يبقى كما هو
│   ├── query/
│   ├── utils/
│   └── ...
│
├── features/                      ⏸️ خارج النطاق - سيعالج لاحقاً
│
└── (ملفات أخرى)
```

### مبادئ البنية الجديدة

#### 1. **Core Layer**
```typescript
// المسؤولية: خدمات أساسية مشتركة عبر المنصة
core/
├── auth/         // إدارة المصادقة
├── rbac/         // التحكم بالصلاحيات
├── tenancy/      // Multi-tenancy
├── services/     // خدمات مشتركة (bulk, import/export, ...)
├── components/   // مكونات UI أساسية (ui/, layout/, ...)
├── hooks/        // hooks أساسية
└── config/       // إعدادات المنصة
```

#### 2. **Modules Layer**
```typescript
// المسؤولية: وحدات عمل قابلة لإعادة الاستخدام
modules/{module-name}/
├── types/              // TypeScript Types
├── integration/        // Supabase/API Integration
├── hooks/              // React Hooks
├── components/         // UI Components
└── index.ts            // Barrel Export

// مثال: modules/committees/
export { Committee, CommitteeStatus } from './types';
export { useCommitteesList, useCommitteeById } from './hooks';
export { CommitteeCard, CommitteeForm } from './components';
```

#### 3. **Apps Layer**
```typescript
// المسؤولية: تطبيقات مستقلة تستخدم Core & Modules
apps/{app-name}/
├── pages/              // صفحات التطبيق
├── components/         // مكونات خاصة بالتطبيق
├── hooks/              // hooks خاصة بالتطبيق
└── index.ts

// مثال: apps/awareness/pages/campaigns/
import { useCampaignsList } from '@/modules/campaigns';
import { useRBAC } from '@/core/rbac';
```

---

## 📝 خطة التنفيذ التفصيلية

### المرحلة 1: Core Migration (نقل الخدمات الأساسية)

#### الخطوة 1.1: نقل RBAC Hooks & Integration
```bash
# الملفات المصدر:
src/hooks/useRBAC.ts
src/integrations/supabase/rbac.ts

# الوجهة:
src/core/rbac/hooks/useRBAC.ts
src/core/rbac/integration/rbac.integration.ts

# الإجراءات:
1. نسخ useRBAC.ts → core/rbac/hooks/
2. نسخ rbac.ts → core/rbac/integration/ (إعادة تسمية)
3. تحديث imports في useRBAC.ts
4. تحديث core/rbac/hooks/index.ts
5. تحديث core/rbac/index.ts
```

**الملفات المتأثرة:**
- `src/core/rbac/hooks/useRBAC.ts` (جديد)
- `src/core/rbac/integration/rbac.integration.ts` (جديد)
- `src/core/rbac/hooks/index.ts` (تحديث)
- `src/core/rbac/index.ts` (تحديث)

**التحديثات المطلوبة:**
```typescript
// src/core/rbac/hooks/index.ts
export { useRBAC } from './useRBAC';

// src/core/rbac/index.ts
export * from './hooks';
export * from './integration';
```

#### الخطوة 1.2: نقل UI Components إلى Core
```bash
# الملفات المصدر:
src/components/ui/*

# الوجهة:
src/core/components/ui/*

# الإجراءات:
1. نقل كامل مجلد ui/ إلى core/components/
2. لا حاجة لتحديث imports (نفس المسار @/components/ui)
3. تحديث core/components/index.ts
```

**عدد الملفات:** ~40 ملف مكون UI

#### الخطوة 1.3: نقل GateH Components إلى Core
```bash
# الملفات المصدر:
src/components/gateh/
├── ActionHeader.tsx
├── ActionTimeline.tsx
├── AddUpdateDialog.tsx
├── GateHExportDialog.tsx
├── StatusTracker.tsx
└── index.ts

# الوجهة:
src/core/components/gateh/

# الإجراءات:
1. نقل كامل مجلد gateh/
2. تحديث imports الداخلية
3. تحديث core/components/index.ts
```

#### الخطوة 1.4: دمج Layouts
```bash
# المشكلة: مجلدين مكررين
src/layouts/
src/layout/

# الحل:
1. مراجعة محتوى كل مجلد
2. دمجها في: src/core/components/layout/
3. حذف المجلدين القديمين
4. تحديث جميع imports
```

**الملفات للمراجعة:**
- `src/layouts/*`
- `src/layout/*`

#### الخطوة 1.5: تحديث Core Exports
```typescript
// src/core/index.ts
export * from './auth';
export * from './rbac';
export * from './tenancy';
export * from './services';
export * from './config';
export * from './hooks';
export * from './components';  // ← تحديث

// src/core/components/index.ts
export * from './ui';
export * from './layout';
export * from './gateh';
export * from './shared';
```

---

### المرحلة 2: Modules Migration (إنشاء ونقل الوحدات)

#### الخطوة 2.1: إنشاء Module - Committees

##### 2.1.1: إنشاء البنية الأساسية
```bash
# إنشاء المجلدات:
src/modules/committees/
├── types/
├── integration/
├── hooks/
├── components/
└── index.ts
```

##### 2.1.2: نقل Types
```bash
# البحث عن:
src/components/committees/* (ملفات .types.ts)
src/integrations/supabase/* (committee types)

# إنشاء:
src/modules/committees/types/
├── committee.types.ts
├── member.types.ts
├── meeting.types.ts
└── index.ts
```

**محتوى متوقع لـ committee.types.ts:**
```typescript
export type Committee = {
  id: string;
  code: string;
  name: string;
  charter?: string;
  status: CommitteeStatus;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};

export type CommitteeStatus = 'active' | 'inactive' | 'archived';

export type CommitteeListFilters = {
  search?: string;
  status?: CommitteeStatus;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  pageSize?: number;
};

// ... المزيد من الأنواع
```

##### 2.1.3: نقل Integration Layer
```bash
# البحث عن ملفات Supabase integration:
src/integrations/supabase/committees*
src/integrations/supabase/*committee*

# إنشاء:
src/modules/committees/integration/
├── committees.integration.ts
└── index.ts
```

**محتوى متوقع لـ committees.integration.ts:**
```typescript
import { supabase } from '@/integrations/supabase/client';
import type { Committee, CommitteeListFilters } from '../types';

export type CommitteesQueryParams = CommitteeListFilters;

export async function fetchCommitteesList(params: CommitteesQueryParams = {}) {
  // ... منطق جلب البيانات
}

export async function fetchCommitteeById(id: string) {
  // ... منطق جلب لجنة واحدة
}

export async function createCommittee(data: Omit<Committee, 'id' | 'createdAt'>) {
  // ... منطق الإنشاء
}

// ... المزيد من الدوال
```

##### 2.1.4: نقل Hooks
```bash
# البحث عن:
src/hooks/*committee*
src/components/committees/* (inline hooks)

# إنشاء:
src/modules/committees/hooks/
├── useCommitteesList.ts
├── useCommitteeById.ts
├── useCreateCommittee.ts
├── useUpdateCommittee.ts
├── useCommitteesFilters.ts
├── useBulkCommitteeActions.ts
└── index.ts
```

**محتوى متوقع لـ useCommitteesList.ts:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchCommitteesList } from '../integration';
import { qk } from '@/lib/query/keys';

export function useCommitteesList(params: CommitteesQueryParams) {
  return useQuery({
    queryKey: qk.committees.list(params),
    queryFn: () => fetchCommitteesList(params),
  });
}
```

##### 2.1.5: نقل Components
```bash
# المصدر:
src/components/committees/

# الوجهة:
src/modules/committees/components/

# الملفات المتوقعة:
├── CommitteeCard.tsx
├── CommitteeForm.tsx
├── CommitteeList.tsx
├── CommitteeDetails.tsx
├── MembersList.tsx
├── MeetingsList.tsx
└── index.ts
```

##### 2.1.6: Barrel Export
```typescript
// src/modules/committees/index.ts
/**
 * Committees Module
 * 
 * Committee management functionality
 */

// Types
export type {
  Committee,
  CommitteeStatus,
  CommitteeListFilters,
  CommitteeMember,
  CommitteeMeeting,
} from './types';

// Integration
export {
  fetchCommitteesList,
  fetchCommitteeById,
  createCommittee,
  updateCommittee,
  deleteCommittee,
} from './integration';

// Hooks
export {
  useCommitteesList,
  useCommitteeById,
  useCreateCommittee,
  useUpdateCommittee,
  useCommitteesFilters,
  useBulkCommitteeActions,
} from './hooks';

// Components
export {
  CommitteeCard,
  CommitteeForm,
  CommitteeList,
} from './components';
```

#### الخطوة 2.2: إنشاء Module - Documents

```bash
# نفس الخطوات السابقة لـ Committees:
src/modules/documents/
├── types/
│   ├── document.types.ts
│   └── index.ts
├── integration/
│   ├── documents.integration.ts
│   └── index.ts
├── hooks/
│   ├── useDocumentsList.ts
│   ├── useDocumentById.ts
│   └── index.ts
├── components/
│   ├── DocumentCard.tsx
│   ├── DocumentForm.tsx
│   └── index.ts
└── index.ts
```

**الملفات المصدر:**
- `src/components/documents/*`
- `src/integrations/supabase/*document*`

#### الخطوة 2.3: إنشاء Module - Policies

```bash
src/modules/policies/
├── types/
│   ├── policy.types.ts
│   └── index.ts
├── integration/
│   ├── policies.integration.ts
│   └── index.ts
├── hooks/
│   ├── usePoliciesList.ts
│   ├── usePolicyById.ts
│   └── index.ts
├── components/
│   ├── PolicyCard.tsx
│   ├── PolicyForm.tsx
│   └── index.ts
└── index.ts
```

**الملفات المصدر:**
- `src/components/policies/*`
- `src/integrations/supabase/*polic*`

#### الخطوة 2.4: إنشاء Module - Alerts

```bash
src/modules/alerts/
├── types/
│   ├── alert.types.ts
│   └── index.ts
├── integration/
│   ├── alerts.integration.ts
│   └── index.ts
├── hooks/
│   ├── useAlertsList.ts
│   ├── useAlertPolicies.ts
│   └── index.ts
├── components/
│   ├── AlertCard.tsx
│   ├── AlertPolicyForm.tsx
│   └── index.ts
└── index.ts
```

**الملفات المصدر:**
- `src/integrations/supabase/alert*`
- أي components متعلقة بالـ alerts

#### الخطوة 2.5: تحديث Modules Index
```typescript
// src/modules/index.ts
/**
 * Application Modules - Barrel Export
 * 
 * Reusable business modules
 */

export * from './campaigns';      // ✅ موجود
export * from './committees';     // ✅ جديد
export * from './documents';      // ✅ جديد
export * from './policies';       // ✅ جديد
export * from './alerts';         // ✅ جديد
export * from './content-hub';
export * from './culture-index';
```

---

### المرحلة 3: Apps Migration (نقل صفحات التطبيقات)

#### الخطوة 3.1: نقل Admin Pages إلى Platform App

```bash
# المصدر:
src/pages/admin/
├── access-matrix/
├── audit-log/
├── health/
├── roles/
├── settings/
├── tenants/
└── users/

# الوجهة:
src/apps/platform/pages/
├── access-matrix/
├── audit-log/
├── health/
├── roles/
├── settings/
├── tenants/
└── users/
```

**عدد الملفات:** ~30 صفحة

**الإجراءات:**
1. نقل كل مجلد فرعي
2. تحديث imports في كل ملف
3. تحديث route definitions في App.tsx

#### الخطوة 3.2: نقل Admin Components

```bash
# المصدر:
src/components/admin/

# الوجهة:
src/apps/platform/components/admin/
```

#### الخطوة 3.3: مراجعة Awareness Pages

```bash
# المراجعة:
src/apps/awareness/pages/

# التأكد من:
1. جميع الصفحات موجودة في apps/awareness
2. لا توجد صفحات awareness في src/pages/
3. الـ imports صحيحة من modules/
```

#### الخطوة 3.4: تحديث Routes

```typescript
// src/App.tsx - تحديث المسارات

// قبل:
import AdminDashboard from './pages/admin/AdminDashboard';

// بعد:
import AdminDashboard from './apps/platform/pages/AdminDashboard';

// أو بشكل أفضل:
import { AdminDashboard } from '@/apps/platform';
```

---

### المرحلة 4: Integration Layer Refactor (إعادة تنظيم التكاملات)

#### الخطوة 4.1: مراجعة ملفات Supabase

```bash
# الملفات الحالية:
src/integrations/supabase/
├── client.ts               ✅ read-only (لا يمس)
├── types.ts                ✅ read-only (لا يمس)
├── rbac.ts                 → نُقل إلى core/rbac/integration/
├── campaigns*.ts           → modules/campaigns/integration/
├── committees*.ts          → modules/committees/integration/
├── documents*.ts           → modules/documents/integration/
├── policies*.ts            → modules/policies/integration/
├── alerts*.ts              → modules/alerts/integration/
└── ...

# الإجراء:
1. مراجعة كل ملف
2. تحديد إلى أين ينقل (core / module / app)
3. نقله وتحديث imports
```

#### الخطوة 4.2: ملفات Supabase المتبقية

**الفئات:**

##### أ. Core Integration (نقل إلى core/)
```bash
src/integrations/supabase/
├── tenancy*.ts    → core/tenancy/integration/
├── auth*.ts       → core/auth/integration/
└── settings*.ts   → core/config/integration/
```

##### ب. Module Integration (نقل إلى modules/)
```bash
# تم التعامل معها في المرحلة 2
```

##### ج. App-Specific (نقل إلى apps/)
```bash
src/integrations/supabase/
├── platform*.ts   → apps/platform/integration/
└── awareness*.ts  → apps/awareness/integration/
```

##### د. Shared Utilities (يبقى في integrations/)
```bash
src/integrations/supabase/
├── client.ts      ✅ يبقى
├── types.ts       ✅ يبقى
├── index.ts       ✅ يبقى
└── utils/         ✅ يبقى (إن وجد)
```

#### الخطوة 4.3: تحديث Integration Index

```typescript
// src/integrations/supabase/index.ts
/**
 * Supabase Integration
 * 
 * Central export for Supabase client and utilities
 */

export { supabase } from './client';
export type { Database } from './types';

// Utilities (if any)
// export * from './utils';
```

---

### المرحلة 5: Cleanup & Testing (التنظيف والاختبار)

#### الخطوة 5.1: حذف الملفات القديمة

##### أ. حذف Hooks القديمة
```bash
# بعد التأكد من نقل كل شيء:
rm src/hooks/useRBAC.ts           # نُقل إلى core/rbac/hooks/

# مراجعة وحذف gate hooks:
rm -rf src/hooks/gatee/
rm -rf src/hooks/gatef/
rm -rf src/hooks/gatei/
```

**⚠️ تحذير:** قبل الحذف، التأكد من:
1. فهم استخدام هذه الـ hooks
2. نقلها أو دمجها في المكان المناسب
3. عدم وجود أي استخدام لها في الكود

##### ب. حذف Components القديمة
```bash
# بعد نقلها إلى modules/:
rm -rf src/components/committees/
rm -rf src/components/documents/
rm -rf src/components/policies/

# بعد نقلها إلى core/:
rm -rf src/components/ui/
rm -rf src/components/gateh/

# بعد نقلها إلى apps/:
rm -rf src/components/admin/
```

##### ج. حذف Pages القديمة
```bash
# بعد نقلها إلى apps/:
rm -rf src/pages/admin/
rm -rf src/pages/tenants/
# ... أي صفحات أخرى تم نقلها
```

##### د. حذف Layouts المكررة
```bash
# بعد الدمج في core/components/layout/:
rm -rf src/layouts/
rm -rf src/layout/
```

##### هـ. حذف Integration Files المنقولة
```bash
# بعد نقلها:
rm src/integrations/supabase/rbac.ts
rm src/integrations/supabase/campaigns*.ts
rm src/integrations/supabase/committees*.ts
# ... إلخ
```

#### الخطوة 5.2: تحديث جميع Imports

##### أ. استخدام Find & Replace في VS Code
```
البحث عن:
from '@/hooks/useRBAC'

الاستبدال بـ:
from '@/core/rbac'

---

البحث عن:
from '@/components/ui/

الاستبدال بـ:
from '@/core/components/ui/

---

البحث عن:
from '@/integrations/supabase/rbac'

الاستبدال بـ:
from '@/core/rbac/integration'
```

##### ب. التحقق من Barrel Exports

```typescript
// ✅ صحيح - استخدام barrel exports:
import { useRBAC } from '@/core/rbac';
import { useCampaignsList } from '@/modules/campaigns';
import { Button } from '@/core/components/ui';

// ❌ خطأ - استيراد مباشر:
import { useRBAC } from '@/core/rbac/hooks/useRBAC';
import { useCampaignsList } from '@/modules/campaigns/hooks/useCampaignsList';
```

#### الخطوة 5.3: تحديث tsconfig Paths

```json
// tsconfig.json - التأكد من الـ paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/core/*": ["./src/core/*"],
      "@/modules/*": ["./src/modules/*"],
      "@/apps/*": ["./src/apps/*"]
    }
  }
}
```

#### الخطوة 5.4: اختبار التطبيق

##### أ. اختبار Build
```bash
# 1. تشغيل Build
npm run build

# 2. التحقق من عدم وجود أخطاء:
- ✅ لا توجد import errors
- ✅ لا توجد type errors
- ✅ Build ينجح بدون تحذيرات
```

##### ب. اختبار Runtime
```bash
# 1. تشغيل Dev Server
npm run dev

# 2. اختبار الصفحات الرئيسية:
- ✅ /admin/campaigns - تعمل
- ✅ /admin/committees - تعمل  
- ✅ /admin/documents - تعمل
- ✅ /admin/policies - تعمل
- ✅ /admin/users - تعمل
- ✅ /admin/roles - تعمل
- ✅ /admin/tenants - تعمل
```

##### ج. اختبار CRUD Operations
```
لكل Module:
1. ✅ List - عرض القائمة
2. ✅ View - عرض التفاصيل
3. ✅ Create - إنشاء جديد
4. ✅ Update - تحديث موجود
5. ✅ Delete - حذف (soft delete)
6. ✅ Filters - عمل الفلاتر
7. ✅ Search - عمل البحث
8. ✅ Pagination - عمل الصفحات
```

##### د. اختبار RBAC
```
1. ✅ تسجيل الدخول كـ platform_admin
2. ✅ الوصول إلى صفحات Admin
3. ✅ تنفيذ عمليات CRUD
4. ✅ رؤية البيانات الصحيحة للـ tenant
```

#### الخطوة 5.5: مراجعة نهائية للكود

##### Checklist:
```
✅ جميع الملفات في المكان الصحيح
✅ لا توجد ملفات قديمة/مكررة
✅ جميع imports محدثة
✅ جميع barrel exports صحيحة
✅ لا توجد أخطاء TypeScript
✅ Build ينجح
✅ التطبيق يعمل بدون أخطاء
✅ جميع الصفحات تعمل
✅ CRUD operations تعمل
✅ RBAC يعمل بشكل صحيح
```

---

## 📄 قائمة الملفات الكاملة

### ملفات سيتم نقلها (Phase by Phase)

#### Phase 1: Core Migration

| المصدر | الوجهة | الحالة |
|--------|--------|--------|
| `src/hooks/useRBAC.ts` | `src/core/rbac/hooks/useRBAC.ts` | 🔄 نقل |
| `src/integrations/supabase/rbac.ts` | `src/core/rbac/integration/rbac.integration.ts` | 🔄 نقل |
| `src/components/ui/*` (40 ملف) | `src/core/components/ui/*` | 🔄 نقل |
| `src/components/gateh/*` (5 ملفات) | `src/core/components/gateh/*` | 🔄 نقل |
| `src/layouts/*` | `src/core/components/layout/*` | 🔄 دمج |
| `src/layout/*` | `src/core/components/layout/*` | 🔄 دمج |

**إجمالي الملفات: ~50 ملف**

#### Phase 2: Modules Migration

##### Committees Module
| المصدر | الوجهة | الحالة |
|--------|--------|--------|
| `src/components/committees/*.tsx` | `src/modules/committees/components/` | 🔄 نقل |
| `src/integrations/supabase/committee*.ts` | `src/modules/committees/integration/` | 🔄 نقل |
| hooks داخل components | `src/modules/committees/hooks/` | ✨ إنشاء |
| types داخل components | `src/modules/committees/types/` | ✨ إنشاء |

**عدد الملفات المتوقع: ~25 ملف**

##### Documents Module
| المصدر | الوجهة | الحالة |
|--------|--------|--------|
| `src/components/documents/*.tsx` | `src/modules/documents/components/` | 🔄 نقل |
| `src/integrations/supabase/document*.ts` | `src/modules/documents/integration/` | 🔄 نقل |

**عدد الملفات المتوقع: ~20 ملف**

##### Policies Module
| المصدر | الوجهة | الحالة |
|--------|--------|--------|
| `src/components/policies/*.tsx` | `src/modules/policies/components/` | 🔄 نقل |
| `src/integrations/supabase/polic*.ts` | `src/modules/policies/integration/` | 🔄 نقل |

**عدد الملفات المتوقع: ~20 ملف**

##### Alerts Module
| المصدر | الوجهة | الحالة |
|--------|--------|--------|
| `src/integrations/supabase/alert*.ts` | `src/modules/alerts/integration/` | 🔄 نقل |
| components متفرقة | `src/modules/alerts/components/` | 🔄 نقل/إنشاء |

**عدد الملفات المتوقع: ~15 ملف**

**إجمالي Phase 2: ~80 ملف**

#### Phase 3: Apps Migration

| المصدر | الوجهة | الحالة |
|--------|--------|--------|
| `src/pages/admin/*` | `src/apps/platform/pages/*` | 🔄 نقل |
| `src/components/admin/*` | `src/apps/platform/components/admin/*` | 🔄 نقل |

**عدد الملفات: ~35 ملف**

#### Phase 4: Integration Refactor

| المصدر | الوجهة | الحالة |
|--------|--------|--------|
| ملفات supabase متفرقة | توزيع على core/modules/apps | 🔄 نقل |

**عدد الملفات المتبقية: ~20 ملف**

#### Phase 5: Cleanup

| الملف/المجلد | الإجراء |
|-------------|---------|
| `src/hooks/gatee/` | 🗑️ حذف |
| `src/hooks/gatef/` | 🗑️ حذف |
| `src/hooks/gatei/` | 🗑️ حذف |
| `src/components/committees/` | 🗑️ حذف (بعد النقل) |
| `src/components/documents/` | 🗑️ حذف (بعد النقل) |
| `src/components/policies/` | 🗑️ حذف (بعد النقل) |
| `src/components/ui/` | 🗑️ حذف (بعد النقل) |
| `src/components/gateh/` | 🗑️ حذف (بعد النقل) |
| `src/components/admin/` | 🗑️ حذف (بعد النقل) |
| `src/pages/admin/` | 🗑️ حذف (بعد النقل) |
| `src/layouts/` | 🗑️ حذف (بعد الدمج) |
| `src/layout/` | 🗑️ حذف (بعد الدمج) |

**إجمالي الملفات للحذف: ~100 ملف**

### الملفات التي لن تمس

| المسار | السبب |
|--------|-------|
| `src/features/*` | ⏸️ خارج النطاق - سيعالج لاحقاً |
| `src/integrations/supabase/client.ts` | ✅ read-only |
| `src/integrations/supabase/types.ts` | ✅ read-only |
| `src/lib/*` | ✅ منظم بالفعل |
| `src/apps/awareness/*` | ✅ منظم بالفعل |
| `src/apps/platform/*` (الموجود) | ✅ منظم بالفعل |
| `src/core/auth/*` (الموجود) | ✅ منظم بالفعل |
| `src/core/tenancy/*` (الموجود) | ✅ منظم بالفعل |
| `src/modules/campaigns/*` | ✅ منظم بالفعل (D1) |

### إحصائيات إجمالية

```
📊 إجمالي الملفات المتأثرة:

✨ إنشاء جديد:    ~60 ملف (modules structure)
🔄 نقل:            ~185 ملف
🗑️ حذف:            ~100 ملف
✅ لن يمس:         ~200 ملف

المجموع الإجمالي:  ~545 ملف
```

---

## ⚠️ إدارة المخاطر

### المخاطر المحتملة وخطط التخفيف

#### 1. 🔴 خطر عالي: Import Errors

**المشكلة:**
```typescript
// بعد النقل، قد تظهر أخطاء:
Module not found: Can't resolve '@/hooks/useRBAC'
```

**خطة التخفيف:**
```
1. ✅ استخدام TypeScript للكشف عن الأخطاء
2. ✅ تشغيل Build بعد كل مرحلة
3. ✅ استخدام Find & Replace الشامل
4. ✅ مراجعة barrel exports
5. ✅ اختبار كل صفحة بعد التحديث
```

**الحل السريع:**
```bash
# في حالة ظهور أخطاء:
1. npm run build → لرؤية جميع الأخطاء
2. البحث عن النمط الخاطئ في VS Code
3. الاستبدال الشامل
4. Build مرة أخرى
```

#### 2. 🟡 خطر متوسط: Circular Dependencies

**المشكلة:**
```typescript
// قد تحدث dependencies دائرية:
core/rbac imports from modules/campaigns
modules/campaigns imports from core/rbac
```

**خطة التخفيف:**
```
1. ✅ اتباع Dependency Rule:
   Apps → Modules → Core
   
2. ✅ عدم السماح بـ:
   Core → Modules
   Core → Apps
   Modules → Apps
   
3. ✅ مراجعة imports في كل ملف
```

**القاعدة الذهبية:**
```
Core لا يستورد من Modules أو Apps أبداً
Modules لا تستورد من Apps أبداً
Apps تستورد من Core و Modules
```

#### 3. 🟡 خطر متوسط: حذف ملفات قيد الاستخدام

**المشكلة:**
```bash
# حذف ملف لا يزال مستخدماً:
rm src/hooks/gatee/useGateEViews.ts
# ← لكن لا يزال مستخدماً في أماكن أخرى
```

**خطة التخفيف:**
```
1. ✅ قبل حذف أي ملف، البحث عن استخداماته:
   - Ctrl+Shift+F في VS Code
   - البحث عن اسم الملف
   - البحث عن الـ imports منه

2. ✅ حذف الملف فقط إذا:
   - لا توجد imports منه
   - أو تم نقل جميع استخداماته

3. ✅ الاحتفاظ بنسخة backup قبل الحذف
```

#### 4. 🟢 خطر منخفض: Performance Issues

**المشكلة:**
```typescript
// barrel exports قد تؤثر على الأداء:
export * from './hooks';  // ← قد يستورد أكثر من اللازم
```

**خطة التخفيف:**
```
1. ✅ استخدام named exports حيثما أمكن
2. ✅ تجنب export * في الملفات الكبيرة
3. ✅ مراقبة bundle size بعد التغييرات
4. ✅ استخدام lazy loading للصفحات
```

#### 5. 🟢 خطر منخفض: Type Errors

**المشكلة:**
```typescript
// قد تظهر أخطاء types بعد النقل
Type 'Committee' is not assignable to type 'CommitteeData'
```

**خطة التخفيف:**
```
1. ✅ تشغيل TypeScript check بعد كل مرحلة:
   npx tsc --noEmit

2. ✅ مراجعة type definitions
3. ✅ التأكد من توافق الأنواع
4. ✅ تحديث types حسب الحاجة
```

### خطة الطوارئ (Rollback Plan)

#### إذا حدث خطأ كبير:

```bash
# 1. استعادة من Git
git reset --hard HEAD~1  # آخر commit
git reset --hard <commit-hash>  # commit محدد

# 2. أو استعادة من branch
git checkout main
git branch -D migration-temp

# 3. أو استعادة ملفات محددة
git checkout HEAD -- src/hooks/useRBAC.ts
```

#### الاحتياطات:

```
1. ✅ عمل commit بعد كل مرحلة ناجحة
2. ✅ استخدام branch منفصل للـ migration
3. ✅ الاحتفاظ بنسخة backup كاملة
4. ✅ اختبار بعد كل مرحلة قبل المتابعة
```

---

## ✅ معايير النجاح

### معايير القبول النهائية

#### 1. البنية (Structure) ✅

```
✅ جميع الملفات في المكان الصحيح:
   - Core في src/core/
   - Modules في src/modules/
   - Apps في src/apps/
   
✅ كل module يتبع D1 Standard:
   - types/
   - integration/
   - hooks/
   - components/
   - index.ts

✅ لا توجد ملفات قديمة/مكررة

✅ Barrel exports صحيحة في كل مستوى
```

#### 2. الكود (Code Quality) ✅

```
✅ لا توجد TypeScript errors:
   npx tsc --noEmit → 0 errors

✅ Build ينجح:
   npm run build → ✅ Success

✅ لا توجد console errors في البيئة التطويرية

✅ جميع imports محدثة وصحيحة

✅ Dependency rules محترمة:
   Apps → Modules → Core
```

#### 3. الوظائف (Functionality) ✅

```
✅ جميع الصفحات تعمل:
   - /admin/campaigns
   - /admin/committees
   - /admin/documents
   - /admin/policies
   - /admin/users
   - /admin/roles
   - /admin/tenants

✅ CRUD operations تعمل لكل module:
   - List/Read
   - Create
   - Update
   - Delete (soft)

✅ Filters & Search تعمل

✅ RBAC يعمل بشكل صحيح

✅ Realtime updates تعمل (إن وجدت)
```

#### 4. الأداء (Performance) ✅

```
✅ Bundle size لم يزد بشكل ملحوظ

✅ Page load time طبيعي

✅ لا توجد memory leaks

✅ Hot reload يعمل بسرعة
```

#### 5. التوثيق (Documentation) ✅

```
✅ README.md محدث

✅ وثائق الـ modules موجودة

✅ الـ comments في الكود واضحة

✅ Migration plan هذه الوثيقة مكتملة
```

### Checklist نهائي

قبل اعتبار المشروع مكتمل، يجب:

```
□ Phase 1 (Core Migration) مكتمل ومختبر
□ Phase 2 (Modules Migration) مكتمل ومختبر
□ Phase 3 (Apps Migration) مكتمل ومختبر
□ Phase 4 (Integration Refactor) مكتمل ومختبر
□ Phase 5 (Cleanup) مكتمل

□ جميع الملفات القديمة محذوفة
□ جميع imports محدثة
□ Build ينجح بدون أخطاء
□ التطبيق يعمل بدون أخطاء
□ جميع الصفحات مختبرة
□ CRUD operations مختبرة
□ RBAC مختبر
□ Performance طبيعي

□ Git commits منظمة
□ Documentation محدثة
□ Code review مكتمل
```

---

## 📅 الجدول الزمني

### تقدير الوقت لكل مرحلة

```
📊 التقدير الإجمالي: 10-15 ساعة عمل

Phase 1: Core Migration          → 2-3 ساعات
Phase 2: Modules Migration        → 4-6 ساعات
Phase 3: Apps Migration           → 2-3 ساعات  
Phase 4: Integration Refactor     → 1-2 ساعات
Phase 5: Cleanup & Testing        → 1-2 ساعات
```

### الجدول الزمني المقترح

#### اليوم 1 (4-5 ساعات)
```
صباحاً (2-3 ساعات):
├── Phase 1: Core Migration
│   ├── نقل RBAC hooks & integration
│   ├── نقل UI components
│   ├── نقل GateH components
│   └── دمج Layouts
└── Testing Phase 1

مساءً (2 ساعة):
├── Phase 2.1: Committees Module
│   ├── إنشاء البنية
│   ├── نقل types
│   ├── نقل integration
│   ├── نقل hooks
│   └── نقل components
└── Testing Committees
```

#### اليوم 2 (5-6 ساعات)
```
صباحاً (3-4 ساعات):
├── Phase 2.2: Documents Module
├── Phase 2.3: Policies Module
└── Phase 2.4: Alerts Module
└── Testing All Modules

مساءً (2 ساعة):
├── Phase 3: Apps Migration
│   ├── نقل Admin pages
│   ├── نقل Admin components
│   └── تحديث routes
└── Testing Apps
```

#### اليوم 3 (3-4 ساعات)
```
صباحاً (2 ساعة):
├── Phase 4: Integration Refactor
│   └── توزيع ملفات supabase المتبقية
└── Testing Integration Layer

مساءً (1-2 ساعة):
├── Phase 5: Cleanup & Testing
│   ├── حذف الملفات القديمة
│   ├── تحديث جميع imports
│   ├── Final testing
│   └── Documentation update
└── Final Review & Sign-off
```

### المعالم الرئيسية (Milestones)

```
🎯 Milestone 1: Core Ready
   - Core services منظمة
   - UI components في core
   - Build ينجح
   
🎯 Milestone 2: Modules Complete  
   - جميع الـ 4 modules منشأة
   - تتبع D1 Standard
   - CRUD يعمل

🎯 Milestone 3: Apps Organized
   - صفحات Admin في platform app
   - Routes محدثة
   - Navigation يعمل

🎯 Milestone 4: Clean Codebase
   - لا ملفات قديمة
   - جميع imports صحيحة
   - Testing مكتمل

🎯 Milestone 5: Production Ready
   - جميع tests تنجح
   - Documentation مكتملة
   - Ready for deployment
```

---

## 📝 ملاحظات إضافية

### أفضل الممارسات أثناء التنفيذ

#### 1. استخدام Git بفعالية
```bash
# إنشاء branch للـ migration
git checkout -b migration/unified-platform-architecture

# Commit بعد كل مرحلة ناجحة
git add .
git commit -m "feat: Phase 1 - Core Migration complete"

# Push للـ backup
git push origin migration/unified-platform-architecture
```

#### 2. التنفيذ التدريجي
```
✅ نفذ مرحلة واحدة في كل مرة
✅ اختبر بعد كل مرحلة
✅ Commit بعد كل مرحلة ناجحة
✅ لا تنتقل للمرحلة التالية إلا بعد نجاح السابقة
```

#### 3. التوثيق المستمر
```
✅ وثق أي تغييرات غير متوقعة
✅ سجل القرارات المهمة
✅ حدّث هذه الوثيقة إذا لزم الأمر
✅ اكتب notes للمطورين الآخرين
```

#### 4. Communication
```
✅ أبلغ الفريق قبل البدء
✅ شارك التقدم بانتظام
✅ اطلب المراجعة عند الحاجة
✅ وثق أي مشاكل أو حلول
```

### الأدوات المساعدة

#### VS Code Extensions المفيدة
```
- Error Lens          → رؤية الأخطاء مباشرة
- Import Cost         → معرفة حجم الـ imports
- Path Intellisense   → autocomplete للمسارات
- Better Comments     → تنظيم الـ comments
- Todo Tree           → تتبع TODO items
```

#### Commands مفيدة
```bash
# البحث عن جميع imports لملف معين
grep -r "from '@/hooks/useRBAC'" src/

# عد الملفات في مجلد
find src/components/ui -type f | wc -l

# البحث عن TODO items
grep -r "TODO" src/

# التحقق من TypeScript
npx tsc --noEmit

# Check Bundle Size
npm run build -- --analyze
```

---

## 🎯 الخلاصة

### ما الذي سنحققه؟

#### قبل Migration ❌
```
❌ ملفات مبعثرة وغير منظمة
❌ صعوبة في إيجاد الكود
❌ تكرار الكود
❌ صعوبة في الصيانة
❌ صعوبة في إضافة ميزات جديدة
❌ غير قابل للتوسع
```

#### بعد Migration ✅
```
✅ بنية واضحة ومنظمة
✅ سهولة في إيجاد الكود
✅ إعادة استخدام عالية
✅ سهولة في الصيانة
✅ سرعة في إضافة ميزات
✅ قابل للتوسع (Scalable)
✅ يتبع Best Practices
✅ جاهز لإضافة Apps جديدة
```

### الفوائد طويلة الأمد

```
🚀 تطوير أسرع
   - إضافة modules جديدة بسهولة
   - إضافة apps جديدة بسهولة
   - استخدام مكونات جاهزة

📦 إعادة استخدام أفضل
   - Modules قابلة للاستخدام في apps متعددة
   - Core services مشتركة
   - Components قابلة لإعادة الاستخدام

🔧 صيانة أسهل
   - كود منظم وواضح
   - سهولة في إيجاد المشاكل
   - سهولة في التحديثات

👥 تعاون أفضل
   - فهم سريع للبنية
   - مسؤوليات واضحة
   - onboarding أسهل للمطورين الجدد

📈 قابلية التوسع
   - إضافة LMS app
   - إضافة Phishing app  
   - إضافة GRC app
   - كل app يستخدم نفس Core & Modules
```

---

## ✍️ موافقة وبدء التنفيذ

### قبل البدء

```
□ مراجعة كاملة لهذه الوثيقة
□ فهم كل مرحلة وخطواتها
□ الموافقة على الخطة
□ تخصيص الوقت اللازم
□ إنشاء backup
□ إنشاء Git branch
□ إبلاغ الفريق
```

### بعد الموافقة

```bash
# 1. إنشاء Branch
git checkout -b migration/unified-platform-architecture

# 2. البدء بـ Phase 1
# ... (اتبع الخطوات في الوثيقة)

# 3. التقدم تدريجياً
# Phase 1 → Test → Commit
# Phase 2 → Test → Commit
# Phase 3 → Test → Commit
# Phase 4 → Test → Commit
# Phase 5 → Test → Commit

# 4. Final Review & Merge
git checkout main
git merge migration/unified-platform-architecture
```

---

## 📞 الدعم والمساعدة

إذا واجهت أي مشكلة أثناء التنفيذ:

1. ✅ راجع قسم "إدارة المخاطر" في هذه الوثيقة
2. ✅ ابحث عن الخطأ في الوثائق
3. ✅ راجع الكود المشابه في campaigns module (D1 Standard)
4. ✅ تحقق من console errors
5. ✅ استخدم TypeScript للكشف عن المشاكل

---

**تاريخ آخر تحديث:** 2025-11-15  
**الإصدار:** 1.0  
**الحالة:** ✅ جاهز للمراجعة والتنفيذ

---

**ملاحظة نهائية:**  
هذه الوثيقة شاملة ومفصلة، لكنها قابلة للتعديل حسب احتياجات المشروع. يُنصح بمراجعتها بعناية قبل البدء في التنفيذ وتحديثها عند الحاجة أثناء عملية الـ Migration.

**نجاح هذا المشروع يعتمد على:**
- 📝 التخطيط الدقيق (✅ مكتمل بهذه الوثيقة)
- 🔍 التنفيذ التدريجي والمنظم
- 🧪 الاختبار المستمر
- 📚 التوثيق الجيد
- 👥 التواصل الفعال

**بالتوفيق! 🚀**
