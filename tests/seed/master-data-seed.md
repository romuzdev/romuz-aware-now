# Master Data Seed Script

## الاستخدام

### الطريقة 1: تشغيل Script مباشرة (بعد تسجيل دخولك في التطبيق)

```bash
npm run seed:master-data
```

أو:

```bash
tsx tests/seed/master-data-seed.ts
```

### الطريقة 2: تنفيذ SQL يدوياً (عبر Backend > SQL Editor)

بعد تسجيل دخولك في التطبيق، افتح Backend واستخدم هذا الـ SQL:

```sql
-- =========================================
-- S1.1) كتالوجات تجريبية (GLOBAL + TENANT)
-- =========================================
-- TENANT catalog
insert into public.ref_catalogs (code, label_ar, label_en, scope, tenant_id, status, version, meta, created_by, updated_by)
values
  ('AWARE_TAGS', 'وسوم التوعية', 'Awareness Tags', 'TENANT', app_current_tenant_id(), 'DRAFT', 1, '{}'::jsonb, app_current_user_id(), app_current_user_id())
on conflict (code, scope, coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)) do nothing;

-- GLOBAL catalog
insert into public.ref_catalogs (code, label_ar, label_en, scope, tenant_id, status, version, meta, created_by, updated_by)
values
  ('RISK_CATEGORIES', 'تصنيفات المخاطر', 'Risk Categories', 'GLOBAL', null, 'DRAFT', 1, '{}'::jsonb, app_current_user_id(), app_current_user_id())
on conflict (code, scope, coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)) do nothing;

-- =========================================
-- S1.2) Terms للمثالين
-- =========================================
with ids as (
  select
    (select id from public.ref_catalogs where code='AWARE_TAGS' and tenant_id = app_current_tenant_id() limit 1) as aware_catalog_id,
    (select id from public.ref_catalogs where code='RISK_CATEGORIES' and tenant_id is null limit 1) as risk_catalog_id
)
-- AWARE_TAGS (TENANT)
insert into public.ref_terms (catalog_id, parent_id, code, label_ar, label_en, sort_order, active, attrs, created_by, updated_by)
select aware_catalog_id, null, x.code, x.label_ar, x.label_en, x.sort_order, x.active, '{}'::jsonb, app_current_user_id(), app_current_user_id()
from ids,
     (values
       ('PHISH', 'تصيّد', 'Phishing', 10, true),
       ('PWD',   'كلمة مرور', 'Password', 20, true),
       ('MFA',   'تحقق متعدد', 'MFA', 30, true)
     ) as x(code,label_ar,label_en,sort_order,active)
where ids.aware_catalog_id is not null
on conflict (catalog_id, code) do nothing;

-- RISK_CATEGORIES (GLOBAL)
with ids as (
  select (select id from public.ref_catalogs where code='RISK_CATEGORIES' and tenant_id is null limit 1) as risk_catalog_id
)
insert into public.ref_terms (catalog_id, parent_id, code, label_ar, label_en, sort_order, active, attrs, created_by, updated_by)
select risk_catalog_id, null, x.code, x.label_ar, x.label_en, x.sort_order, x.active, '{}'::jsonb, app_current_user_id(), app_current_user_id()
from ids,
     (values
       ('OP', 'تشغيلي', 'Operational', 10, true),
       ('CY', 'سيبراني', 'Cyber',       20, true),
       ('CM', 'امتثال',  'Compliance',  30, true)
     ) as x(code,label_ar,label_en,sort_order,active)
where ids.risk_catalog_id is not null
on conflict (catalog_id, code) do nothing;

-- =========================================
-- S1.3) Mapping مثال
-- =========================================
insert into public.ref_mappings (catalog_id, term_id, source_system, src_code, target_code, notes, created_by)
select c.id, null, 'Odoo', 'AWARE_TAGS', 'AWARE_TAGS', 'Mirror code', app_current_user_id()
from public.ref_catalogs c
where c.code='AWARE_TAGS' and c.tenant_id = app_current_tenant_id()
on conflict (catalog_id, coalesce(term_id, '00000000-0000-0000-0000-000000000000'::uuid), source_system, src_code) do nothing;

-- =========================================
-- S1.4) Saved View
-- =========================================
insert into public.md_saved_views (id, tenant_id, entity_type, view_name, description_ar, filters, sort_config, is_default, is_shared, owner_id)
values (
  gen_random_uuid(), 
  app_current_tenant_id(), 
  'ref_terms', 
  'منظور افتراضي', 
  'فلترة بسيطة', 
  '{"active":true}'::jsonb, 
  '{"orderBy":"sort_order","orderDir":"asc"}'::jsonb, 
  true, 
  true, 
  app_current_user_id()
)
on conflict do nothing;
```

## البيانات المُضافة

### Catalogs
1. **AWARE_TAGS** (TENANT) - وسوم التوعية
2. **RISK_CATEGORIES** (GLOBAL) - تصنيفات المخاطر

### Terms
#### AWARE_TAGS:
- PHISH - تصيّد
- PWD - كلمة مرور
- MFA - تحقق متعدد

#### RISK_CATEGORIES:
- OP - تشغيلي
- CY - سيبراني
- CM - امتثال

### Mappings
- AWARE_TAGS → Odoo mapping

### Saved Views
- منظور افتراضي - للمصطلحات النشطة

## ملاحظات

⚠️ **مهم:** يجب أن تكون مسجل دخول في التطبيق قبل تشغيل الـ script لأن الـ audit triggers تحتاج session مصادق.

📝 **نصيحة:** إذا واجهت أخطاء RLS، تأكد أنك مسجل دخول بحساب له صلاحيات كافية (tenant_admin أو platform_admin).
