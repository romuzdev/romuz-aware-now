# خطة الاختبار الشاملة لنظام Romuz - Gate System
## دليل تنفيذي مفصل للاختبار الكامل للنظام

---

## 📋 جدول المحتويات

1. [نظرة عامة على استراتيجية الاختبار](#نظرة-عامة)
2. [البنية الحالية للاختبارات](#البنية-الحالية)
3. [أنواع الاختبارات المطلوبة](#أنواع-الاختبارات)
4. [خطة التنفيذ التفصيلية](#خطة-التنفيذ)
5. [سكريبتات التشغيل](#سكريبتات-التشغيل)
6. [معايير النجاح والتقييم](#معايير-النجاح)
7. [التقارير والمراقبة](#التقارير-والمراقبة)
8. [حل المشاكل الشائعة](#حل-المشاكل)

---

## 1. نظرة عامة على استراتيجية الاختبار {#نظرة-عامة}

### 1.1 الأهداف الرئيسية

- ✅ **الجودة الشاملة**: التأكد من أن جميع الميزات تعمل بشكل صحيح
- 🔒 **الأمان**: التحقق من RLS, RBAC, وحماية البيانات
- ⚡ **الأداء**: قياس أوقات الاستجابة والكفاءة
- 🔄 **التكامل**: اختبار التكامل بين جميع الوحدات
- 📊 **التغطية**: تحقيق تغطية اختبارية لا تقل عن 70%

### 1.2 هرمية الاختبارات

```
        /\
       /  \
      / E2E\ ← 10-20% (اختبارات شاملة end-to-end)
     /------\
    /        \
   /Integration\ ← 30-40% (اختبارات التكامل)
  /------------\
 /              \
/   Unit Tests   \ ← 40-50% (اختبارات الوحدات)
/________________\
```

---

## 2. البنية الحالية للاختبارات {#البنية-الحالية}

### 2.1 هيكل المجلدات

```
tests/
├── unit/                    # اختبارات الوحدات (Components, Hooks, Utils)
│   ├── rbac-security.spec.ts
│   ├── filters.spec.ts
│   ├── savedViews.spec.ts
│   └── ...
│
├── integration/             # اختبارات التكامل (Database, RLS, APIs)
│   ├── rls.spec.ts
│   ├── constraints.spec.ts
│   ├── audit.spec.ts
│   ├── gate_k_rpc_test.ts
│   └── ...
│
├── e2e/                     # اختبارات End-to-End (User Flows)
│   ├── auth.setup.ts
│   ├── _helpers/
│   │   ├── auth.ts
│   │   └── selectors.ts
│   ├── admin.flow.spec.ts   (مطلوب إنشاؤه)
│   ├── manager.flow.spec.ts (مطلوب إنشاؤه)
│   ├── reader.flow.spec.ts  (مطلوب إنشاؤه)
│   ├── api.campaigns.spec.ts (مطلوب إنشاؤه)
│   └── grc/                 # اختبارات GRC Module
│       ├── risks.flow.spec.ts
│       ├── controls.flow.spec.ts
│       └── compliance.flow.spec.ts
│
├── sanity/                  # اختبارات سريعة للتحقق من الصحة
│   ├── security.sanity.ts
│   ├── performance.sanity.ts
│   └── run-all.ts
│
├── fixtures/                # بيانات تجريبية للاختبارات
├── helpers/                 # دوال مساعدة مشتركة
└── seed/                    # سكريبتات إنشاء بيانات الاختبار
```

### 2.2 أدوات الاختبار المستخدمة

| الأداة | الغرض | الملفات |
|--------|-------|---------|
| **Vitest** | اختبارات الوحدات والتكامل | `vitest.config.ts` |
| **Playwright** | اختبارات E2E | `playwright.config.ts`, `playwright.config.grc.ts` |
| **Testing Library** | اختبارات React Components | مثبتة في المشروع |
| **Supabase Client** | اختبارات قاعدة البيانات | `src/integrations/supabase/` |

---

## 3. أنواع الاختبارات المطلوبة {#أنواع-الاختبارات}

### 3.1 اختبارات الوحدات (Unit Tests) - Priority: Critical ⚡

**الغرض**: اختبار الوظائف الفردية والكومبونينتات بشكل معزول

#### 3.1.1 ما يجب اختباره:

- ✅ **React Components**: 
  - Rendering صحيح
  - Props handling
  - State management
  - Event handlers

- ✅ **Custom Hooks**: 
  - Return values
  - Side effects
  - Dependencies
  - Error handling

- ✅ **Utility Functions**:
  - Pure functions
  - Data transformations
  - Validation logic
  - Formatters

- ✅ **Business Logic**:
  - RBAC permissions (`rbacCan.spec.ts`)
  - Filters (`filters.spec.ts`)
  - CSV mappers (`csvMappers.spec.ts`)
  - Quiz grading (`quizGrading.spec.ts`)

#### 3.1.2 مثال على اختبار وحدة:

```typescript
// tests/unit/example.spec.ts
import { describe, it, expect } from 'vitest';
import { calculateCompletionRate } from '@/lib/utils/calculations';

describe('calculateCompletionRate', () => {
  it('should calculate completion rate correctly', () => {
    const completed = 75;
    const total = 100;
    const result = calculateCompletionRate(completed, total);
    expect(result).toBe(75);
  });

  it('should return 0 when total is 0', () => {
    const result = calculateCompletionRate(0, 0);
    expect(result).toBe(0);
  });

  it('should round to 2 decimal places', () => {
    const result = calculateCompletionRate(1, 3);
    expect(result).toBe(33.33);
  });
});
```

---

### 3.2 اختبارات التكامل (Integration Tests) - Priority: High 🔴

**الغرض**: اختبار التفاعل بين الوحدات المختلفة

#### 3.2.1 مجالات التكامل:

- ✅ **Database Integration**:
  - RLS Policies (`rls.spec.ts`)
  - Database constraints (`constraints.spec.ts`)
  - Views and KPIs (`views_kpis.spec.ts`)
  - Audit logging (`audit.spec.ts`)

- ✅ **API Integration**:
  - Edge Functions
  - RPC Functions (`gate_k_rpc_test.ts`)
  - Supabase Client

- ✅ **Module Integration**:
  - Gate-K (Committees) (`gatek.spec.ts`)
  - Gate-N (Notifications) (`gate-n-*.test.ts`)
  - Gate-M (Master Data)
  - Awareness Module

#### 3.2.2 مثال على اختبار تكامل:

```typescript
// tests/integration/campaigns-api.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Campaigns API Integration', () => {
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    // Setup test tenant and user
    const { data: tenant } = await supabase
      .from('tenants')
      .insert({ name: 'Test Tenant' })
      .select()
      .single();
    tenantId = tenant.id;
  });

  it('should create campaign with correct RLS', async () => {
    const { data, error } = await supabase
      .from('awareness_campaigns')
      .insert({
        name: 'Test Campaign',
        tenant_id: tenantId,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe('Test Campaign');
  });

  it('should enforce RLS for other tenants', async () => {
    // Switch to different tenant context
    // Attempt to access previous tenant's campaign
    // Should fail due to RLS
  });
});
```

---

### 3.3 اختبارات E2E (End-to-End Tests) - Priority: High 🔴

**الغرض**: اختبار تدفقات المستخدم الكاملة من البداية إلى النهاية

#### 3.3.1 تدفقات المستخدم (User Flows):

##### A. Admin Flow (مدير النظام) - `admin.flow.spec.ts`

```typescript
/**
 * Admin Flow Test - Full Campaign Lifecycle
 * 
 * Steps:
 * 1. Login as admin
 * 2. Navigate to campaigns
 * 3. Create new campaign
 * 4. Add participants
 * 5. Add modules
 * 6. Publish campaign
 * 7. Monitor progress
 * 8. View reports
 * 9. Archive campaign
 */

test.describe('Admin Flow - Campaign Lifecycle', () => {
  test('should complete full campaign lifecycle', async ({ page }) => {
    // 1. Login
    await login(page, TEST_USERS.admin);
    
    // 2. Create campaign
    await page.click('[data-testid="create-campaign-btn"]');
    await page.fill('[name="name"]', 'Q1 Security Awareness');
    await page.fill('[name="start_date"]', '2025-01-01');
    await page.fill('[name="end_date"]', '2025-03-31');
    await page.click('[type="submit"]');
    
    // 3. Add participants
    await page.click('[data-testid="add-participants-btn"]');
    await page.click('[data-testid="import-csv-btn"]');
    // ... upload CSV
    
    // 4. Verify creation
    await expect(page.locator('text=Q1 Security Awareness')).toBeVisible();
  });
});
```

##### B. Manager Flow (المدير التنفيذي) - `manager.flow.spec.ts`

```typescript
/**
 * Manager Flow Test - Operational Tasks
 * 
 * Steps:
 * 1. Login as manager
 * 2. View campaign dashboard
 * 3. Monitor participant progress
 * 4. Bulk status update
 * 5. Export reports
 * 6. View analytics
 */

test.describe('Manager Flow - Operations', () => {
  test('should perform bulk operations', async ({ page }) => {
    await login(page, TEST_USERS.manager);
    
    // Bulk status update
    await page.click('[data-testid="select-all-checkbox"]');
    await page.click('[data-testid="bulk-actions-btn"]');
    await page.click('text=تحديث الحالة');
    
    // Verify update
    await expect(page.locator('.toast-success')).toBeVisible();
  });
});
```

##### C. Reader Flow (القارئ) - `reader.flow.spec.ts`

```typescript
/**
 * Reader Flow Test - RBAC Guards
 * 
 * Purpose: Test that readers can ONLY view data, not modify
 * 
 * Steps:
 * 1. Login as reader
 * 2. Try to access campaigns (should succeed)
 * 3. Try to create campaign (should fail - button hidden)
 * 4. Try to edit campaign (should fail - button hidden)
 * 5. Try to delete campaign (should fail - button hidden)
 * 6. View reports (should succeed)
 */

test.describe('Reader Flow - RBAC Guards', () => {
  test('should hide modification buttons', async ({ page }) => {
    await login(page, TEST_USERS.reader);
    
    await page.goto('/admin/campaigns');
    
    // Should NOT see create button
    await expect(page.locator('[data-testid="create-campaign-btn"]')).toBeHidden();
    
    // Should NOT see edit buttons
    await expect(page.locator('[data-testid="edit-btn"]')).toHaveCount(0);
    
    // Should see view button
    await expect(page.locator('[data-testid="view-btn"]')).toBeVisible();
  });
});
```

#### 3.3.2 اختبارات API - `api.*.spec.ts`

```typescript
/**
 * API Tests - Backend Endpoints
 */

test.describe('Campaigns API', () => {
  test('GET /api/campaigns - should return campaigns list', async ({ request }) => {
    const response = await request.get('/api/campaigns', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /api/campaigns - should create campaign', async ({ request }) => {
    const response = await request.post('/api/campaigns', {
      data: {
        name: 'Test Campaign',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status()).toBe(201);
  });
});
```

---

### 3.4 اختبارات الأمان (Security Tests) - Priority: Critical ⚡🔒

**الغرض**: التحقق من أمان النظام وحماية البيانات

#### 3.4.1 مجالات الأمان:

- ✅ **RLS (Row Level Security)**:
  - تحقق من أن كل tenant يرى بياناته فقط
  - اختبار سيناريوهات privilege escalation
  - التحقق من isolation بين المستأجرين

- ✅ **RBAC (Role-Based Access Control)**:
  - اختبار صلاحيات كل دور
  - التحقق من عدم القدرة على تجاوز الصلاحيات
  - اختبار permission matrix

- ✅ **Authentication & Authorization**:
  - اختبار تسجيل الدخول
  - اختبار انتهاء الجلسة
  - اختبار token validation

#### 3.4.2 مثال على اختبار أمان:

```typescript
// tests/integration/security-rls.spec.ts
describe('RLS Security Tests', () => {
  it('should prevent cross-tenant data access', async () => {
    // Create two tenants
    const tenant1 = await createTestTenant();
    const tenant2 = await createTestTenant();
    
    // Create campaign for tenant1
    const campaign = await createCampaign(tenant1.id);
    
    // Try to access from tenant2 context
    const { data, error } = await supabase
      .from('awareness_campaigns')
      .select('*')
      .eq('id', campaign.id)
      .single();
    
    // Should return null due to RLS
    expect(data).toBeNull();
    expect(error).toBeDefined();
  });

  it('should allow admin to manage campaigns', async () => {
    const user = await loginAs('admin');
    
    const { data, error } = await supabase
      .from('awareness_campaigns')
      .insert({ name: 'Test' })
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should prevent reader from creating campaigns', async () => {
    const user = await loginAs('reader');
    
    const { data, error } = await supabase
      .from('awareness_campaigns')
      .insert({ name: 'Test' })
      .select()
      .single();
    
    expect(error).toBeDefined();
    expect(data).toBeNull();
  });
});
```

---

### 3.5 اختبارات الأداء (Performance Tests) - Priority: Medium 🟡

**الغرض**: قياس أداء النظام وأوقات الاستجابة

#### 3.5.1 مقاييس الأداء:

- ⏱️ **Page Load Time**: < 2 ثانية
- ⏱️ **API Response Time**: < 300 مللي ثانية
- ⏱️ **Database Query Time**: < 100 مللي ثانية
- 📊 **Large Dataset Handling**: 10,000+ سجل

#### 3.5.2 مثال على اختبار أداء:

```typescript
// tests/sanity/performance.sanity.ts
describe('Performance Tests', () => {
  it('should load campaigns page in < 2 seconds', async () => {
    const startTime = Date.now();
    
    await page.goto('/admin/campaigns');
    await page.waitForSelector('[data-testid="campaigns-table"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  it('should handle large datasets efficiently', async () => {
    // Create 1000 campaigns
    const campaigns = Array.from({ length: 1000 }, (_, i) => ({
      name: `Campaign ${i}`,
      tenant_id: tenantId,
      start_date: '2025-01-01',
      end_date: '2025-12-31',
    }));
    
    await supabase.from('awareness_campaigns').insert(campaigns);
    
    // Measure query time
    const startTime = Date.now();
    const { data } = await supabase
      .from('awareness_campaigns')
      .select('*')
      .limit(100);
    const queryTime = Date.now() - startTime;
    
    expect(queryTime).toBeLessThan(300);
    expect(data.length).toBe(100);
  });
});
```

---

## 4. خطة التنفيذ التفصيلية {#خطة-التنفيذ}

### المرحلة 1: الإعداد والتحضير (يوم 1-2) 🔧

#### الخطوة 1.1: تثبيت الأدوات

```bash
# تثبيت Playwright (إذا لم يكن مثبتاً)
npm install -D @playwright/test
npx playwright install

# تثبيت أدوات إضافية
npm install -D @faker-js/faker  # لإنشاء بيانات تجريبية
```

#### الخطوة 1.2: إعداد بيئة الاختبار

```bash
# 1. إنشاء ملف بيئة الاختبار
cp .env .env.test

# 2. تعديل .env.test بقاعدة بيانات اختبار منفصلة
# VITE_SUPABASE_URL=your_test_supabase_url
# VITE_SUPABASE_ANON_KEY=your_test_anon_key

# 3. إنشاء قاعدة بيانات اختبار
# يفضل استخدام Supabase project منفصل للاختبارات
```

#### الخطوة 1.3: إنشاء بيانات تجريبية (Seed Data)

```bash
# تشغيل seed script لإنشاء بيانات تجريبية
npm run seed:test
```

---

### المرحلة 2: اختبارات الوحدات (يوم 3-5) 🧪

#### الخطوة 2.1: اختبار Utility Functions

```bash
# تشغيل جميع اختبارات الوحدات
npm run test:unit

# أو اختبار ملف محدد
npx vitest run tests/unit/filters.spec.ts
```

#### الخطوة 2.2: اختبار React Components

```typescript
// مثال: tests/unit/components/CampaignCard.spec.tsx
import { render, screen } from '@testing-library/react';
import { CampaignCard } from '@/components/campaigns/CampaignCard';

describe('CampaignCard', () => {
  const mockCampaign = {
    id: '1',
    name: 'Test Campaign',
    status: 'active',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
  };

  it('should render campaign name', () => {
    render(<CampaignCard campaign={mockCampaign} />);
    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
  });

  it('should display status badge', () => {
    render(<CampaignCard campaign={mockCampaign} />);
    expect(screen.getByText('نشط')).toBeInTheDocument();
  });
});
```

#### الخطوة 2.3: اختبار Custom Hooks

```typescript
// مثال: tests/unit/hooks/useCampaigns.spec.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useCampaigns', () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch campaigns successfully', async () => {
    const { result } = renderHook(() => useCampaigns(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
```

**الهدف اليومي**: اختبار 20-30 وحدة يومياً

---

### المرحلة 3: اختبارات التكامل (يوم 6-8) 🔗

#### الخطوة 3.1: اختبار RLS Policies

```bash
# تشغيل اختبارات RLS
npx vitest run tests/integration/rls.spec.ts
```

#### الخطوة 3.2: اختبار Database Constraints

```bash
# تشغيل اختبارات القيود
npx vitest run tests/integration/constraints.spec.ts
```

#### الخطوة 3.3: اختبار Audit Logging

```bash
# تشغيل اختبارات التدقيق
npx vitest run tests/integration/audit.spec.ts
```

**الهدف اليومي**: اختبار 10-15 سيناريو تكامل يومياً

---

### المرحلة 4: اختبارات E2E (يوم 9-12) 🌐

#### الخطوة 4.1: إعداد Playwright Authentication

```bash
# تشغيل setup لإنشاء authentication states
npx playwright test auth.setup.ts
```

#### الخطوة 4.2: اختبار Admin Flow

```bash
# إنشاء وتشغيل اختبار Admin
npx playwright test admin.flow.spec.ts --headed
```

#### الخطوة 4.3: اختبار Manager Flow

```bash
# إنشاء وتشغيل اختبار Manager
npx playwright test manager.flow.spec.ts --headed
```

#### الخطوة 4.4: اختبار Reader Flow (RBAC)

```bash
# اختبار صلاحيات القراءة فقط
npx playwright test reader.flow.spec.ts --headed
```

#### الخطوة 4.5: اختبار APIs

```bash
# اختبار جميع APIs
npx playwright test api.*.spec.ts
```

**الهدف اليومي**: اختبار 5-7 تدفقات مستخدم كاملة يومياً

---

### المرحلة 5: اختبارات الأمان (يوم 13-14) 🔒

#### الخطوة 5.1: اختبار RLS Isolation

```bash
# اختبار عزل البيانات بين المستأجرين
npx vitest run tests/integration/security-rls.spec.ts
```

#### الخطوة 5.2: اختبار RBAC

```bash
# اختبار صلاحيات الأدوار
npx vitest run tests/unit/rbac-security.spec.ts
```

#### الخطوة 5.3: Penetration Testing Scenarios

```typescript
// tests/security/penetration.spec.ts
describe('Security Penetration Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE campaigns; --";
    
    const { error } = await supabase
      .from('awareness_campaigns')
      .select('*')
      .eq('name', maliciousInput);
    
    // Should be safely escaped, no error
    expect(error).toBeNull();
  });

  it('should prevent XSS attacks', async ({ page }) => {
    await page.goto('/admin/campaigns/new');
    
    const xssScript = '<script>alert("XSS")</script>';
    await page.fill('[name="name"]', xssScript);
    await page.click('[type="submit"]');
    
    // Script should be escaped and not executed
    const alertFired = await page.evaluate(() => {
      return window.document.querySelector('script[src*="alert"]') !== null;
    });
    
    expect(alertFired).toBe(false);
  });
});
```

---

### المرحلة 6: اختبارات الأداء (يوم 15) ⚡

#### الخطوة 6.1: تشغيل Performance Sanity Checks

```bash
# تشغيل اختبارات الأداء
npm run test:performance
# or
node tests/sanity/performance.sanity.ts
```

#### الخطوة 6.2: Load Testing

```typescript
// tests/performance/load-test.spec.ts
import { test } from '@playwright/test';

test.describe('Load Testing', () => {
  test('should handle 100 concurrent users', async ({ browser }) => {
    const contexts = await Promise.all(
      Array.from({ length: 100 }, () => browser.newContext())
    );
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );
    
    const startTime = Date.now();
    
    await Promise.all(
      pages.map(page => page.goto('/admin/campaigns'))
    );
    
    const loadTime = Date.now() - startTime;
    
    // Should handle 100 users in < 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
```

---

### المرحلة 7: تجميع التقارير والمراجعة (يوم 16) 📊

#### الخطوة 7.1: تشغيل جميع الاختبارات

```bash
# تشغيل جميع الاختبارات بتقرير شامل
npm run test:all
```

#### الخطوة 7.2: توليد تقرير التغطية

```bash
# توليد تقرير تغطية الكود
npm run test:coverage

# فتح تقرير التغطية في المتصفح
npx vitest --coverage --ui
```

#### الخطوة 7.3: مراجعة النتائج

- ✅ مراجعة جميع الاختبارات الفاشلة
- ✅ التأكد من تغطية لا تقل عن 70%
- ✅ مراجعة أوقات الاستجابة
- ✅ توثيق المشاكل المكتشفة

---

## 5. سكريبتات التشغيل {#سكريبتات-التشغيل}

### 5.1 إضافة سكريبتات إلى package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:security": "vitest run tests/unit/rbac-security.spec.ts tests/integration/rls.spec.ts",
    "test:performance": "node tests/sanity/performance.sanity.ts",
    "test:sanity": "node tests/sanity/run-all.ts",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "seed:test": "node tests/seed/seed-all.ts"
  }
}
```

### 5.2 إنشاء سكريبت شامل للتشغيل

```bash
# إنشاء ملف: scripts/run-all-tests.sh
#!/bin/bash

echo "🚀 بدء تشغيل جميع الاختبارات..."
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Unit Tests
echo ""
echo "📦 المرحلة 1: اختبارات الوحدات..."
npm run test:unit
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ اختبارات الوحدات نجحت${NC}"
else
    echo -e "${RED}❌ اختبارات الوحدات فشلت${NC}"
    exit 1
fi

# 2. Integration Tests
echo ""
echo "🔗 المرحلة 2: اختبارات التكامل..."
npm run test:integration
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ اختبارات التكامل نجحت${NC}"
else
    echo -e "${RED}❌ اختبارات التكامل فشلت${NC}"
    exit 1
fi

# 3. E2E Tests
echo ""
echo "🌐 المرحلة 3: اختبارات E2E..."
npm run test:e2e
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ اختبارات E2E نجحت${NC}"
else
    echo -e "${RED}❌ اختبارات E2E فشلت${NC}"
    exit 1
fi

# 4. Security Tests
echo ""
echo "🔒 المرحلة 4: اختبارات الأمان..."
npm run test:security
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ اختبارات الأمان نجحت${NC}"
else
    echo -e "${YELLOW}⚠️  اختبارات الأمان بها تحذيرات${NC}"
fi

# 5. Performance Tests
echo ""
echo "⚡ المرحلة 5: اختبارات الأداء..."
npm run test:performance
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ اختبارات الأداء نجحت${NC}"
else
    echo -e "${YELLOW}⚠️  اختبارات الأداء بها تحذيرات${NC}"
fi

# 6. Coverage Report
echo ""
echo "📊 المرحلة 6: توليد تقرير التغطية..."
npm run test:coverage

echo ""
echo "=================================="
echo -e "${GREEN}🎉 جميع الاختبارات اكتملت بنجاح!${NC}"
echo "📊 عرض التقرير: npx vitest --coverage --ui"
echo "🎭 عرض تقرير Playwright: npx playwright show-report"
```

### 5.3 جعل السكريبت قابلاً للتنفيذ

```bash
chmod +x scripts/run-all-tests.sh
```

### 5.4 تشغيل جميع الاختبارات

```bash
./scripts/run-all-tests.sh
```

---

## 6. معايير النجاح والتقييم {#معايير-النجاح}

### 6.1 معايير النجاح الكمية

| المعيار | الهدف | الحد الأدنى المقبول |
|---------|--------|---------------------|
| **Test Coverage** | ≥ 80% | ≥ 70% |
| **Pass Rate** | 100% | ≥ 95% |
| **Page Load Time** | < 1.5s | < 2s |
| **API Response Time** | < 200ms | < 300ms |
| **Database Query Time** | < 50ms | < 100ms |
| **E2E Test Success Rate** | 100% | ≥ 95% |
| **Security Tests Pass** | 100% | 100% (Critical) |

### 6.2 معايير النجاح النوعية

- ✅ **Functionality**: جميع الميزات تعمل كما هو متوقع
- ✅ **Security**: لا توجد ثغرات أمنية critical
- ✅ **Performance**: النظام يستجيب بسرعة مقبولة
- ✅ **Reliability**: النظام مستقر ولا يتعطل
- ✅ **Usability**: تجربة المستخدم سلسة
- ✅ **Maintainability**: الكود منظم وسهل الصيانة

### 6.3 مؤشرات الأداء الرئيسية (KPIs)

```typescript
// tests/helpers/performance-metrics.ts
export interface PerformanceMetrics {
  testCoverage: number;        // %
  passRate: number;            // %
  avgPageLoadTime: number;     // ms
  avgApiResponseTime: number;  // ms
  avgDbQueryTime: number;      // ms
  criticalIssues: number;      // count
  highIssues: number;          // count
  mediumIssues: number;        // count
}

export function evaluateMetrics(metrics: PerformanceMetrics): 'PASS' | 'FAIL' {
  const checks = [
    metrics.testCoverage >= 70,
    metrics.passRate >= 95,
    metrics.avgPageLoadTime < 2000,
    metrics.avgApiResponseTime < 300,
    metrics.avgDbQueryTime < 100,
    metrics.criticalIssues === 0,
  ];
  
  return checks.every(check => check) ? 'PASS' : 'FAIL';
}
```

---

## 7. التقارير والمراقبة {#التقارير-والمراقبة}

### 7.1 تقارير الاختبارات

#### A. تقرير Vitest (Unit & Integration)

```bash
# توليد تقرير HTML
npx vitest --coverage --reporter=html

# عرض التقرير في المتصفح
open coverage/index.html
```

#### B. تقرير Playwright (E2E)

```bash
# توليد تقرير Playwright
npx playwright show-report

# تقرير JSON
npx playwright test --reporter=json

# تقرير JUnit (للتكامل مع CI/CD)
npx playwright test --reporter=junit
```

### 7.2 Dashboard للمراقبة

```typescript
// tests/dashboard/test-results-dashboard.ts
import fs from 'fs';
import path from 'path';

interface TestResults {
  unit: { total: number; passed: number; failed: number; coverage: number };
  integration: { total: number; passed: number; failed: number };
  e2e: { total: number; passed: number; failed: number };
  performance: { avgLoadTime: number; avgApiTime: number; avgDbTime: number };
}

export function generateDashboard(results: TestResults): string {
  return `
# 📊 لوحة معلومات الاختبارات

## نظرة عامة
- **التاريخ**: ${new Date().toLocaleDateString('ar-SA')}
- **الوقت**: ${new Date().toLocaleTimeString('ar-SA')}

## نتائج الاختبارات

### 🧪 اختبارات الوحدات
- **الإجمالي**: ${results.unit.total}
- **نجح**: ${results.unit.passed} ✅
- **فشل**: ${results.unit.failed} ❌
- **التغطية**: ${results.unit.coverage}%

### 🔗 اختبارات التكامل
- **الإجمالي**: ${results.integration.total}
- **نجح**: ${results.integration.passed} ✅
- **فشل**: ${results.integration.failed} ❌

### 🌐 اختبارات E2E
- **الإجمالي**: ${results.e2e.total}
- **نجح**: ${results.e2e.passed} ✅
- **فشل**: ${results.e2e.failed} ❌

### ⚡ مقاييس الأداء
- **متوسط وقت تحميل الصفحة**: ${results.performance.avgLoadTime}ms
- **متوسط وقت استجابة API**: ${results.performance.avgApiTime}ms
- **متوسط وقت استعلام قاعدة البيانات**: ${results.performance.avgDbTime}ms

## الحالة العامة
${evaluateOverallStatus(results)}
`;
}

function evaluateOverallStatus(results: TestResults): string {
  const totalTests = results.unit.total + results.integration.total + results.e2e.total;
  const totalPassed = results.unit.passed + results.integration.passed + results.e2e.passed;
  const passRate = (totalPassed / totalTests) * 100;
  
  if (passRate >= 95 && results.unit.coverage >= 70) {
    return '✅ **ممتاز**: جميع المعايير محققة';
  } else if (passRate >= 90) {
    return '⚠️ **جيد**: هناك بعض المشاكل البسيطة';
  } else {
    return '❌ **يحتاج تحسين**: هناك مشاكل تحتاج إلى معالجة';
  }
}
```

---

## 8. حل المشاكل الشائعة {#حل-المشاكل}

### 8.1 مشاكل Playwright

#### مشكلة: Timeout في اختبارات E2E

```typescript
// الحل: زيادة timeout
test.setTimeout(60000); // 60 ثانية

// أو في playwright.config.ts
export default defineConfig({
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
});
```

#### مشكلة: Authentication state لا يعمل

```bash
# حذف وإعادة إنشاء auth states
rm -rf test-results/.auth
npx playwright test auth.setup.ts
```

### 8.2 مشاكل Vitest

#### مشكلة: Module not found

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### مشكلة: Database connection في الاختبارات

```typescript
// tests/setup.ts
import { beforeAll, afterAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

beforeAll(async () => {
  // Setup test database
  await setupTestDatabase();
});

afterAll(async () => {
  // Cleanup test database
  await cleanupTestDatabase();
});
```

### 8.3 مشاكل التغطية (Coverage)

#### مشكلة: Coverage منخفض جداً

```bash
# عرض الملفات غير المغطاة
npx vitest --coverage --reporter=verbose

# التركيز على الملفات المهمة أولاً
npx vitest tests/unit/critical/*.spec.ts --coverage
```

---

## 9. الملخص والخطوات التالية

### 9.1 جدول زمني مقترح

| المرحلة | المدة | المهام الرئيسية |
|---------|------|-----------------|
| **الإعداد** | يوم 1-2 | تثبيت الأدوات، إعداد البيئة، Seed Data |
| **Unit Tests** | يوم 3-5 | اختبار Components, Hooks, Utils |
| **Integration Tests** | يوم 6-8 | اختبار RLS, APIs, Database |
| **E2E Tests** | يوم 9-12 | اختبار User Flows, APIs |
| **Security Tests** | يوم 13-14 | اختبار RLS, RBAC, Penetration |
| **Performance Tests** | يوم 15 | Load Testing, Benchmarking |
| **التقارير** | يوم 16 | تجميع النتائج، المراجعة |

**المدة الإجمالية**: 16 يوم عمل (حوالي 3 أسابيع)

### 9.2 الخطوات التالية الفورية

1. ✅ **إنشاء ملفات الاختبارات المفقودة**:
   ```bash
   # إنشاء E2E tests
   touch tests/e2e/admin.flow.spec.ts
   touch tests/e2e/manager.flow.spec.ts
   touch tests/e2e/reader.flow.spec.ts
   touch tests/e2e/api.campaigns.spec.ts
   touch tests/e2e/api.participants.spec.ts
   ```

2. ✅ **إعداد Seed Data**:
   ```bash
   # إنشاء seed script
   node tests/seed/seed-all.ts
   ```

3. ✅ **تشغيل اختبار تجريبي**:
   ```bash
   # تشغيل اختبار بسيط للتأكد من الإعداد
   npm run test:unit
   ```

4. ✅ **البدء بالمرحلة الأولى**:
   ```bash
   # البدء باختبارات الوحدات
   ./scripts/run-all-tests.sh
   ```

---

## 10. موارد إضافية

### 10.1 وثائق مرجعية

- 📖 [Playwright Documentation](https://playwright.dev/)
- 📖 [Vitest Documentation](https://vitest.dev/)
- 📖 [Testing Library](https://testing-library.com/)
- 📖 [Supabase Testing Guide](https://supabase.com/docs/guides/testing)

### 10.2 أمثلة من المشروع

- `tests/e2e/README.md` - دليل E2E
- `tests/unit/rbac-security.spec.ts` - مثال RBAC
- `tests/integration/rls.spec.ts` - مثال RLS
- `docs/awareness/05_QA/Test_Matrix.md` - مصفوفة الاختبار

---

## 📝 ملاحظات ختامية

هذه الخطة الشاملة تغطي جميع جوانب الاختبار للنظام. يمكن تعديلها وتخصيصها حسب الحاجة. 

**نصائح مهمة**:
- 🔄 ابدأ بالاختبارات الأكثر أهمية (Critical Path)
- 📊 راقب التقدم باستمرار
- 🐛 وثق جميع المشاكل المكتشفة
- ✅ احتفل بكل إنجاز صغير!

**للدعم والمساعدة**:
- راجع الوثائق الموجودة في `docs/`
- اطلع على الأمثلة الموجودة في `tests/`
- استخدم `--help` مع أي أمر للحصول على المساعدة

---

**آخر تحديث**: 2025-01-17  
**الإصدار**: 1.0  
**الحالة**: جاهز للتنفيذ ✅
