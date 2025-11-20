# System Architecture Overview v1.0
**Date:** 2025-11-17  
**Project:** Romuz Cybersecurity Culture Platform  
**Owner:** Smart Solutions Unit  
**Version:** 1.0

---

## 1. نظرة عامة (Overview)

منصة Romuz هي تطبيق SaaS متعدد المستأجرين (Multi-Tenant) مبني على معمارية حديثة تعتمد على:
- **Frontend:** React + TypeScript + Vite
- **UI Framework:** Tailwind CSS + shadcn/ui
- **Backend:** Lovable Cloud (Supabase)
- **State Management:** TanStack Query (React Query)
- **Routing:** React Router v6
- **Authentication:** Supabase Auth + Enhanced RBAC

---

## 2. المبادئ المعمارية الأساسية

### 2.1 الفصل بين الطبقات (Layered Architecture)
```
┌─────────────────────────────────────────┐
│           Apps Layer (UI)               │  ← التطبيقات والواجهات
├─────────────────────────────────────────┤
│         Modules Layer (Logic)           │  ← منطق الأعمال القابل لإعادة الاستخدام
├─────────────────────────────────────────┤
│      Core Layer (Foundation)            │  ← الخدمات الأساسية والبنية التحتية
├─────────────────────────────────────────┤
│    Integration Layer (Supabase)         │  ← التكامل مع قاعدة البيانات والAPI
└─────────────────────────────────────────┘
```

### 2.2 Multi-Tenancy Architecture
- **عزل كامل للبيانات:** كل tenant له قاعدة بيانات منطقية منفصلة
- **RLS (Row Level Security):** تطبيق الأمان على مستوى الصف
- **Context-Based Routing:** توجيه تلقائي بناءً على سياق المستأجر
- **Shared Infrastructure:** بنية تحتية مشتركة مع عزل منطقي

### 2.3 Security-First Design
- **Database-Driven RBAC:** صلاحيات مدارة عبر قاعدة البيانات
- **RLS Policies:** سياسات أمان صارمة على جميع الجداول
- **Audit Logging:** تسجيل شامل لجميع العمليات الحرجة
- **JWT-Based Auth:** مصادقة آمنة باستخدام JWT tokens

---

## 3. بنية المشروع (Project Structure)

### 3.1 Core Layer (`src/core/`)
الطبقة الأساسية التي تعتمد عليها جميع التطبيقات والموديولات.

```typescript
src/core/
├── auth/              # نظام المصادقة والتفويض
│   ├── AuthProvider.tsx
│   ├── hooks/
│   └── utils/
├── rbac/              # نظام الصلاحيات المتقدم
│   ├── types.ts
│   ├── roles.ts
│   ├── permissions.ts
│   ├── hooks/
│   └── integration/
├── tenancy/           # Multi-Tenancy Support
│   └── integration/
├── services/          # خدمات مشتركة
├── config/            # إعدادات النظام
├── hooks/             # React Hooks مشتركة
└── components/        # مكونات UI أساسية
```

**المسؤوليات:**
- ✅ إدارة المصادقة والجلسات
- ✅ نظام RBAC المتقدم
- ✅ إدارة سياق المستأجر (Tenant Context)
- ✅ الخدمات المشتركة (Logging, Error Handling)
- ✅ المكونات الأساسية المشتركة

### 3.2 Modules Layer (`src/modules/`)
موديولات منطق الأعمال القابلة لإعادة الاستخدام.

```typescript
src/modules/
├── campaigns/         # M2 - إدارة حملات التوعية
├── content-hub/       # M4 - مركز المحتوى
├── culture-index/     # M3 - مؤشرات الثقافة
├── awareness/         # تقارير ومقاييس التوعية
├── policies/          # M23 - إدارة السياسات
├── committees/        # M21 - إدارة اللجان
├── kpis/              # إدارة مؤشرات الأداء
├── automation/        # قواعد الأتمتة
├── grc/               # Governance, Risk & Compliance
└── master-data/       # إدارة البيانات الرئيسية
```

**بنية كل Module:**
```typescript
modules/{module-name}/
├── types/              # TypeScript Types
│   └── *.types.ts
├── integration/        # Supabase Integration
│   └── *.integration.ts
├── hooks/              # React Hooks
│   ├── use*.ts
│   └── index.ts
├── components/         # Shared Components
│   ├── *Card.tsx
│   ├── *Form.tsx
│   └── index.ts
└── index.ts            # Barrel Export
```

