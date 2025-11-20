# 🏗️ Romuz Platform Architecture

## نظرة عامة

تم تحويل Romuz من تطبيق واحد إلى **منصة موحدة متعددة التطبيقات** (Multi-Application Platform)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Core Platform                           │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │ Auth │  │ User │  │ RBAC │  │Tenant│  │Shared│  │ Intg │  │
│  │      │  │ Mgmt │  │      │  │      │  │Serv. │  │      │  │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Application Modules                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Campaigns│ │Reports │ │ Alerts │ │Content │ │  KPIs  │       │
│  │        │ │        │ │        │ │  Hub   │ │        │       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Applications                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Awareness│ │Phishing│ │  LMS   │ │  GRC   │ │ Other  │       │
│  │        │ │Simulator│ │        │ │        │ │  Apps  │       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 هيكل المشروع

```
src/
├── core/                           # 🏛️ Core Platform Layer
│   ├── auth/                       # Authentication & Identity
│   ├── rbac/                       # RBAC & Permissions
│   ├── tenancy/                    # Multi-Tenancy Helpers
│   ├── services/                   # Shared Services
│   │   ├── documentService.ts
│   │   ├── attachmentService.ts
│   │   ├── auditService.ts
│   │   └── alertService.ts
│   ├── config/                     # Core Config
│   │   ├── appRegistry.ts         # 📋 App Registry
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── hooks/                      # Core Hooks
│   │   ├── useAppModules.ts
│   │   ├── useAppFeatures.ts
│   │   └── usePermissions.ts
│   ├── components/                 # Core Components
│   │   ├── PermissionGuard.tsx
│   │   ├── AppSwitcher.tsx
│   │   └── ErrorBoundary.tsx
│   └── index.ts                    # Barrel Export
│
├── modules/                        # 🧩 Application Modules Layer
│   ├── campaigns/                  # M2 - Campaign Management
│   │   ├── types/
│   │   ├── integration/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── index.ts
│   ├── content-hub/                # M4 - Content Hub
│   ├── culture-index/              # M3 - Culture KPIs
│   ├── documents/                  # M10 - Documents
│   ├── alerts/                     # M8 - Alerts
│   └── index.ts
│
├── apps/                           # 📱 Applications Layer
│   ├── awareness/                  # ✅ Awareness Platform
│   │   ├── pages/
│   │   │   ├── campaigns/
│   │   │   ├── participants/
│   │   │   └── reports/
│   │   ├── components/
│   │   ├── routes.tsx
│   │   ├── config.ts
│   │   └── index.ts
│   ├── lms/                        # 🚧 LMS (Coming Soon)
│   ├── phishing/                   # 🚧 Phishing Simulator (Coming Soon)
│   └── grc/                        # 🧪 GRC (Beta)
│
├── components/                     # 🎨 Shared UI Components
│   └── ui/                         # shadcn/ui components
│
├── layouts/                        # 📐 Layouts
│   ├── AppSidebar.tsx             # Dynamic Sidebar
│   └── AppLayout.tsx
│
├── lib/                            # 🛠️ Utilities
│   ├── app-context/               # App Context Provider
│   └── utils.ts
│
├── types/                          # 📝 Global Types
│   └── supabase.ts
│
├── App.tsx                         # Main App
├── main.tsx                        # Entry Point
└── index.css                       # Global Styles
```

---

## 🔑 المفاهيم الأساسية

### 1️⃣ Core Platform Layer

**الغرض:** الطبقة الأساسية التي يعتمد عليها كل شيء

**يحتوي على:**
- Authentication & Identity Management
- Role-Based Access Control (RBAC)
- Multi-Tenancy Helpers
- Shared Services (Documents, Audit, Alerts)
- App Registry (تسجيل التطبيقات)
- Core Hooks & Components

**قواعد:**
- ✅ مشترك بين جميع التطبيقات
- ✅ مستقل (لا يعتمد على Modules أو Apps)
- ✅ مستقر (تغييراته نادرة)
- ❌ لا يحتوي على Business Logic

