# إضافة الإعدادات المتقدمة لـ Gate-P Tenant Configuration

## نظرة عامة
تم إضافة إعدادات متقدمة جديدة لإدارة المستأجرين في Gate-P Console، تشمل:
- **حدود التخزين** (Storage Limits)
- **حدود استدعاء النظام** (API Rate Limits)
- **حصص البريد الإلكتروني** (Email Quotas)
- **العلامة التجارية المخصصة** (Custom Branding)

---

## 📊 Part 1: Database Schema

### الحقول المضافة إلى جدول `admin_settings`

#### 1️⃣ حدود التخزين (Storage Limits)
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `storage_limit_mb` | INTEGER | 5120 (5 GB) | الحد الأقصى للتخزين بالميجابايت |
| `storage_used_mb` | INTEGER | 0 | المساحة المستخدمة حالياً |

#### 2️⃣ حدود استدعاء النظام (API Rate Limits)
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `api_rate_limit_per_minute` | INTEGER | 100 | عدد الطلبات المسموح بها في الدقيقة |
| `api_rate_limit_per_hour` | INTEGER | 5000 | عدد الطلبات المسموح بها في الساعة |
| `api_unlimited` | BOOLEAN | false | هل الوصول غير محدود |

#### 3️⃣ حصص البريد الإلكتروني (Email Quotas)
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `email_quota_monthly` | INTEGER | 1000 | الحصة الشهرية من الرسائل |
| `email_used_current_month` | INTEGER | 0 | عدد الرسائل المستخدمة في الشهر الحالي |
| `email_quota_reset_date` | DATE | بداية الشهر القادم | تاريخ إعادة تعيين الحصة |

#### 4️⃣ العلامة التجارية المخصصة (Custom Branding)
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `branding_logo_url` | TEXT | NULL | رابط شعار المستأجر |
| `branding_primary_color` | TEXT | hsl(222.2 47.4% 11.2%) | اللون الأساسي بصيغة HSL |
| `branding_secondary_color` | TEXT | hsl(210 40% 96.1%) | اللون الثانوي بصيغة HSL |
| `branding_app_name` | TEXT | 'Romuz Awareness' | اسم التطبيق المخصص |
| `branding_support_email` | TEXT | NULL | بريد الدعم الفني |
| `branding_support_phone` | TEXT | NULL | هاتف الدعم الفني |

### Constraints المضافة
```sql
-- تأكد من أن القيم صحيحة
CHECK (storage_limit_mb > 0)
CHECK (storage_used_mb >= 0)
CHECK (api_rate_limit_per_minute > 0)
CHECK (api_rate_limit_per_hour > 0)
CHECK (email_quota_monthly > 0)
CHECK (email_used_current_month >= 0)
```

### Index المضاف
```sql
CREATE INDEX idx_admin_settings_tenant_id ON admin_settings(tenant_id);
```

---

## 🔧 Part 2: Edge Function Updates

### ملف: `supabase/functions/gate-p-tenant-settings/index.ts`

#### التحديثات على `SettingsRequest` Interface
```typescript
interface SettingsRequest {
  tenant_id: string;
  sla_config?: any;
  feature_flags?: any;
  limits?: any;
  notification_channels?: any;
  // Storage Limits
  storage_limit_mb?: number;
  storage_used_mb?: number;
  // API Rate Limits
  api_rate_limit_per_minute?: number;
  api_rate_limit_per_hour?: number;
  api_unlimited?: boolean;
  // Email Quotas
  email_quota_monthly?: number;
  email_used_current_month?: number;
  email_quota_reset_date?: string;
  // Custom Branding
  branding_logo_url?: string;
  branding_primary_color?: string;
  branding_secondary_color?: string;
  branding_app_name?: string;
  branding_support_email?: string;
  branding_support_phone?: string;
}
```

#### تحديثات على PUT Handler
- تم تحديث دالة `upsert` لدعم الحقول الجديدة
- جميع الحقول الجديدة اختيارية (optional)
- يتم إضافة الحقول فقط إذا كانت موجودة في الطلب

---

## 🎨 Part 3: TypeScript Types

