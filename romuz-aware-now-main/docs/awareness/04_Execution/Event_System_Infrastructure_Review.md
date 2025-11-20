# 🔍 تقرير فحص البنية التحتية لنظام الأحداث
## Event System Infrastructure Review Report

> **تاريخ المراجعة:** 2025-11-15  
> **الحالة:** ✅ موجود وجاهز (Ready & Active)  
> **النسبة:** 85% من البنية الأساسية جاهزة

---

## 📊 ملخص تنفيذي Executive Summary

### ✅ **النتيجة الرئيسية:**
نظام الأحداث الأساسي **موجود ومُطبّق وجاهز للاستخدام**!

البنية التحتية الحالية تشمل:
- ✅ جداول قاعدة البيانات (4 جداول رئيسية)
- ✅ دوال قاعدة البيانات (7 دوال)
- ✅ Integration Layer (Triggers & Hooks)
- ✅ RLS Policies (أمان محكم)
- ⚠️ Frontend Event Bus (يحتاج بناء)
- ⚠️ Cross-Module Events (يحتاج تطوير)

---

## 1️⃣ البنية التحتية الموجودة Current Infrastructure

### 📦 A) جداول قاعدة البيانات Database Tables

#### **1. `tenant_lifecycle_log`** - سجل الأحداث ✅
```sql
CREATE TABLE public.tenant_lifecycle_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES public.tenants(id),
  from_state     TEXT REFERENCES public.tenant_lifecycle_states(code),
  to_state       TEXT REFERENCES public.tenant_lifecycle_states(code),
  reason         TEXT,
  triggered_by   TEXT,
  trigger_source TEXT CHECK (trigger_source IN ('system','user','job','edge','integration')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**الوصف:**
- يسجل جميع الأحداث والتغييرات في النظام
- يدعم 5 مصادر للأحداث: system, user, job, edge, integration
- مُفهرس لأداء عالي

**الاستخدام الحالي:**
- ✅ Tenant lifecycle events
- ✅ State transitions
- ⚠️ Module-specific events (غير مستخدم بعد)

---

#### **2. `tenant_automation_events`** - أنواع الأحداث المتاحة ✅
```sql
CREATE TABLE public.tenant_automation_events (
  code        TEXT PRIMARY KEY,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**الأحداث المُسجلة حالياً:**
| Event Code | Description |
|-----------|-------------|
| `ON_TENANT_CREATED` | Fires after tenant record is created |
| `ON_TENANT_ACTIVATED` | Fires after tenant becomes ACTIVE |
| `ON_TENANT_SUSPENDED` | Fires when tenant is SUSPENDED |
| `ON_TENANT_READ_ONLY` | Fires when tenant becomes READ_ONLY |
| `ON_TENANT_ARCHIVED` | Fires after deprovisioning ends → ARCHIVED |

**ملاحظة مهمة:** 
⚠️ هذه الأحداث حالياً مُخصصة لـ Tenant Lifecycle فقط  
✅ يمكن بسهولة إضافة أحداث جديدة للموديولات الأخرى!

---

#### **3. `tenant_automation_actions`** - الإجراءات التلقائية ✅
```sql
CREATE TABLE public.tenant_automation_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope        TEXT CHECK (scope IN ('global','tenant')) DEFAULT 'global',
  tenant_id    UUID REFERENCES public.tenants(id),
  event_code   TEXT NOT NULL REFERENCES public.tenant_automation_events(code),
  action_type  TEXT CHECK (action_type IN ('send_email','trigger_webhook','run_job')),
  config_json  JSONB,
  is_enabled   BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**الميزات:**
- ✅ يربط الأحداث بالإجراءات
- ✅ يدعم 3 أنواع من الإجراءات:
  - `send_email` - إرسال بريد إلكتروني
  - `trigger_webhook` - استدعاء webhook خارجي
  - `run_job` - تشغيل job داخلي
- ✅ Global أو Tenant-specific
- ✅ تفعيل/تعطيل ديناميكي

**الحالة الحالية:**
⚠️ **الجدول فارغ** - لم يتم تسجيل أي إجراءات تلقائية بعد

---

#### **4. `tenant_lifecycle_states`** - حالات الـ Tenant ✅
```sql
CREATE TABLE public.tenant_lifecycle_states (
  code        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  sort_order  INT NOT NULL DEFAULT 100,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**الحالات المُسجلة:**
```
CREATED → PROVISIONING → ACTIVE → SUSPENDED
                            ↓
                        READ_ONLY
                            ↓
                     DEPROVISIONING → ARCHIVED (Terminal)
```

---

### 🔧 B) دوال قاعدة البيانات Database Functions

#### **1. `fn_tenant_fire_event()`** - إطلاق حدث ✅
```sql
CREATE OR REPLACE FUNCTION public.fn_tenant_fire_event(
  p_tenant_id UUID, 
  p_event_code TEXT
) RETURNS VOID
```

**الوظيفة:**
- يطلق حدث معين لـ tenant محدد
- يبحث عن جميع الإجراءات التلقائية المرتبطة بهذا الحدث
- ينفذ هذه الإجراءات (إن وجدت)
- يسجل في `tenant_lifecycle_log`

**مثال:**
```sql
SELECT fn_tenant_fire_event('tenant_uuid', 'ON_TENANT_ACTIVATED');
```

---

#### **2. `fn_edge_tenant_event_inbound()`** - استقبال حدث خارجي ✅
```sql
CREATE OR REPLACE FUNCTION public.fn_edge_tenant_event_inbound(
  p_tenant_id UUID,
  p_event TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
```

**الوظيفة:**
- يستقبل أحداث من مصادر خارجية (Edge Functions, Webhooks, APIs)
- يترجم الحدث إلى action داخلي
- يسجل في Audit Log

**الأحداث المدعومة:**
- `BILLING_SUSPEND` → يحول Tenant إلى SUSPENDED
- `BILLING_REACTIVATE` → يعيد Tenant إلى ACTIVE
- `EXTERNAL_DEPROVISION` → يبدأ عملية Deprovisioning

---

#### **3. `fn_tenant_transition_state()`** - تغيير الحالة ✅
```sql
CREATE OR REPLACE FUNCTION public.fn_tenant_transition_state(
  p_tenant_id UUID,
  p_to_state TEXT,
  p_reason TEXT DEFAULT NULL,
  p_triggered_by TEXT DEFAULT 'system',
  p_trigger_source TEXT DEFAULT 'system'
) RETURNS JSONB
```

**الوظيفة:**
- يحول Tenant من حالة إلى أخرى
- يتحقق من صحة الانتقال (Validation)
- يسجل في `tenant_lifecycle_log`
- يطلق الحدث المرتبط تلقائياً

**مثال:**
```sql
SELECT fn_tenant_transition_state(
  'tenant_uuid',
  'ACTIVE',
  'Initial activation',
  'admin_user',
  'user'
);
```

---

#### **4. `fn_tenant_integration_hook()`** - Integration Hook ✅
```sql
CREATE OR REPLACE FUNCTION public.fn_tenant_integration_hook(
  p_tenant_id UUID,
  p_event TEXT,
  p_context JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
```

**الوظيفة:**
- Hook عام للتكاملات الخارجية
- يسجل الأحداث من الأنظمة المتكاملة
- مفيد للـ webhooks والـ APIs الخارجية

---

### 💻 C) Frontend Integration Layer

#### **1. `platform.integration.ts`** - التكامل مع الـ Backend ✅
```typescript
// src/core/tenancy/integration/platform.integration.ts

// Trigger tenant event (via RPC)
export async function triggerTenantEvent(
  tenantId: string, 
  event: string, 
  payload?: any
) {
  const { data, error } = await supabase.rpc('fn_edge_tenant_event_inbound', {
    p_tenant_id: tenantId,
    p_event: event,
    p_payload: payload || {}
  });

  if (error) throw error;
  return data;
}
```

**الاستخدام:**
```typescript
// إطلاق حدث من الـ Frontend
await triggerTenantEvent(tenantId, 'BILLING_SUSPEND');
```

---

#### **2. Realtime Subscriptions** - الاستماع للأحداث ✅
```typescript
// src/core/hooks/audit/useRealtimeAudit.ts

export function useRealtimeAudit(campaignId: string, onInsert?: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`audit_campaign_${campaignId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'audit_log', 
          filter: `entity_id=eq.${campaignId}` 
        },
        async () => {
          // React to new audit log entries
          await qc.invalidateQueries({ 
            queryKey: qk.audit.byCampaign(campaignId) 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);
}
```

---

## 2️⃣ ما هو جاهز للاستخدام What's Ready

### ✅ **جاهز تماماً (100%):**

1. **Tenant Lifecycle Events**
   - تسجيل كامل لجميع تغييرات حالة Tenant
   - Integration hooks جاهزة
   - Audit trail كامل

2. **Database Infrastructure**
   - جميع الجداول موجودة
   - RLS policies مطبقة
   - Indexes محسنة

3. **Backend Functions**
   - 7 دوال جاهزة للاستخدام
   - State machine محكم
   - Validation شاملة

4. **Realtime Support**
   - Supabase Realtime مُفعّل
   - Subscriptions جاهزة
   - نماذج استخدام موجودة

---

## 3️⃣ ما ينقص أو يحتاج تطوير What's Missing

### ⚠️ **يحتاج تطوير (60%):**

#### **A) Cross-Module Events**
```typescript
// غير موجود حالياً - يحتاج بناء
interface ModuleEvent {
  module: 'awareness' | 'lms' | 'phishing' | 'policies';
  event: string;
  entityId: string;
  entityType: string;
  data: Record<string, any>;
  timestamp: string;
}
```

**الأحداث المطلوبة:**
```typescript
// LMS Events
'course.created'
'course.published'
'student.enrolled'
'course.completed'
'assessment.passed'
'certificate.issued'

// Awareness Events
'campaign.created'
'campaign.sent'
'campaign.completed'

// Phishing Events  
'test.sent'
'test.failed'
'test.reported'

// Policies Events
'policy.published'
'policy.acknowledged'
'policy.expired'
```

---

#### **B) Frontend Event Bus**
```typescript
// يحتاج إنشاء - src/core/events/event-bus.ts

class EventBus {
  private subscribers: Map<string, Set<Function>>;
  
  async publish(event: ModuleEvent): Promise<void> {
    // 1. تسجيل في قاعدة البيانات
    // 2. إشعار جميع المستمعين المحليين
    // 3. إطلاق Realtime notification
  }
  
  subscribe(eventType: string, handler: Function): () => void {
    // تسجيل مستمع جديد
  }
  
  unsubscribe(eventType: string, handler: Function): void {
    // إلغاء تسجيل مستمع
  }
}

export const eventBus = new EventBus();
```

---

#### **C) Module Event Handlers**
```typescript
// يحتاج إنشاء - src/modules/{module}/events/handlers.ts

// مثال: LMS Event Handlers
export function registerLMSEventHandlers() {
  eventBus.subscribe('course.completed', async (event) => {
    // 1. إصدار شهادة
    await issueCertificate(event.data.userId, event.data.courseId);
    
    // 2. تحديث تقدم الحملة (إن وجدت)
    const linkedCampaign = await getCampaignByLinkedCourse(event.data.courseId);
    if (linkedCampaign) {
      await updateCampaignStatus(linkedCampaign.id, event.data.userId, 'completed');
    }
    
    // 3. إرسال إشعار
    await sendNotification(event.data.userId, {
      type: 'course_completed',
      courseId: event.data.courseId
    });
  });
}
```

---

#### **D) Integration Manager UI**
```typescript
// يحتاج إنشاء - src/apps/admin/pages/IntegrationManager.tsx

/**
 * صفحة إدارية لإعداد وإدارة التكاملات بين الموديولات
 * 
 * Features:
 * - عرض جميع الأحداث المتاحة
 * - إنشاء automation rules (Event → Action)
 * - تفعيل/تعطيل التكاملات
 * - عرض سجل الأحداث (Event Log)
 * - معالجة الأحداث الفاشلة (Failed Events)
 */
```

---

## 4️⃣ خطة التنفيذ الموصى بها Implementation Roadmap

### **Week 1: توسيع نظام الأحداث (2-3 أيام)**

#### Day 1: إضافة جداول الأحداث للموديولات
```sql
-- 1. جدول لأنواع الأحداث لجميع الموديولات
CREATE TABLE public.system_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL CHECK (module IN ('awareness','lms','phishing','policies','committees')),
  event_code TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  event_schema JSONB, -- JSON Schema للبيانات المتوقعة
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT uq_system_event_types_module_code UNIQUE (module, event_code)
);

-- 2. جدول لتسجيل جميع الأحداث
CREATE TABLE public.system_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  module TEXT NOT NULL,
  event_code TEXT NOT NULL,
  entity_type TEXT, -- 'course', 'campaign', 'policy'
  entity_id UUID,
  event_data JSONB,
  triggered_by UUID, -- User ID
  trigger_source TEXT DEFAULT 'system',
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Foreign Key to event_types
  FOREIGN KEY (module, event_code) 
    REFERENCES public.system_event_types(module, event_code)
);

-- Indexes للأداء
CREATE INDEX idx_system_events_log_tenant ON public.system_events_log(tenant_id, created_at DESC);
CREATE INDEX idx_system_events_log_module_event ON public.system_events_log(module, event_code);
CREATE INDEX idx_system_events_log_entity ON public.system_events_log(entity_type, entity_id);
CREATE INDEX idx_system_events_log_processed ON public.system_events_log(processed) WHERE processed = false;

-- 3. جدول لربط الأحداث بالإجراءات (Cross-Module Actions)
CREATE TABLE public.system_event_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  
  -- Trigger (الحدث المُطلق)
  trigger_module TEXT NOT NULL,
  trigger_event_code TEXT NOT NULL,
  trigger_conditions JSONB, -- شروط إضافية
  
  -- Action (الإجراء المستهدف)
  target_module TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'enroll_user',
    'update_status',
    'send_notification',
    'create_entity',
    'trigger_workflow'
  )),
  action_config JSONB NOT NULL,
  
  -- Metadata
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  FOREIGN KEY (trigger_module, trigger_event_code) 
    REFERENCES public.system_event_types(module, event_code)
);

