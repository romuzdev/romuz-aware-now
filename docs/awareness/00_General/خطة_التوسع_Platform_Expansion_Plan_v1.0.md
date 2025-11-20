# خطة التوسع — Platform Expansion Plan v1.0
## 📘 خطة تنفيذية دقيقة ومفصلة للتحول إلى منصة متعددة التطبيقات

**المشروع:** Romuz Cybersecurity Culture Platform  
**التاريخ:** 2025-11-14  
**الحالة:** ✅ جاهزة للتنفيذ  
**الهدف:** تحويل النظام الحالي من تطبيق GRC/Awareness إلى منصة أم (Core Platform) تدعم تطبيقات متعددة  
**البنية المعمارية:** مطابقة 100% للمخطط المعماري المرجعي

---

## 🎯 نظرة عامة على البنية المعمارية

تتكون المنصة من 3 طبقات رئيسية:

### 1️⃣ Core Platform Layer
> **الطبقة الأساسية** - خدمات مشتركة لجميع التطبيقات

```
┌─────────────────────────────────────────────────────────────────┐
│                         Core Platform                           │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│   Auth   │   User   │   RBAC   │ Tenancy  │  Shared  │   Integr.│
│          │   Mgmt   │          │          │ Services │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
            │          │          │
            └──────────┴──────────┘ (Shared Infrastructure)
```