**مثال:**
```typescript
import { useCan, documentService } from '@/core';
import { PermissionGuard } from '@/core/components';
```

---

### 2️⃣ Application Modules Layer

**الغرض:** وحدات عمل قابلة لإعادة الاستخدام تحتوي على منطق الأعمال

**يحتوي على:**
- Business Logic
- Data Models & Types
- API Integration (Supabase)
- Shared Hooks
- Reusable Components

**قواعد:**
- ✅ يمكن لعدة تطبيقات استخدامه
- ✅ يعتمد على Core فقط
- ✅ مستقل عن Apps
- ❌ لا يحتوي على Pages

**مثال:**
```typescript
import { Campaign, useCampaignsList } from '@/modules/campaigns';
import { ContentItem, useContentHub } from '@/modules/content-hub';
```

---

### 3️⃣ Applications Layer

**الغرض:** تطبيقات مستقلة مبنية على Core + Modules

**يحتوي على:**
- UI Pages
- App-specific Components
- Routes Configuration
- App Configuration

**قواعد:**
- ✅ يستخدم Core Services
- ✅ يستخدم Modules
- ✅ يمكن إضافته/إزالته بسهولة
- ❌ لا يعتمد على Apps أخرى

**مثال:**
```typescript
import { awarenessRoutes } from '@/apps/awareness/routes';
```

---

## 🔄 تدفق البيانات

```
User Interaction
       ↓
App Component (Apps Layer)
       ↓
Module Hook (Modules Layer)
       ↓
Core Service (Core Layer)
       ↓
Supabase / Database
```

**مثال عملي:**
```typescript
// 1. User clicks "Create Campaign" in Awareness App
// apps/awareness/pages/campaigns/create.tsx
function CreateCampaignPage() {
  const { createCampaign } = useCreateCampaign(); // من Modules
  
  // 2. Hook يستدعي Module Integration
  // modules/campaigns/hooks/useCreateCampaign.ts
  // الذي يستخدم Core Services للـ Audit Log
  
  // 3. Core Service يتواصل مع Supabase
  // core/services/auditService.ts
}
```

---

## 🎯 App Registry System

### ما هو App Registry؟

نظام مركزي لتسجيل جميع التطبيقات المتاحة على المنصة

```typescript
// src/core/config/appRegistry.ts
export const APP_MODULES: AppModule[] = [
  {
    id: 'awareness',
    name: 'Awareness',
    nameAr: 'التوعية الأمنية',
    route: '/app/awareness',
    requiredPermission: 'app.awareness.access',
    status: 'active',
    features: [
      {
        id: 'campaigns',
        name: 'Campaigns',
        route: '/app/awareness/campaigns',
        requiredPermission: 'awareness.campaign.view',
      },
      // ... more features
    ],
  },
  // ... more apps
];
```

### كيف يعمل؟

1. **التسجيل:** كل تطبيق يُسجل في `appRegistry.ts`
2. **الصلاحيات:** القائمة الجانبية تقرأ من Registry وتصفي حسب permissions
3. **الديناميكية:** إضافة تطبيق جديد = تعديل Registry فقط

---

## 🔐 Permission System

### البنية

```sql
role_permissions
├── tenant_id
├── role_code (admin, manager, user, viewer)
└── permission_code (awareness.campaign.create)
```

### التنسيق

```
Format: "resource.action"

Examples:
- awareness.campaign.view
- awareness.campaign.create
- lms.course.enroll
- phishing.campaign.launch
- system.settings.edit
```

### الاستخدام

```typescript
// Hook
const { hasPermission } = usePermissions();
if (hasPermission('awareness.campaign.create')) {
  // Show create button
}

// Component
<PermissionGuard permission="awareness.campaign.create">
  <CreateButton />
</PermissionGuard>
```

---

## 🚀 كيف تضيف تطبيق جديد؟

### الخطوات (2-4 ساعات)

#### 1️⃣ إنشاء البنية

