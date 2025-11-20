-- ============================================================================
-- Event System - Phase 1: Core Backend Functions
-- Migration: Create 3 main functions + 8 action executors + helper
-- ============================================================================

-- ==================================================
-- FUNCTION 1: fn_publish_event() - نشر حدث جديد
-- ==================================================
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
  
  -- Process automation rules (async trigger)
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

COMMENT ON FUNCTION public.fn_publish_event IS 'Publish a new system event and trigger automation rules';

-- ==================================================
-- FUNCTION 2: fn_process_event() - معالجة الأحداث
-- ==================================================
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
    RAISE EXCEPTION 'EVENT_NOT_FOUND: %', p_event_id;
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
        v_event.payload,
        v_event.metadata
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
    status = CASE 
      WHEN v_failed = 0 THEN 'processed'
      WHEN v_executed > 0 THEN 'processed'
      ELSE 'failed'
    END,
    processed_at = now()
  WHERE id = p_event_id;
  
  -- Return summary
  RETURN QUERY
  SELECT v_matched, v_executed, v_failed;
END;
$$;

COMMENT ON FUNCTION public.fn_process_event IS 'Process an event by matching and executing automation rules';

-- ==================================================
-- HELPER: fn_evaluate_conditions() - تقييم الشروط
-- ==================================================
CREATE OR REPLACE FUNCTION public.fn_evaluate_conditions(
  p_conditions JSONB,
  p_payload JSONB,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
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
BEGIN
  -- Get logic operator (AND/OR)
  v_logic_operator := COALESCE(p_conditions->>'logic', 'AND');
  
  -- If no rules, return true
  IF NOT (p_conditions ? 'rules') OR jsonb_array_length(p_conditions->'rules') = 0 THEN
    RETURN true;
  END IF;
  
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
        v_result := (v_actual_value ILIKE '%' || v_expected_value || '%');
        
      WHEN 'not_contains' THEN
        v_result := (v_actual_value NOT ILIKE '%' || v_expected_value || '%');
        
      WHEN 'is_null' THEN
        v_result := (v_actual_value IS NULL);
        
      WHEN 'is_not_null' THEN
        v_result := (v_actual_value IS NOT NULL);
        
      ELSE
        RAISE WARNING 'Unknown operator: %', v_operator;
        v_result := false;
    END CASE;
    
    -- Apply logic
    IF v_logic_operator = 'AND' AND NOT v_result THEN
      RETURN false;
    ELSIF v_logic_operator = 'OR' AND v_result THEN
      RETURN true;
    END IF;
  END LOOP;
  
  -- Final result based on logic
  IF v_logic_operator = 'AND' THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.fn_evaluate_conditions IS 'Evaluate conditions against event payload';

-- ==================================================
-- FUNCTION 3: fn_execute_automation_rule() - تنفيذ القاعدة
-- ==================================================
CREATE OR REPLACE FUNCTION public.fn_execute_automation_rule(
  p_rule_id UUID,
  p_event_id UUID,
  p_event_payload JSONB,
  p_event_metadata JSONB DEFAULT '{}'::jsonb
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
    RAISE EXCEPTION 'RULE_NOT_FOUND: %', p_rule_id;
  END IF;
  
  -- Evaluate conditions
  v_conditions_met := fn_evaluate_conditions(
    v_rule.conditions,
    p_event_payload,
    p_event_metadata
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
        PERFORM fn_action_enroll_in_course(v_action, p_event_payload);
        
      WHEN 'send_notification' THEN
        PERFORM fn_action_send_notification(v_action, p_event_payload);
        
      WHEN 'create_action_plan' THEN
        PERFORM fn_action_create_action_plan(v_action, p_event_payload);
        
      WHEN 'update_kpi' THEN
        PERFORM fn_action_update_kpi(v_action, p_event_payload);
        
      WHEN 'trigger_campaign' THEN
        PERFORM fn_action_trigger_campaign(v_action, p_event_payload);
        
      WHEN 'create_task' THEN
        PERFORM fn_action_create_task(v_action, p_event_payload);
        
      WHEN 'call_webhook' THEN
        PERFORM fn_action_call_webhook(v_action, p_event_payload);
        
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

COMMENT ON FUNCTION public.fn_execute_automation_rule IS 'Execute a single automation rule with all its actions';

-- ==================================================
-- ACTION EXECUTORS (8 functions)
-- ==================================================

-- 1. Enroll in Course
CREATE OR REPLACE FUNCTION public.fn_action_enroll_in_course(
  p_action JSONB,
  p_event_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
  v_user_id UUID;
  v_course_id UUID;
BEGIN
  v_user_id := COALESCE(
    (p_action->>'user_id')::UUID,
    (p_event_payload->>'user_id')::UUID
  );
  v_course_id := (p_action->>'course_id')::UUID;
  
  -- Check if lms_enrollments table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'lms_enrollments'
  ) THEN
    EXECUTE format('
      INSERT INTO public.lms_enrollments (
        tenant_id,
        user_id,
        course_id,
        status
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, user_id, course_id) DO NOTHING
    ', v_tenant_id, v_user_id, v_course_id, 'active');
  ELSE
    RAISE NOTICE 'lms_enrollments table does not exist yet';
  END IF;
END;
$$;

-- 2. Send Notification
CREATE OR REPLACE FUNCTION public.fn_action_send_notification(
  p_action JSONB,
  p_event_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(
    (p_action->>'user_id')::UUID,
    (p_event_payload->>'user_id')::UUID
  );
  
  -- Log notification (simplified - actual implementation would use notification system)
  RAISE NOTICE 'Notification sent to user %: %', v_user_id, p_action->>'message';
  
  -- TODO: Implement actual notification system integration
END;
$$;

-- 3. Create Action Plan
CREATE OR REPLACE FUNCTION public.fn_action_create_action_plan(
  p_action JSONB,
  p_event_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
  v_user_id UUID := app_current_user_id();
BEGIN
  -- Check if gate_h schema exists
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'gate_h') THEN
    EXECUTE format('
      INSERT INTO gate_h.action_items (
        tenant_id,
        source,
        title_ar,
        desc_ar,
        priority,
        status,
        assignee_user_id,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ') USING 
      v_tenant_id,
      'automation',
      p_action->>'title_ar',
      p_action->>'desc_ar',
      COALESCE(p_action->>'priority', 'medium'),
      'new',
      (p_action->>'assignee_user_id')::UUID,
      v_user_id;
  ELSE
    RAISE NOTICE 'gate_h schema does not exist yet';
  END IF;
END;
$$;

-- 4. Update KPI
CREATE OR REPLACE FUNCTION public.fn_action_update_kpi(
  p_action JSONB,
  p_event_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
BEGIN
  -- Check if kpi_catalog table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'kpi_catalog'
  ) THEN
    UPDATE public.kpi_catalog
    SET 
      target_value = (p_action->>'new_target_value')::NUMERIC,
      updated_at = now()
    WHERE tenant_id = v_tenant_id
      AND kpi_key = p_action->>'kpi_key';
  ELSE
    RAISE NOTICE 'kpi_catalog table does not exist yet';
  END IF;
END;
$$;

-- 5. Trigger Campaign
CREATE OR REPLACE FUNCTION public.fn_action_trigger_campaign(
  p_action JSONB,
  p_event_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
BEGIN
  -- Check if awareness_campaigns table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'awareness_campaigns'
  ) THEN
    UPDATE public.awareness_campaigns
    SET 
      status = 'active',
      start_at = now()
    WHERE tenant_id = v_tenant_id
      AND id = (p_action->>'campaign_id')::UUID;
  ELSE
    RAISE NOTICE 'awareness_campaigns table does not exist yet';
  END IF;
END;
$$;

-- 6. Create Task
CREATE OR REPLACE FUNCTION public.fn_action_create_task(
  p_action JSONB,
  p_event_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simplified task creation (would integrate with actual task system)
  RAISE NOTICE 'Task created: %', p_action->>'title';
  
  -- TODO: Implement actual task system integration
END;
$$;

-- 7. Call Webhook
CREATE OR REPLACE FUNCTION public.fn_action_call_webhook(
  p_action JSONB,
  p_event_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook_id UUID;
BEGIN
  v_webhook_id := (p_action->>'webhook_id')::UUID;
  
  -- Log webhook call (actual HTTP call done by edge function)
  RAISE NOTICE 'Webhook % triggered', v_webhook_id;
  
  -- TODO: Implement actual webhook HTTP call via edge function
END;
$$;

-- ==================================================
-- UTILITY: Get Event Statistics
-- ==================================================
CREATE OR REPLACE FUNCTION public.fn_get_event_statistics(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  total_events BIGINT,
  today_events BIGINT,
  processing_events BIGINT,
  failed_events BIGINT,
  by_category JSONB,
  by_priority JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID := app_current_tenant_id();
  v_date_from TIMESTAMPTZ;
  v_date_to TIMESTAMPTZ;
BEGIN
  v_date_from := COALESCE(p_date_from, now() - INTERVAL '30 days');
  v_date_to := COALESCE(p_date_to, now());
  
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_events,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::BIGINT as today_events,
    COUNT(*) FILTER (WHERE status = 'processing')::BIGINT as processing_events,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_events,
    (
      SELECT jsonb_object_agg(event_category, cnt)
      FROM (
        SELECT event_category, COUNT(*)::INTEGER as cnt
        FROM public.system_events
        WHERE tenant_id = v_tenant_id
          AND created_at BETWEEN v_date_from AND v_date_to
        GROUP BY event_category
      ) cat
    ) as by_category,
    (
      SELECT jsonb_object_agg(priority, cnt)
      FROM (
        SELECT priority, COUNT(*)::INTEGER as cnt
        FROM public.system_events
        WHERE tenant_id = v_tenant_id
          AND created_at BETWEEN v_date_from AND v_date_to
        GROUP BY priority
      ) pri
    ) as by_priority
  FROM public.system_events
  WHERE tenant_id = v_tenant_id
    AND created_at BETWEEN v_date_from AND v_date_to;
END;
$$;

COMMENT ON FUNCTION public.fn_get_event_statistics IS 'Get aggregated event statistics for the current tenant';

-- ==================================================
-- END OF BACKEND FUNCTIONS MIGRATION
-- ==================================================