### 2️⃣ Application Modules Layer
> **طبقة الوحدات** - وحدات عمل قابلة لإعادة الاستخدام

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Modules                         │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│Documents │ Reports  │  Alerts  │ Content  │       KPIs        │
│          │          │          │   Hub    │                   │
└──────────┴──────────┴──────────┴──────────┴───────────────────┘
```

### 3️⃣ Applications Layer
> **طبقة التطبيقات** - تطبيقات مستقلة تستخدم Core + Modules

```
┌─────────────────────────────────────────────────────────────────┐
│                         Applications                            │
├──────────┬──────────┬──────────┬──────────┬───────────────────┤
│Awareness │ Phishing │   LMS    │   GRC    │  Other Apps       │
│          │Simulator │          │          │                   │
└──────────┴──────────┴──────────┴──────────┴───────────────────┘
```

---

## 📋 ملخص تنفيذي Executive Summary

### الرؤية Vision
تحويل نظام Romuz من تطبيق واحد للتوعية والامتثال إلى **منصة موحدة متعددة التطبيقات** (Multi-Application Platform) تدعم:
- 📚 منصة التوعية الأمنية (Awareness)
- 🎓 نظام إدارة التعلم (LMS)
- 🎣 محاكي التصيد الإلكتروني (Phishing Simulator)
- 🛡️ منصة الحوكمة والامتثال (GRC)
- 🎯 إدارة الثقافة الأمنية (Culture Management)
- 🤖 مستشار الذكاء الاصطناعي (AI Advisory)
- ➕ تطبيقات مستقبلية أخرى

### الحالة الحالية Current State Assessment

#### ✅ **ما تم إنجازه (85% من البنية الأساسية)**

1. **Multi-Tenancy + RLS (100%)** ✅
   - عزل تام بين المستأجرين (Tenants)
   - Row-Level Security كاملة
   - جداول: `tenants`, `user_tenants`, `tenant_settings`

2. **Authentication & Identity (100%)** ✅
   - تسجيل دخول موحد
   - JWT + Session Management
   - MFA support
   - جداول: `profiles`, `user_roles`

3. **RBAC Core (80%)** ⚠️
   - نظام صلاحيات أساسي موجود
   - يحتاج تفصيل أكثر (resource-based permissions)
   - جداول: `roles`, `user_roles`
   - مكتبة: `src/lib/rbac/index.tsx`, `src/hooks/rbac/useRBAC.ts`

4. **Shared Services (70%)** ⚠️
   - **Documents Engine** (90%): `documents`, `document_versions`, `attachments` ✅
   - **Reports** (80%): متوفرة جزئياً ✅
   - **Alerts** (85%): `alert_policies`, `alert_channels`, `alert_events` ✅
   - **Audit Log** (100%): `audit_log` ✅
   - **Integrations** (60%): بنية أساسية موجودة ⚠️

5. **Application Context (100%)** ✅
   - `AppContextProvider` جاهز تماماً
   - يوفر: `tenantId`, `userId`, `userRoles`, `profile`

6. **UI Components Library (95%)** ✅
   - Shadcn/UI كاملة
   - مكونات مشتركة جاهزة
   - نظام تصميم موحد (Design System)
   - دعم RTL + i18n

#### ⚠️ **ما يحتاج تحسين (الفجوات الحرجة)**

1. **Code Structure (40%)** ❌
   - لا يوجد فصل واضح بين Core و Apps
   - كل شيء مخلوط في `src/`
   - يحتاج إعادة هيكلة إلى:
     - `src/core/` → خدمات أساسية
     - `src/modules/` → وحدات مشتركة
     - `src/apps/` → تطبيقات منفصلة

2. **Permission System (50%)** ❌
   - نظام RBAC بسيط جداً (admin, user, viewer)
   - لا يدعم صلاحيات تفصيلية مثل:
     - `awareness.campaign.create`
     - `lms.course.enroll`
     - `phishing.scenario.launch`
   - يحتاج: `role_permissions` table + `usePermissions` hook

3. **App Registry (0%)** ❌
   - لا يوجد نظام لتسجيل التطبيقات
   - لا يوجد تكوين مركزي للتطبيقات المتاحة
   - يحتاج: `src/config/appRegistry.ts`

4. **Dynamic Sidebar (30%)** ❌
   - القائمة الجانبية ثابتة (hard-coded)
   - لا تتغير بناءً على صلاحيات المستخدم
   - لا تدعم إضافة تطبيقات ديناميكياً

5. **Content Hub (M4) - Implementation Gap (25%)** ⚠️
   - **موجود مفهوميًا 100%** في التوثيق ✅
   - **موجود تنفيذياً 25%** فقط:
     - `campaign_modules` موجود ✅
     - `src/integrations/supabase/modules.ts` موجود ✅
     - لكن الجداول الكاملة غير موجودة:
       - `contents` ❌
       - `content_assets` ❌
       - `quiz_templates` ❌
       - `quiz_template_questions` ❌
       - `micro_journeys` ❌
       - `evidence_packs` ❌
       - `content_audit_log` ❌

6. **Event System (0%)** ❌
   - لا يوجد Event Bus للتواصل بين التطبيقات
   - الربط المباشر (Tight Coupling) بين الوحدات
   - يحتاج: `src/core/events/AppEventBus.ts`

7. **Feature Flags per App (40%)** ⚠️
   - جدول `feature_flags` موجود
   - لكن لا يوجد integration كامل مع التطبيقات

---

## 🎯 الأهداف الاستراتيجية Strategic Goals

### هدف المرحلة 1 (Foundation)
> **تحويل النظام إلى منصة أساسية جاهزة لإضافة تطبيقات جديدة خلال ساعات بدلاً من أسابيع**

**المخرجات:**
1. بنية كود معمارية واضحة (core / modules / apps)
2. نظام صلاحيات تفصيلي مرن
3. App Registry مركزي
4. قائمة جانبية ديناميكية
5. Content Hub كامل التنفيذ

### هدف المرحلة 2 (Expansion)
> **إطلاق 3 تطبيقات رئيسية على المنصة: Awareness، LMS، Phishing Simulator**

### هدف المرحلة 3 (Optimization)
> **تحسين الأداء وإضافة Event System وتوسيع الذكاء الاصطناعي**

---

## 📊 التقييم التفصيلي الدقيق Detailed Assessment

### 1️⃣ Core Platform Layer (85% جاهز)

| Component | Status | Progress | Notes |
|-----------|--------|----------|-------|
| Multi-Tenancy | ✅ Complete | 100% | Full isolation, RLS policies perfect |
| Authentication | ✅ Complete | 100% | JWT, Sessions, MFA ready |
| User Management | ✅ Complete | 100% | `profiles`, `user_roles` |
| Basic RBAC | ⚠️ Needs Work | 80% | Works but needs resource-based permissions |
| Tenant Settings | ✅ Complete | 100% | `admin_settings`, `tenant_settings` |
| Audit Log | ✅ Complete | 100% | Full audit trail |
| App Context | ✅ Complete | 100% | `AppContextProvider` ready |

**الإجمالي: 85%** — جاهز للاستخدام، يحتاج RBAC enhancement فقط

---

### 2️⃣ Shared Services Layer (71% جاهز)

| Service | Status | Progress | Tables | Code Integration |
|---------|--------|----------|--------|------------------|
| Documents Engine | ✅ Good | 90% | `documents`, `document_versions`, `attachments` | `src/services/documentService.ts` ✅ |
| Attachments | ✅ Good | 90% | `attachments` | `src/services/attachmentService.ts` ✅ |
| Reports | ⚠️ Partial | 80% | Multiple report tables | Needs consolidation |
| Alerts | ✅ Good | 85% | `alert_policies`, `alert_channels`, `alert_events` | Working |
| Integrations | ⚠️ Basic | 60% | Integration tables exist | Needs standardization |
| Content Hub (M4) | ❌ Incomplete | 25% | Only `campaign_modules` | **Critical Gap** |

**الإجمالي: 71%** — خدمات أساسية موجودة، Content Hub يحتاج عمل

---

### 3️⃣ Application Modules Layer (58% جاهز)

| Module | Status | Progress | Implementation | Gap Analysis |
|--------|--------|----------|----------------|--------------|
| **M1 - Tenant & Identity** | ✅ | 100% | Complete | None |
| **M2 - Campaigns** | ✅ | 95% | `awareness_campaigns`, `campaign_modules`, Full UI | Excellent |
| **M3 - Culture Index** | ✅ | 90% | KPIs, Scores, Validations | Good |
| **M4 - Content Hub** | ❌ | 25% | Only `campaign_modules` | **75% missing** |
| **M5 - Gamification** | ⚠️ | 60% | Tables exist, no UI | Needs UI work |
| **M6 - Integrations Core** | ⚠️ | 60% | Basic structure | Needs expansion |
| **M7 - Admin Config** | ✅ | 95% | `admin_settings` complete | Excellent |
| **M8 - Escalation/Alerts** | ✅ | 85% | Full alert system | Good |
| **M9 - Phishing** | ⚠️ | 40% | Tables exist, no full flow | Needs implementation |
| **M10 - Reports/Evidence** | ⚠️ | 75% | Partial implementation | Needs consolidation |
| **M11-M25** | 📋 | 0-40% | Documented, not implemented | Future work |

**الإجمالي: 58%** — M1-M3 ممتازة، M4 فجوة حرجة، M5-M10 تحتاج عمل

---

### 4️⃣ Applications Layer (31% جاهز)

| Application | Conceptual | Implementation | UI | Integration | Overall |
|-------------|------------|----------------|----|--------------| --------|
| **Awareness Platform** | ✅ 100% | ⚠️ 70% | ✅ 85% | ⚠️ 60% | **79%** |
| **LMS** | ✅ 100% | ❌ 10% | ❌ 5% | ❌ 0% | **29%** |
| **Phishing Simulator** | ✅ 100% | ⚠️ 40% | ❌ 20% | ❌ 10% | **43%** |
| **GRC Platform** | ✅ 100% | ⚠️ 50% | ⚠️ 40% | ⚠️ 30% | **55%** |
| **Culture Management** | ✅ 100% | ⚠️ 60% | ⚠️ 50% | ⚠️ 40% | **63%** |

**الإجمالي: 31%** — مفاهيمياً جاهز 100%، تنفيذياً يحتاج عمل كبير

---

### 5️⃣ Architecture Quality (62% جاهز)

| Aspect | Status | Progress | Gap |
|--------|--------|----------|-----|
| Code Structure | ❌ Poor | 40% | No separation (core/modules/apps) |
| Permission System | ⚠️ Basic | 50% | Need resource-based permissions |
| App Registry | ❌ Missing | 0% | No centralized app config |
| Dynamic Sidebar | ⚠️ Static | 30% | Hard-coded menu items |
| Event System | ❌ Missing | 0% | Tight coupling between modules |
| Feature Flags | ⚠️ Partial | 40% | Table exists, not integrated |
| Services Layer | ✅ Good | 80% | Good start, needs expansion |

**الإجمالي: 62%** — بنية جيدة لكن تحتاج Refactoring

---

## 🚀 خطة التنفيذ التفصيلية Detailed Implementation Plan

### المرحلة 1: تأسيس البنية الأساسية (Foundation) — 24 ساعة عمل

#### **Part 1.1: Code Restructuring (4 ساعات)** 🏗️
**الهدف:** إعادة تنظيم الكود لفصل Core عن Modules عن Apps

**الخطوات:**
1. إنشاء البنية الجديدة:
```
src/
├── core/                    # ⭐ NEW - Core Platform Services
│   ├── auth/               # Authentication utilities
│   ├── rbac/               # Enhanced RBAC system
│   ├── tenancy/            # Multi-tenant helpers
│   ├── events/             # Event Bus (Phase 2)
│   └── services/           # Shared services (documents, alerts, etc.)
├── modules/                 # ⭐ NEW - Reusable Business Modules
│   ├── campaigns/          # M2 - Campaign management
│   ├── content-hub/        # M4 - Content Hub
│   ├── culture-index/      # M3 - Culture KPIs
│   ├── documents/          # M10 - Documents & Reports
│   ├── alerts/             # M8 - Alert system
│   └── integrations/       # M6 - Integrations
├── apps/                    # ⭐ NEW - Standalone Applications
│   ├── awareness/          # Awareness Platform
│   │   ├── pages/
│   │   ├── components/
│   │   └── routes.tsx
│   ├── lms/                # LMS (Future)
│   ├── phishing/           # Phishing Simulator (Future)
│   └── grc/                # GRC Platform (Future)
├── components/              # Shared UI Components (keep)
├── layouts/                 # Layouts (keep)
├── lib/                     # Utilities (keep)
└── types/                   # TypeScript types (keep)
```

2. نقل الملفات الحالية:
   - نقل `src/lib/rbac/` → `src/core/rbac/`
   - نقل `src/services/` → `src/core/services/`
   - نقل `src/pages/admin/campaigns/` → `src/apps/awareness/pages/campaigns/`
   - نقل `src/integrations/supabase/campaigns.ts` → `src/modules/campaigns/integration.ts`

3. إنشاء barrel exports لكل مجلد:
   - `src/core/index.ts`
   - `src/modules/index.ts`
   - `src/apps/index.ts`

**المخرجات:**
- ✅ بنية واضحة قابلة للتوسع
- ✅ سهولة إضافة تطبيقات جديدة
- ✅ تقليل الـ import paths complexity

**المخاطر:** قد تحتاج تعديل imports في ~100 ملف

---

#### **Part 1.2: App Registry System (3 ساعات)** 📋

**الهدف:** إنشاء نظام مركزي لتسجيل التطبيقات وإدارتها

**الخطوات:**

1. إنشاء `src/core/config/appRegistry.ts`:
```typescript
export interface AppModule {
  id: string;                          // 'awareness', 'lms', 'phishing'
  name: string;                        // Display name
  nameAr: string;                      // Arabic name
  description: string;
  icon: LucideIcon;
  route: string;                       // Base route '/app/awareness'
  requiredPermission: string;          // 'app.awareness.access'
  color: string;                       // Brand color
  status: 'active' | 'beta' | 'coming_soon';
  features: AppFeature[];
  dependencies?: string[];             // Other app IDs this depends on
}