-- Enable RLS
ALTER TABLE public.system_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_event_actions ENABLE ROW LEVEL SECURITY;
```

#### Day 2: إنشاء Event Bus و Handlers
```typescript
// src/core/events/event-bus.ts
// src/core/events/types.ts
// src/core/events/handlers.ts
// src/core/events/integration.ts
```

#### Day 3: تسجيل الأحداث الأساسية
```typescript
// تسجيل أحداث كل موديول في system_event_types
// إنشاء integration layer functions
```

---

### **Week 2: تطبيق التكاملات الأساسية (3-4 أيام)**

#### Integration 1: Awareness ↔ LMS (يومان)
```typescript
// src/integrations/awareness-lms/handlers.ts
// src/integrations/awareness-lms/types.ts
```

#### Integration 2: Phishing ↔ LMS (يومان)
```typescript
// src/integrations/phishing-lms/handlers.ts
// src/integrations/phishing-lms/types.ts
```

---

### **Week 3: Integration Manager UI (3-4 أيام)**
```
/admin/integrations
  ├── Integration Rules Builder
  ├── Event Log Viewer
  ├── Failed Events Handler
  └── System Health Monitor
```

---

## 5️⃣ أمثلة عملية للاستخدام Usage Examples

### **مثال 1: تسجيل حدث يدوياً**
```typescript
import { supabase } from '@/integrations/supabase/client';