**المسؤوليات:**
- ✅ منطق الأعمال (Business Logic)
- ✅ نماذج البيانات (Data Models)
- ✅ التكامل مع API
- ✅ React Hooks المتخصصة
- ✅ مكونات قابلة لإعادة الاستخدام

### 3.3 Apps Layer (`src/apps/`)
التطبيقات والواجهات النهائية للمستخدمين.

```typescript
src/apps/
├── platform/          # تطبيق المنصة الأساسي
│   ├── pages/
│   ├── routes.tsx
│   └── index.ts
├── admin/             # لوحة التحكم الإدارية
│   ├── pages/
│   ├── routes.tsx
│   └── config.ts
├── awareness/         # تطبيق التوعية الأمنية
│   ├── pages/
│   ├── routes.tsx
│   └── config.ts
└── lms/               # نظام إدارة التعلم
    ├── pages/
    ├── routes.tsx
    └── config.ts
```

**المسؤوليات:**
- ✅ صفحات التطبيق (Pages)
- ✅ التوجيه (Routing)
- ✅ تكوين التطبيق (App Configuration)
- ✅ تخطيطات الصفحات (Layouts)
- ✅ تجربة المستخدم النهائية

### 3.4 Integration Layer (`src/integrations/supabase/`)
طبقة التكامل مع Lovable Cloud (Supabase).

```typescript
src/integrations/supabase/
├── client.ts          # Supabase Client (Auto-generated)
└── types.ts           # Database Types (Auto-generated)
```

**ملاحظات هامة:**
- ⚠️ **لا تعدل هذه الملفات يدويًا** - يتم إنشاؤها تلقائيًا
- ✅ استخدم `import { supabase } from "@/integrations/supabase/client"`
- ✅ جميع استدعاءات قاعدة البيانات تمر عبر طبقة Integration في Modules

---

## 4. نظام RBAC المتقدم

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Application Layer                  │
│   (React Components + Hooks)                    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│           RBAC Hooks Layer                      │
│   • useRole()                                   │
│   • useCan()                                    │
│   • usePermissions()                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Permission System Layer                 │
│   • matchesPermission()                         │
│   • hasPermission()                             │
│   • Wildcard Support (*)                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│           Database Layer                        │
│   • user_roles table                            │
│   • Security Definer Functions                  │
│   • RLS Policies                                │
└─────────────────────────────────────────────────┘
```

### 4.2 Role Hierarchy

#### Platform Roles (عبر جميع المستأجرين)
```typescript
enum PlatformRoles {
  PLATFORM_ADMIN = 'platform_admin',    // الصلاحيات الكاملة
  PLATFORM_SUPPORT = 'platform_support' // الدعم الفني
}
```

#### Tenant Roles (داخل المستأجر)
```typescript
enum TenantRoles {
  TENANT_ADMIN = 'tenant_admin',        // مدير المستأجر
  TENANT_MANAGER = 'tenant_manager',    // المدير
  TENANT_EMPLOYEE = 'tenant_employee'   // الموظف
}
```

### 4.3 Permission Categories

```typescript
categories = {
  'campaigns': ['create', 'read', 'update', 'delete', 'publish'],
  'policies': ['create', 'read', 'update', 'delete', 'approve'],
  'users': ['create', 'read', 'update', 'delete', 'manage_roles'],
  'reports': ['read', 'export', 'schedule'],
  'settings': ['read', 'update', 'manage_integrations'],
  // ... إلخ
}
```

### 4.4 Wildcard Permissions
```typescript
// أمثلة على Wildcards
'campaigns:*'        // جميع صلاحيات الحملات
'*:read'            // القراءة في جميع الموديولات
'*:*'               // جميع الصلاحيات (Super Admin)
```

### 4.5 Usage Examples

#### في React Components
```typescript
import { useCan, useRole } from '@/core/rbac';

function CampaignActions() {
  const { can } = useCan();
  const { hasRole, isPlatformAdmin } = useRole();
  
  return (
    <>
      {can('campaigns:create') && <CreateButton />}
      {can('campaigns:delete') && <DeleteButton />}
      {isPlatformAdmin && <AdminPanel />}
    </>
  );
}
```

#### في Route Protection
```typescript
import { RequirePermission } from '@/core/rbac';

