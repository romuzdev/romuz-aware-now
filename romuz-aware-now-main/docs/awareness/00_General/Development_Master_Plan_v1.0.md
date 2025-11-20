# خطة التطوير الرئيسية - Romuz Awareness Platform
## Development Master Plan v1.0

> **الهدف:** وثيقة مرجعية شاملة لتطوير التطبيقات المتبقية (LMS، Phishing، GRC) بنفس معايير الجودة الحالية
> 
> **منهجية العمل:** Sequential Development (تسلسلي) - تطوير كامل لكل تطبيق ثم الانتقال للتالي

---

## 📋 جدول المحتويات

1. [نظرة عامة على النظام الحالي](#1-نظرة-عامة-على-النظام-الحالي)
2. [معايير الجودة المطلوبة](#2-معايير-الجودة-المطلوبة)
3. [العمارة الأساسية Core Architecture](#3-العمارة-الأساسية-core-architecture)
4. [التكامل مع مكونات النظام Core Integration](#4-التكامل-مع-مكونات-النظام-core-integration)
5. [التكامل بين التطبيقات Inter-App Integration](#5-التكامل-بين-التطبيقات-inter-app-integration)
6. [خطة التطوير التسلسلي Sequential Plan](#6-خطة-التطوير-التسلسلي-sequential-plan)
7. [معايير الكود والتطوير Coding Standards](#7-معايير-الكود-والتطوير-coding-standards)
8. [معايير قاعدة البيانات Database Standards](#8-معايير-قاعدة-البيانات-database-standards)
9. [معايير واجهة المستخدم UI/UX Standards](#9-معايير-واجهة-المستخدم-uiux-standards)
10. [الأمن والصلاحيات Security & Permissions](#10-الأمن-والصلاحيات-security--permissions)
11. [خارطة الطريق Development Roadmap](#11-خارطة-الطريق-development-roadmap)

---

## 1. نظرة عامة على النظام الحالي

### 1.1 التطبيقات المكتملة

#### ✅ Awareness App (M2 - Campaigns)
- **الحالة:** مكتمل بنسبة 95%
- **الوحدات:**
  - إدارة الحملات (CRUD)
  - إدارة المشاركين (Participants)
  - الوحدات التدريبية (Modules)
  - الاختبارات (Quizzes)
  - التقارير والتحليلات (Analytics)
  - الإشعارات (Notifications)
  - العمليات الجماعية (Bulk Operations)
  - الاستيراد/التصدير (Import/Export)

#### ✅ Committees App (M11 - Governance)
- **الحالة:** مكتمل بنسبة 90%
- **الوحدات:**
  - إدارة اللجان (CRUD)
  - الأعضاء والأدوار (Members & Roles)
  - الاجتماعات (Meetings)
  - الأجندات والقرارات (Agendas & Decisions)
  - سير العمل (Workflows)
  - التحليلات (Analytics)
  - الإشعارات (Notifications)

#### ✅ Objectives & KPIs App (M9)
- **الحالة:** مكتمل بنسبة 90%
- **الوحدات:**
  - الأهداف الاستراتيجية (Objectives)
  - مؤشرات الأداء (KPIs)
  - الأهداف والقياسات (Targets & Readings)
  - المبادرات (Initiatives)
  - التقارير (Reports)

#### ✅ Policies App (M3)
- **الحالة:** مكتمل بنسبة 85%
- **الوحدات:**
  - إدارة السياسات (CRUD)
  - الإقرارات (Acknowledgements)
  - الإصدارات (Versions)
  - التوزيع (Distribution)

#### ✅ Actions App (M10)
- **الحالة:** مكتمل بنسبة 85%
- **الوحدات:**
  - إدارة الإجراءات (CRUD)
  - التتبع (Tracking)
  - التنبيهات (Alerts)
  - التقارير (Reports)

#### ✅ Analytics App (M8)
- **الحالة:** مكتمل بنسبة 80%
- **الوحدات:**
  - لوحات المؤشرات (Dashboards)
  - التقارير التنفيذية (Executive Reports)
  - تحليلات متقدمة (Advanced Analytics)

### 1.2 التطبيقات المطلوبة

#### 🔄 LMS App (M4 - Training)
- **الأولوية:** عالية (Priority 1)
- **الارتباط:** مرتبط مباشرة بـ Awareness & Policies

#### 🔄 Phishing Simulation App (M5)
- **الأولوية:** عالية (Priority 2)
- **الارتباط:** مرتبط بـ Awareness & Analytics

#### 🔄 GRC Platform App (M12-M13)
- **الأولوية:** متوسطة (Priority 3)
- **الارتباط:** مرتبط بـ Policies & Actions & Committees

---

## 2. معايير الجودة المطلوبة

### 2.1 معايير العمارة (Architecture Standards)

✅ **Multi-Tenant Architecture**
- كل جدول يحتوي على `tenant_id`
- RLS Policies مطبقة على كل الجداول
- عزل البيانات بشكل كامل

✅ **Module-Based Structure**
```
src/modules/{module-name}/
├── components/          # React Components
├── hooks/              # Custom Hooks
├── integration/        # Supabase Integration Layer
├── types/              # TypeScript Types
└── index.ts           # Barrel Export
```

✅ **Integration Layer Pattern**
- كل عمليات Supabase تمر عبر Integration Layer
- لا يتم استدعاء Supabase مباشرة من Components
- Audit Logging مدمج في Integration Layer

✅ **Type Safety**
- استخدام TypeScript بشكل صارم
- Types محددة لكل Entity
- استخدام Zod للـ Validation

### 2.2 معايير قاعدة البيانات

✅ **Naming Conventions**
```sql
-- Tables
{module}_entities          -- e.g., awareness_campaigns
{module}_entity_relations  -- e.g., campaign_participants

-- Columns
id              -- UUID primary key
tenant_id       -- UUID (required for multi-tenancy)
created_at      -- timestamptz
updated_at      -- timestamptz
created_by      -- UUID
updated_by      -- UUID
```

✅ **RLS Policies Pattern**
```sql
-- SELECT Policy
CREATE POLICY "Users can view own tenant data"
ON public.{table_name}
FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM auth.get_user_metadata()));

-- INSERT Policy
CREATE POLICY "Users can insert own tenant data"
ON public.{table_name}
FOR INSERT
WITH CHECK (tenant_id = (SELECT tenant_id FROM auth.get_user_metadata()));

-- UPDATE Policy
CREATE POLICY "Users can update own tenant data"
ON public.{table_name}
FOR UPDATE
USING (tenant_id = (SELECT tenant_id FROM auth.get_user_metadata()));

-- DELETE Policy (Soft Delete)
CREATE POLICY "Users can soft-delete own tenant data"
ON public.{table_name}
FOR UPDATE
USING (tenant_id = (SELECT tenant_id FROM auth.get_user_metadata()));
```

✅ **Indexes**
```sql
-- Composite Indexes
CREATE INDEX idx_{table}_{tenant_id}_{commonly_filtered_column}
ON public.{table_name}(tenant_id, status);

-- Timestamp Indexes
CREATE INDEX idx_{table}_created_at
ON public.{table_name}(created_at DESC);
```

✅ **Audit Logging**
- كل عملية CRUD تسجل في `audit_log`
- التسجيل يتم عبر Integration Layer
- المعلومات المسجلة: actor, entity_type, entity_id, action, payload

### 2.3 معايير الكود

✅ **Component Structure**
```typescript
// 1. Imports (grouped)
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { useFetchEntities } from '@/modules/{module}/hooks';

// 2. Types & Interfaces
interface EntityListProps {
  filters?: EntityFilters;
}

// 3. Component
export function EntityList({ filters }: EntityListProps) {
  // Hooks
  const { data, isLoading, error } = useFetchEntities(filters);
  
  // Event Handlers
  const handleAction = () => { ... };
  
  // Render Conditions
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data?.length) return <EmptyState />;
  
  // Main Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

✅ **Custom Hooks Pattern**
```typescript
// src/modules/{module}/hooks/useFetchEntities.ts
import { useQuery } from '@tanstack/react-query';
import { fetchEntities } from '../integration';
import type { Entity, EntityFilters } from '../types';

export function useFetchEntities(filters?: EntityFilters) {
  return useQuery({
    queryKey: ['entities', filters],
    queryFn: () => fetchEntities(filters),
    staleTime: 30000, // 30 seconds
  });
}
```

✅ **Integration Layer Pattern**
```typescript
// src/modules/{module}/integration/{entity}.integration.ts
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { logAudit } from '@/core/audit';

export async function fetchEntities(filters?: EntityFilters) {
  const { data: session } = await supabase.auth.getSession();
  const tenantId = session?.user?.user_metadata?.tenant_id;
  
  let query = supabase
    .from('entities')
    .select('*')
    .eq('tenant_id', tenantId);
  
  // Apply filters...
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  await logAudit({
    entity_type: 'entity',
    entity_id: 'list',
    action: 'read',
    actor: session?.user?.id || 'system',
    tenant_id: tenantId,
  });
  
  return data;
}
```

### 2.4 معايير واجهة المستخدم

✅ **Design System**
- استخدام Tailwind Semantic Tokens من `index.css`
- عدم استخدام ألوان مباشرة (no `text-white`, `bg-black`)
- جميع الألوان يجب أن تكون HSL
- استخدام Design Tokens:
  ```css
  --background
  --foreground
  --primary
  --primary-foreground
  --secondary
  --muted
  --accent
  --destructive
  --border
  ```

✅ **Component Standards**
- استخدام shadcn/ui components
- Responsive Design (mobile-first)
- RTL Support للعربية
- Loading States (Skeletons)
- Error States (Error Boundaries)
- Empty States (EmptyState component)

✅ **Layout Pattern**
```typescript
<div className="container mx-auto py-6 space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold">Title</h1>
      <p className="text-muted-foreground">Description</p>
    </div>
    <div className="flex gap-2">
      <Button>Action</Button>
    </div>
  </div>
  
  {/* Filters */}
  <Card>
    <CardContent className="pt-6">
      {/* Filter Components */}
    </CardContent>
  </Card>
  
  {/* Content */}
  <Card>
    <CardContent className="pt-6">
      {/* Main Content */}
    </CardContent>
  </Card>
</div>
```

✅ **Internationalization (i18n)**
- كل النصوص من ملفات الترجمة
- دعم العربية والإنجليزية
- استخدام `react-i18next`
```typescript
import { useTranslation } from 'react-i18next';

export function Component() {
  const { t } = useTranslation();
  return <h1>{t('module.key')}</h1>;
}
```

---

## 3. العمارة الأساسية Core Architecture

### 3.1 هيكل المشروع

```
src/
├── apps/
│   ├── awareness/          # Awareness Application
│   ├── lms/               # LMS Application (NEW)
│   ├── phishing/          # Phishing Application (NEW)
│   ├── grc/               # GRC Application (NEW)
│   └── platform/          # Core Platform
│
├── modules/               # Business Modules
│   ├── campaigns/         # M2 - Campaigns
│   ├── policies/          # M3 - Policies
│   ├── training/          # M4 - Training (NEW)
│   ├── phishing/          # M5 - Phishing (NEW)
│   ├── objectives/        # M9 - Objectives
│   ├── actions/           # M10 - Actions
│   ├── committees/        # M11 - Committees
│   ├── risks/             # M12 - Risks (NEW)
│   ├── controls/          # M13 - Controls (NEW)
│   └── analytics/         # M8 - Analytics
│
├── core/                  # Core Infrastructure
│   ├── auth/             # Authentication
│   ├── tenancy/          # Multi-tenancy
│   ├── audit/            # Audit Logging
│   ├── rbac/             # Role-Based Access Control
│   ├── components/       # Shared Components
│   │   ├── layout/      # Layout Components
│   │   ├── routing/     # Routing Components
│   │   └── ui/          # Base UI Components
│   └── config/          # Configuration
│
├── components/           # shadcn/ui Components
│   └── ui/
│
├── integrations/         # External Integrations
│   └── supabase/        # Supabase Client & Types
│
├── lib/                 # Utilities
│   ├── utils.ts        # Utility Functions
│   └── i18n.ts         # i18n Configuration
│
└── hooks/              # Global Hooks
```

### 3.2 التطبيقات Applications

#### Pattern: Application Structure
```
src/apps/{app-name}/
├── components/          # App-specific Components
├── pages/              # App Pages
├── routes.tsx          # App Routes
├── config.ts           # App Configuration
└── index.ts           # App Entry Point
```

#### App Configuration
```typescript
// src/apps/{app-name}/config.ts
export const appConfig = {
  id: 'app-name',
  name: 'App Display Name',
  icon: IconComponent,
  route: '/app-route',
  status: 'active',
  metadata: {
    category: 'security',
    description: 'App description',
    version: '1.0.0',
  },
  features: [
    {
      id: 'feature-1',
      name: 'Feature Name',
      icon: IconComponent,
      route: '/app-route/feature',
      permissions: ['permission.code'],
      showInSidebar: true,
      order: 1,
    },
  ],
};
```

### 3.3 الوحدات Modules

#### Pattern: Module Structure
```
src/modules/{module-name}/
├── components/
│   ├── {Entity}List.tsx
│   ├── {Entity}Form.tsx
│   ├── {Entity}Details.tsx
│   └── {Entity}Card.tsx
│
├── hooks/
│   ├── useFetch{Entities}.ts
│   ├── useCreate{Entity}.ts
│   ├── useUpdate{Entity}.ts
│   └── useDelete{Entity}.ts
│
├── integration/
│   ├── {entity}.integration.ts
│   ├── {entity}-guards.ts
│   └── index.ts
│
├── types/
│   ├── {entity}.types.ts
│   └── index.ts
│
└── index.ts
```

---

## 4. التكامل مع مكونات النظام Core Integration

### 4.1 Authentication & Authorization

#### A. Authentication Flow
```typescript
// 1. Get Current User
import { supabase } from '@/integrations/supabase/client';

const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;
const tenantId = user?.user_metadata?.tenant_id;
```

#### B. RBAC Integration
```typescript
// 1. Check Permission
import { usePermissions } from '@/core/rbac/hooks';

export function ProtectedComponent() {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('module.action')) {
    return <UnauthorizedState />;
  }
  
  return <Content />;
}

// 2. Route Protection
import { RoleGuard } from '@/core/components/routing';

<Route 
  path="/protected" 
  element={
    <RoleGuard requiredPermission="module.action">
      <ProtectedPage />
    </RoleGuard>
  } 
/>
```

#### C. Permission Definitions
```typescript
// src/core/rbac/permissions.ts
export const APP_PERMISSIONS = {
  // LMS Permissions
  'lms.courses.view': 'View Courses',
  'lms.courses.create': 'Create Courses',
  'lms.courses.edit': 'Edit Courses',
  'lms.courses.delete': 'Delete Courses',
  'lms.enrollments.manage': 'Manage Enrollments',
  
  // Phishing Permissions
  'phishing.campaigns.view': 'View Phishing Campaigns',
  'phishing.campaigns.create': 'Create Phishing Campaigns',
  'phishing.campaigns.edit': 'Edit Phishing Campaigns',
  'phishing.results.view': 'View Phishing Results',
  
  // GRC Permissions
  'grc.risks.view': 'View Risks',
  'grc.risks.manage': 'Manage Risks',
  'grc.controls.view': 'View Controls',
  'grc.controls.manage': 'Manage Controls',
};
```

### 4.2 Multi-Tenancy

#### A. Tenant Context
```typescript
// Every module must respect tenant isolation
import { useAppContext } from '@/lib/app-context/AppContextProvider';

export function ModuleComponent() {
  const { tenantId } = useAppContext();
  
  // All queries filtered by tenantId
  const { data } = useFetchEntities({ tenant_id: tenantId });
}
```

#### B. Database RLS
```sql
-- Every table must have RLS enabled
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- Every query is automatically filtered by tenant_id
CREATE POLICY "Tenant isolation"
ON public.{table_name}
FOR ALL
USING (tenant_id = (SELECT tenant_id FROM auth.get_user_metadata()));
```

### 4.3 Audit Logging

#### A. Integration Layer Logging
```typescript
// src/core/audit/logger.ts
import { supabase } from '@/integrations/supabase/client';

export async function logAudit({
  entity_type,
  entity_id,
  action,
  payload,
}: AuditLogInput) {
  const { data: session } = await supabase.auth.getSession();
  const tenantId = session?.user?.user_metadata?.tenant_id;
  
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor: session?.user?.id || 'system',
    entity_type,
    entity_id,
    action,
    payload,
    created_at: new Date().toISOString(),
  });
}
```

#### B. Usage in Integration Layer
```typescript
// src/modules/{module}/integration/{entity}.integration.ts
export async function createEntity(input: CreateEntityInput) {
  // Create entity
  const { data, error } = await supabase
    .from('entities')
    .insert(input)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log the action
  await logAudit({
    entity_type: 'entity',
    entity_id: data.id,
    action: 'create',
    payload: { input },
  });
  
  return data;
}
```

### 4.4 Data Validation

#### A. Zod Schemas
```typescript
// src/modules/{module}/types/schemas.ts
import { z } from 'zod';

export const EntitySchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Entity = z.infer<typeof EntitySchema>;
```

#### B. Form Validation
```typescript
// src/modules/{module}/components/EntityForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntitySchema } from '../types/schemas';

export function EntityForm() {
  const form = useForm({
    resolver: zodResolver(EntitySchema),
    defaultValues: {...},
  });
  
  const onSubmit = form.handleSubmit(async (values) => {
    // Submit validated data
  });
}
```

### 4.5 Error Handling

#### A. Error Boundary
```typescript
// src/core/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorState error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### B. Query Error Handling
```typescript
// src/modules/{module}/hooks/useFetchEntities.ts
export function useFetchEntities() {
  return useQuery({
    queryKey: ['entities'],
    queryFn: fetchEntities,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('Failed to fetch entities:', error);
      toast.error('Failed to load data');
    },
  });
}
```

### 4.6 Loading States

#### A. Skeleton Components
```typescript
// src/core/components/LoadingSkeleton.tsx
export function TableLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
```

#### B. Usage
```typescript
export function EntityList() {
  const { data, isLoading } = useFetchEntities();
  
  if (isLoading) return <TableLoadingSkeleton />;
  if (!data?.length) return <EmptyState />;
  
  return <Table data={data} />;
}
```

---

## 5. التكامل بين التطبيقات Inter-App Integration

### 5.1 Data Sharing Between Apps

#### A. Shared Data Models
```typescript
// Core entities are shared across apps
import { Campaign } from '@/modules/campaigns/types';
import { Course } from '@/modules/training/types';
import { PhishingCampaign } from '@/modules/phishing/types';
```

#### B. Cross-Module Queries
```typescript
// Example: LMS accessing Campaign data
import { fetchCampaignById } from '@/modules/campaigns/integration';

export async function linkCourseWithCampaign(
  courseId: string,
  campaignId: string
) {
  // Validate campaign exists
  const campaign = await fetchCampaignById(campaignId);
  
  // Create link
  await supabase.from('course_campaign_links').insert({
    course_id: courseId,
    campaign_id: campaignId,
    tenant_id: campaign.tenant_id,
  });
}
```

### 5.2 Event-Driven Integration

#### A. Event Types
```typescript
// src/core/events/types.ts
export type AppEvent = 
  | { type: 'campaign.completed'; payload: { campaignId: string } }
  | { type: 'course.completed'; payload: { courseId: string; userId: string } }
  | { type: 'phishing.result'; payload: { campaignId: string; userId: string; result: string } }
  | { type: 'policy.acknowledged'; payload: { policyId: string; userId: string } };
```

#### B. Event Emitter
```typescript
// src/core/events/emitter.ts
import { EventEmitter } from 'events';

export const appEvents = new EventEmitter();

// Emit event
export function emitAppEvent(event: AppEvent) {
  appEvents.emit(event.type, event.payload);
}

// Listen to event
export function onAppEvent(type: string, handler: (payload: any) => void) {
  appEvents.on(type, handler);
  return () => appEvents.off(type, handler);
}
```

#### C. Usage Example
```typescript
// In LMS: Emit course completion
import { emitAppEvent } from '@/core/events/emitter';

export async function completeCourse(courseId: string, userId: string) {
  // Mark course as completed...
  
  // Emit event
  emitAppEvent({
    type: 'course.completed',
    payload: { courseId, userId },
  });
}

// In Analytics: Listen for completion
import { onAppEvent } from '@/core/events/emitter';

useEffect(() => {
  const unsubscribe = onAppEvent('course.completed', (payload) => {
    // Update analytics...
  });
  
  return unsubscribe;
}, []);
```

### 5.3 Shared Components

#### A. Cross-App Components
```typescript
// Components that are used across multiple apps
src/core/components/shared/
├── UserSelector.tsx        # Select users for assignment
├── DateRangePicker.tsx     # Common date range picker
├── StatusBadge.tsx         # Consistent status display
├── ExportButton.tsx        # Standard export functionality
└── BulkActionToolbar.tsx   # Bulk operations UI
```

#### B. Usage
```typescript
// In any app
import { UserSelector } from '@/core/components/shared/UserSelector';

export function AssignmentForm() {
  return (
    <UserSelector
      multiple
      onChange={(users) => setSelectedUsers(users)}
    />
  );
}
```

### 5.4 Navigation Between Apps

#### A. App Registry
```typescript
// src/core/config/registry.ts
export const APP_REGISTRY = [
  {
    id: 'awareness',
    name: 'Awareness',
    route: '/awareness',
    icon: Brain,
  },
  {
    id: 'lms',
    name: 'LMS',
    route: '/lms',
    icon: GraduationCap,
  },
  // ...
];
```

#### B. Cross-App Links
```typescript
// Link from Awareness to LMS
import { Link } from 'react-router-dom';

export function CampaignDetails({ campaign }) {
  return (
    <div>
      {campaign.linked_course_id && (
        <Link to={`/lms/courses/${campaign.linked_course_id}`}>
          View Related Course →
        </Link>
      )}
    </div>
  );
}
```

### 5.5 Data Relationships

#### A. Database Foreign Keys
```sql
-- Link between Campaign and Course
CREATE TABLE public.campaign_course_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  campaign_id UUID NOT NULL REFERENCES public.awareness_campaigns(id),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(tenant_id, campaign_id, course_id)
);

-- Link between Phishing Campaign and Awareness Campaign
CREATE TABLE public.phishing_awareness_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  phishing_campaign_id UUID NOT NULL REFERENCES public.phishing_campaigns(id),
  awareness_campaign_id UUID NOT NULL REFERENCES public.awareness_campaigns(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, phishing_campaign_id)
);
```

#### B. Integration Functions
```typescript
// src/modules/campaigns/integration/links.integration.ts
export async function linkCampaignWithCourse(
  campaignId: string,
  courseId: string
) {
  const { data: session } = await supabase.auth.getSession();
  const tenantId = session?.user?.user_metadata?.tenant_id;
  
  const { data, error } = await supabase
    .from('campaign_course_links')
    .insert({
      tenant_id: tenantId,
      campaign_id: campaignId,
      course_id: courseId,
      created_by: session?.user?.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  await logAudit({
    entity_type: 'campaign_course_link',
    entity_id: data.id,
    action: 'create',
    payload: { campaignId, courseId },
  });
  
  return data;
}
```

---

## 6. خطة التطوير التسلسلي Sequential Plan

### 6.1 المراحل الرئيسية

```
Phase 1: LMS Development (4 weeks)
├── Week 1: Core Setup & Database
├── Week 2: Course Management & Content
├── Week 3: Enrollment & Progress Tracking
└── Week 4: Assessments & Reporting

Phase 2: Phishing Simulation (3 weeks)
├── Week 1: Core Setup & Templates
├── Week 2: Campaign Management
└── Week 3: Results & Reporting

Phase 3: GRC Platform (4 weeks)
├── Week 1: Core Setup & Risks
├── Week 2: Controls & Assessments
├── Week 3: Compliance & Audits
└── Week 4: Integration & Reporting

Phase 4: Integration & Enhancement (2 weeks)
├── Week 1: Cross-App Integration
└── Week 2: Testing & Polish
```

### 6.2 Phase 1: LMS Development (Priority 1)

#### Week 1: Core Setup & Database

**Day 1-2: Database Schema**
```sql
-- Tables to create:
- lms_courses
- lms_course_modules
- lms_course_lessons
- lms_course_resources
- lms_enrollments
- lms_progress
- lms_assessments
- lms_assessment_questions
- lms_assessment_attempts
- lms_certificates
```

**Day 3-4: Integration Layer**
```typescript
// Files to create:
src/modules/training/integration/
├── courses.integration.ts
├── enrollments.integration.ts
├── progress.integration.ts
├── assessments.integration.ts
└── index.ts
```

**Day 5: Types & Schemas**
```typescript
// Files to create:
src/modules/training/types/
├── course.types.ts
├── enrollment.types.ts
├── assessment.types.ts
└── index.ts
```

#### Week 2: Course Management & Content

**Day 1-2: Course CRUD**
```typescript
// Components:
- CourseList.tsx
- CourseForm.tsx
- CourseDetails.tsx
- CourseCard.tsx

// Hooks:
- useFetchCourses.ts
- useCreateCourse.ts
- useUpdateCourse.ts
- useDeleteCourse.ts
```

**Day 3-4: Module & Lesson Management**
```typescript
// Components:
- ModuleList.tsx
- ModuleForm.tsx
- LessonList.tsx
- LessonForm.tsx
- ContentEditor.tsx
```

**Day 5: Resource Management**
```typescript
// Components:
- ResourceLibrary.tsx
- ResourceUpload.tsx
- ResourceViewer.tsx
```

#### Week 3: Enrollment & Progress

**Day 1-2: Enrollment System**
```typescript
// Components:
- EnrollmentForm.tsx
- EnrollmentList.tsx
- BulkEnrollment.tsx

// Features:
- Self-enrollment
- Admin enrollment
- Bulk enrollment from CSV
```

**Day 3-5: Progress Tracking**
```typescript
// Components:
- ProgressDashboard.tsx
- ProgressCard.tsx
- ProgressTimeline.tsx
- CompletionCertificate.tsx

// Features:
- Real-time progress tracking
- Completion tracking
- Certificate generation
```

#### Week 4: Assessments & Reporting

**Day 1-3: Assessment System**
```typescript
// Components:
- AssessmentBuilder.tsx
- QuestionBank.tsx
- AssessmentAttempt.tsx
- AssessmentResults.tsx

// Question Types:
- Multiple Choice
- True/False
- Essay
- Matching
```

**Day 4-5: Reporting & Analytics**
```typescript
// Components:
- LMSDashboard.tsx
- CourseAnalytics.tsx
- LearnerAnalytics.tsx
- CompletionReports.tsx
```

### 6.3 Phase 2: Phishing Simulation (Priority 2)

#### Week 1: Core Setup & Templates

**Day 1-2: Database Schema**
```sql
-- Tables to create:
- phishing_campaigns
- phishing_templates
- phishing_template_variants
- phishing_targets
- phishing_results
- phishing_training_assignments
```

**Day 3-5: Templates & Variants**
```typescript
// Components:
- TemplateLibrary.tsx
- TemplateBuilder.tsx
- TemplatePreview.tsx
- VariantManager.tsx

// Features:
- Email templates
- Landing page templates
- SMS templates
- Template variables
```

#### Week 2: Campaign Management

**Day 1-3: Campaign CRUD**
```typescript
// Components:
- PhishingCampaignList.tsx
- PhishingCampaignForm.tsx
- PhishingCampaignDetails.tsx
- TargetSelector.tsx

// Features:
- Campaign scheduling
- Target selection
- Template assignment
- Delivery settings
```

**Day 4-5: Tracking & Monitoring**
```typescript
// Components:
- CampaignMonitor.tsx
- RealTimeStats.tsx
- EventTimeline.tsx
```

#### Week 3: Results & Reporting

**Day 1-3: Results Processing**
```typescript
// Components:
- ResultsDashboard.tsx
- ResultsTable.tsx
- ResultsDetails.tsx
- UserRiskProfile.tsx

// Metrics:
- Open rate
- Click rate
- Data submission rate
- Report rate
```

**Day 4-5: Training Assignment**
```typescript
// Components:
- AutoTrainingAssignment.tsx
- TrainingRecommendations.tsx

// Features:
- Auto-assign training based on failure
- Link with LMS courses
- Progress tracking
```

### 6.4 Phase 3: GRC Platform (Priority 3)

#### Week 1: Core Setup & Risks

**Day 1-2: Database Schema**
```sql
-- Tables to create:
- grc_risks
- grc_risk_assessments
- grc_controls
- grc_control_tests
- grc_compliance_frameworks
- grc_compliance_requirements
- grc_audits
- grc_audit_findings
```

**Day 3-5: Risk Management**
```typescript
// Components:
- RiskRegister.tsx
- RiskForm.tsx
- RiskAssessment.tsx
- RiskMatrix.tsx
- RiskHeatmap.tsx

// Features:
- Risk identification
- Risk assessment (likelihood + impact)
- Risk treatment plans
- Risk monitoring
```

#### Week 2: Controls & Assessments

**Day 1-3: Control Management**
```typescript
// Components:
- ControlLibrary.tsx
- ControlForm.tsx
- ControlMapping.tsx
- ControlEffectiveness.tsx

// Features:
- Control catalog
- Control design
- Control testing
- Control effectiveness rating
```

**Day 4-5: Control Testing**
```typescript
// Components:
- TestPlanner.tsx
- TestExecution.tsx
- TestResults.tsx
- EvidenceManager.tsx
```

#### Week 3: Compliance & Audits

**Day 1-3: Compliance Management**
```typescript
// Components:
- FrameworkLibrary.tsx
- RequirementMapping.tsx
- ComplianceGaps.tsx
- ComplianceReports.tsx

// Frameworks:
- NCA ECC
- ISO 27001
- PDPL
- Custom frameworks
```

**Day 4-5: Audit Management**
```typescript
// Components:
- AuditPlanner.tsx
- AuditExecution.tsx
- FindingsTracker.tsx
- AuditReports.tsx
```

#### Week 4: Integration & Reporting

**Day 1-2: Cross-Module Integration**
```typescript
// Link with:
- Policies (compliance requirements)
- Actions (remediation actions)
- Committees (oversight)
- Objectives (risk objectives)
```

**Day 3-5: GRC Dashboard & Reports**
```typescript
// Components:
- GRCDashboard.tsx
- RiskDashboard.tsx
- ComplianceDashboard.tsx
- ExecutiveReports.tsx
```

### 6.5 Phase 4: Integration & Enhancement

#### Week 1: Cross-App Integration

**Day 1-2: Data Links**
```typescript
// Implement:
- Campaign ↔ Course links
- Phishing ↔ Training assignment
- Risk ↔ Control mapping
- Policy ↔ Compliance requirement
```

**Day 3-4: Event Integration**
```typescript
// Implement event handlers:
- Course completion → Update risk score
- Phishing failure → Auto-assign training
- Policy acknowledgment → Update compliance
```

**Day 5: Navigation & UX**
```typescript
// Improve:
- Cross-app navigation
- Breadcrumbs
- Related content links
- Unified search
```

#### Week 2: Testing & Polish

**Day 1-3: Testing**
```
- Integration testing
- User acceptance testing
- Performance testing
- Security testing
```

**Day 4-5: Polish & Documentation**
```
- UI/UX refinements
- Performance optimization
- Documentation updates
- User guides
```

---

## 7. معايير الكود والتطوير Coding Standards

### 7.1 File Organization

```typescript
// ✅ Good: Organized imports
// 1. React & External Libraries
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

// 2. UI Components
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 3. Core & Shared
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { usePermissions } from '@/core/rbac/hooks';

// 4. Module-specific
import { useFetchCourses } from '../hooks';
import { CourseCard } from './CourseCard';
import type { Course } from '../types';

// ❌ Bad: Mixed imports
import { Card } from '@/components/ui/card';
import { useFetchCourses } from '../hooks';
import React from 'react';
import type { Course } from '../types';
```

### 7.2 Component Standards

```typescript
// ✅ Good: Well-structured component
interface CourseListProps {
  filters?: CourseFilters;
  onCourseSelect?: (course: Course) => void;
}

export function CourseList({ filters, onCourseSelect }: CourseListProps) {
  // 1. Context & Auth
  const { tenantId } = useAppContext();
  const { hasPermission } = usePermissions();
  
  // 2. Data Hooks
  const { data: courses, isLoading, error } = useFetchCourses(filters);
  
  // 3. Local State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // 4. Computed Values
  const canCreate = hasPermission('lms.courses.create');
  
  // 5. Event Handlers
  const handleCourseClick = (course: Course) => {
    setSelectedId(course.id);
    onCourseSelect?.(course);
  };
  
  // 6. Effects
  useEffect(() => {
    // Side effects...
  }, []);
  
  // 7. Early Returns
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!courses?.length) return <EmptyState />;
  
  // 8. Main Render
  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onClick={() => handleCourseClick(course)}
          isSelected={selectedId === course.id}
        />
      ))}
    </div>
  );
}
```

### 7.3 Hook Standards

```typescript
// ✅ Good: Reusable custom hook
export function useFetchCourses(filters?: CourseFilters) {
  const { tenantId } = useAppContext();
  
  return useQuery({
    queryKey: ['courses', tenantId, filters],
    queryFn: () => fetchCourses(filters),
    enabled: !!tenantId,
    staleTime: 30000,
    select: (data) => {
      // Transform data if needed
      return data.map(course => ({
        ...course,
        displayName: `${course.code} - ${course.name}`,
      }));
    },
  });
}

// ✅ Good: Mutation hook with optimistic updates
export function useUpdateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseInput }) => 
      updateCourse(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['courses'] });
      
      // Snapshot previous value
      const previousCourses = queryClient.getQueryData(['courses']);
      
      // Optimistically update
      queryClient.setQueryData(['courses'], (old: Course[]) =>
        old.map(course => course.id === id ? { ...course, ...data } : course)
      );
      
      return { previousCourses };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['courses'], context?.previousCourses);
      toast.error('Failed to update course');
    },
    onSuccess: () => {
      toast.success('Course updated successfully');
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
```

### 7.4 Integration Layer Standards

```typescript
// ✅ Good: Complete integration function
export async function fetchCourses(
  filters?: CourseFilters
): Promise<Course[]> {
  // 1. Get session & tenant
  const { data: session } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Unauthorized');
  
  const tenantId = session.user.user_metadata?.tenant_id;
  if (!tenantId) throw new Error('No tenant context');
  
  // 2. Build query
  let query = supabase
    .from('lms_courses')
    .select(`
      *,
      instructor:users!lms_courses_instructor_id_fkey(id, full_name),
      enrollments:lms_enrollments(count)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  
  // 3. Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
  }
  
  // 4. Execute query
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to fetch courses:', error);
    throw error;
  }
  
  // 5. Log audit
  await logAudit({
    entity_type: 'course',
    entity_id: 'list',
    action: 'read',
    payload: { filters },
  });
  
  return data || [];
}
```

### 7.5 Type Safety

```typescript
// ✅ Good: Complete type definitions
// Database types (auto-generated)
import type { Database } from '@/integrations/supabase/types';
type CourseRow = Database['public']['Tables']['lms_courses']['Row'];

// Domain types (with transformations)
export interface Course extends Omit<CourseRow, 'metadata'> {
  metadata: CourseMetadata;
  instructor?: Instructor;
  enrollmentCount?: number;
}

export interface CourseMetadata {
  duration_hours?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  prerequisites?: string[];
}

// Input types (for forms & mutations)
export type CreateCourseInput = Omit<Course, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCourseInput = Partial<CreateCourseInput>;

// Filter types
export interface CourseFilters {
  status?: Course['status'];
  search?: string;
  instructor_id?: string;
  date_from?: string;
  date_to?: string;
}
```

---

## 8. معايير قاعدة البيانات Database Standards

### 8.1 Table Design

```sql
-- ✅ Good: Complete table definition
CREATE TABLE public.lms_courses (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy (REQUIRED)
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Core Fields
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Relationships
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.lms_categories(id) ON DELETE SET NULL,
  
  -- Metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit Fields (REQUIRED)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ, -- Soft delete support
  
  -- Constraints
  CONSTRAINT uq_lms_courses_tenant_code UNIQUE (tenant_id, code)
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;

-- Indexes (REQUIRED for performance)
CREATE INDEX idx_lms_courses_tenant_id ON public.lms_courses(tenant_id);
CREATE INDEX idx_lms_courses_status ON public.lms_courses(tenant_id, status);
CREATE INDEX idx_lms_courses_created_at ON public.lms_courses(created_at DESC);
CREATE INDEX idx_lms_courses_deleted_at ON public.lms_courses(deleted_at) 
  WHERE deleted_at IS NULL;

-- Full-text search (optional but recommended)
CREATE INDEX idx_lms_courses_search ON public.lms_courses 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Trigger for updated_at (REQUIRED)
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.lms_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 8.2 RLS Policies

```sql
-- ✅ Good: Complete RLS policy set

-- SELECT Policy
CREATE POLICY "Users can view courses in their tenant"
ON public.lms_courses
FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
  AND deleted_at IS NULL -- Exclude soft-deleted records
);

-- INSERT Policy
CREATE POLICY "Instructors can create courses"
ON public.lms_courses
FOR INSERT
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
  AND EXISTS (
    SELECT 1 FROM auth.check_user_permission('lms.courses.create')
  )
);

-- UPDATE Policy
CREATE POLICY "Instructors can update their courses"
ON public.lms_courses
FOR UPDATE
USING (
  tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
  AND (
    instructor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.check_user_permission('lms.courses.edit')
    )
  )
);

-- DELETE Policy (soft delete via UPDATE)
CREATE POLICY "Instructors can delete their courses"
ON public.lms_courses
FOR UPDATE
USING (
  tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
  AND deleted_at IS NULL
  AND (
    instructor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.check_user_permission('lms.courses.delete')
    )
  )
);
```

### 8.3 Relationships & Foreign Keys

```sql
-- ✅ Good: Proper relationship definition

-- Many-to-One: Course → Instructor
ALTER TABLE public.lms_courses
  ADD CONSTRAINT fk_lms_courses_instructor
  FOREIGN KEY (instructor_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- One-to-Many: Course → Modules
CREATE TABLE public.lms_course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT uq_lms_course_modules_position 
    UNIQUE (course_id, position)
);

-- Many-to-Many: Course ↔ Users (Enrollments)
CREATE TABLE public.lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active',
  
  CONSTRAINT uq_lms_enrollments_user_course 
    UNIQUE (tenant_id, course_id, user_id)
);
```

### 8.4 Functions & Triggers

```sql
-- ✅ Good: Reusable database function

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Soft delete
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate course completion
CREATE OR REPLACE FUNCTION calculate_course_completion(
  p_course_id UUID,
  p_user_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
BEGIN
  -- Count total lessons
  SELECT COUNT(*)
  INTO v_total_lessons
  FROM lms_course_lessons
  WHERE course_id = p_course_id;
  
  -- Count completed lessons
  SELECT COUNT(*)
  INTO v_completed_lessons
  FROM lms_progress
  WHERE course_id = p_course_id
    AND user_id = p_user_id
    AND status = 'completed';
  
  -- Return percentage
  IF v_total_lessons = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (v_completed_lessons::NUMERIC / v_total_lessons::NUMERIC) * 100;
END;
$$ LANGUAGE plpgsql;
```

### 8.5 Views & Materialized Views

```sql
-- ✅ Good: Helpful database view

-- View: Course with enrollment stats
CREATE OR REPLACE VIEW vw_lms_courses_with_stats AS
SELECT
  c.*,
  COUNT(DISTINCT e.id) AS enrollment_count,
  COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) AS completion_count,
  AVG(CASE WHEN e.status = 'completed' THEN 
    EXTRACT(EPOCH FROM (e.completed_at - e.enrolled_at)) / 3600 
  END) AS avg_completion_hours,
  u.full_name AS instructor_name
FROM lms_courses c
LEFT JOIN lms_enrollments e ON e.course_id = c.id
LEFT JOIN users u ON u.id = c.instructor_id
WHERE c.deleted_at IS NULL
GROUP BY c.id, u.full_name;

-- Materialized View: For expensive aggregations
CREATE MATERIALIZED VIEW mv_lms_course_analytics AS
SELECT
  c.tenant_id,
  c.id AS course_id,
  c.name AS course_name,
  DATE_TRUNC('month', e.enrolled_at) AS month,
  COUNT(DISTINCT e.user_id) AS unique_learners,
  COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.user_id END) AS completions,
  AVG(CASE WHEN e.completed_at IS NOT NULL THEN 
    EXTRACT(EPOCH FROM (e.completed_at - e.enrolled_at)) / 3600 
  END) AS avg_hours_to_complete
FROM lms_courses c
LEFT JOIN lms_enrollments e ON e.course_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.tenant_id, c.id, c.name, DATE_TRUNC('month', e.enrolled_at);

-- Index on materialized view
CREATE INDEX idx_mv_lms_course_analytics_tenant 
  ON mv_lms_course_analytics(tenant_id, month);

-- Refresh function (call periodically)
CREATE OR REPLACE FUNCTION refresh_lms_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lms_course_analytics;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. معايير واجهة المستخدم UI/UX Standards

### 9.1 Design Tokens

```css
/* index.css - Design System */

:root {
  /* Base Colors - HSL only! */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  
  --radius: 0.5rem;
  
  /* Status Colors */
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
  --info: 199 89% 48%;
  
  /* Custom Tokens */
  --sidebar-width: 280px;
  --header-height: 64px;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode colors */
}
```

### 9.2 Component Layout

```typescript
// ✅ Good: Consistent page layout
export function CoursesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Courses
          </h1>
          <p className="text-muted-foreground">
            Manage your training courses and content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </div>
      </div>
      
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Search..." />
            <Select>...</Select>
            <DateRangePicker />
          </div>
        </CardContent>
      </Card>
      
      {/* Content Card */}
      <Card>
        <CardContent className="pt-6">
          <CourseList />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 9.3 Responsive Design

```typescript
// ✅ Good: Mobile-first responsive
export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4 md:p-6">
        {/* Mobile: Stack vertically */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Course info */}
          <div className="space-y-2 flex-1">
            <h3 className="text-lg md:text-xl font-semibold">
              {course.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
            
            {/* Tags - wrap on mobile */}
            <div className="flex flex-wrap gap-2">
              <Badge>{course.level}</Badge>
              <Badge variant="outline">
                {course.duration_hours}h
              </Badge>
            </div>
          </div>
          
          {/* Right: Actions - full width on mobile */}
          <div className="flex gap-2 md:flex-col">
            <Button className="flex-1 md:flex-initial">
              View
            </Button>
            <Button variant="outline" className="flex-1 md:flex-initial">
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 9.4 Loading States

```typescript
// ✅ Good: Informative loading states

// Skeleton for list
export function CourseListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Skeleton className="h-24 w-24 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton for details
export function CourseDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

// Usage
export function CoursePage({ id }: CoursePageProps) {
  const { data: course, isLoading } = useFetchCourseById(id);
  
  if (isLoading) return <CourseDetailsSkeleton />;
  if (!course) return <NotFound />;
  
  return <CourseDetails course={course} />;
}
```

### 9.5 Empty States

```typescript
// ✅ Good: Helpful empty states
export function EmptyCoursesState() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('lms.courses.create');
  
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">
        No courses yet
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {canCreate
          ? "Get started by creating your first training course"
          : "No courses have been created yet. Contact your administrator."
        }
      </p>
      
      {canCreate && (
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create First Course
        </Button>
      )}
    </div>
  );
}
```

### 9.6 Error States

```typescript
// ✅ Good: Actionable error states
export function ErrorState({ 
  error,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-destructive/10 p-6 mb-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">
        Something went wrong
      </h3>
      
      <p className="text-muted-foreground mb-2">
        {error?.message || 'An unexpected error occurred'}
      </p>
      
      <p className="text-sm text-muted-foreground mb-6">
        Please try again or contact support if the problem persists
      </p>
      
      <div className="flex gap-2">
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </div>
  );
}
```

---

## 10. الأمن والصلاحيات Security & Permissions

### 10.1 Permission Definitions

```typescript
// src/core/rbac/permissions.ts

export const LMS_PERMISSIONS = {
  // Courses
  'lms.courses.view': 'View courses',
  'lms.courses.create': 'Create courses',
  'lms.courses.edit': 'Edit courses',
  'lms.courses.delete': 'Delete courses',
  'lms.courses.publish': 'Publish courses',
  
  // Enrollments
  'lms.enrollments.view': 'View enrollments',
  'lms.enrollments.create': 'Enroll users',
  'lms.enrollments.delete': 'Unenroll users',
  'lms.enrollments.bulk': 'Bulk enrollment operations',
  
  // Assessments
  'lms.assessments.view': 'View assessments',
  'lms.assessments.create': 'Create assessments',
  'lms.assessments.edit': 'Edit assessments',
  'lms.assessments.grade': 'Grade assessments',
  
  // Reports
  'lms.reports.view': 'View reports',
  'lms.reports.export': 'Export reports',
  'lms.reports.learner_progress': 'View learner progress',
};

export const PHISHING_PERMISSIONS = {
  // Campaigns
  'phishing.campaigns.view': 'View phishing campaigns',
  'phishing.campaigns.create': 'Create phishing campaigns',
  'phishing.campaigns.edit': 'Edit phishing campaigns',
  'phishing.campaigns.delete': 'Delete phishing campaigns',
  'phishing.campaigns.launch': 'Launch phishing campaigns',
  
  // Templates
  'phishing.templates.view': 'View templates',
  'phishing.templates.create': 'Create templates',
  'phishing.templates.edit': 'Edit templates',
  
  // Results
  'phishing.results.view': 'View results',
  'phishing.results.export': 'Export results',
  'phishing.results.user_details': 'View user-level results',
};

export const GRC_PERMISSIONS = {
  // Risks
  'grc.risks.view': 'View risks',
  'grc.risks.create': 'Create risks',
  'grc.risks.edit': 'Edit risks',
  'grc.risks.assess': 'Assess risks',
  'grc.risks.approve': 'Approve risk assessments',
  
  // Controls
  'grc.controls.view': 'View controls',
  'grc.controls.create': 'Create controls',
  'grc.controls.edit': 'Edit controls',
  'grc.controls.test': 'Test controls',
  
  // Compliance
  'grc.compliance.view': 'View compliance',
  'grc.compliance.manage': 'Manage compliance',
  'grc.compliance.report': 'Generate compliance reports',
  
  // Audits
  'grc.audits.view': 'View audits',
  'grc.audits.conduct': 'Conduct audits',
  'grc.audits.manage_findings': 'Manage findings',
};
```

### 10.2 Role Templates

```typescript
// src/core/rbac/roles.ts

export const ROLE_TEMPLATES = {
  // LMS Roles
  lms_instructor: {
    name: 'LMS Instructor',
    permissions: [
      'lms.courses.view',
      'lms.courses.create',
      'lms.courses.edit',
      'lms.enrollments.view',
      'lms.assessments.view',
      'lms.assessments.create',
      'lms.assessments.edit',
      'lms.assessments.grade',
      'lms.reports.view',
      'lms.reports.learner_progress',
    ],
  },
  
  lms_learner: {
    name: 'LMS Learner',
    permissions: [
      'lms.courses.view',
      'lms.enrollments.view',
      'lms.assessments.view',
    ],
  },
  
  lms_admin: {
    name: 'LMS Administrator',
    permissions: Object.keys(LMS_PERMISSIONS),
  },
  
  // Phishing Roles
  phishing_admin: {
    name: 'Phishing Administrator',
    permissions: Object.keys(PHISHING_PERMISSIONS),
  },
  
  phishing_analyst: {
    name: 'Phishing Analyst',
    permissions: [
      'phishing.campaigns.view',
      'phishing.templates.view',
      'phishing.results.view',
      'phishing.results.export',
    ],
  },
  
  // GRC Roles
  grc_manager: {
    name: 'GRC Manager',
    permissions: Object.keys(GRC_PERMISSIONS),
  },
  
  risk_owner: {
    name: 'Risk Owner',
    permissions: [
      'grc.risks.view',
      'grc.risks.edit',
      'grc.risks.assess',
      'grc.controls.view',
    ],
  },
  
  compliance_officer: {
    name: 'Compliance Officer',
    permissions: [
      'grc.compliance.view',
      'grc.compliance.manage',
      'grc.compliance.report',
      'grc.audits.view',
      'grc.audits.conduct',
    ],
  },
};
```

### 10.3 Data Access Patterns

```typescript
// ✅ Good: Respect permissions in UI
export function CourseActions({ course }: CourseActionsProps) {
  const { hasPermission } = usePermissions();
  
  const canEdit = hasPermission('lms.courses.edit');
  const canDelete = hasPermission('lms.courses.delete');
  const canPublish = hasPermission('lms.courses.publish');
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`/lms/courses/${course.id}`)}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        
        {canEdit && (
          <DropdownMenuItem onClick={() => navigate(`/lms/courses/${course.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        
        {canPublish && course.status === 'draft' && (
          <DropdownMenuItem onClick={() => handlePublish(course.id)}>
            <Send className="mr-2 h-4 w-4" />
            Publish
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {canDelete && (
          <DropdownMenuItem
            onClick={() => handleDelete(course.id)}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ✅ Good: Enforce permissions in integration layer
export async function deleteCourse(id: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Unauthorized');
  
  // Check permission
  const { data: hasPermission } = await supabase.rpc('check_user_permission', {
    permission_code: 'lms.courses.delete',
  });
  
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
  
  // Soft delete
  const { error } = await supabase
    .from('lms_courses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
  
  await logAudit({
    entity_type: 'course',
    entity_id: id,
    action: 'delete',
  });
}
```

---

## 11. خارطة الطريق Development Roadmap

### 11.1 Timeline Overview

```
├── Week 1-4: LMS Development
│   ├── Database & Core Setup
│   ├── Course Management
│   ├── Enrollment & Progress
│   └── Assessments & Reporting
│
├── Week 5-7: Phishing Simulation
│   ├── Templates & Campaigns
│   ├── Execution & Tracking
│   └── Results & Remediation
│
├── Week 8-11: GRC Platform
│   ├── Risk Management
│   ├── Control Management
│   ├── Compliance Management
│   └── Audit Management
│
└── Week 12-13: Integration & Polish
    ├── Cross-App Integration
    ├── Testing & QA
    └── Documentation & Training
```

### 11.2 Success Criteria

#### LMS Success Criteria
- [ ] Instructors can create and publish courses
- [ ] Admin can bulk-enroll users
- [ ] Learners can view and complete courses
- [ ] Progress is tracked accurately
- [ ] Assessments work with all question types
- [ ] Certificates are generated on completion
- [ ] Reports show learner analytics

#### Phishing Success Criteria
- [ ] Templates library with variants
- [ ] Campaigns can be scheduled and launched
- [ ] Results are captured accurately
- [ ] Failed users auto-assigned training
- [ ] Dashboards show key metrics
- [ ] Risk profiles updated based on results

#### GRC Success Criteria
- [ ] Risk register with assessments
- [ ] Control library with testing
- [ ] Compliance framework mapping
- [ ] Audit planning and execution
- [ ] Findings tracked to closure
- [ ] Executive dashboards functional

### 11.3 Quality Gates

Before moving to next phase:
- [ ] All database migrations successful
- [ ] All RLS policies tested
- [ ] All integration functions working
- [ ] All components rendering properly
- [ ] All hooks returning correct data
- [ ] All permissions enforced
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] RTL working for Arabic
- [ ] Loading states implemented
- [ ] Error handling in place
- [ ] Audit logging working

---

## 📝 Summary & Next Steps

### الوثيقة جاهزة للاستخدام

هذه الوثيقة تحتوي على:

✅ **معايير العمارة الكاملة** - Multi-tenant, Module-based, Integration Layer
✅ **معايير قاعدة البيانات** - Tables, RLS, Indexes, Functions
✅ **معايير الكود** - TypeScript, React, Hooks, Components
✅ **معايير واجهة المستخدم** - Design System, Responsive, Loading/Error States
✅ **التكامل مع المكونات الأساسية** - Auth, Tenancy, Audit, RBAC
✅ **التكامل بين التطبيقات** - Data Sharing, Events, Cross-App Links
✅ **خطة التطوير التسلسلي** - 13 أسبوع مفصلة بالأيام
✅ **معايير الأمن والصلاحيات** - Permissions, Roles, Access Control

### البدء بالتطوير

**الخطوة التالية:**
```
Phase 1: LMS Development (Week 1-4)
└── Start: Week 1, Day 1 - Database Schema
```

**هل أنت جاهز للبدء بـ LMS Development؟**

عند الموافقة، سنبدأ مباشرة بـ:
1. إنشاء Database Schema لـ LMS
2. كتابة RLS Policies
3. بناء Integration Layer
4. إنشاء Types & Schemas

---

**المرجعية:** احتفظ بهذه الوثيقة كمرجع دائم خلال التطوير
**التحديثات:** سيتم تحديث الوثيقة عند الحاجة أثناء التطوير