### ملف: `src/integrations/supabase/gate-p.ts`

#### تحديثات على `TenantSettings` Interface
```typescript
export interface TenantSettings {
  id?: string;
  tenant_id?: string;
  sla_config: Record<string, any>;
  feature_flags: Record<string, any>;
  limits: Record<string, any>;
  notification_channels: Record<string, any>;
  // Storage Limits
  storage_limit_mb?: number;
  storage_used_mb?: number;
  // API Rate Limits
  api_rate_limit_per_minute?: number;
  api_rate_limit_per_hour?: number;
  api_unlimited?: boolean;
  // Email Quotas
  email_quota_monthly?: number;
  email_used_current_month?: number;
  email_quota_reset_date?: string;
  // Custom Branding
  branding_logo_url?: string;
  branding_primary_color?: string;
  branding_secondary_color?: string;
  branding_app_name?: string;
  branding_support_email?: string;
  branding_support_phone?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}
```

---

## 🖥️ Part 4: UI Components

### ملف: `src/features/gate-p/TenantSettingsPanel.tsx`

#### تحديثات على `SettingsForm` Interface
تم إضافة جميع الحقول الجديدة إلى الـ interface.

#### تحديثات على Form State
تم إضافة القيم الافتراضية:
- `storage_limit_mb`: 5120 (5 GB)
- `storage_used_mb`: 0
- `api_rate_limit_per_minute`: 100
- `api_rate_limit_per_hour`: 5000
- `api_unlimited`: false
- `email_quota_monthly`: 1000
- `email_used_current_month`: 0
- `branding_app_name`: 'Romuz Awareness'
- الألوان: القيم الافتراضية من الـ design system

#### Sections الجديدة في الواجهة

##### 1. حدود التخزين (Storage Limits)
- عرض الحد الأقصى والمستخدم بالميجابايت والجيجابايت
- حساب النسبة المئوية المستخدمة

##### 2. حدود استدعاء النظام (API Rate Limits)
- Switch لتفعيل "وصول غير محدود"
- حقول للحد الأقصى في الدقيقة والساعة (تظهر فقط إذا لم يكن غير محدود)

##### 3. حصص البريد الإلكتروني (Email Quotas)
- الحصة الشهرية
- المستخدم في الشهر الحالي مع النسبة المئوية
- تاريخ إعادة التعيين (date picker)

##### 4. العلامة التجارية المخصصة (Custom Branding)
- اسم التطبيق
- رابط الشعار
- بريد وهاتف الدعم
- الألوان الأساسية والثانوية (HSL format)
- معاينة الألوان (color preview boxes)

---

## 🔒 Security & Validation

### Frontend Validation
- جميع القيم الرقمية لها `min` attributes
- التحقق من صحة الألوان بصيغة HSL في frontend
- التحقق من صحة البريد الإلكتروني باستخدام `type="email"`
- التحقق من صحة الروابط باستخدام `type="url"`

### Backend Validation
- Database constraints تضمن صحة القيم الرقمية
- RLS policies تضمن أن فقط `super_admin` يستطيع التعديل
- Audit logging لجميع التحديثات

---

## 📝 Usage Examples

### مثال 1: تحديث حدود التخزين
```typescript
const settings = {
  storage_limit_mb: 10240, // 10 GB
  storage_used_mb: 2048,   // 2 GB used
};

await updateTenantSettings(tenantId, settings);
```

### مثال 2: تفعيل API غير محدود
```typescript
const settings = {
  api_unlimited: true,
};

await updateTenantSettings(tenantId, settings);
```

### مثال 3: تخصيص العلامة التجارية
```typescript
const settings = {
  branding_app_name: 'شركة الأمان الإلكتروني',
  branding_logo_url: 'https://example.com/logo.png',
  branding_primary_color: 'hsl(200 80% 50%)',
  branding_secondary_color: 'hsl(200 30% 90%)',
  branding_support_email: 'support@example.com',
  branding_support_phone: '+966 12 345 6789',
};

await updateTenantSettings(tenantId, settings);
```

---

## ✅ Testing Checklist