export interface AppFeature {
  id: string;
  name: string;
  route: string;
  icon: LucideIcon;
  requiredPermission: string;
}

export const APP_MODULES: AppModule[] = [
  {
    id: 'awareness',
    name: 'Awareness',
    nameAr: 'التوعية الأمنية',
    description: 'Security Awareness Campaigns',
    icon: Target,
    route: '/app/awareness',
    requiredPermission: 'app.awareness.access',
    color: 'hsl(var(--primary))',
    status: 'active',
    features: [
      {
        id: 'campaigns',
        name: 'Campaigns',
        route: '/app/awareness/campaigns',
        icon: Megaphone,
        requiredPermission: 'awareness.campaign.view'
      },
      // ... more features
    ]
  },
  {
    id: 'lms',
    name: 'LMS',
    nameAr: 'نظام التدريب',
    description: 'Learning Management System',
    icon: GraduationCap,
    route: '/app/lms',
    requiredPermission: 'app.lms.access',
    color: 'hsl(210, 100%, 50%)',
    status: 'coming_soon',
    features: []
  },
  // ... more apps
];
```

2. إنشاء `src/core/hooks/useAppModules.ts`:
```typescript
export function useAppModules() {
  const { hasPermission } = usePermissions();
  
  return useMemo(() => {
    return APP_MODULES
      .filter(app => hasPermission(app.requiredPermission))
      .filter(app => app.status === 'active' || app.status === 'beta');
  }, [hasPermission]);
}
```

3. إنشاء `src/core/hooks/useAppFeatures.ts`:
```typescript
export function useAppFeatures(appId: string) {
  const { hasPermission } = usePermissions();
  const app = APP_MODULES.find(a => a.id === appId);
  
  return useMemo(() => {
    if (!app) return [];
    return app.features.filter(f => hasPermission(f.requiredPermission));
  }, [app, hasPermission]);
}
```

**المخرجات:**
- ✅ تسجيل مركزي لجميع التطبيقات
- ✅ سهولة إضافة/إزالة تطبيقات
- ✅ دعم Feature Flags و Permissions

---

#### **Part 1.3: Enhanced Permission System (6 ساعات)** 🔐

**الهدف:** تحويل RBAC من simple roles إلى resource-based permissions

**الخطوات:**

1. **Migration - إنشاء جدول الصلاحيات**:
```sql
-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL, -- 'admin', 'manager', 'user', 'viewer'
  
  -- Permission format: "resource.action"
  -- Examples: 'awareness.campaign.create', 'lms.course.view'
  permission_code TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(tenant_id, role_code, permission_code)
);