<Route
  path="/campaigns/new"
  element={
    <RequirePermission permission="campaigns:create">
      <CreateCampaignPage />
    </RequirePermission>
  }
/>
```

---

## 5. Multi-Tenancy Implementation

### 5.1 Tenant Context Flow

```
User Login
    ↓
JWT Token (includes tenant_id in metadata)
    ↓
AppContextProvider extracts tenant_id
    ↓
All queries automatically filtered by tenant_id
    ↓
RLS enforces tenant isolation at DB level
```

### 5.2 RLS Policy Pattern

كل جدول tenant-scoped يتبع هذا النمط:

```sql
-- Enable RLS
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
CREATE POLICY "Users can view their tenant data"
ON public.{table_name}
FOR SELECT
USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- INSERT Policy
CREATE POLICY "Users can insert for their tenant"
ON public.{table_name}
FOR INSERT
WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

-- UPDATE Policy
CREATE POLICY "Users can update their tenant data"
ON public.{table_name}
FOR UPDATE
USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- DELETE Policy
CREATE POLICY "Users can delete their tenant data"
ON public.{table_name}
FOR DELETE
USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

### 5.3 Tenant Isolation Guarantees

✅ **Database Level:**
- RLS policies enforce tenant_id filtering
- No queries can access other tenant's data
- Composite unique indexes include tenant_id

✅ **Application Level:**
- AppContext provides tenant_id automatically
- All Supabase calls include tenant filter
- Frontend never manually sets tenant_id

✅ **API Level:**
- JWT token includes tenant_id claim
- Server-side validation on all operations
- Edge Functions respect tenant context

---

## 6. تدفق البيانات (Data Flow)

### 6.1 Read Flow
```
Component
    ↓ (uses hook)
useModule Hook (e.g., useCampaignsList)
    ↓ (calls)
Module Integration (e.g., fetchCampaignsList)
    ↓ (queries)
Supabase Client + RLS
    ↓ (returns)
TanStack Query Cache
    ↓ (provides)
Component Render
```

### 6.2 Write Flow
```
Component (Form Submit)
    ↓ (calls mutation)
useMutation Hook
    ↓ (calls)
Module Integration (e.g., createCampaign)
    ↓ (executes)
Supabase Client (INSERT)
    ↓ (triggers)
RLS Policy Validation
    ↓ (logs)
Audit Log Entry
    ↓ (invalidates)
Query Cache Refresh
    ↓ (updates)
UI Re-render
```

### 6.3 Authentication Flow
```
User Credentials
    ↓
Supabase Auth (signInWithPassword)
    ↓
JWT Token (with tenant_id, roles)
    ↓
AppContextProvider (extract context)
    ↓
React Query Context
    ↓
All Queries Authenticated
```

---

## 7. الأنماط المعمارية المستخدمة

### 7.1 Repository Pattern
كل module يحتوي على طبقة integration تعمل كـ repository:

```typescript
// modules/campaigns/integration/campaigns.integration.ts
export async function fetchCampaignsList(
  params: CampaignsQueryParams
): Promise<Campaign[]> {
  // Implementation
}

export async function createCampaign(
  data: CreateCampaignInput
): Promise<Campaign> {
  // Implementation
}
```

### 7.2 Hook Pattern
استخدام React Hooks لإدارة الحالة والعمليات:

```typescript
// modules/campaigns/hooks/useCampaignsList.ts
export function useCampaignsList(params?: CampaignsQueryParams) {
  return useQuery({
    queryKey: ['campaigns', 'list', params],
    queryFn: () => fetchCampaignsList(params),
  });
}
```

### 7.3 Barrel Export Pattern
تنظيم الصادرات من كل module:

```typescript
// modules/campaigns/index.ts
export * from './types';
export * from './integration';
export * from './hooks';
export * from './components';
```

### 7.4 Optimistic Updates
تحديثات تفاؤلية لتحسين تجربة المستخدم:

```typescript
const mutation = useMutation({
  mutationFn: updateCampaign,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['campaigns']);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['campaigns']);
    
    // Optimistically update
    queryClient.setQueryData(['campaigns'], (old) => ({
      ...old,
      ...newData,
    }));
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['campaigns'], context.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries(['campaigns']);
  },
});
```