```bash
mkdir -p src/apps/your-app/{pages,components}
touch src/apps/your-app/{index.ts,routes.tsx,config.ts}
```

#### 2️⃣ إنشاء Routes

```typescript
// src/apps/your-app/routes.tsx
export const yourAppRoutes = [
  {
    path: '/app/your-app',
    element: <YourAppPage />,
    permission: 'app.your-app.access',
  },
];
```

#### 3️⃣ تسجيل في App Registry

```typescript
// src/core/config/appRegistry.ts
{
  id: 'your-app',
  name: 'Your App',
  nameAr: 'تطبيقك',
  route: '/app/your-app',
  requiredPermission: 'app.your-app.access',
  status: 'active',
  features: [...],
}
```

#### 4️⃣ إضافة الصلاحيات

```sql
INSERT INTO role_permissions (tenant_id, role_code, permission_code)
VALUES
  (..., 'admin', 'app.your-app.access'),
  (..., 'admin', 'your-app.feature.view');
```

#### 5️⃣ استخدام في App.tsx

```typescript
import { yourAppRoutes } from '@/apps/your-app/routes';

// Add to routes array
```

**✅ انتهى! التطبيق الجديد جاهز**

---

## 📊 Import Paths

### قواعد الـ Imports

```typescript
// ✅ GOOD
import { useCan } from '@/core/rbac';
import { Campaign } from '@/modules/campaigns';
import { Button } from '@/components/ui/button';

// ❌ BAD
import { useCan } from '../../../lib/rbac';
import { Campaign } from '../../types/campaigns';
```

### Barrel Exports

كل طبقة لها `index.ts` يجمع exports:

```typescript
// src/core/index.ts
export * from './auth';
export * from './rbac';
export * from './services';

// Usage
import { useCan, documentService } from '@/core';
```

---

## 🧪 Testing Strategy

### ما يجب اختباره

```typescript
// Core Layer - Unit Tests
✅ usePermissions() hook
✅ PermissionGuard component
✅ documentService functions

// Modules Layer - Integration Tests
✅ useCampaignsList() + API
✅ Campaign CRUD operations

// Apps Layer - E2E Tests
✅ User can create campaign
✅ User can view reports
```

---

## 📈 Performance Considerations

### 1️⃣ Code Splitting

```typescript
// Lazy load apps
const AwarenessApp = lazy(() => import('@/apps/awareness'));
```

### 2️⃣ Permission Caching

```typescript
// usePermissions uses React Query with 5min staleTime
const { hasPermission } = usePermissions(); // Cached ✅
```

### 3️⃣ Dynamic Imports

```typescript
// Only load what's needed
if (hasPermission('app.awareness.access')) {
  const { AwarenessPage } = await import('@/apps/awareness');
}
```

---

## 🔧 Migration from Old Structure

### قبل (Old)

```
src/
├── pages/admin/campaigns/
├── hooks/campaigns/
├── types/campaigns.ts
├── integrations/supabase/campaigns.ts
└── services/
```

### بعد (New)

```
src/
├── core/
│   └── services/
├── modules/campaigns/
│   ├── types/
│   ├── integration/
│   └── hooks/
└── apps/awareness/
    └── pages/campaigns/
```

### الفوائد

- ✅ **واضح:** كل شيء له مكان محدد
- ✅ **قابل للتوسع:** إضافة app جديد سهل
- ✅ **قابل للصيانة:** Code منظم وسهل القراءة
- ✅ **قابل لإعادة الاستخدام:** Modules مشتركة

---

## 📚 Resources

- [Core README](../../src/core/README.md)
- [Modules README](../../src/modules/README.md)
- [Apps README](../../src/apps/README.md)
- [خطة التوسع](./خطة_التوسع_Platform_Expansion_Plan_v1.0.md)
- [خطة التنفيذ التفصيلية](./خطة_التوسع_التنفيذية_التفصيلية_v1.0.md)

---

**الإصدار:** v1.0  
**التاريخ:** 2025-11-14  
**الحالة:** ✅ مطبق جزئياً (البنية الأساسية جاهزة)