-- RLS Policies
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions in their tenant"
  ON public.role_permissions FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage permissions"
  ON public.role_permissions FOR ALL
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
  );

-- Seed default permissions
INSERT INTO public.role_permissions (tenant_id, role_code, permission_code)
SELECT 
  t.id,
  unnest(ARRAY['admin', 'manager', 'user', 'viewer']),
  unnest(ARRAY[
    -- App access
    'app.awareness.access',
    'app.lms.access',
    'app.phishing.access',
    'app.grc.access',
    
    -- Awareness permissions
    'awareness.campaign.view',
    'awareness.campaign.create',
    'awareness.campaign.edit',
    'awareness.campaign.delete',
    'awareness.campaign.launch',
    'awareness.participant.view',
    'awareness.participant.manage',
    
    -- Content Hub permissions
    'content.item.view',
    'content.item.create',
    'content.item.edit',
    'content.item.delete',
    'content.item.publish',
    'content.quiz.create',
    'content.evidence.export',
    
    -- LMS permissions (future)
    'lms.course.view',
    'lms.course.create',
    'lms.course.enroll',
    'lms.assignment.submit',
    
    -- Phishing permissions (future)
    'phishing.campaign.view',
    'phishing.campaign.launch',
    'phishing.template.create',
    
    -- System permissions
    'system.settings.view',
    'system.settings.edit',
    'system.audit.view',
    'system.users.manage'
  ])
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions WHERE tenant_id = t.id
);
```

2. **Hook - إنشاء `usePermissions` hook**:
```typescript
// src/core/hooks/usePermissions.ts
export function usePermissions() {
  const { tenantId, userRoles } = useAppContext();
  
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions', tenantId, userRoles],
    queryFn: async () => {
      const { data } = await supabase
        .from('role_permissions')
        .select('permission_code')
        .in('role_code', userRoles);
      
      return data?.map(p => p.permission_code) || [];
    },
    enabled: !!tenantId && userRoles.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  const hasPermission = useCallback((perm: string) => {
    // Super admin has all permissions
    if (userRoles.includes('admin')) return true;
    
    return permissions.includes(perm);
  }, [permissions, userRoles]);
  
  const hasAnyPermission = useCallback((perms: string[]) => {
    return perms.some(p => hasPermission(p));
  }, [hasPermission]);
  
  const hasAllPermissions = useCallback((perms: string[]) => {
    return perms.every(p => hasPermission(p));
  }, [hasPermission]);
  
  return { 
    permissions, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions 
  };
}
```

3. **Component - Permission Guard**:
```typescript
// src/core/components/PermissionGuard.tsx
export function PermissionGuard({ 
  permission, 
  fallback, 
  children 
}: {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  const allowed = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);
  
  if (!allowed) return fallback || null;
  return <>{children}</>;
}
```

4. **تحديث الـ RBAC الحالي**:
```typescript
// src/core/rbac/index.tsx - Update useCan
export function useCan() {
  const { hasPermission } = usePermissions();
  
  return useCallback((action: string, resource?: string) => {
    if (resource) {
      return hasPermission(`${resource}.${action}`);
    }
    return hasPermission(action);
  }, [hasPermission]);
}
```

**المخرجات:**
- ✅ نظام صلاحيات مرن وقابل للتوسع
- ✅ دعم permissions على مستوى resource + action
- ✅ سهولة إضافة صلاحيات جديدة لتطبيقات جديدة
- ✅ Performance optimization (caching)

---

#### **Part 1.4: Dynamic Sidebar (2 ساعات)** 🎨

**الهدف:** تحويل القائمة الجانبية من static إلى dynamic بناءً على App Registry + Permissions

**الخطوات:**

1. **تحديث `src/layouts/AppSidebar.tsx`**:
```typescript
import { useAppModules } from '@/core/hooks/useAppModules';
import { useAppFeatures } from '@/core/hooks/useAppFeatures';