---

## 8. الموديولات الرئيسية (Core Modules)

### 8.1 M2 - Campaigns (حملات التوعية)
```
modules/campaigns/
├── types/
│   ├── campaign.types.ts       # Campaign, CampaignStatus
│   ├── participant.types.ts    # Participant, ParticipantStatus
│   ├── module.types.ts         # CampaignModule
│   └── quiz.types.ts           # Quiz, Question, Answer
├── integration/
│   ├── campaigns.integration.ts
│   ├── participants.integration.ts
│   ├── modules.integration.ts
│   └── quizzes.integration.ts
├── hooks/
│   ├── useCampaignsList.ts
│   ├── useCampaignById.ts
│   ├── useParticipants.ts
│   └── useQuizzes.ts
└── components/
    ├── CampaignCard.tsx
    ├── StatusBadge.tsx
    └── ParticipantsList.tsx
```

**الوظائف الرئيسية:**
- ✅ إنشاء وإدارة حملات التوعية
- ✅ تتبع المشاركين والتقدم
- ✅ إدارة المحتوى والاختبارات
- ✅ تقارير الأداء والتفاعل

### 8.2 M4 - Content Hub (مركز المحتوى)
```
modules/content-hub/
├── types/
│   ├── content.types.ts        # ContentItem, ContentType
│   └── version.types.ts        # ContentVersion
├── integration/
│   ├── content.integration.ts
│   └── versions.integration.ts
└── hooks/
    ├── useContentList.ts
    └── useContentVersions.ts
```

**الوظائف الرئيسية:**
- ✅ إدارة مكتبة المحتوى
- ✅ التحكم في الإصدارات
- ✅ دعم متعدد اللغات
- ✅ تصنيف وتنظيم المحتوى

### 8.3 M21 - Committees (إدارة اللجان)
```
modules/committees/
├── types/
│   ├── committee.types.ts
│   ├── workflow.types.ts
│   └── analytics.types.ts
├── integration/
│   ├── committees.integration.ts
│   ├── workflows.integration.ts
│   ├── analytics.integration.ts
│   └── notifications.integration.ts
└── hooks/
    ├── useCommittees.ts
    ├── useWorkflows.ts
    └── useAnalytics.ts
```

**الوظائف الرئيسية:**
- ✅ إدارة اللجان والأعضاء
- ✅ سير عمل القرارات (Workflows)
- ✅ الاجتماعات والمتابعة
- ✅ تحليلات الأداء

### 8.4 Master Data (البيانات الرئيسية)
```
modules/master-data/
├── types/
│   ├── catalog.types.ts        # Catalog, CatalogScope
│   ├── term.types.ts           # Term, TermStatus
│   └── mapping.types.ts        # Mapping, MappingType
├── integration/
│   ├── catalogs.integration.ts
│   ├── terms.integration.ts
│   └── mappings.integration.ts
├── hooks/
│   ├── useCatalogs.ts
│   ├── useTerms.ts
│   └── useMappings.ts
└── components/
    ├── CatalogSelector.tsx
    ├── TermSelector.tsx
    └── BulkImportDialog.tsx
```

**الوظائف الرئيسية:**
- ✅ إدارة الكتالوجات (Catalogs)
- ✅ إدارة المصطلحات (Terms)
- ✅ الربط بين الأنظمة (Mappings)
- ✅ الاستيراد/التصدير الجماعي

---

## 9. الأمان والصلاحيات (Security & Permissions)

### 9.1 Defense in Depth Strategy

```
┌─────────────────────────────────────────┐
│     1. Frontend Permission Checks       │  ← إخفاء UI غير مصرح به
├─────────────────────────────────────────┤
│     2. Route Protection Guards          │  ← منع الوصول للصفحات
├─────────────────────────────────────────┤
│     3. API Integration Validation       │  ← التحقق من الصلاحيات
├─────────────────────────────────────────┤
│     4. Database RLS Policies            │  ← الحماية النهائية
└─────────────────────────────────────────┘
```

### 9.2 RLS Policy Examples

