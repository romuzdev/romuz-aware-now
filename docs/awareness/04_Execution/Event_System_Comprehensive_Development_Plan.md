# خطة التطوير الشاملة لنظام الأحداث | Event System Comprehensive Development Plan

**التاريخ:** 2025-11-15  
**الإصدار:** v1.0  
**الحالة:** 🎯 **خطة معتمدة للتنفيذ**  
**المرجع:** `Platform_Expansion_Plan_v1.0.md` | `Architecture.md`  
**التوافق:** 100% مع الهيكل المعماري للمنصة

---

## 📋 فهرس المحتويات

1. [نظرة عامة تنفيذية](#executive-summary)
2. [رؤية Event System](#vision)
3. [التكامل مع البنية المعمارية](#architecture-integration)
4. [البنية التقنية المقترحة](#technical-architecture)
5. [خطة التنفيذ](#implementation-plan)
6. [الفوائد والقيمة](#benefits)
7. [المخاطر والتخفيف](#risks)
8. [المراجع](#references)

---

## 🎯 نظرة عامة تنفيذية {#executive-summary}

### الهدف الاستراتيجي
تطوير **نظام أحداث موحد ومتقدم** (Unified Event System) يربط جميع طبقات وتطبيقات منصة Romuz بشكل احترافي، مما يمكّن من:

- ✅ **تكامل سلس** بين جميع التطبيقات (Awareness, LMS, Phishing, GRC)
- ✅ **أتمتة ذكية** للعمليات عبر الأنظمة المختلفة
- ✅ **مراقبة شاملة** لجميع الأنشطة في الوقت الفعلي
- ✅ **مرونة عالية** لإضافة تطبيقات جديدة دون تعديل الأنظمة الموجودة

### الحالة الراهنة ✅
```
✅ البنية التحتية موجودة (Tenant Lifecycle Events)
✅ 4 جداول قاعدة بيانات جاهزة
✅ 7 دوال خلفية (Backend Functions) جاهزة
✅ تكامل أمامي (Frontend Integration) جاهز
```

### النطاق المطلوب 🎯
```
🎯 توسيع النظام ليشمل جميع الطبقات الثلاث
🎯 ربط 5+ تطبيقات ببعضها
🎯 دعم 50+ نوع حدث مختلف
🎯 واجهة إدارة متقدمة للـ Admin
```

---

## 🔭 رؤية Event System {#vision}

### التعريف
**Event System** هو نظام مركزي يعمل كـ "**Nervous System**" للمنصة بأكملها، حيث:

```
┌─────────────────────────────────────────────────────────────┐
│            Event System = Central Nervous System            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📡 يستقبل الأحداث من جميع الأنظمة                         │
│  🔄 يعالج ويحول الأحداث                                    │
│  📢 ينشر الأحداث للمستمعين المهتمين                        │
│  📊 يسجل ويراقب جميع الأحشطة                               │
│  🤖 ينفذ الأتمتة والإجراءات التلقائية                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### المبادئ الأساسية

#### 1️⃣ Event-First Architecture
كل عملية مهمة تُنتج حدث (Event):
```typescript
// مثال: إتمام موظف لدورة تدريبية
EVENT: 'lms.course.completed'
PAYLOAD: {
  userId: 'user_123',
  courseId: 'course_456',
  score: 95,
  timestamp: '2025-11-15T10:30:00Z'
}

// يؤدي تلقائياً إلى:
→ Awareness: تسجيل نقاط في Impact Score
→ Certificates: إصدار شهادة
→ Reports: تحديث تقارير الأداء
→ Notifications: إرسال تهنئة للموظف
```

#### 2️⃣ Loose Coupling (الارتباط المرن)
الأنظمة لا تعرف بعضها مباشرة:
```
❌ WRONG:  LMS → يستدعي Awareness مباشرة
✅ CORRECT: LMS → ينشر حدث → Awareness يستمع للحدث
```

#### 3️⃣ Scalability & Extensibility
إضافة تطبيق جديد = الاستماع للأحداث الموجودة فقط:
```
// تطبيق جديد: Gamification
gamification.subscribe('lms.course.completed', (event) => {
  // منح نقاط وشارات للموظف
  awardPoints(event.userId, 100);
  awardBadge(event.userId, 'course-master');
});
```

---

## 🏗️ التكامل مع البنية المعمارية {#architecture-integration}

استناداً للهيكل المعماري المعتمد، سيتم دمج Event System في **جميع الطبقات الثلاث**:

### 1️⃣ Core Platform Layer Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                         Core Platform                           │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│   Auth   │   User   │   RBAC   │ Tenancy  │  Shared  │   Integr.│
│          │   Mgmt   │          │          │ Services │          │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘
     │          │          │          │          │          │
     └──────────┴──────────┴──────────┴──────────┴──────────┘
                              ↓
                    ┌─────────────────────┐
                    │   EVENT SYSTEM      │
                    │   (Core Service)    │
                    └─────────────────────┘
```

#### موقع Event System في Core
```
src/core/
├── services/
│   ├── eventSystem/                    ← 🆕 Event System
│   │   ├── index.ts
│   │   ├── eventBus.ts                 # Core Event Bus
│   │   ├── eventLogger.ts              # Event Logging
│   │   ├── eventHandlers.ts            # Global Handlers
│   │   ├── eventTypes.ts               # Type Definitions
│   │   └── eventSubscriptions.ts       # Subscription Manager
│   ├── documentService.ts
│   ├── auditService.ts
│   └── ...
```

#### أحداث Core Platform
```typescript
// Authentication Events
'auth.user.login'
'auth.user.logout'
'auth.user.password_changed'
'auth.mfa.enabled'

// User Management Events
'user.created'
'user.updated'
'user.deactivated'
'user.role_changed'

// RBAC Events
'rbac.permission.granted'
'rbac.permission.revoked'
'rbac.role.assigned'

// Tenancy Events (موجودة ✅)
'tenant.created'
'tenant.activated'
'tenant.suspended'
'tenant.deprovisioned'
```

---

### 2️⃣ Application Modules Layer Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Modules                         │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│Documents │ Reports  │  Alerts  │ Content  │       KPIs        │
│          │          │          │   Hub    │                   │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────────────┘
     │          │          │          │          │
     └──────────┴──────────┴──────────┴──────────┘
                       ↓
              ┌─────────────────────┐
              │   EVENT SYSTEM      │
              │   (Shared Module)   │
              └─────────────────────┘
```

#### أحداث Modules
```typescript
// Documents Module Events
'documents.document.created'
'documents.document.published'
'documents.document.archived'
'documents.version.uploaded'

// Reports Module Events
'reports.report.generated'
'reports.report.scheduled'
'reports.export.completed'

// Alerts Module Events (موجودة ✅)
'alerts.policy.triggered'
'alerts.notification.sent'
'alerts.threshold.exceeded'

// Content Hub Events
'content.published'
'content.updated'
'content.viewed'

// KPIs Module Events
'kpis.target.achieved'
'kpis.target.missed'
'kpis.metric.updated'
```

---

### 3️⃣ Applications Layer Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                         Applications                            │
├──────────┬──────────┬──────────┬──────────┬───────────────────┤
│Awareness │ Phishing │   LMS    │   GRC    │  Other Apps       │
│          │Simulator │          │          │                   │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────────────┘
     │          │          │          │          │
     └──────────┴──────────┴──────────┴──────────┘
                       ↓
              ┌─────────────────────┐
              │   EVENT SYSTEM      │
              │  (App Connector)    │
              └─────────────────────┘
```

#### أحداث Applications

**Awareness App Events:**
```typescript
'awareness.campaign.created'
'awareness.campaign.started'
'awareness.campaign.completed'
'awareness.participant.invited'
'awareness.participant.completed'
'awareness.feedback.submitted'
'awareness.impact_score.calculated'
```

**LMS App Events:**
```typescript
'lms.course.created'
'lms.course.published'
'lms.enrollment.created'
'lms.lesson.completed'
'lms.module.completed'
'lms.course.completed'
'lms.assessment.passed'
'lms.certificate.issued'
```

**Phishing Simulator Events:**
```typescript
'phishing.campaign.launched'
'phishing.email.sent'
'phishing.email.opened'
'phishing.link.clicked'
'phishing.data.submitted'
'phishing.reported.by_user'
'phishing.test.failed'
'phishing.test.passed'
```

**GRC App Events:**
```typescript
'grc.policy.created'
'grc.policy.published'
'grc.policy.acknowledged'
'grc.compliance.checked'
'grc.risk.identified'
'grc.audit.completed'
```

---

## 🛠️ البنية التقنية المقترحة {#technical-architecture}

### Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐   ┌──────────────┐  │
│  │   Event Bus     │    │  Event Monitor  │   │ Automation   │  │
│  │  (React Hook)   │    │   Dashboard     │   │  Rules UI    │  │
│  └────────┬────────┘    └────────┬────────┘   └──────┬───────┘  │
│           │                      │                     │          │
└───────────┼──────────────────────┼─────────────────────┼──────────┘
            │                      │                     │
            └──────────────────────┴─────────────────────┘
                                   ↓
┌───────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Core Event Engine (Supabase)                 │   │
│  │                                                            │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │   │
│  │  │   Event    │  │   Event    │  │    Automation      │ │   │
│  │  │   Queue    │→ │  Handlers  │→ │     Engine         │ │   │
│  │  └────────────┘  └────────────┘  └────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                                   ↓
┌───────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ system_events│  │  automation  │  │   event_handlers     │   │
│  │              │  │    _rules    │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │event_subscri-│  │   event_log  │  │  integration_hooks   │   │
│  │   ptions     │  │  (audit)     │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Database Schema (New Tables)

#### 1. `system_events` - سجل الأحداث الرئيسي
```sql
CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Event Metadata
  event_type TEXT NOT NULL,              -- 'lms.course.completed'
  event_category TEXT NOT NULL,          -- 'lms', 'awareness', 'phishing'
  event_source TEXT NOT NULL,            -- 'lms_app', 'awareness_module'
  
  -- Event Payload
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Event Context
  user_id TEXT,                          -- من قام بالحدث
  entity_type TEXT,                      -- 'course', 'campaign'
  entity_id TEXT,                        -- ID of course/campaign
  
  -- Processing Status
  status TEXT DEFAULT 'pending',         -- pending, processing, completed, failed
  processed_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  error_message TEXT,
  
  -- Metadata
  priority INT DEFAULT 5,                -- 1 (highest) to 10 (lowest)
  correlation_id TEXT,                   -- لربط الأحداث المتعلقة
  tags TEXT[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  
  -- Indexes
  INDEX idx_events_tenant_id ON system_events(tenant_id),
  INDEX idx_events_type ON system_events(event_type),
  INDEX idx_events_category ON system_events(event_category),
  INDEX idx_events_status ON system_events(status),
  INDEX idx_events_created_at ON system_events(created_at DESC)
);
```

#### 2. `automation_rules` - قواعد الأتمتة
```sql
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Rule Identity
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Trigger Configuration
  trigger_event_type TEXT NOT NULL,      -- 'lms.course.completed'
  trigger_conditions JSONB,              -- { "score": { "gte": 80 } }
  
  -- Action Configuration
  action_type TEXT NOT NULL,             -- 'enroll', 'notify', 'award_badge'
  action_config JSONB NOT NULL,          -- { "courseId": "xyz", "delay": "1h" }
  
  -- Priority & Scheduling
  priority INT DEFAULT 5,
  execute_after_seconds INT DEFAULT 0,   -- تأخير التنفيذ
  
  -- Execution Stats
  execution_count INT DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT,
  
  UNIQUE(tenant_id, name)
);
```

#### 3. `event_subscriptions` - اشتراكات الأحداث
```sql
CREATE TABLE event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Subscription Config
  subscriber_name TEXT NOT NULL,         -- 'awareness_impact_calculator'
  event_type TEXT NOT NULL,              -- 'lms.course.completed' or 'lms.*'
  
  -- Handler Configuration
  handler_type TEXT NOT NULL,            -- 'webhook', 'edge_function', 'internal'
  handler_config JSONB NOT NULL,         -- { "url": "...", "method": "POST" }
  
  -- Filtering
  filter_conditions JSONB,               -- للتصفية الدقيقة
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_invocations INT DEFAULT 0,
  successful_invocations INT DEFAULT 0,
  failed_invocations INT DEFAULT 0,
  last_invoked_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4. `event_execution_log` - سجل تنفيذ الأحداث
```sql
CREATE TABLE event_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Links
  event_id UUID REFERENCES system_events(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES event_subscriptions(id) ON DELETE SET NULL,
  
  -- Execution Details
  executed_at TIMESTAMPTZ DEFAULT now(),
  execution_duration_ms INT,
  status TEXT NOT NULL,                  -- 'success', 'failed', 'skipped'
  
  -- Results
  result_data JSONB,
  error_message TEXT,
  stack_trace TEXT,
  
  -- Context
  correlation_id TEXT,
  
  -- Partitioning hint (for future)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 5. `integration_webhooks` - Webhooks للأنظمة الخارجية
```sql
CREATE TABLE integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Webhook Identity
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Configuration
  url TEXT NOT NULL,
  method TEXT DEFAULT 'POST',
  headers JSONB,                         -- { "Authorization": "Bearer xxx" }
  
  -- Event Filtering
  event_types TEXT[],                    -- ['lms.*', 'awareness.campaign.completed']
  
  -- Security
  secret_key TEXT,                       -- لتوقيع الطلبات
  
  -- Retry Policy
  max_retries INT DEFAULT 3,
  retry_delay_seconds INT DEFAULT 60,
  
  -- Stats
  total_calls INT DEFAULT 0,
  successful_calls INT DEFAULT 0,
  failed_calls INT DEFAULT 0,
  last_called_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Backend Functions (Database Functions)

#### 1. `fn_publish_event()` - نشر حدث جديد
```sql
CREATE OR REPLACE FUNCTION fn_publish_event(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_payload JSONB,
  p_user_id TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_priority INT DEFAULT 5
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_category TEXT;
BEGIN
  -- Extract category from event_type (e.g., 'lms.course.completed' → 'lms')
  v_category := split_part(p_event_type, '.', 1);
  
  -- Insert event
  INSERT INTO system_events (
    tenant_id, event_type, event_category, event_source,
    payload, user_id, entity_type, entity_id, priority,
    created_by
  ) VALUES (
    p_tenant_id, p_event_type, v_category, 'application',
    p_payload, p_user_id, p_entity_type, p_entity_id, p_priority,
    p_user_id
  )
  RETURNING id INTO v_event_id;
  
  -- Trigger processing (could be async via pg_notify)
  PERFORM fn_process_event(v_event_id);
  
  RETURN v_event_id;
END;
$$;
```

#### 2. `fn_process_event()` - معالجة حدث
```sql
CREATE OR REPLACE FUNCTION fn_process_event(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_rule RECORD;
  v_subscription RECORD;
BEGIN
  -- Get event
  SELECT * INTO v_event FROM system_events WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', p_event_id;
  END IF;
  
  -- Update status
  UPDATE system_events SET status = 'processing' WHERE id = p_event_id;
  
  -- Find matching automation rules
  FOR v_rule IN
    SELECT * FROM automation_rules
    WHERE tenant_id = v_event.tenant_id
      AND is_active = true
      AND trigger_event_type = v_event.event_type
      AND (trigger_conditions IS NULL OR fn_match_conditions(v_event.payload, trigger_conditions))
    ORDER BY priority ASC
  LOOP
    -- Execute rule
    PERFORM fn_execute_automation_rule(v_rule.id, p_event_id);
  END LOOP;
  
  -- Find matching subscriptions
  FOR v_subscription IN
    SELECT * FROM event_subscriptions
    WHERE tenant_id = v_event.tenant_id
      AND is_active = true
      AND (event_type = v_event.event_type OR event_type = v_event.event_category || '.*')
  LOOP
    -- Invoke subscription handler
    PERFORM fn_invoke_subscription(v_subscription.id, p_event_id);
  END LOOP;
  
  -- Mark as completed
  UPDATE system_events SET 
    status = 'completed',
    processed_at = now()
  WHERE id = p_event_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error
  UPDATE system_events SET 
    status = 'failed',
    error_message = SQLERRM,
    retry_count = retry_count + 1
  WHERE id = p_event_id;
END;
$$;
```

#### 3. `fn_execute_automation_rule()` - تنفيذ قاعدة أتمتة
```sql
CREATE OR REPLACE FUNCTION fn_execute_automation_rule(
  p_rule_id UUID,
  p_event_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule RECORD;
  v_event RECORD;
  v_execution_start TIMESTAMPTZ;
  v_execution_duration_ms INT;
  v_result JSONB;
  v_success BOOLEAN;
BEGIN
  v_execution_start := clock_timestamp();
  
  -- Get rule and event
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id;
  SELECT * INTO v_event FROM system_events WHERE id = p_event_id;
  
  -- Execute based on action_type
  CASE v_rule.action_type
    WHEN 'enroll_user' THEN
      -- Example: Enroll user in a course
      v_result := fn_action_enroll_user(v_event.user_id, v_rule.action_config);
      v_success := true;
      
    WHEN 'send_notification' THEN
      v_result := fn_action_send_notification(v_event.user_id, v_rule.action_config);
      v_success := true;
      
    WHEN 'update_impact_score' THEN
      v_result := fn_action_update_impact_score(v_event.payload, v_rule.action_config);
      v_success := true;
      
    ELSE
      RAISE EXCEPTION 'Unknown action_type: %', v_rule.action_type;
  END CASE;
  
  v_execution_duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - v_execution_start)) * 1000;
  
  -- Log execution
  INSERT INTO event_execution_log (
    tenant_id, event_id, rule_id,
    executed_at, execution_duration_ms, status, result_data
  ) VALUES (
    v_rule.tenant_id, p_event_id, p_rule_id,
    v_execution_start, v_execution_duration_ms, 'success', v_result
  );
  
  -- Update rule stats
  UPDATE automation_rules SET
    execution_count = execution_count + 1,
    last_executed_at = now(),
    last_success_at = now()
  WHERE id = p_rule_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO event_execution_log (
    tenant_id, event_id, rule_id,
    executed_at, execution_duration_ms, status, error_message
  ) VALUES (
    v_rule.tenant_id, p_event_id, p_rule_id,
    v_execution_start, v_execution_duration_ms, 'failed', SQLERRM
  );
  
  UPDATE automation_rules SET
    last_error_at = now(),
    last_error_message = SQLERRM
  WHERE id = p_rule_id;
END;
$$;
```

---

### Frontend Architecture

#### 1. Event Bus Hook
```typescript
// src/core/services/eventSystem/useEventBus.ts

import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  event_category: string;
  payload: Record<string, any>;
  user_id?: string;
  entity_type?: string;
  entity_id?: string;
  priority: number;
  status: string;
  created_at: string;
}

export function useEventBus() {
  // Publish event
  const publishEvent = useCallback(async (
    eventType: string,
    payload: Record<string, any>,
    options?: {
      entityType?: string;
      entityId?: string;
      priority?: number;
    }
  ) => {
    const { data, error } = await supabase.rpc('fn_publish_event', {
      p_tenant_id: getCurrentTenantId(),
      p_event_type: eventType,
      p_payload: payload,
      p_user_id: getCurrentUserId(),
      p_entity_type: options?.entityType,
      p_entity_id: options?.entityId,
      p_priority: options?.priority || 5,
    });

    if (error) throw error;
    return data;
  }, []);

  // Subscribe to events (Realtime)
  const subscribeToEvents = useCallback((
    eventTypes: string[],
    callback: (event: SystemEvent) => void
  ) => {
    const channel = supabase
      .channel('system_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_events',
          filter: `event_type=in.(${eventTypes.join(',')})`,
        },
        (payload) => {
          callback(payload.new as SystemEvent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    publishEvent,
    subscribeToEvents,
  };
}
```

#### 2. Event Monitor Dashboard Component
```typescript
// src/core/components/EventMonitor.tsx

export function EventMonitorDashboard() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const { subscribeToEvents } = useEventBus();

  useEffect(() => {
    // Subscribe to all events for real-time monitoring
    const unsubscribe = subscribeToEvents(['*'], (event) => {
      setEvents((prev) => [event, ...prev].slice(0, 100));
    });

    return unsubscribe;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">مراقبة الأحداث | Event Monitor</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectItem value="all">جميع الأحداث</SelectItem>
          <SelectItem value="lms">LMS</SelectItem>
          <SelectItem value="awareness">Awareness</SelectItem>
          <SelectItem value="phishing">Phishing</SelectItem>
        </Select>
      </div>

      <div className="space-y-2">
        {events
          .filter((e) => filter === 'all' || e.event_category === filter)
          .map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
      </div>
    </div>
  );
}
```

---

## 📅 خطة التنفيذ {#implementation-plan}

### Overview: 3 Phases over 12 Weeks

```
Phase 1: Core Infrastructure (Weeks 1-4)
Phase 2: Module Integration (Weeks 5-8)
Phase 3: Applications & UI (Weeks 9-12)
```

---

### 📦 Phase 1: Core Infrastructure (4 Weeks)

#### Week 1-2: Database & Backend
✅ **Goal:** إنشاء البنية التحتية الأساسية

**Tasks:**
- [ ] إنشاء جداول قاعدة البيانات الجديدة (6 tables)
- [ ] كتابة Database Functions الأساسية (5 functions)
- [ ] إعداد RLS Policies لجميع الجداول
- [ ] Migration Scripts + Testing

**Deliverables:**
- ✅ Database Schema مكتمل
- ✅ Functions جاهزة ومختبرة
- ✅ RLS Policies مفعّلة

#### Week 3-4: Core Services & Hooks
✅ **Goal:** تطوير طبقة الخدمات الأساسية

**Tasks:**
- [ ] إنشاء `src/core/services/eventSystem/`
- [ ] تطوير `useEventBus` Hook
- [ ] تطوير Event Logger
- [ ] تطوير Type Definitions
- [ ] Unit Tests

**Deliverables:**
- ✅ Core Event System Service
- ✅ React Hooks جاهزة
- ✅ Type Safety مضمونة

---

### 🔗 Phase 2: Module Integration (4 Weeks)

#### Week 5-6: Application Modules Events
✅ **Goal:** دمج Event System مع الـ Modules الموجودة

**Tasks:**
- [ ] إضافة Events إلى Documents Module
- [ ] إضافة Events إلى Reports Module
- [ ] إضافة Events إلى Alerts Module (توسيع الموجود)
- [ ] إضافة Events إلى Content Hub
- [ ] إضافة Events إلى KPIs Module

**Example (Documents Module):**
```typescript
// src/modules/documents/integration/documents-data.ts

import { useEventBus } from '@/core/services/eventSystem';

export async function createDocument(input: CreateDocumentInput) {
  const { publishEvent } = useEventBus();
  
  // Create document
  const document = await supabase
    .from('documents')
    .insert(input)
    .select()
    .single();
  
  // Publish event
  await publishEvent('documents.document.created', {
    documentId: document.id,
    documentType: document.doc_type,
    createdBy: document.created_by,
  }, {
    entityType: 'document',
    entityId: document.id,
  });
  
  return document;
}
```

**Deliverables:**
- ✅ 5 Modules مدمجة مع Event System
- ✅ 20+ Event Types جديدة
- ✅ Integration Tests

#### Week 7-8: Automation Rules Engine
✅ **Goal:** بناء محرك الأتمتة

**Tasks:**
- [ ] تطوير Automation Rules Manager (Backend)
- [ ] تطوير Action Handlers (enroll, notify, update_score, etc.)
- [ ] تطوير Condition Matcher
- [ ] تطوير Retry Logic
- [ ] Performance Testing

**Deliverables:**
- ✅ Automation Engine عامل
- ✅ 10+ Action Types مدعومة
- ✅ Reliable Retry Mechanism

---

### 🎨 Phase 3: Applications & Admin UI (4 Weeks)

#### Week 9-10: Applications Integration
✅ **Goal:** ربط التطبيقات بـ Event System

**Tasks:**
- [ ] دمج Awareness App
- [ ] دمج LMS App
- [ ] دمج Phishing Simulator
- [ ] دمج GRC App
- [ ] Cross-App Integration Testing

**Example Integration (LMS → Awareness):**
```typescript
// When user completes LMS course
await publishEvent('lms.course.completed', {
  userId: 'user_123',
  courseId: 'course_456',
  score: 95,
});

// Automation Rule (configured by admin):
// IF: lms.course.completed AND score >= 80
// THEN: awareness.update_impact_score AND enroll_in_advanced_course
```

**Deliverables:**
- ✅ 4 Applications مدمجة
- ✅ 30+ Cross-App Automations
- ✅ E2E Tests

#### Week 11-12: Admin UI & Documentation
✅ **Goal:** واجهة إدارة متقدمة ووثائق شاملة

**Tasks:**
- [ ] Event Monitor Dashboard
- [ ] Automation Rules Manager UI
- [ ] Integration Health Monitor
- [ ] Unified Audit Log Viewer
- [ ] Analytics Dashboard
- [ ] Complete Documentation

**UI Components:**
```
src/core/components/eventSystem/
├── EventMonitorDashboard.tsx
├── AutomationRulesManager.tsx
├── IntegrationHealthMonitor.tsx
├── EventAuditLog.tsx
├── EventAnalytics.tsx
└── components/
    ├── EventCard.tsx
    ├── RuleForm.tsx
    └── HealthStatusBadge.tsx
```

**Deliverables:**
- ✅ Admin UI مكتمل
- ✅ Documentation شاملة
- ✅ Video Tutorials (optional)

---

## 💎 الفوائد والقيمة {#benefits}

### للمطورين (Developers)

```
✅ Loose Coupling: سهولة تطوير وصيانة الكود
✅ Reusability: استخدام نفس الأحداث في أماكن متعددة
✅ Testability: سهولة اختبار الوحدات بشكل منفصل
✅ Scalability: إضافة تطبيقات جديدة دون تعديل القديمة
```

### للإداريين (Admins)

```
✅ Automation: أتمتة العمليات المتكررة دون برمجة
✅ Visibility: مراقبة شاملة لجميع الأنشطة
✅ Control: التحكم الكامل في كيفية تفاعل الأنظمة
✅ Insights: تحليلات متقدمة لفهم سلوك المستخدمين
```

### للمؤسسة (Organization)

```
✅ Efficiency: تقليل الوقت والجهد المطلوب للعمليات
✅ Consistency: ضمان تطبيق القواعد بشكل موحد
✅ Compliance: تتبع كامل لجميع العمليات (Audit Trail)
✅ ROI: عائد استثمار عالٍ من خلال الأتمتة
```

---

## ⚠️ المخاطر والتخفيف {#risks}

### المخاطر المحتملة

| المخاطرة | التأثير | الاحتمالية | الحل |
|---------|---------|-----------|------|
| **Performance Issues** | High | Medium | - Database Indexing<br>- Async Processing<br>- Event Batching |
| **Event Loop Cycles** | High | Low | - Cycle Detection Logic<br>- Max Depth Limits |
| **Data Consistency** | High | Medium | - Transactional Boundaries<br>- Idempotency Keys |
| **Complexity** | Medium | Medium | - Clear Documentation<br>- Training Sessions |
| **Debugging Difficulty** | Medium | Medium | - Comprehensive Logging<br>- Tracing Tools |

### Mitigation Strategies

#### 1. Performance Optimization
```sql
-- Partitioning for large tables
CREATE TABLE system_events_2025_11 PARTITION OF system_events
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Indexes
CREATE INDEX CONCURRENTLY idx_events_hot 
  ON system_events(tenant_id, created_at DESC) 
  WHERE status IN ('pending', 'processing');
```

#### 2. Circuit Breaker Pattern
```typescript
// Prevent cascading failures
const circuitBreaker = {
  failures: 0,
  threshold: 5,
  isOpen: false,
  
  async execute(fn: () => Promise<any>) {
    if (this.isOpen) throw new Error('Circuit breaker is open');
    
    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.isOpen = true;
        setTimeout(() => { this.isOpen = false; }, 60000);
      }
      throw error;
    }
  }
};
```

---

## 📚 المراجع {#references}

### وثائق النظام الحالي
- ✅ `Platform_Expansion_Plan_v1.0.md` - خطة التوسع الأساسية
- ✅ `Architecture.md` - الهيكل المعماري للمنصة
- ✅ `Event_System_Infrastructure_Review.md` - مراجعة البنية التحتية الحالية
- ✅ `Event_System_Admin_Features.md` - ميزات الـ Admin

### معايير خارجية
- [CloudEvents Specification](https://cloudevents.io/)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

---

## 🎯 الخطوات التالية

### خيارات التنفيذ

**Option 1: تنفيذ كامل (موصى به)**
```
✅ تنفيذ جميع المراحل الثلاث (12 أسبوع)
✅ Event System شامل ومتكامل
✅ Admin UI متقدم
```

**Option 2: تنفيذ تدريجي**
```
✅ Phase 1 أولاً (4 أسابيع)
🔄 تقييم ثم Phase 2
🔄 تقييم ثم Phase 3
```

**Option 3: MVP سريع**
```
✅ Core Infrastructure فقط (2 أسابيع)
✅ تكامل بسيط مع LMS + Awareness
✅ Admin UI أساسي
```

---

### ما الذي تريده الآن؟

**اختر الخيار الذي يناسبك:**

1. ✅ **ابدأ Phase 1 فوراً** - سأبدأ بإنشاء Database Tables والـ Functions
2. 📋 **أريد تفاصيل أكثر** - أسئلة إضافية حول التنفيذ
3. 🎨 **شاهد مثال عملي** - أريد رؤية Demo للنظام
4. 💬 **نقاش استراتيجي** - لنناقش الأولويات أولاً

---

**🔎 الحالة:** ✅ خطة جاهزة ومعتمدة للتنفيذ  
**📅 تاريخ الإعداد:** 2025-11-15  
**👤 المعد:** Lovable AI  
**🔗 المرجع:** Platform Expansion Plan v1.0 + Architecture.md