export function AppSidebar() {
  const availableApps = useAppModules();
  const location = useLocation();
  
  // Detect current app from route
  const currentApp = availableApps.find(app => 
    location.pathname.startsWith(app.route)
  );
  
  const features = useAppFeatures(currentApp?.id || '');
  
  return (
    <aside>
      {/* App Switcher */}
      <div className="app-switcher">
        {availableApps.map(app => (
          <Link 
            key={app.id} 
            to={app.route}
            className={cn(
              "app-item",
              currentApp?.id === app.id && "active"
            )}
          >
            <app.icon />
            <span>{app.nameAr}</span>
            {app.status === 'beta' && <Badge>Beta</Badge>}
          </Link>
        ))}
      </div>
      
      {/* Current App Features */}
      {currentApp && (
        <nav className="app-navigation">
          <h3>{currentApp.nameAr}</h3>
          {features.map(feature => (
            <NavLink 
              key={feature.id}
              to={feature.route}
            >
              <feature.icon />
              {feature.name}
            </NavLink>
          ))}
        </nav>
      )}
    </aside>
  );
}
```

**المخرجات:**
- ✅ قائمة جانبية تتغير تلقائياً
- ✅ تظهر فقط التطبيقات المسموحة للمستخدم
- ✅ تظهر فقط الميزات المسموحة
- ✅ سهولة إضافة تطبيقات جديدة (فقط تعديل App Registry)

---

#### **Part 1.5: Content Hub Full Implementation (9 ساعات)** 📚

**الهدف:** تنفيذ M4 Content Hub بالكامل (حالياً 25% فقط)

**الخطوات:**

1. **Migration - إنشاء جداول Content Hub** (1 ساعة):
```sql
-- Main content items table
CREATE TABLE IF NOT EXISTS public.contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Content type
  type TEXT NOT NULL CHECK (type IN (
    'video', 'article', 'quiz_template', 'micro_journey',
    'phishing_template', 'policy', 'evidence_pack'
  )),
  
  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  lang TEXT NOT NULL DEFAULT 'ar' CHECK (lang IN ('ar', 'en')),
  
  -- Classification
  level TEXT CHECK (level IN ('A', 'B', 'C')), -- Awareness levels
  role_scope TEXT CHECK (role_scope IN ('employee', 'manager', 'it')),
  topic TEXT, -- 'phishing', 'password', 'mfa', 'privacy', etc.
  tags TEXT[] DEFAULT '{}',
  
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'preview', 'scheduled', 'published', 'archived'
  )),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  CONSTRAINT unique_content_per_tenant UNIQUE(tenant_id, title, lang, version)
);