#### Basic Tenant Isolation
```sql
CREATE POLICY "tenant_isolation"
ON public.campaigns
FOR ALL
USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

#### Role-Based Access
```sql
CREATE POLICY "admin_full_access"
ON public.campaigns
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('platform_admin', 'tenant_admin')
  OR tenant_id = auth.jwt() ->> 'tenant_id'
);
```

#### Permission-Based Access
```sql
CREATE POLICY "manager_update_only"
ON public.campaigns
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND has_permission('campaigns:update')
  )
  AND tenant_id = auth.jwt() ->> 'tenant_id'
);
```

### 9.3 Audit Logging Pattern

جميع العمليات الحرجة تُسجل في `audit_log`:

```typescript
await logAuditAction({
  entity_type: 'campaign',
  entity_id: campaignId,
  action: 'UPDATE',
  actor: userId,
  tenant_id: tenantId,
  payload: {
    changes: diff,
    old_values: oldData,
    new_values: newData,
  },
});
```

**ما يتم تسجيله:**
- ✅ جميع عمليات CREATE/UPDATE/DELETE
- ✅ تغييرات الصلاحيات والأدوار
- ✅ تسجيل الدخول والخروج
- ✅ الوصول للبيانات الحساسة
- ✅ عمليات التصدير والاستيراد

---

## 10. State Management Strategy

### 10.1 TanStack Query (React Query)

**لماذا React Query؟**
- ✅ Server State Management تلقائي
- ✅ Caching ذكي مع Automatic Refetching
- ✅ Optimistic Updates
- ✅ Background Synchronization
- ✅ Pagination & Infinite Queries

### 10.2 Query Key Strategy

```typescript
// Convention: [module, operation, ...params]
const keys = {
  campaigns: {
    all: ['campaigns'] as const,
    lists: () => [...keys.campaigns.all, 'list'] as const,
    list: (filters: CampaignsQueryParams) =>
      [...keys.campaigns.lists(), filters] as const,
    details: () => [...keys.campaigns.all, 'detail'] as const,
    detail: (id: string) => [...keys.campaigns.details(), id] as const,
  },
};
```

### 10.3 Cache Invalidation

```typescript
// بعد Create
await queryClient.invalidateQueries(['campaigns', 'list']);

// بعد Update
await queryClient.invalidateQueries(['campaigns', 'detail', id]);
await queryClient.invalidateQueries(['campaigns', 'list']);

// بعد Delete
await queryClient.removeQueries(['campaigns', 'detail', id]);
await queryClient.invalidateQueries(['campaigns', 'list']);
```

---

## 11. التوجيه والملاحة (Routing & Navigation)

### 11.1 Route Structure

```
/ (Root)
├── /auth
│   ├── /login
│   └── /signup
├── /admin
│   ├── /dashboard
│   ├── /users
│   ├── /roles
│   └── /master-data
│       ├── /catalogs
│       ├── /terms
│       └── /mappings
├── /awareness
│   ├── /campaigns
│   ├── /analytics
│   └── /reports
├── /lms
│   ├── /courses
│   ├── /enrollments
│   └── /certificates
└── /grc
    ├── /policies
    ├── /risks
    ├── /controls
    └── /audits
```

### 11.2 Protected Routes

```typescript
<Route
  element={
    <RequireAuth>
      <RequirePermission permission="admin:access">
        <AdminLayout />
      </RequirePermission>
    </RequireAuth>
  }
>
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="users" element={<UsersPage />} />
</Route>
```

### 11.3 App Registry Pattern

```typescript
// src/core/config/apps.registry.ts
export const appsRegistry: AppModule[] = [
  awarenessApp,
  lmsApp,
  employeePortalApp,
  adminApp,
];

