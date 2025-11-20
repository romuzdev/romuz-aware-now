# نظام إدارة الصلاحيات (RBAC System)

## 📋 جدول المحتويات
1. [نظرة عامة](#نظرة-عامة)
2. [معمارية النظام](#معمارية-النظام)
3. [مستويات الحماية](#مستويات-الحماية)
4. [تطبيق الصلاحيات في الكود](#تطبيق-الصلاحيات-في-الكود)
5. [أفضل الممارسات الأمنية](#أفضل-الممارسات-الأمنية)
6. [تقييم النظام الحالي](#تقييم-النظام-الحالي)

---

## نظرة عامة

نظام الصلاحيات المستخدم هو **RBAC** (Role-Based Access Control) - التحكم في الوصول المبني على الأدوار.

### ✅ المفهوم الأساسي

```
المستخدم → لديه دور/أدوار → كل دور لديه صلاحيات → الصلاحيات تحدد ما يمكن عمله
```

### 🎯 الأهداف الرئيسية

1. **الأمان**: منع الوصول غير المصرح به للبيانات والوظائف
2. **المرونة**: سهولة إضافة أدوار وصلاحيات جديدة
3. **الأداء**: فحص الصلاحيات بكفاءة دون تأثير على سرعة التطبيق
4. **قابلية التوسع**: دعم منصات متعددة (Multi-Tenant)

---

## معمارية النظام

### 1️⃣ قاعدة البيانات (Database Layer)

#### جدول user_roles
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP,
  UNIQUE (user_id, role, tenant_id)
);
```

#### نوع الأدوار (Enum)
```sql
CREATE TYPE app_role AS ENUM (
  'platform_admin',    -- مدير المنصة
  'platform_support',  -- الدعم الفني
  'tenant_admin',      -- مدير الجهة
  'tenant_manager',    -- مدير
  'tenant_employee',   -- موظف
  'awareness_manager', -- مدير التوعية
  'risk_manager',      -- مدير المخاطر
  'compliance_officer',-- مسؤول الامتثال
  'hr_manager',        -- مدير الموارد البشرية
  'employee'           -- موظف عام
);
```

#### ✅ أفضل الممارسات المطبقة:
- ✓ **جدول منفصل للأدوار**: الأدوار في جدول `user_roles` منفصل عن جدول المستخدمين
- ✓ **Row Level Security (RLS)**: تأمين البيانات على مستوى الصف
- ✓ **Security Definer Functions**: دوال آمنة لجلب الأدوار

```sql
-- دالة آمنة لجلب أدوار المستخدم
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID,
  _role app_role
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;
```

---

### 2️⃣ طبقة التطبيق (Application Layer)

#### هيكل الصلاحيات
```typescript
// src/core/rbac/roles.ts
const TENANT_ADMIN: RoleDefinition = {
  role: 'tenant_admin',
  name: 'Tenant Administrator',
  nameAr: 'مدير الجهة',
  level: 3,
  isPlatform: false,
  permissions: [
    'tenant.*',           // كل صلاحيات الجهة
    'campaigns.*',        // كل صلاحيات الحملات
    'documents.*',        // كل صلاحيات المستندات
    'users.manage',       // إدارة المستخدمين
    'roles.manage',       // إدارة الأدوار
    'settings.manage',    // إدارة الإعدادات
  ],
};
```

#### نظام Wildcards
```typescript
// الصلاحيات تدعم Wildcards للمرونة:
'*'              // كل الصلاحيات
'campaigns.*'    // كل صلاحيات الحملات
'campaigns.view' // صلاحية محددة فقط
```

---

## مستويات الحماية

### المستوى 1️⃣: حماية المسارات (Route Protection)

```typescript
// src/App.tsx
<Route 
  path="/awareness/campaigns" 
  element={
    <ProtectedRoute>
      <AdminLayout>
        <CampaignsListPage />
      </AdminLayout>
    </ProtectedRoute>
  } 
/>
```

**الوظيفة**:
- التأكد من تسجيل دخول المستخدم
- التحقق من اكتمال الملف الشخصي
- إعادة التوجيه للصفحات المناسبة

---

### المستوى 2️⃣: حماية الصلاحيات (Permission Guard)

```typescript
// استخدام RoleGuard لحماية المكونات
<RoleGuard requiredPermission="campaigns.manage">
  <CampaignSettings />
</RoleGuard>
```

**الوظيفة**:
- فحص صلاحية معينة
- إخفاء المحتوى إذا لم تتوفر الصلاحية
- إعادة التوجيه لصفحة Unauthorized

---

### المستوى 3️⃣: التحكم في واجهة المستخدم (UI Control)

```typescript
// src/apps/awareness/pages/campaigns/index.tsx
import { useCan } from '@/core/rbac';

function CampaignsPage() {
  const can = useCan();

  return (
    <>
      {/* عرض زر الإنشاء فقط للمصرح لهم */}
      {can('campaigns.create') && (
        <Button onClick={handleCreate}>
          إنشاء حملة جديدة
        </Button>
      )}

      {/* عرض زر التحرير فقط للمصرح لهم */}
      {can('campaigns.edit') && (
        <Button onClick={handleEdit}>
          تحرير
        </Button>
      )}

      {/* عرض زر الحذف فقط للمصرح لهم */}
      {can('campaigns.delete') && (
        <Button onClick={handleDelete}>
          حذف
        </Button>
      )}
    </>
  );
}
```

---

### المستوى 4️⃣: التحكم في قاعدة البيانات (Database RLS)

```sql
-- RLS Policy على جدول الحملات
CREATE POLICY "Users can view campaigns in their tenant"
ON awareness_campaigns
FOR SELECT
TO authenticated
USING (
  tenant_id = auth.tenant_id()
  OR
  public.has_role(auth.uid(), 'platform_admin')
);

CREATE POLICY "Only managers can create campaigns"
ON awareness_campaigns
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = auth.tenant_id()
  AND (
    public.has_role(auth.uid(), 'tenant_admin')
    OR public.has_role(auth.uid(), 'awareness_manager')
  )
);
```

**الحماية**:
- ✓ لا يمكن تجاوزها من Frontend
- ✓ تطبق على جميع الاستعلامات
- ✓ تحمي البيانات حتى في حالة ثغرات البرمجة

---

## تطبيق الصلاحيات في الكود

### 1️⃣ App Registry (تسجيل التطبيقات)

```typescript
// src/apps/awareness/config.ts
export const awarenessApp: AppModule = {
  id: 'awareness',
  name: 'Awareness',
  route: '/awareness',
  requiredPermission: 'app.awareness.access', // ✓ صلاحية للوصول للتطبيق
  features: [
    {
      id: 'campaigns',
      name: 'Campaigns',
      route: '/campaigns',
      requiredPermission: 'campaigns.view', // ✓ صلاحية لكل ميزة
      showInSidebar: true,
    },
    {
      id: 'settings',
      name: 'Settings',
      route: '/settings',
      requiredPermission: 'settings.manage', // ✓ صلاحيات مختلفة لميزات مختلفة
      showInSidebar: true,
    },
  ],
};
```

### 2️⃣ Dynamic Sidebar (القائمة الجانبية الديناميكية)

```typescript
// src/core/components/navigation/AppSidebar.tsx
export function AppSidebar() {
  const can = useCan();
  
  // ✓ جلب الميزات التي للمستخدم صلاحية الوصول لها فقط
  const sidebarFeatures = useSidebarFeatures(currentApp?.id || '');
  
  return (
    <Sidebar>
      {sidebarFeatures.map((feature) => (
        // ✓ يظهر فقط الميزات المصرح بها
        <SidebarMenuItem key={feature.id}>
          <NavLink to={feature.route}>
            {feature.name}
          </NavLink>
        </SidebarMenuItem>
      ))}
    </Sidebar>
  );
}
```

```typescript
// src/core/config/hooks/useAppRegistry.ts
export function useSidebarFeatures(appId: string): AppFeature[] {
  const can = useCan();
  
  return useMemo(() => {
    const features = getSidebarFeatures(appId);
    
    // ✓ تصفية الميزات حسب الصلاحيات
    return features.filter(feature => 
      can(feature.requiredPermission as any)
    );
  }, [appId, can]);
}
```

### 3️⃣ App Switcher (مبدل التطبيقات)

```typescript
// src/core/components/navigation/HeaderAppSwitcher.tsx
export function HeaderAppSwitcher() {
  // ✓ جلب التطبيقات المصرح بها فقط
  const availableApps = useAvailableApps();
  
  return (
    <DropdownMenu>
      {availableApps.map((app) => (
        <DropdownMenuItem onClick={() => navigate(app.route)}>
          {app.name}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
```

```typescript
// src/core/config/hooks/useAppRegistry.ts
export function useAvailableApps(): AppModule[] {
  const can = useCan();
  const allApps = useAllApps();

  return useMemo(() => {
    return allApps.filter(app => {
      // ✓ فقط التطبيقات النشطة
      if (app.status !== 'active') return false;
      
      // ✓ فحص صلاحية الوصول
      return can(app.requiredPermission as any);
    });
  }, [allApps, can]);
}
```

---

## أفضل الممارسات الأمنية

### ✅ ما يتم تطبيقه حالياً:

#### 1. **Defense in Depth** (الدفاع المتعدد الطبقات)
```
Frontend Guards → Backend Validation → Database RLS
```

#### 2. **Principle of Least Privilege** (أقل صلاحية ممكنة)
- كل دور لديه فقط الصلاحيات الضرورية
- لا صلاحيات إضافية غير مستخدمة

#### 3. **Separation of Concerns** (فصل المسؤوليات)
```
user_roles (منفصل) → roles.ts (تعريف) → hooks (استخدام)
```

#### 4. **Database-Driven** (مبني على قاعدة البيانات)
- الأدوار محفوظة في قاعدة البيانات
- لا أدوار ثابتة في الكود
- سهولة التعديل دون إعادة بناء التطبيق

#### 5. **Type Safety** (أمان الأنواع)
```typescript
// ✓ TypeScript Enums للأدوار
export type AppRole = 
  | 'platform_admin'
  | 'tenant_admin'
  | 'tenant_manager'
  | 'employee';

// ✓ يمنع الأخطاء الإملائية
const role: AppRole = 'admin'; // ✗ خطأ
const role: AppRole = 'tenant_admin'; // ✓ صحيح
```

---

### ⚠️ نقاط التحسين المطلوبة:

#### 1. **تجنب localStorage للصلاحيات**

❌ **الخطأ**:
```typescript
// NEVER DO THIS - يمكن التلاعب به!
const isAdmin = localStorage.getItem('isAdmin') === 'true';
```

✅ **الصحيح**:
```typescript
// دائماً من السيرفر
const { can } = useCan();
if (can('admin.access')) {
  // ...
}
```

#### 2. **تأمين Edge Functions**

```typescript
// supabase/functions/my-function/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // ✓ التحقق من JWT Token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ✓ فحص الصلاحيات
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ✓ فحص الدور
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (!roles?.some(r => r.role === 'admin')) {
    return new Response('Forbidden', { status: 403 });
  }

  // المنطق هنا...
});
```

#### 3. **Audit Logging** (تسجيل الأحداث)

```typescript
// تسجيل كل تغيير في الصلاحيات
await supabase.from('audit_log').insert({
  action: 'ROLE_ASSIGNED',
  actor: currentUser.id,
  entity_type: 'user_roles',
  entity_id: targetUser.id,
  payload: { role: 'tenant_admin', tenant_id: tenantId },
});
```

---

## تقييم النظام الحالي

### ✅ نقاط القوة

1. **معماري محكم**: استخدام RBAC كامل مع RLS
2. **قاعدة بيانات آمنة**: جدول منفصل للأدوار + RLS
3. **واجهة ديناميكية**: القوائم والأزرار تظهر حسب الصلاحيات
4. **قابل للتوسع**: سهولة إضافة أدوار وصلاحيات جديدة
5. **Multi-Tenant Ready**: دعم منصات متعددة

### 🔧 التحسينات المقترحة

1. **Permission Caching**:
   ```typescript
   // كاش الصلاحيات لتحسين الأداء
   const { data: permissions, isLoading } = useQuery({
     queryKey: ['permissions', user?.id],
     queryFn: fetchUserPermissions,
     staleTime: 5 * 60 * 1000, // 5 دقائق
   });
   ```

2. **Permission Testing**:
   ```typescript
   // اختبارات للصلاحيات
   describe('RBAC System', () => {
     it('should allow admin to create campaigns', () => {
       const admin = { role: 'tenant_admin' };
       expect(can('campaigns.create', admin)).toBe(true);
     });
     
     it('should deny employee from deleting campaigns', () => {
       const employee = { role: 'employee' };
       expect(can('campaigns.delete', employee)).toBe(false);
     });
   });
   ```

3. **Permission Documentation**:
   ```typescript
   // توثيق كل صلاحية
   export const PERMISSIONS = {
     'campaigns.create': {
       name: 'Create Campaign',
       nameAr: 'إنشاء حملة',
       description: 'Ability to create new awareness campaigns',
       risk: 'medium',
     },
     'users.delete': {
       name: 'Delete User',
       nameAr: 'حذف مستخدم',
       description: 'Ability to permanently delete users',
       risk: 'high',
     },
   };
   ```

---

## خلاصة

### ✅ الإجابة على أسئلتك:

1. **كيف تدار الشاشات؟**
   - كل تطبيق وميزة لها `requiredPermission`
   - يتم فحص الصلاحيات ديناميكياً باستخدام `useCan()`
   - القوائم والأزرار تظهر/تختفي حسب الصلاحيات

2. **أفضل الممارسات؟**
   - ✓ Defense in Depth (متعدد الطبقات)
   - ✓ Database RLS (حماية قاعدة البيانات)
   - ✓ Least Privilege (أقل صلاحية)
   - ✓ Type Safety (TypeScript)

3. **هل نطبقها في النظام؟**
   - ✅ نعم! النظام يطبق معظم أفضل الممارسات
   - ✅ معمارية RBAC كاملة
   - ✅ RLS على قاعدة البيانات
   - ✅ واجهة ديناميكية
   - 🔧 بعض التحسينات المقترحة للأداء والاختبار

---

## مراجع مفيدة

- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [RBAC vs ABAC](https://www.osohq.com/academy/rbac-vs-abac)

---

📌 **ملاحظة**: هذا النظام قابل للتطوير والتحسين المستمر حسب احتياجات المشروع.