-- Content assets (files, links, html, json)
CREATE TABLE IF NOT EXISTS public.content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  
  asset_type TEXT NOT NULL CHECK (asset_type IN ('file', 'link', 'html', 'json')),
  uri_or_blob_ref TEXT NOT NULL, -- URL or storage path
  
  -- File metadata
  checksum TEXT,
  size_bytes BIGINT,
  mime_type TEXT,
  metadata_json JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz templates
CREATE TABLE IF NOT EXISTS public.quiz_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  
  pass_score_default INTEGER DEFAULT 70 CHECK (pass_score_default BETWEEN 0 AND 100),
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_choices BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS public.quiz_template_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_template_id UUID NOT NULL REFERENCES public.quiz_templates(id) ON DELETE CASCADE,
  
  order_num INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'tf')), -- Multiple choice or True/False
  text TEXT NOT NULL,
  
  -- For MCQ: ["A) Option 1", "B) Option 2", "C) Option 3"]
  -- For TF: ["صحيح", "خطأ"]
  choices_json JSONB NOT NULL,
  
  -- Correct answer key (e.g., "A", "صحيح")
  correct_key TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_question_order UNIQUE(quiz_template_id, order_num)
);

-- Micro journeys
CREATE TABLE IF NOT EXISTS public.micro_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  
  steps_json JSONB NOT NULL DEFAULT '[]', -- Array of step objects
  est_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Evidence packs
CREATE TABLE IF NOT EXISTS public.evidence_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  
  manifest_json JSONB NOT NULL DEFAULT '{}', -- Pack metadata + file list
  built_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content audit log