// يُستخدم لبناء القوائم والتوجيه الديناميكي
```

---

## 12. UI/UX Design System

### 12.1 Design Tokens (Semantic Colors)

```css
/* index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
```

### 12.2 Component Patterns

**استخدام shadcn/ui Components:**
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
```

**Custom Variants:**
```typescript
const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      destructive: "bg-destructive text-destructive-foreground",
      outline: "border border-input",
      // ... إلخ
    },
  },
});
```

### 12.3 RTL Support

```typescript
// i18n configuration
i18n.dir(i18n.language === 'ar' ? 'rtl' : 'ltr');
document.documentElement.dir = i18n.dir();
```

---

## 13. Performance Optimization

### 13.1 Code Splitting

```typescript
// Lazy loading routes
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const CampaignDetails = lazy(() => import('./pages/CampaignDetails'));

<Route
  path="campaigns"
  element={
    <Suspense fallback={<LoadingSkeleton />}>
      <CampaignsPage />
    </Suspense>
  }
/>
```

### 13.2 React Query Optimization

```typescript
// Prefetching
queryClient.prefetchQuery({
  queryKey: ['campaigns', 'list'],
  queryFn: fetchCampaignsList,
});

// Stale time configuration
useQuery({
  queryKey: ['campaigns', id],
  queryFn: () => fetchCampaignById(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 13.3 Database Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_campaigns_tenant_status 
ON campaigns(tenant_id, status);

CREATE INDEX idx_campaigns_tenant_created 
ON campaigns(tenant_id, created_at DESC);

-- Timestamp indexes
CREATE INDEX idx_campaigns_created_at 
ON campaigns(created_at DESC);
```

---

## 14. Error Handling Strategy

### 14.1 Error Boundaries

```typescript
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => {
    logError(error, errorInfo);
  }}
>
  <App />
</ErrorBoundary>
```

### 14.2 Query Error Handling

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['campaigns', id],
  queryFn: () => fetchCampaignById(id),
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (isError) {
  return <ErrorMessage error={error} />;
}
```

### 14.3 Toast Notifications

```typescript
import { toast } from 'sonner';

// Success
toast.success('تم حفظ الحملة بنجاح');

// Error
toast.error('حدث خطأ أثناء الحفظ');

// Loading
const toastId = toast.loading('جاري الحفظ...');
toast.success('تم الحفظ', { id: toastId });
```

---

## 15. Testing Strategy

### 15.1 Unit Testing
```typescript
// Example: Testing a utility function
describe('matchesPermission', () => {
  it('should match exact permission', () => {
    expect(matchesPermission('campaigns:read', 'campaigns:read'))
      .toBe(true);
  });
  
  it('should match wildcard category', () => {
    expect(matchesPermission('campaigns:*', 'campaigns:read'))
      .toBe(true);
  });
});
```

### 15.2 Integration Testing
```typescript
// Example: Testing a custom hook
describe('useCampaignsList', () => {
  it('should fetch campaigns list', async () => {
    const { result } = renderHook(() => useCampaignsList(), {
      wrapper: QueryClientWrapper,
    });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
  });
});
```

### 15.3 E2E Testing (Planned)
- Playwright for end-to-end testing
- Critical user flows coverage
- Multi-tenant scenarios

---

## 16. Deployment & DevOps

### 16.1 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to Lovable
        run: npm run deploy
```

### 16.2 Environment Variables
```env
# .env (Auto-generated by Lovable Cloud)
VITE_SUPABASE_URL=<auto-generated>
VITE_SUPABASE_PUBLISHABLE_KEY=<auto-generated>
VITE_SUPABASE_PROJECT_ID=<auto-generated>
```

### 16.3 Database Migrations
```bash
# Migrations are automatic via Lovable Cloud
# Migration files stored in: supabase/migrations/
```

---

## 17. Monitoring & Observability

### 17.1 Audit Logging
- جميع العمليات الحرجة مسجلة في `audit_log`
- Query: `SELECT * FROM audit_log WHERE entity_type = 'campaign'`

### 17.2 Performance Monitoring
- React Query DevTools (Development)
- Console logging for critical operations
- Error tracking via Error Boundaries

### 17.3 Database Analytics (من خلال Lovable Cloud)
- Query performance monitoring
- Slow query detection
- Index usage statistics

---

## 18. Future Enhancements

### 18.1 Planned Features
- [ ] Advanced Analytics Dashboard (M24)
- [ ] Self-Service Analytics (M24)
- [ ] Customer Success Toolkit (M25)
- [ ] Public API/Webhooks (M15)
- [ ] Advanced Reporting Engine
- [ ] Real-time Notifications
- [ ] Mobile Application (Phase 3)

### 18.2 Technical Debt
- [ ] Comprehensive E2E testing
- [ ] Performance optimization for large datasets
- [ ] Advanced caching strategies
- [ ] PWA support
- [ ] Offline capabilities

### 18.3 Scalability Improvements
- [ ] Database query optimization
- [ ] CDN for static assets
- [ ] Redis caching layer (if needed)
- [ ] Load balancing strategy
- [ ] Microservices migration (long-term)

---

## 19. Best Practices & Guidelines

### 19.1 Code Organization
✅ **DO:**
- استخدم barrel exports (`index.ts`)
- اتبع بنية الطبقات (Core → Modules → Apps)
- فصل منطق الأعمال عن UI
- استخدم TypeScript بشكل صارم

❌ **DON'T:**
- لا تخلط بين طبقات المعمارية
- لا تكرر الكود بين الموديولات
- لا تتجاوز RLS policies
- لا تعدل ملفات Auto-generated

### 19.2 Database Design
✅ **DO:**
- أضف RLS على جميع الجداول
- استخدم indexes للأعمدة المستخدمة في WHERE
- استخدم composite unique indexes
- سجل جميع التغييرات الحرجة في audit_log

❌ **DON'T:**
- لا تستخدم CHECK constraints للوقت
- لا تنسى tenant_id في الجداول
- لا تعدل schemas محجوزة (auth, storage)
- لا تنسى FK constraints

### 19.3 Security
✅ **DO:**
- استخدم RLS policies دائمًا
- تحقق من الصلاحيات في Frontend و Backend
- سجل جميع عمليات الوصول الحساسة
- استخدم JWT tokens بشكل آمن

❌ **DON'T:**
- لا تثق بـ tenant_id من Frontend
- لا تخزن secrets في الكود
- لا تتجاوز RBAC checks
- لا تعرض بيانات حساسة في الأخطاء

### 19.4 Performance
✅ **DO:**
- استخدم React Query caching
- طبق pagination على القوائم الطويلة
- استخدم lazy loading للمكونات الكبيرة
- أضف indexes على الجداول الكبيرة

❌ **DON'T:**
- لا تحمل جميع البيانات دفعة واحدة
- لا تنسى staleTime configuration
- لا تتجاهل React Query DevTools
- لا تستخدم useEffect لـ data fetching

---

## 20. الخلاصة والنقاط الرئيسية

### 20.1 القوة الأساسية للمعمارية
1. ✅ **Multi-Tenant بتصميم آمن:** عزل كامل للبيانات + RLS
2. ✅ **RBAC متقدم:** نظام صلاحيات مرن وقوي
3. ✅ **Layered Architecture:** فصل واضح للمسؤوليات
4. ✅ **Type Safety:** TypeScript كامل في جميع الطبقات
5. ✅ **Modern Stack:** React + Lovable Cloud + TanStack Query

### 20.2 الأولويات الأمنية
1. 🔒 **RLS First:** لا بيانات بدون RLS policies
2. 🔒 **RBAC Everywhere:** تحقق من الصلاحيات في جميع الطبقات
3. 🔒 **Audit Everything:** سجل جميع العمليات الحرجة
4. 🔒 **Defense in Depth:** أمان متعدد الطبقات

### 20.3 مبادئ التطوير
1. 📦 **Module First:** فكر في Modules قابلة لإعادة الاستخدام
2. 🎨 **UI/UX Excellence:** استخدم Design System باستمرار
3. ⚡ **Performance Matters:** طبق best practices للأداء
4. 🧪 **Test Thoroughly:** اختبارات شاملة لجميع الطبقات

---

## 21. المراجع والوثائق

### 21.1 Internal Documentation
- [Project Charter](../03_Modules/Romuz_Cybersecurity_Culture_Project_Charter_v1.0.md)
- [Functional Scope Boundaries](../03_Modules/Functional_Scope_Boundaries_OnePager_v1.0.md)
- [System Interaction Map](../03_Modules/System_Interaction_Map_v1.0.md)
- [RBAC Implementation Summary](../04_Execution/Part_1.3_Enhanced_Permission_System_Summary.md)

### 21.2 External References
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

### 21.3 Architecture Patterns
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Multi-Tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-11-17  
**Next Review:** 2025-12-17  
**Maintainer:** Smart Solutions Unit - Architecture Team

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-17 | AI Assistant | Initial comprehensive documentation |

---

**ملاحظة:** هذه الوثيقة حية ويجب تحديثها مع كل تغيير معماري كبير في المشروع.