- [ ] التحقق من إضافة الحقول بنجاح في قاعدة البيانات
- [ ] اختبار GET request لاسترجاع الإعدادات
- [ ] اختبار PUT request لتحديث الإعدادات
- [ ] التحقق من عمل Password Protection
- [ ] التحقق من Audit Logging
- [ ] اختبار جميع الحقول في الواجهة
- [ ] التحقق من Validation (أرقام سالبة، ألوان غير صحيحة، إلخ)
- [ ] اختبار Color Preview
- [ ] اختبار حساب النسب المئوية
- [ ] التحقق من أن الإعدادات تُحفظ وتُحمّل بشكل صحيح

---

## 🚀 Future Enhancements

### مقترحات للتطوير المستقبلي:
1. **Storage Usage Tracking**: إضافة نظام لمراقبة استخدام التخزين تلقائياً
2. **API Rate Limiting Enforcement**: تطبيق الحدود فعلياً على API requests
3. **Email Quota Auto-Reset**: جدولة إعادة تعيين الحصة الشهرية تلقائياً
4. **Branding Preview**: معاينة كاملة للعلامة التجارية قبل الحفظ
5. **Logo Upload**: إضافة إمكانية رفع الشعار مباشرة بدلاً من رابط خارجي
6. **Color Picker**: إضافة color picker بدلاً من إدخال HSL يدوياً
7. **Settings History**: سجل تاريخ التغييرات على الإعدادات
8. **Bulk Operations**: تحديث إعدادات متعددة للمستأجرين دفعة واحدة
9. **Templates**: قوالب جاهزة للإعدادات (Basic, Professional, Enterprise)
10. **Alerts**: إشعارات تلقائية عند اقتراب المستأجر من الحدود

---

## 📁 Files Modified

### Database
- ✅ Migration: `supabase/migrations/[timestamp]_add_advanced_tenant_settings.sql`

### Backend
- ✅ `supabase/functions/gate-p-tenant-settings/index.ts`

### Frontend
- ✅ `src/integrations/supabase/gate-p.ts`
- ✅ `src/features/gate-p/TenantSettingsPanel.tsx`

### Documentation
- ✅ `docs/awareness/04_Execution/Advanced_Tenant_Settings.md` (هذا الملف)

---

## 🔎 Review Report

### Coverage
✅ تم تنفيذ جميع المتطلبات:
- ✅ حدود التخزين (Storage Limits)
- ✅ حدود استدعاء النظام (API Rate Limits)
- ✅ حصص البريد الإلكتروني (Email Quotas)
- ✅ العلامة التجارية المخصصة (Custom Branding)

### Technical Decisions
1. **HSL Colors**: تم استخدام HSL بدلاً من Hex لسهولة التكامل مع Design System
2. **Optional Fields**: جميع الحقول الجديدة اختيارية للحفاظ على backward compatibility
3. **Validation**: تم تطبيق validation على مستوى Database و Frontend
4. **No Constraints on Colors**: تم إزالة regex constraint على الألوان من Database لتجنب مشاكل البيانات الموجودة

### Warnings
⚠️ **Email Quota Reset**: لا يوجد حالياً نظام تلقائي لإعادة تعيين حصة البريد الإلكتروني. يجب إضافة Cron Job أو Scheduled Function لاحقاً.

⚠️ **API Rate Limiting**: الحدود المُعرّفة هنا للتوثيق فقط. لا يوجد حالياً middleware يفرض هذه الحدود على الطلبات الفعلية.

⚠️ **Storage Tracking**: حقل `storage_used_mb` يجب تحديثه يدوياً أو عبر نظام tracking منفصل.

---

## 📊 Summary

تمت إضافة **13 حقل جديد** إلى جدول `admin_settings` لدعم إعدادات متقدمة شاملة لإدارة المستأجرين في Gate-P Console.

جميع الإعدادات:
- ✅ محمية بـ Password Protection
- ✅ مسجلة في Audit Log
- ✅ متاحة فقط لـ `super_admin`
- ✅ موثقة بالكامل

**التاريخ**: 2025-11-13  
**المطوّر**: Lovable AI  
**الحالة**: ✅ مكتمل
