# خطة التنفيذ التفصيلية لنظام الأحداث | Event System Implementation Roadmap v1.0

**التاريخ:** 2025-11-15  
**الإصدار:** v1.0 - خطة التنفيذ العملية  
**الحالة:** 🚀 **جاهز للتنفيذ الفوري**  
**المرجع:** `Event_System_Complete_Development_Plan_v2.0.md`  
**المدة الإجمالية:** 12 أسبوع (3 أشهر)

---

## 📋 فهرس المحتويات

1. [نظرة عامة](#overview)
2. [المتطلبات الأساسية](#prerequisites)
3. [Phase 1: Core Infrastructure](#phase-1)
4. [Phase 2: Automation Engine](#phase-2)
5. [Phase 3: Applications & UI](#phase-3)
6. [معايير القبول](#acceptance-criteria)
7. [خطة الاختبار](#testing-plan)
8. [إدارة المخاطر](#risk-management)

---

## 🎯 نظرة عامة {#overview}

### الهدف
تنفيذ نظام أحداث موحد يربط جميع مكونات منصة Romuz Awareness بشكل احترافي عبر 3 مراحل متدرجة.

### المخرجات الرئيسية
```
✅ 5 جداول قاعدة بيانات جديدة
✅ 8+ دوال Backend Functions
✅ 14+ Integration Hooks للـ Modules
✅ واجهة إدارة متقدمة (Event Monitor + Automation Rules)
✅ نظام Realtime للمراقبة والتنبيهات
✅ تغطية شاملة لجميع Gates والتطبيقات
```

### فريق العمل المطلوب
- **Backend Developer** (1): Database + Functions + Integration
- **Frontend Developer** (1): UI + Hooks + Components
- **QA Engineer** (0.5): Testing + Validation
- **DevOps** (0.25): Deployment + Monitoring

---

## 🔧 المتطلبات الأساسية {#prerequisites}

### قبل البدء (Pre-Development)
```bash
# 1. مراجعة البنية الحالية
✅ فهم Architecture Diagram الحالي
✅ مراجعة جميع Modules الموجودة (14 module)
✅ مراجعة Gates الخمسة (F, H, I, K, L)
✅ فهم Multi-Tenancy & RBAC

# 2. إعداد البيئة
✅ Access to Supabase Project
✅ Local Development Environment
✅ Testing Environment
✅ Documentation Access

# 3. المتطلبات التقنية
✅ PostgreSQL 14+
✅ Supabase Realtime enabled
✅ TypeScript 5+
✅ React 18+
✅ Tanstack Query v5
```

---

## 📦 Phase 1: Core Infrastructure (الأسابيع 1-4)

### **Week 1: Database Foundation** 🗄️

#### Day 1-2: Core Tables Creation
**المسؤول:** Backend Developer

**المهام:**
1. إنشاء جدول `system_events` (الجدول الرئيسي)
```sql
-- Priority: CRITICAL
-- Time: 4 hours
-- Dependencies: None

CREATE TABLE public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  source_module TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  user_id UUID,
  priority TEXT DEFAULT 'medium',
  payload JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
);

-- Indexes for performance
CREATE INDEX idx_system_events_tenant ON system_events(tenant_id);
CREATE INDEX idx_system_events_type ON system_events(event_type);
CREATE INDEX idx_system_events_created ON system_events(created_at DESC);
CREATE INDEX idx_system_events_status ON system_events(status);
CREATE INDEX idx_system_events_entity ON system_events(entity_type, entity_id);
```

**معايير القبول:**
- ✅ الجدول منشأ بنجاح
- ✅ جميع Indexes تعمل
- ✅ RLS Policies مطبقة
- ✅ إدخال بيانات تجريبية ناجح

---

2. إنشاء جدول `automation_rules`
```sql
-- Priority: CRITICAL
-- Time: 3 hours
-- Dependencies: system_events

CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  description_ar TEXT,
  trigger_event_types TEXT[] NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_automation_rules_tenant ON automation_rules(tenant_id);
CREATE INDEX idx_automation_rules_enabled ON automation_rules(is_enabled);
CREATE INDEX idx_automation_rules_events ON automation_rules USING GIN(trigger_event_types);
```

**معايير القبول:**
- ✅ الجدول منشأ مع جميع الحقول
- ✅ Indexes محسنة
- ✅ إمكانية حفظ قواعد معقدة
- ✅ اختبار بيانات نموذجية

---

#### Day 3-4: Supporting Tables
**المسؤول:** Backend Developer

3. إنشاء `event_subscriptions`
```sql
-- Priority: HIGH
-- Time: 2 hours
-- Dependencies: system_events

CREATE TABLE public.event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  subscriber_module TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  callback_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_module ON event_subscriptions(subscriber_module);
CREATE INDEX idx_subscriptions_active ON event_subscriptions(is_active);
```

4. إنشاء `event_execution_log`
```sql
-- Priority: HIGH
-- Time: 2 hours
-- Dependencies: automation_rules, system_events

CREATE TABLE public.event_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  event_id UUID REFERENCES system_events(id),
  rule_id UUID REFERENCES automation_rules(id),
  execution_status TEXT NOT NULL,
  execution_result JSONB,
  error_message TEXT,
  execution_duration_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_execution_log_event ON event_execution_log(event_id);
CREATE INDEX idx_execution_log_rule ON event_execution_log(rule_id);
CREATE INDEX idx_execution_log_status ON event_execution_log(execution_status);
```

5. إنشاء `integration_webhooks`
```sql
-- Priority: MEDIUM
-- Time: 2 hours
-- Dependencies: None

CREATE TABLE public.integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  webhook_name TEXT NOT NULL,
  url TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  auth_type TEXT DEFAULT 'none',
  auth_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_webhooks_tenant ON integration_webhooks(tenant_id);
CREATE INDEX idx_webhooks_active ON integration_webhooks(is_active);
```

**Checkpoint Week 1:**
- [ ] جميع الجداول الخمسة منشأة
- [ ] جميع Indexes محسنة
- [ ] RLS Policies مطبقة
- [ ] وثائق Database Schema جاهزة

---

### **Week 2: Backend Functions** ⚙️

#### Day 5-7: Core Functions
**المسؤول:** Backend Developer

1. **Function: `fn_publish_event()`**
```sql
-- Priority: CRITICAL
-- Time: 6 hours
-- Purpose: نشر حدث جديد في النظام

CREATE OR REPLACE FUNCTION public.fn_publish_event(
  p_event_type TEXT,
  p_event_category TEXT,
  p_source_module TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_priority TEXT DEFAULT 'medium',
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  event_id UUID,
  status TEXT,
  processed_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_event_id UUID;
  v_processed_count INTEGER := 0;
  v_subscription RECORD;
BEGIN
  -- Get context
  v_tenant_id := app_current_tenant_id();
  v_user_id := app_current_user_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Insert event
  INSERT INTO public.system_events (
    tenant_id,
    event_type,
    event_category,
    source_module,
    entity_type,
    entity_id,
    user_id,
    priority,
    payload,
    metadata,
    status
  )
  VALUES (
    v_tenant_id,
    p_event_type,
    p_event_category,
    p_source_module,
    p_entity_type,
    p_entity_id,
    v_user_id,
    p_priority,
    p_payload,
    p_metadata,
    'pending'
  )
  RETURNING id INTO v_event_id;
  
  -- Process automation rules (async)
  PERFORM fn_process_event(v_event_id);
  
  -- Count processed subscriptions
  SELECT COUNT(*) INTO v_processed_count
  FROM public.event_subscriptions
  WHERE tenant_id = v_tenant_id
    AND is_active = true
    AND p_event_type = ANY(event_types);
  
  -- Return result
  RETURN QUERY
  SELECT 
    v_event_id,
    'published'::TEXT,
    v_processed_count;
END;
$$;
```

**اختبار:**
```sql
-- Test Case 1: Publish simple event
SELECT * FROM fn_publish_event(
  'policy_created',
  'policy',
  'gate_f',
  'policy',
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  'high',
  '{"policy_name": "سياسة الأمن السيبراني"}'::jsonb
);

-- Expected: event_id returned, status='published'
```

---

2. **Function: `fn_process_event()`**
```sql
-- Priority: CRITICAL
-- Time: 8 hours
-- Purpose: معالجة الأحداث وتنفيذ قواعد الأتمتة

CREATE OR REPLACE FUNCTION public.fn_process_event(
  p_event_id UUID
)
RETURNS TABLE(
  rules_matched INTEGER,
  rules_executed INTEGER,
  rules_failed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_rule RECORD;
  v_matched INTEGER := 0;
  v_executed INTEGER := 0;
  v_failed INTEGER := 0;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_duration INTEGER;
BEGIN
  -- Get event details
  SELECT * INTO v_event
  FROM public.system_events
  WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;
  
  -- Find matching rules
  FOR v_rule IN
    SELECT *
    FROM public.automation_rules
    WHERE tenant_id = v_event.tenant_id
      AND is_enabled = true
      AND v_event.event_type = ANY(trigger_event_types)
    ORDER BY priority DESC
  LOOP
    v_matched := v_matched + 1;
    v_start_time := clock_timestamp();
    
    BEGIN
      -- Execute rule
      PERFORM fn_execute_automation_rule(
        v_rule.id,
        p_event_id,
        v_event.payload
      );
      
      v_executed := v_executed + 1;
      v_end_time := clock_timestamp();
      v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER;
      
      -- Log success
      INSERT INTO public.event_execution_log (
        tenant_id,
        event_id,
        rule_id,
        execution_status,
        execution_duration_ms,
        execution_result
      )
      VALUES (
        v_event.tenant_id,
        p_event_id,
        v_rule.id,
        'success',
        v_duration,
        jsonb_build_object('matched', true, 'executed', true)
      );
      
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      
      -- Log failure
      INSERT INTO public.event_execution_log (
        tenant_id,
        event_id,
        rule_id,
        execution_status,
        error_message
      )
      VALUES (
        v_event.tenant_id,
        p_event_id,
        v_rule.id,
        'failed',
        SQLERRM
      );
    END;
  END LOOP;
  
  -- Update event status
  UPDATE public.system_events
  SET 
    status = 'processed',
    processed_at = now()
  WHERE id = p_event_id;
  
  -- Return summary
  RETURN QUERY
  SELECT v_matched, v_executed, v_failed;
END;
$$;
```

**اختبار:**
```sql
-- Test Case 2: Process event
SELECT * FROM fn_process_event('event-uuid-here');

-- Expected: rules matched and executed counts
```

---

3. **Function: `fn_execute_automation_rule()`**
```sql
-- Priority: CRITICAL
-- Time: 10 hours
-- Purpose: تنفيذ قاعدة أتمتة محددة

CREATE OR REPLACE FUNCTION public.fn_execute_automation_rule(
  p_rule_id UUID,
  p_event_id UUID,
  p_event_payload JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_conditions_met BOOLEAN;
  v_action JSONB;
  v_action_type TEXT;
BEGIN
  -- Get rule details
  SELECT * INTO v_rule
  FROM public.automation_rules
  WHERE id = p_rule_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RULE_NOT_FOUND';
  END IF;
  
  -- Evaluate conditions
  v_conditions_met := fn_evaluate_conditions(
    v_rule.conditions,
    p_event_payload
  );
  
  IF NOT v_conditions_met THEN
    RETURN false;
  END IF;
  
  -- Execute each action
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_rule.actions)
  LOOP
    v_action_type := v_action->>'action_type';
    
    CASE v_action_type
      WHEN 'enroll_in_course' THEN
        PERFORM fn_action_enroll_in_course(v_action);
        
      WHEN 'send_notification' THEN
        PERFORM fn_action_send_notification(v_action);
        
      WHEN 'create_action_plan' THEN
        PERFORM fn_action_create_action_plan(v_action);
        
      WHEN 'update_kpi' THEN
        PERFORM fn_action_update_kpi(v_action);
        
      WHEN 'trigger_campaign' THEN
        PERFORM fn_action_trigger_campaign(v_action);
        
      WHEN 'create_task' THEN
        PERFORM fn_action_create_task(v_action);
        
      WHEN 'call_webhook' THEN
        PERFORM fn_action_call_webhook(v_action);
        
      ELSE
        RAISE WARNING 'Unknown action type: %', v_action_type;
    END CASE;
  END LOOP;
  
  -- Update execution count
  UPDATE public.automation_rules
  SET 
    execution_count = execution_count + 1,
    last_executed_at = now()
  WHERE id = p_rule_id;
  
  RETURN true;
END;
$$;
```

---

#### Day 8-9: Action Executors
**المسؤول:** Backend Developer

4. **Action Functions** (8 functions)

```sql
-- 4.1: Enroll in Course
CREATE OR REPLACE FUNCTION fn_action_enroll_in_course(p_action JSONB)
RETURNS VOID AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
  v_user_id UUID;
  v_course_id UUID;
BEGIN
  v_user_id := (p_action->>'user_id')::UUID;
  v_course_id := (p_action->>'course_id')::UUID;
  
  INSERT INTO public.lms_enrollments (
    tenant_id,
    user_id,
    course_id,
    enrollment_type,
    status
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    v_course_id,
    'auto_assigned',
    'active'
  )
  ON CONFLICT (tenant_id, user_id, course_id) 
  DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2: Send Notification
CREATE OR REPLACE FUNCTION fn_action_send_notification(p_action JSONB)
RETURNS VOID AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
BEGIN
  INSERT INTO public.notifications (
    tenant_id,
    user_id,
    title,
    message,
    type,
    priority
  )
  VALUES (
    v_tenant_id,
    (p_action->>'user_id')::UUID,
    p_action->>'title',
    p_action->>'message',
    p_action->>'notification_type',
    p_action->>'priority'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3: Create Action Plan
CREATE OR REPLACE FUNCTION fn_action_create_action_plan(p_action JSONB)
RETURNS VOID AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
  v_user_id UUID := app_current_user_id();
BEGIN
  INSERT INTO gate_h.action_items (
    tenant_id,
    source,
    title_ar,
    desc_ar,
    priority,
    status,
    assignee_user_id,
    due_date,
    created_by
  )
  VALUES (
    v_tenant_id,
    'automation',
    p_action->>'title_ar',
    p_action->>'desc_ar',
    (p_action->>'priority')::gate_h.action_priority,
    'new',
    (p_action->>'assignee_user_id')::UUID,
    (p_action->>'due_date')::DATE,
    v_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.4: Update KPI
CREATE OR REPLACE FUNCTION fn_action_update_kpi(p_action JSONB)
RETURNS VOID AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
BEGIN
  UPDATE public.kpi_catalog
  SET 
    target_value = (p_action->>'new_target_value')::NUMERIC,
    updated_at = now()
  WHERE tenant_id = v_tenant_id
    AND kpi_key = p_action->>'kpi_key';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.5: Trigger Campaign
CREATE OR REPLACE FUNCTION fn_action_trigger_campaign(p_action JSONB)
RETURNS VOID AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
BEGIN
  UPDATE public.awareness_campaigns
  SET 
    status = 'active',
    start_at = now()
  WHERE tenant_id = v_tenant_id
    AND id = (p_action->>'campaign_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.6: Create Task
CREATE OR REPLACE FUNCTION fn_action_create_task(p_action JSONB)
RETURNS VOID AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
BEGIN
  INSERT INTO public.tasks (
    tenant_id,
    title,
    description,
    assignee_id,
    due_date,
    priority,
    status
  )
  VALUES (
    v_tenant_id,
    p_action->>'title',
    p_action->>'description',
    (p_action->>'assignee_id')::UUID,
    (p_action->>'due_date')::DATE,
    p_action->>'priority',
    'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.7: Call Webhook
CREATE OR REPLACE FUNCTION fn_action_call_webhook(p_action JSONB)
RETURNS VOID AS $$
DECLARE
  v_webhook_id UUID;
BEGIN
  v_webhook_id := (p_action->>'webhook_id')::UUID;
  
  -- Log webhook call (actual HTTP call done by edge function)
  INSERT INTO public.webhook_logs (
    webhook_id,
    payload,
    status,
    created_at
  )
  VALUES (
    v_webhook_id,
    p_action->'payload',
    'pending',
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.8: Evaluate Conditions Helper
CREATE OR REPLACE FUNCTION fn_evaluate_conditions(
  p_conditions JSONB,
  p_payload JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_condition JSONB;
  v_operator TEXT;
  v_field TEXT;
  v_value TEXT;
  v_actual_value TEXT;
BEGIN
  -- Simple condition evaluation
  -- Format: {"field": "score", "operator": "gt", "value": "70"}
  
  FOR v_condition IN SELECT * FROM jsonb_array_elements(p_conditions)
  LOOP
    v_field := v_condition->>'field';
    v_operator := v_condition->>'operator';
    v_value := v_condition->>'value';
    v_actual_value := p_payload->>v_field;
    
    CASE v_operator
      WHEN 'eq' THEN
        IF v_actual_value != v_value THEN
          RETURN false;
        END IF;
        
      WHEN 'gt' THEN
        IF v_actual_value::NUMERIC <= v_value::NUMERIC THEN
          RETURN false;
        END IF;
        
      WHEN 'lt' THEN
        IF v_actual_value::NUMERIC >= v_value::NUMERIC THEN
          RETURN false;
        END IF;
        
      WHEN 'contains' THEN
        IF v_actual_value NOT LIKE '%' || v_value || '%' THEN
          RETURN false;
        END IF;
        
      ELSE
        RAISE WARNING 'Unknown operator: %', v_operator;
        RETURN false;
    END CASE;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Checkpoint Week 2:**
- [ ] جميع Functions منشأة ومختبرة
- [ ] Unit Tests تعمل بنجاح
- [ ] Performance Testing مكتمل
- [ ] وثائق Functions جاهزة

---

### **Week 3-4: Frontend Event Bus & Integration Hooks** 🔗

#### Week 3: Event Bus Foundation
**المسؤول:** Frontend Developer

**Day 10-12: Core Event Bus**

1. **Create Event Types**
```typescript
// src/lib/events/event.types.ts
// Priority: CRITICAL
// Time: 4 hours

export type EventCategory = 
  | 'auth'
  | 'policy'
  | 'action'
  | 'kpi'
  | 'campaign'
  | 'analytics'
  | 'training'
  | 'awareness'
  | 'phishing'
  | 'document'
  | 'committee'
  | 'content'
  | 'culture'
  | 'objective'
  | 'alert';

export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

export type EventStatus = 'pending' | 'processing' | 'processed' | 'failed';

export interface SystemEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  event_category: EventCategory;
  source_module: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  priority: EventPriority;
  payload: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  processed_at?: string;
  status: EventStatus;
}

export interface PublishEventParams {
  event_type: string;
  event_category: EventCategory;
  source_module: string;
  entity_type?: string;
  entity_id?: string;
  priority?: EventPriority;
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EventSubscription {
  id: string;
  subscriber_module: string;
  event_types: string[];
  callback: (event: SystemEvent) => void | Promise<void>;
}
```

---

2. **Create Event Bus Hook**
```typescript
// src/lib/events/useEventBus.ts
// Priority: CRITICAL
// Time: 8 hours

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import type { SystemEvent, PublishEventParams, EventSubscription } from './event.types';

export function useEventBus() {
  const { tenantId } = useAppContext();
  const subscriptionsRef = useRef<Map<string, EventSubscription>>(new Map());

  /**
   * Publish Event
   */
  const publishEvent = useCallback(async (params: PublishEventParams) => {
    if (!tenantId) {
      console.warn('[EventBus] No tenant context');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('fn_publish_event', {
        p_event_type: params.event_type,
        p_event_category: params.event_category,
        p_source_module: params.source_module,
        p_entity_type: params.entity_type || null,
        p_entity_id: params.entity_id || null,
        p_priority: params.priority || 'medium',
        p_payload: params.payload || {},
        p_metadata: params.metadata || {},
      });

      if (error) throw error;

      console.log(`[EventBus] Published: ${params.event_type}`, data);
      return data[0];
    } catch (error) {
      console.error('[EventBus] Publish failed:', error);
      throw error;
    }
  }, [tenantId]);

  /**
   * Subscribe to Events
   */
  const subscribe = useCallback((subscription: Omit<EventSubscription, 'id'>) => {
    const id = `sub_${Date.now()}_${Math.random()}`;
    subscriptionsRef.current.set(id, { ...subscription, id });

    console.log(`[EventBus] Subscribed: ${subscription.subscriber_module}`, subscription.event_types);

    return () => {
      subscriptionsRef.current.delete(id);
      console.log(`[EventBus] Unsubscribed: ${id}`);
    };
  }, []);

  /**
   * Realtime Listener
   */
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('system-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_events',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const event = payload.new as SystemEvent;
          
          console.log(`[EventBus] Realtime event received: ${event.event_type}`);

          // Notify all matching subscriptions
          subscriptionsRef.current.forEach((subscription) => {
            if (subscription.event_types.includes(event.event_type) ||
                subscription.event_types.includes('*')) {
              try {
                subscription.callback(event);
              } catch (error) {
                console.error(`[EventBus] Subscription callback error:`, error);
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return {
    publishEvent,
    subscribe,
  };
}
```

**اختبار:**
```typescript
// Test in any component
const { publishEvent, subscribe } = useEventBus();

// Publish test event
await publishEvent({
  event_type: 'test_event',
  event_category: 'policy',
  source_module: 'test',
  payload: { message: 'Hello Event System!' }
});

// Subscribe to events
useEffect(() => {
  const unsubscribe = subscribe({
    subscriber_module: 'test_component',
    event_types: ['test_event'],
    callback: (event) => {
      console.log('Received event:', event);
    }
  });

  return unsubscribe;
}, []);
```

---

3. **Create Event Helper Functions**
```typescript
// src/lib/events/eventHelpers.ts
// Priority: HIGH
// Time: 4 hours

import { supabase } from '@/integrations/supabase/client';
import type { SystemEvent } from './event.types';

/**
 * Fetch recent events
 */
export async function fetchRecentEvents(
  limit: number = 50,
  filters?: {
    event_type?: string;
    event_category?: string;
    source_module?: string;
    status?: string;
  }
) {
  let query = supabase
    .from('system_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.event_type) {
    query = query.eq('event_type', filters.event_type);
  }
  if (filters?.event_category) {
    query = query.eq('event_category', filters.event_category);
  }
  if (filters?.source_module) {
    query = query.eq('source_module', filters.source_module);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }

  return data as SystemEvent[];
}

/**
 * Fetch event by ID
 */
export async function fetchEventById(eventId: string) {
  const { data, error } = await supabase
    .from('system_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) throw error;
  return data as SystemEvent;
}

/**
 * Fetch execution logs for event
 */
export async function fetchEventExecutionLogs(eventId: string) {
  const { data, error } = await supabase
    .from('event_execution_log')
    .select(`
      *,
      rule:automation_rules(rule_name, description_ar)
    `)
    .eq('event_id', eventId)
    .order('executed_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get event statistics
 */
export async function getEventStatistics(
  dateFrom?: string,
  dateTo?: string
) {
  const { data, error } = await supabase.rpc('fn_get_event_statistics', {
    p_date_from: dateFrom || null,
    p_date_to: dateTo || null,
  });

  if (error) throw error;
  return data;
}
```

---

#### Week 4: Module Integration Hooks
**المسؤول:** Frontend Developer + Backend Developer

**Day 13-16: Integration for All 14 Modules**

**Integration Pattern (مثال واحد - يتكرر لجميع Modules):**

```typescript
// src/modules/policies/integration/policies-events.ts
// Priority: HIGH
// Time per module: 2-3 hours

import { supabase } from '@/integrations/supabase/client';
import type { PublishEventParams } from '@/lib/events/event.types';

/**
 * Publish Policy Event
 */
async function publishPolicyEvent(params: Omit<PublishEventParams, 'event_category' | 'source_module'>) {
  const { data, error } = await supabase.rpc('fn_publish_event', {
    p_event_type: params.event_type,
    p_event_category: 'policy',
    p_source_module: 'gate_f',
    p_entity_type: params.entity_type || null,
    p_entity_id: params.entity_id || null,
    p_priority: params.priority || 'medium',
    p_payload: params.payload || {},
    p_metadata: params.metadata || {},
  });

  if (error) {
    console.error('Failed to publish policy event:', error);
    throw error;
  }

  return data;
}

/**
 * Policy Created Event
 */
export async function logPolicyCreatedEvent(policyId: string, policyData: any) {
  return publishPolicyEvent({
    event_type: 'policy_created',
    entity_type: 'policy',
    entity_id: policyId,
    priority: 'high',
    payload: {
      policy_code: policyData.code,
      policy_name_ar: policyData.name_ar,
      category: policyData.category,
      status: policyData.status,
    },
  });
}

/**
 * Policy Updated Event
 */
export async function logPolicyUpdatedEvent(policyId: string, changes: any) {
  return publishPolicyEvent({
    event_type: 'policy_updated',
    entity_type: 'policy',
    entity_id: policyId,
    priority: 'medium',
    payload: { changes },
  });
}

/**
 * Policy Published Event
 */
export async function logPolicyPublishedEvent(policyId: string, publishData: any) {
  return publishPolicyEvent({
    event_type: 'policy_published',
    entity_type: 'policy',
    entity_id: policyId,
    priority: 'high',
    payload: {
      publish_date: publishData.publish_date,
      version: publishData.version,
    },
  });
}

/**
 * Policy Archived Event
 */
export async function logPolicyArchivedEvent(policyId: string, reason: string) {
  return publishPolicyEvent({
    event_type: 'policy_archived',
    entity_type: 'policy',
    entity_id: policyId,
    priority: 'medium',
    payload: { reason },
  });
}
```

**قائمة التكامل الكاملة:**

| # | Module | Events | Hook File | Status |
|---|--------|---------|-----------|--------|
| 1 | **Gate-F (Policies)** | policy_created, policy_updated, policy_published, policy_archived | `policies-events.ts` | ⏳ |
| 2 | **Gate-H (Actions)** | action_created, action_assigned, action_completed, action_overdue | `actions-events.ts` | ⏳ |
| 3 | **Gate-I (KPIs)** | kpi_created, kpi_threshold_breach, kpi_updated | `kpis-events.ts` | ⏳ |
| 4 | **Gate-K (Campaigns)** | campaign_created, campaign_started, campaign_completed, participant_enrolled | `campaigns-events.ts` | ⏳ |
| 5 | **Gate-L (Analytics)** | report_generated, insight_detected, anomaly_detected | `analytics-events.ts` | ⏳ |
| 6 | **Training (LMS)** | course_created, enrollment_created, progress_updated, certificate_issued | `lms-events.ts` | ⏳ |
| 7 | **Awareness** | impact_score_calculated, calibration_completed | `awareness-events.ts` | ⏳ |
| 8 | **Phishing** | simulation_launched, user_clicked, user_reported | `phishing-events.ts` | ⏳ |
| 9 | **Documents** | document_uploaded, document_approved, document_expired | `documents-events.ts` | ⏳ |
| 10 | **Committees** | meeting_scheduled, decision_made, followup_created | `committees-events.ts` | ⏳ |
| 11 | **Content Hub** | content_published, content_viewed | `content-events.ts` | ⏳ |
| 12 | **Culture Index** | survey_completed, culture_score_calculated | `culture-events.ts` | ⏳ |
| 13 | **Objectives** | objective_created, objective_progress_updated | `objectives-events.ts` | ⏳ |
| 14 | **Alerts** | alert_triggered, alert_acknowledged | `alerts-events.ts` | ⏳ |

**Checkpoint Week 3-4:**
- [ ] Event Bus Hook مكتمل ومختبر
- [ ] جميع الـ 14 Modules لديها Event Hooks
- [ ] Realtime Subscriptions تعمل
- [ ] Integration Tests ناجحة 100%

---

## 🤖 Phase 2: Automation Rules Engine (الأسابيع 5-8)

### **Week 5-6: Rules Engine Backend** ⚙️

#### Week 5: Core Rules Logic
**المسؤول:** Backend Developer

**Day 17-19: Conditions Evaluator**

1. **Enhanced Conditions Evaluator**
```sql
-- src: Database Function
-- Priority: CRITICAL
-- Time: 12 hours

CREATE OR REPLACE FUNCTION fn_evaluate_conditions_advanced(
  p_conditions JSONB,
  p_payload JSONB,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  matched BOOLEAN,
  evaluation_details JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_condition JSONB;
  v_operator TEXT;
  v_field TEXT;
  v_expected_value TEXT;
  v_actual_value TEXT;
  v_result BOOLEAN;
  v_logic_operator TEXT;
  v_details JSONB := '[]'::jsonb;
  v_all_met BOOLEAN := true;
BEGIN
  -- Get logic operator (AND/OR)
  v_logic_operator := COALESCE(p_conditions->>'logic', 'AND');
  
  -- Evaluate each condition
  FOR v_condition IN SELECT * FROM jsonb_array_elements(p_conditions->'rules')
  LOOP
    v_field := v_condition->>'field';
    v_operator := v_condition->>'operator';
    v_expected_value := v_condition->>'value';
    
    -- Get actual value from payload or metadata
    v_actual_value := COALESCE(
      p_payload->>v_field,
      p_metadata->>v_field
    );
    
    -- Evaluate based on operator
    CASE v_operator
      WHEN 'eq' THEN
        v_result := (v_actual_value = v_expected_value);
        
      WHEN 'neq' THEN
        v_result := (v_actual_value != v_expected_value);
        
      WHEN 'gt' THEN
        v_result := (v_actual_value::NUMERIC > v_expected_value::NUMERIC);
        
      WHEN 'gte' THEN
        v_result := (v_actual_value::NUMERIC >= v_expected_value::NUMERIC);
        
      WHEN 'lt' THEN
        v_result := (v_actual_value::NUMERIC < v_expected_value::NUMERIC);
        
      WHEN 'lte' THEN
        v_result := (v_actual_value::NUMERIC <= v_expected_value::NUMERIC);
        
      WHEN 'contains' THEN
        v_result := (v_actual_value LIKE '%' || v_expected_value || '%');
        
      WHEN 'not_contains' THEN
        v_result := (v_actual_value NOT LIKE '%' || v_expected_value || '%');
        
      WHEN 'starts_with' THEN
        v_result := (v_actual_value LIKE v_expected_value || '%');
        
      WHEN 'ends_with' THEN
        v_result := (v_actual_value LIKE '%' || v_expected_value);
        
      WHEN 'in' THEN
        v_result := (v_actual_value = ANY(string_to_array(v_expected_value, ',')));
        
      WHEN 'not_in' THEN
        v_result := (v_actual_value != ALL(string_to_array(v_expected_value, ',')));
        
      WHEN 'is_null' THEN
        v_result := (v_actual_value IS NULL);
        
      WHEN 'is_not_null' THEN
        v_result := (v_actual_value IS NOT NULL);
        
      ELSE
        RAISE WARNING 'Unknown operator: %', v_operator;
        v_result := false;
    END CASE;
    
    -- Add to details
    v_details := v_details || jsonb_build_object(
      'field', v_field,
      'operator', v_operator,
      'expected', v_expected_value,
      'actual', v_actual_value,
      'result', v_result
    );
    
    -- Apply logic
    IF v_logic_operator = 'AND' AND NOT v_result THEN
      v_all_met := false;
      EXIT;
    ELSIF v_logic_operator = 'OR' AND v_result THEN
      v_all_met := true;
      EXIT;
    END IF;
  END LOOP;
  
  -- Handle OR logic final check
  IF v_logic_operator = 'OR' AND NOT v_all_met THEN
    v_all_met := false;
  END IF;
  
  RETURN QUERY
  SELECT 
    v_all_met,
    jsonb_build_object(
      'logic', v_logic_operator,
      'rules_evaluated', jsonb_array_length(p_conditions->'rules'),
      'conditions_met', v_all_met,
      'details', v_details
    );
END;
$$;
```

---

#### Week 6: Action Schedulers & Retries
**المسؤول:** Backend Developer

**Day 20-22: Advanced Action Executors**

2. **Scheduled Actions & Retry Logic**
```sql
-- Add scheduling columns to automation_rules
ALTER TABLE public.automation_rules
ADD COLUMN execution_mode TEXT DEFAULT 'immediate',
ADD COLUMN schedule_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN retry_config JSONB DEFAULT '{"max_retries": 3, "backoff_seconds": [60, 300, 900]}'::jsonb;

-- Scheduled execution function
CREATE OR REPLACE FUNCTION fn_schedule_rule_execution(
  p_rule_id UUID,
  p_event_id UUID,
  p_schedule_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule_id UUID;
BEGIN
  INSERT INTO public.scheduled_rule_executions (
    rule_id,
    event_id,
    scheduled_at,
    status
  )
  VALUES (
    p_rule_id,
    p_event_id,
    p_schedule_at,
    'pending'
  )
  RETURNING id INTO v_schedule_id;
  
  RETURN v_schedule_id;
END;
$$;

-- Retry failed execution
CREATE OR REPLACE FUNCTION fn_retry_failed_execution(
  p_execution_log_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_log RECORD;
  v_rule RECORD;
  v_retry_count INTEGER;
  v_max_retries INTEGER;
BEGIN
  -- Get execution log
  SELECT * INTO v_log
  FROM public.event_execution_log
  WHERE id = p_execution_log_id
    AND execution_status = 'failed';
    
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get rule and retry config
  SELECT * INTO v_rule
  FROM public.automation_rules
  WHERE id = v_log.rule_id;
  
  v_max_retries := (v_rule.retry_config->>'max_retries')::INTEGER;
  
  -- Count previous retries
  SELECT COUNT(*) INTO v_retry_count
  FROM public.event_execution_log
  WHERE rule_id = v_log.rule_id
    AND event_id = v_log.event_id;
  
  IF v_retry_count >= v_max_retries THEN
    RAISE NOTICE 'Max retries exceeded for rule %', v_log.rule_id;
    RETURN false;
  END IF;
  
  -- Retry execution
  PERFORM fn_execute_automation_rule(
    v_log.rule_id,
    v_log.event_id,
    '{}'::jsonb
  );
  
  RETURN true;
END;
$$;
```

**Checkpoint Week 5-6:**
- [ ] Advanced Conditions Evaluator يعمل
- [ ] Scheduled Execution جاهز
- [ ] Retry Logic مختبر
- [ ] Performance Benchmarks مقبولة

---

### **Week 7-8: Rules UI (Admin)** 🎨

#### Week 7: Rule Builder Components
**المسؤول:** Frontend Developer

**Day 23-26: Core UI Components**

1. **AutomationRulesManager** (Main Dashboard)
```typescript
// src/modules/admin/pages/AutomationRulesManager.tsx
// Priority: CRITICAL
// Time: 12 hours

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Play, Pause, Trash2, Edit } from 'lucide-react';
import { RuleBuilder } from './RuleBuilder';

export function AutomationRulesManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch rules
  const { data: rules, isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Toggle rule
  const toggleRule = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_enabled: !is_enabled })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast('تم تحديث حالة القاعدة');
    },
  });

  // Delete rule
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast('تم حذف القاعدة');
    },
  });

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">قواعد الأتمتة</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          قاعدة جديدة
        </Button>
      </div>

      {(isCreating || editingRule) && (
        <RuleBuilder
          rule={editingRule}
          onClose={() => {
            setIsCreating(false);
            setEditingRule(null);
          }}
          onSave={() => {
            setIsCreating(false);
            setEditingRule(null);
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
          }}
        />
      )}

      <div className="grid gap-4">
        {rules?.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {rule.rule_name}
                    <Badge variant={rule.is_enabled ? 'default' : 'secondary'}>
                      {rule.is_enabled ? 'مفعّلة' : 'معطّلة'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rule.description_ar}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleRule.mutate({ id: rule.id, is_enabled: rule.is_enabled })}
                  >
                    {rule.is_enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingRule(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذه القاعدة؟')) {
                        deleteRule.mutate(rule.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">المشغلات:</span>
                  <div className="font-medium">
                    {rule.trigger_event_types.join(', ')}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">عدد التنفيذات:</span>
                  <div className="font-medium">{rule.execution_count}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">آخر تنفيذ:</span>
                  <div className="font-medium">
                    {rule.last_executed_at 
                      ? new Date(rule.last_executed_at).toLocaleString('ar-SA')
                      : 'لم يتم التنفيذ بعد'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

2. **RuleBuilder** (Rule Creation/Edit UI)
```typescript
// src/modules/admin/pages/RuleBuilder.tsx
// Priority: CRITICAL
// Time: 16 hours

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ConditionEditor } from './ConditionEditor';
import { ActionConfigurator } from './ActionConfigurator';

interface RuleBuilderProps {
  rule?: any;
  onClose: () => void;
  onSave: () => void;
}

export function RuleBuilder({ rule, onClose, onSave }: RuleBuilderProps) {
  const [formData, setFormData] = useState({
    rule_name: rule?.rule_name || '',
    description_ar: rule?.description_ar || '',
    trigger_event_types: rule?.trigger_event_types || [],
    conditions: rule?.conditions || { logic: 'AND', rules: [] },
    actions: rule?.actions || [],
    priority: rule?.priority || 0,
    is_enabled: rule?.is_enabled ?? true,
  });

  const saveRule = useMutation({
    mutationFn: async () => {
      if (rule) {
        // Update existing rule
        const { error } = await supabase
          .from('automation_rules')
          .update(formData)
          .eq('id', rule.id);
        
        if (error) throw error;
      } else {
        // Create new rule
        const { error } = await supabase
          .from('automation_rules')
          .insert([formData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast(rule ? 'تم تحديث القاعدة' : 'تم إنشاء القاعدة');
      onSave();
    },
    onError: (error: any) => {
      toast.error(`فشل: ${error.message}`);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {rule ? 'تعديل القاعدة' : 'قاعدة أتمتة جديدة'}
            </h2>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>اسم القاعدة</Label>
                <Input
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  placeholder="مثال: تسجيل تلقائي عند فشل التقييم"
                />
              </div>

              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  placeholder="وصف مختصر لما تقوم به هذه القاعدة"
                />
              </div>

              <div>
                <Label>أنواع الأحداث المشغلة</Label>
                <Input
                  value={formData.trigger_event_types.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    trigger_event_types: e.target.value.split(',').map(s => s.trim()),
                  })}
                  placeholder="campaign_completed, assessment_failed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  افصل الأنواع بفاصلة
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>الشروط</CardTitle>
            </CardHeader>
            <CardContent>
              <ConditionEditor
                conditions={formData.conditions}
                onChange={(conditions) => setFormData({ ...formData, conditions })}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionConfigurator
                actions={formData.actions}
                onChange={(actions) => setFormData({ ...formData, actions })}
              />
            </CardContent>
          </Card>

          {/* Save Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              onClick={() => saveRule.mutate()}
              disabled={saveRule.isPending}
            >
              {saveRule.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

#### Week 8: Testing & Refinement
**المسؤول:** Frontend + Backend Developer + QA

**Day 27-29: Integration Testing**
- Test all 14 modules' event publishing
- Test automation rules execution
- Performance testing
- Load testing

**Checkpoint Week 7-8:**
- [ ] Rule Builder UI مكتمل
- [ ] جميع Actions Configurators جاهزة
- [ ] Integration Tests ناجحة 100%
- [ ] Performance acceptable

---

## 🎯 Phase 3: Applications Integration & Admin UI (الأسابيع 9-12)

### **Week 9-10: Applications Integration** 📱

#### Applications Event Integration

**Day 30-35: Integrate 6 Applications**

| # | Application | Events | Priority | Time |
|---|-------------|--------|----------|------|
| 1 | **Admin** | admin_settings_updated, user_role_changed | HIGH | 4h |
| 2 | **Awareness** | impact_score_updated, calibration_completed | HIGH | 6h |
| 3 | **LMS** | course_completed, certificate_issued | HIGH | 6h |
| 4 | **Phishing** | simulation_created, user_reported | MEDIUM | 4h |
| 5 | **GRC** | risk_assessed, compliance_updated | MEDIUM | 4h |
| 6 | **Platform** | tenant_created, feature_flag_changed | LOW | 2h |

---

### **Week 11-12: Event Monitor Dashboard** 📊

#### Event Monitor UI Components
**المسؤول:** Frontend Developer

**Day 36-40: Dashboard Components**

1. **EventMonitorDashboard** (Main View)
```typescript
// src/modules/admin/pages/EventMonitorDashboard.tsx
// Priority: HIGH
// Time: 16 hours

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentEvents, getEventStatistics } from '@/lib/events/eventHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEventBus } from '@/lib/events/useEventBus';
import { useEffect } from 'react';

export function EventMonitorDashboard() {
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const { subscribe } = useEventBus();

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['event-statistics'],
    queryFn: () => getEventStatistics(),
    refetchInterval: 30000, // 30s
  });

  // Fetch recent events
  const { data: events, isLoading } = useQuery({
    queryKey: ['recent-events'],
    queryFn: () => fetchRecentEvents(100),
    refetchInterval: 10000, // 10s
  });

  // Subscribe to live events
  useEffect(() => {
    const unsubscribe = subscribe({
      subscriber_module: 'event_monitor',
      event_types: ['*'], // All events
      callback: (event) => {
        setLiveEvents(prev => [event, ...prev].slice(0, 50));
      },
    });

    return unsubscribe;
  }, [subscribe]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">مراقبة الأحداث</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">إجمالي الأحداث</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_events || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.today_events || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">قيد المعالجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats?.processing_events || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">فشل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats?.failed_events || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Timeline */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="live">مباشر</TabsTrigger>
          <TabsTrigger value="policy">السياسات</TabsTrigger>
          <TabsTrigger value="action">الإجراءات</TabsTrigger>
          <TabsTrigger value="kpi">المؤشرات</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2">
          {events?.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge>{event.event_category}</Badge>
                      <span className="font-semibold">{event.event_type}</span>
                      <Badge variant={
                        event.priority === 'critical' ? 'destructive' :
                        event.priority === 'high' ? 'default' : 'secondary'
                      }>
                        {event.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.source_module} • {event.entity_type}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString('ar-SA')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="live">
          {liveEvents.map((event) => (
            <Card key={event.id} className="animate-in slide-in-from-top">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <Badge>{event.event_type}</Badge>
                  <span className="text-sm">{event.source_module}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Checkpoint Week 11-12:**
- [ ] Event Monitor Dashboard مكتمل
- [ ] Live Events تعمل بشكل صحيح
- [ ] Filtering & Search يعمل
- [ ] UI/UX ممتاز

---

## ✅ معايير القبول {#acceptance-criteria}

### Phase 1 Acceptance
```
✅ Database:
  - جميع الجداول الخمسة منشأة مع Indexes
  - RLS Policies مطبقة على جميع الجداول
  - Performance: Query time < 100ms

✅ Backend Functions:
  - fn_publish_event() يعمل بنجاح 100%
  - fn_process_event() ينفذ القواعد بشكل صحيح
  - fn_execute_automation_rule() يدعم جميع Action Types
  - Unit Tests: Coverage > 80%

✅ Event Bus:
  - useEventBus Hook يعمل بدون أخطاء
  - Realtime Subscriptions تعمل < 2s latency
  - All 14 Modules متصلة بنجاح

✅ Integration:
  - كل Module ينشر الأحداث بشكل صحيح
  - Event Flow: Publish → Process → Execute < 5s
```

### Phase 2 Acceptance
```
✅ Rules Engine:
  - Conditions Evaluator يدعم جميع Operators
  - Actions Executors تنفذ بنجاح 100%
  - Scheduling & Retry Logic يعمل

✅ Admin UI:
  - AutomationRulesManager يعرض جميع القواعد
  - RuleBuilder يسمح بإنشاء قواعد معقدة
  - Testing Tool يختبر القواعد قبل التنشيط

✅ Testing:
  - Integration Tests: Pass Rate > 95%
  - Load Testing: 1000 events/min handled
  - Error Rate: < 1%
```

### Phase 3 Acceptance
```
✅ Applications:
  - جميع الـ 6 Applications متصلة
  - Cross-App Workflows تعمل
  - No Breaking Changes في التطبيقات الموجودة

✅ Event Monitor:
  - Dashboard يعرض الإحصائيات الصحيحة
  - Live Events تظهر في الوقت الفعلي
  - Filtering & Search سريع < 500ms

✅ Documentation:
  - API Documentation مكتمل
  - User Guide جاهز (AR)
  - Video Tutorials متوفرة

✅ Performance:
  - Page Load Time < 2s
  - Event Processing < 3s average
  - System Uptime > 99.9%
```

---

## 🧪 خطة الاختبار {#testing-plan}

### Unit Testing
```typescript
// Backend Functions
✅ fn_publish_event()
  - Test 1: Publish valid event → Success
  - Test 2: Publish without tenant → Exception
  - Test 3: Publish with invalid payload → Validation Error

✅ fn_process_event()
  - Test 1: Process with matching rules → Rules executed
  - Test 2: Process with no matching rules → No execution
  - Test 3: Process with failed rule → Logged as failed

✅ fn_execute_automation_rule()
  - Test 1: Execute with valid conditions → Actions executed
  - Test 2: Execute with unmet conditions → No actions
  - Test 3: Execute with invalid action → Error logged

// Frontend Hooks
✅ useEventBus
  - Test 1: publishEvent() → Event created in DB
  - Test 2: subscribe() → Callback fired on matching event
  - Test 3: unsubscribe() → Callback not fired

✅ Integration Hooks (per module)
  - Test 1: logXxxCreatedEvent() → Event published
  - Test 2: Event payload contains correct data
```

### Integration Testing
```bash
# Test Scenario 1: Policy Created → Action Plan Created
1. Create Policy via Gate-F
2. Verify policy_created event published
3. Verify automation rule triggered
4. Verify action plan created in Gate-H

# Test Scenario 2: Campaign Completed → Enroll in Course
1. Mark campaign as completed
2. Verify campaign_completed event published
3. Verify rule matches participants with score < 70
4. Verify participants enrolled in remediation course

# Test Scenario 3: KPI Threshold Breach → Send Notification
1. Update KPI value to breach threshold
2. Verify kpi_threshold_breach event published
3. Verify notification sent to relevant users
4. Verify alert logged
```

### Load Testing
```bash
# Tool: Artillery or k6

# Scenario 1: High Event Volume
- Publish 1000 events/minute
- Measure: Processing time, Error rate, DB load

# Scenario 2: Concurrent Rule Executions
- Trigger 100 rules simultaneously
- Measure: Execution time, Success rate, Resource usage

# Scenario 3: Realtime Performance
- Subscribe 50 clients to live events
- Publish 500 events/minute
- Measure: Latency, Delivery rate, CPU usage
```

### User Acceptance Testing (UAT)
```
Test Group: 5 Admin Users + 10 End Users

Week 11 Tests:
✅ Create automation rule via UI
✅ Edit existing rule
✅ Enable/Disable rule
✅ View rule execution logs
✅ Monitor live events
✅ Filter events by type/category
✅ Export event data

Feedback Collection:
- Survey Form (Google Forms)
- Bug Report System (GitHub Issues)
- Feature Requests
```

---

## ⚠️ إدارة المخاطر {#risk-management}

### Risk Matrix

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| 1 | **Performance Degradation** | Medium | High | • Optimize Indexes<br>• Implement Caching<br>• Load Testing |
| 2 | **Event Loop (Infinite)** | Low | Critical | • Max Recursion Depth Check<br>• Execution Timeout<br>• Circuit Breaker |
| 3 | **Data Inconsistency** | Medium | High | • Transactions<br>• Idempotency Keys<br>• Retry Logic |
| 4 | **Integration Breakage** | Low | High | • Backward Compatibility<br>• Versioning<br>• Feature Flags |
| 5 | **Security Vulnerabilities** | Low | Critical | • RLS Policies<br>• Input Validation<br>• Security Audit |
| 6 | **Scope Creep** | High | Medium | • Strict Scope Control<br>• Phase Gates<br>• Change Request Process |

### Contingency Plans

**If Phase 1 Delayed:**
- Reduce initial module integrations from 14 to 8 (Core only)
- Postpone webhook integrations to Phase 3
- Focus on critical event types only

**If Performance Issues:**
- Implement event batching
- Add message queue (Redis)
- Scale database resources
- Optimize query patterns

**If UI Development Delayed:**
- Launch with basic Event Log view only
- Delay Rule Builder to Phase 4
- Provide API-only access for power users

---

## 📚 الوثائق المطلوبة

### Technical Documentation
```
✅ API Reference (OpenAPI Spec)
✅ Database Schema ERD
✅ Event Types Catalog (100+ events)
✅ Integration Guide (per module)
✅ Troubleshooting Guide
```

### User Documentation (Arabic)
```
✅ Admin User Guide
  - إدارة قواعد الأتمتة
  - مراقبة الأحداث
  - تحليل الأداء

✅ Developer Guide
  - كيفية إضافة أحداث جديدة
  - كيفية إنشاء Integration Hook
  - Best Practices

✅ Video Tutorials
  - إنشاء قاعدة أتمتة
  - مراقبة الأحداث المباشرة
  - Troubleshooting شائع
```

---

## 🎯 مؤشرات النجاح (KPIs)

### Technical KPIs
```
✅ Event Publishing Success Rate: > 99%
✅ Rule Execution Success Rate: > 95%
✅ Average Event Processing Time: < 3 seconds
✅ System Uptime: > 99.9%
✅ Error Rate: < 1%
✅ API Response Time: < 500ms (P95)
```

### Business KPIs
```
✅ Automated Workflows Created: > 20
✅ Manual Tasks Reduced: > 40%
✅ Cross-Module Integration: 100% (14/14 modules)
✅ Admin User Adoption: > 80%
✅ Developer Satisfaction: > 4/5
```

---

## 📅 الجدول الزمني النهائي

| Week | Phase | Deliverables | Status |
|------|-------|--------------|--------|
| 1 | Phase 1 | Database Tables + Core Functions | ⏳ |
| 2 | Phase 1 | Backend Functions + Action Executors | ⏳ |
| 3 | Phase 1 | Event Bus Hook + Event Types | ⏳ |
| 4 | Phase 1 | Module Integration (14 modules) | ⏳ |
| 5 | Phase 2 | Advanced Conditions Evaluator | ⏳ |
| 6 | Phase 2 | Scheduled Actions + Retry Logic | ⏳ |
| 7 | Phase 2 | Rule Builder UI | ⏳ |
| 8 | Phase 2 | Testing & Refinement | ⏳ |
| 9 | Phase 3 | Applications Integration (6 apps) | ⏳ |
| 10 | Phase 3 | Cross-App Workflows | ⏳ |
| 11 | Phase 3 | Event Monitor Dashboard | ⏳ |
| 12 | Phase 3 | Final Testing + Documentation | ⏳ |

**Total Duration:** 12 أسابيع (3 أشهر)  
**Go-Live Date:** Week 13

---

## 🚀 الخطوة التالية

### الآن - بدء التنفيذ الفوري:

```bash
# Step 1: Database Setup (Day 1)
✅ إنشاء جدول system_events
✅ إنشاء جدول automation_rules
✅ إنشاء جدول event_subscriptions
✅ إنشاء جدول event_execution_log
✅ إنشاء جدول integration_webhooks

# Step 2: Core Functions (Day 2-3)
✅ إنشاء fn_publish_event()
✅ إنشاء fn_process_event()
✅ إنشاء fn_execute_automation_rule()

# Step 3: Event Bus (Day 4-5)
✅ إنشاء Event Types
✅ إنشاء useEventBus Hook
✅ اختبار Realtime Subscriptions

# Step 4: First Integration (Day 6)
✅ ربط Gate-F (Policies) كـ Proof of Concept
✅ اختبار Event Flow الكامل
```

**هل أنت جاهز لبدء Phase 1؟** ✅

---

## 📞 الدعم والمتابعة

**Daily Standups:** 10:00 AM (15 min)  
**Weekly Reviews:** Sunday 2:00 PM (1 hour)  
**Phase Gates:** End of Week 4, 8, 12

**Communication Channels:**
- 💬 Slack: #event-system-dev
- 📧 Email: dev-team@romuz.com
- 📋 Project Board: Jira/Linear

---

**🎯 End of Implementation Roadmap v1.0**

**Last Updated:** 2025-11-15  
**Next Review:** End of Week 4 (Phase 1 Completion)
