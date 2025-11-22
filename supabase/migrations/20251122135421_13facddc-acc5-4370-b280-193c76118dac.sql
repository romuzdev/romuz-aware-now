-- حذف جداول grc_third_party_* غير المستخدمة
-- الاحتفاظ بنظام vendors system فقط

-- حذف الجداول بالترتيب الصحيح (من الأصغر للأكبر)
DROP TABLE IF EXISTS public.grc_third_party_due_diligence CASCADE;
DROP TABLE IF EXISTS public.grc_third_party_risk_assessments CASCADE;
DROP TABLE IF EXISTS public.grc_third_party_vendors CASCADE;

-- تعليق: تم حذف النظام المتوازي وتوحيد البيانات في vendors system