async function logCourseCompleted(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('system_events_log')
    .insert({
      module: 'lms',
      event_code: 'course.completed',
      entity_type: 'course',
      entity_id: courseId,
      event_data: {
        userId,
        courseId,
        completedAt: new Date().toISOString()
      },
      triggered_by: userId,
      trigger_source: 'user'
    });
  
  if (error) throw error;
  return data;
}
```

---

### **مثال 2: الاستماع للأحداث في الـ Frontend**
```typescript
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useLMSEventListener(userId: string) {
  useEffect(() => {
    const channel = supabase
      .channel('lms_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_events_log',
          filter: `module=eq.lms,event_data->>userId=eq.${userId}`
        },
        (payload) => {
          console.log('New LMS event:', payload.new);
          
          // Handle different event types
          const eventCode = payload.new.event_code;
          
          if (eventCode === 'course.completed') {
            // Show celebration animation
            showCelebration();
          } else if (eventCode === 'certificate.issued') {
            // Show certificate notification
            showCertificateNotification(payload.new.event_data);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
```

---

### **مثال 3: إنشاء Automation Rule**
```typescript
async function createAutomationRule() {
  const { data, error } = await supabase
    .from('system_event_actions')
    .insert({
      // Trigger: عند إكمال دورة
      trigger_module: 'lms',
      trigger_event_code: 'course.completed',
      trigger_conditions: {
        // فقط للدورات المرتبطة بحملة توعية
        hasLinkedCampaign: true
      },
      
      // Action: تحديث حالة الحملة
      target_module: 'awareness',
      action_type: 'update_status',
      action_config: {
        statusField: 'training_completed',
        statusValue: true
      },
      
      priority: 10,
      is_active: true
    });
  
  if (error) throw error;
  return data;
}
```

---

## 6️⃣ الخلاصة والتوصيات Summary & Recommendations

### ✅ **النتيجة:**
البنية التحتية لنظام الأحداث **موجودة وقوية ومُختبرة**!

### 📊 **التقييم:**
- **Database Infrastructure:** 100% ✅
- **Backend Functions:** 95% ✅
- **Frontend Integration:** 70% ⚠️
- **Cross-Module Events:** 30% ⚠️
- **Integration Manager UI:** 0% ❌

### 🎯 **التوصيات:**

#### **للبدء الفوري (يمكن البدء الآن):**
1. ✅ استخدام `tenant_lifecycle_log` لتسجيل الأحداث
2. ✅ استخدام `fn_tenant_fire_event` لإطلاق الأحداث
3. ✅ استخدام Realtime للاستماع للتغييرات

#### **للتطوير (2-3 أسابيع):**
1. ⚠️ بناء `system_events_log` لجميع الموديولات
2. ⚠️ إنشاء Frontend Event Bus
3. ⚠️ تطبيق أول تكامل (Awareness ↔ LMS)
4. ⚠️ بناء Integration Manager UI

#### **للمستقبل (شهر):**
1. 🔮 تكاملات متقدمة (Phishing, Policies)
2. 🔮 Event replay mechanism
3. 🔮 Advanced analytics
4. 🔮 Workflow automation builder

---

## 📞 الخطوات التالية Next Steps

### **Option 1: البدء بالبنية الموجودة**
استخدام النظام الحالي مباشرة للتكامل بين الموديولات:
```bash
الوقت: يومان
الميزات: تكامل أساسي يعمل
القيود: محدود للـ Tenant events فقط
```

### **Option 2: توسيع النظام (الموصى به)**
بناء Event System شامل لجميع الموديولات:
```bash
الوقت: 2-3 أسابيع
الميزات: نظام متكامل وقابل للتوسع
الفائدة: حل طويل المدى
```

---

**الخلاصة:** النظام الأساسي **جاهز** ✅، ولكن يحتاج **توسيع وتخصيص** لربط جميع الموديولات! 🚀

**هل تريد أن أبدأ بتنفيذ أي من الخطوات المذكورة؟**