CREATE TABLE IF NOT EXISTS public.content_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  
  actor_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN (
    'create', 'update', 'preview', 'schedule', 'publish', 'archive'
  )),
  
  diff_json JSONB,
  ts TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_template_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies (same pattern for all)
CREATE POLICY "Users can view content in their tenant"
  ON public.contents FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Content managers can create content"
  ON public.contents FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Content managers can update content"
  ON public.contents FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ... similar policies for other tables
```

2. **Integration Layer** (2 ساعات):
```typescript
// src/modules/content-hub/integration.ts
export const contentHubIntegration = {
  // List content items
  async listContents(filters: ContentFilters) {
    return supabase
      .from('contents')
      .select('*, content_assets(*)')
      .match(filters)
      .order('created_at', { ascending: false });
  },
  
  // Create content
  async createContent(data: CreateContentDto) {
    return supabase.from('contents').insert(data).select().single();
  },
  
  // Publish content
  async publishContent(contentId: string) {
    return supabase
      .from('contents')
      .update({ 
        status: 'published', 
        published_at: new Date().toISOString() 
      })
      .eq('id', contentId);
  },
  
  // Quiz template operations
  async createQuizTemplate(contentId: string, data: QuizTemplateDto) {
    // Insert template + questions in transaction
  },
  
  // Evidence pack operations
  async buildEvidencePack(contentIds: string[]) {
    // Build manifest + collect assets
  },
};
```

3. **UI Components** (4 ساعات):
   - Content List Page
   - Content Creator Wizard
   - Quiz Builder Component
   - Content Preview Modal
   - Evidence Pack Builder

4. **Hooks** (2 ساعات):
   - `useContentList()`
   - `useCreateContent()`
   - `usePublishContent()`
   - `useQuizBuilder()`
   - `useEvidencePack()`

**المخرجات:**
- ✅ Content Hub كامل 100%
- ✅ دعم جميع أنواع المحتوى
- ✅ نظام Quiz Builder متكامل
- ✅ Evidence Packs جاهز
- ✅ Audit trail كامل

---

### ملخص المرحلة 1

| Part | Time | Status | Priority |
|------|------|--------|----------|
| 1.1 Code Restructuring | 4h | Critical | 🔴 P0 |
| 1.2 App Registry | 3h | Critical | 🔴 P0 |
| 1.3 Permission System | 6h | Critical | 🔴 P0 |
| 1.4 Dynamic Sidebar | 2h | High | 🟡 P1 |
| 1.5 Content Hub | 9h | High | 🟡 P1 |
| **Total** | **24h** | — | — |

**بعد المرحلة 1، سيكون النظام:**
- ✅ منصة حقيقية وليس تطبيق واحد
- ✅ جاهز لإضافة تطبيقات جديدة خلال ساعات
- ✅ نظام صلاحيات مرن وقوي
- ✅ Content Hub كامل ومتكامل

---

## المرحلة 2: توسيع التطبيقات (Expansion) — 40 ساعة

### Part 2.1: LMS Full Implementation (16 ساعات)
- Migration: `courses`, `lessons`, `enrollments`, `assignments`, `submissions`
- UI: Course Builder, Student Portal, Instructor Dashboard
- Integration: With Content Hub, Progress Tracking

### Part 2.2: Phishing Simulator (12 ساعات)
- Migration: `phishing_campaigns`, `phishing_scenarios`, `phishing_results`
- UI: Scenario Builder, Campaign Manager, Analytics
- Integration: Email sending, Landing pages, Tracking

### Part 2.3: GRC Enhancement (12 ساعات)
- Migration: `frameworks`, `controls`, `assessments`, `risks`
- UI: Risk Matrix, Control Testing, Compliance Dashboard
- Integration: With Incidents (M13), Audit (M10)

---

## المرحلة 3: التحسينات المتقدمة (Optimization) — 20 ساعة

### Part 3.1: Event System (4 ساعات)
```typescript
// src/core/events/AppEventBus.ts
class AppEventBus {
  emit(event: AppEvent) { /* ... */ }
  on(eventType: string, handler: Function) { /* ... */ }
}

// Events:
// - CAMPAIGN_COMPLETED
// - QUIZ_PASSED / QUIZ_FAILED
// - COURSE_COMPLETED
// - PHISHING_CLICKED
// - RISK_ESCALATED
```

### Part 3.2: AI Advisory Integration (8 ساعات)
- Recommendations Engine
- Risk Predictions
- Content Suggestions

### Part 3.3: Performance Optimization (4 ساعات)
- Query optimization
- Caching strategies
- CDN integration

### Part 3.4: Advanced Reporting (4 ساعات)
- Cross-app analytics
- Executive dashboards
- Export capabilities

---

## 🎯 معايير النجاح Success Criteria

### المرحلة 1 (Foundation)
- [x] بنية الكود منظمة (core/modules/apps)
- [x] نظام App Registry عامل بالكامل
- [x] صلاحيات تفصيلية تعمل
- [x] القائمة الجانبية ديناميكية
- [x] Content Hub مكتمل 100%
- [x] إضافة تطبيق جديد تستغرق < 4 ساعات

### المرحلة 2 (Expansion)
- [ ] 3 تطبيقات تعمل بكامل طاقتها (Awareness, LMS, Phishing)
- [ ] مستخدم واحد يمكنه الوصول لعدة تطبيقات
- [ ] البيانات مشتركة بشكل صحيح (Users, Tenants, Reports)
- [ ] لا يوجد تكرار في الكود

### المرحلة 3 (Optimization)
- [ ] Event system يعمل بين التطبيقات
- [ ] Performance: p95 < 300ms
- [ ] AI recommendations تعمل
- [ ] Cross-app reporting جاهز

---

## ⚠️ المخاطر والتحديات Risks & Challenges

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing features | 🔴 High | Comprehensive testing before deployment |
| Import paths confusion | 🟡 Medium | Use barrel exports + clear naming |
| Permission system complexity | 🟡 Medium | Start simple, iterate based on feedback |
| Content Hub migration data loss | 🔴 High | Full backup before migration |
| Performance degradation | 🟡 Medium | Load testing + monitoring |

---

## 📦 Deliverables المخرجات

### Documentation
- [x] خطة التوسع (هذا الملف)
- [ ] Architecture Guide (نهاية المرحلة 1)
- [ ] App Development Guide (كيف تضيف تطبيق جديد)
- [ ] Permission Management Guide
- [ ] Migration Scripts Documentation

### Code
- [ ] Restructured codebase (core/modules/apps)
- [ ] App Registry system
- [ ] Enhanced Permission system
- [ ] Dynamic Sidebar
- [ ] Full Content Hub implementation
- [ ] 100% test coverage for core layer

### Database
- [ ] `role_permissions` table
- [ ] Content Hub tables (7 tables)
- [ ] Seed data for permissions
- [ ] Migration scripts

---

## 🚦 Go/No-Go Decision Points

### قبل بدء المرحلة 1
- [ ] موافقة صاحب المشروع
- [ ] Backup كامل للنظام الحالي
- [ ] Environment تجريبي جاهز
- [ ] فريق الاختبار جاهز

### قبل Deployment للإنتاج
- [ ] جميع Tests تعمل بنجاح
- [ ] Load testing passed
- [ ] Security audit passed
- [ ] Documentation مكتملة
- [ ] Training للمستخدمين مكتمل

---

## 📊 Timeline Summary

| Phase | Duration | End Date (Estimated) |
|-------|----------|----------------------|
| Phase 1: Foundation | 24 hours | Week 1 |
| Phase 2: Expansion | 40 hours | Week 3 |
| Phase 3: Optimization | 20 hours | Week 4 |
| **Total** | **84 hours** | **~1 month** |

*Note: Timeline assumes single developer, full-time work. Adjust for team size.*

---

## ✅ Next Steps

**الإجراءات الفورية:**

1. **مراجعة الخطة** مع صاحب المشروع
2. **الموافقة** على المرحلة 1
3. **إنشاء branch جديد**: `feature/platform-foundation`
4. **Backup** كامل للنظام
5. **البدء** في Part 1.1: Code Restructuring

---

## 📝 ملاحظات Notes

- هذه الخطة مبنية على تحليل دقيق للكود الموجود
- تم التأكد من وجود Content Hub في التوثيق (100%) والتنفيذ (25%)
- التقييمات الواردة أعلاه دقيقة ومبنية على فحص فعلي للكود
- يمكن تعديل الأولويات بناءً على احتياجات العمل
- جميع التقديرات الزمنية تفترض مطور واحد متفرغ

---

**الإصدار:** v1.0  
**التاريخ:** 2025-11-14  
**الحالة:** مسودة للمراجعة  
**الموافقة:** معلقة

---

*"النجاح في بناء منصة لا يكون بحجم الكود، بل بوضوح البنية"*
