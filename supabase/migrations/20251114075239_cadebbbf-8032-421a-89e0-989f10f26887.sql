-- ============================================================================
-- Gate-E: D1 Standard Upgrade - Part 2 (RPC Functions)
-- ============================================================================
-- Saved Alert Views, Bulk Operations, Import Functions

-- ============================================================
-- 1) Saved Alert Views Functions
-- ============================================================

-- Save or update an alert view
CREATE OR REPLACE FUNCTION public.fn_gate_e_save_alert_view(
  p_view_name TEXT,
  p_description_ar TEXT,
  p_filters JSONB,
  p_sort_config JSONB,
  p_is_default BOOLEAN,
  p_is_shared BOOLEAN
)
RETURNS TABLE(
  id UUID,
  view_name TEXT,
  description_ar TEXT,
  filters JSONB,
  sort_config JSONB,
  is_default BOOLEAN,
  is_shared BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  
  -- If setting as default, unset other defaults for this user
  IF p_is_default THEN
    UPDATE public.gate_e_alert_views
    SET is_default = false
    WHERE tenant_id = v_tenant_id
      AND user_id = v_user_id
      AND is_default = true;
  END IF;
  
  -- Upsert view
  RETURN QUERY
  INSERT INTO public.gate_e_alert_views (
    tenant_id,
    user_id,
    view_name,
    description_ar,
    filters,
    sort_config,
    is_default,
    is_shared
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    p_view_name,
    p_description_ar,
    p_filters,
    p_sort_config,
    p_is_default,
    p_is_shared
  )
  ON CONFLICT (tenant_id, user_id, view_name)
  DO UPDATE SET
    description_ar = EXCLUDED.description_ar,
    filters = EXCLUDED.filters,
    sort_config = EXCLUDED.sort_config,
    is_default = EXCLUDED.is_default,
    is_shared = EXCLUDED.is_shared,
    updated_at = now()
  RETURNING 
    gate_e_alert_views.id,
    gate_e_alert_views.view_name,
    gate_e_alert_views.description_ar,
    gate_e_alert_views.filters,
    gate_e_alert_views.sort_config,
    gate_e_alert_views.is_default,
    gate_e_alert_views.is_shared,
    gate_e_alert_views.created_at,
    gate_e_alert_views.updated_at;
END;
$$;

-- List all alert views for current user
CREATE OR REPLACE FUNCTION public.fn_gate_e_list_alert_views()
RETURNS TABLE(
  id UUID,
  view_name TEXT,
  description_ar TEXT,
  filters JSONB,
  sort_config JSONB,
  is_default BOOLEAN,
  is_shared BOOLEAN,
  is_owner BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  RETURN QUERY
  SELECT 
    v.id,
    v.view_name,
    v.description_ar,
    v.filters,
    v.sort_config,
    v.is_default,
    v.is_shared,
    (v.user_id = v_user_id) as is_owner,
    v.created_at,
    v.updated_at
  FROM public.gate_e_alert_views v
  WHERE v.tenant_id = v_tenant_id
    AND (v.user_id = v_user_id OR v.is_shared = true)
  ORDER BY v.is_default DESC, v.view_name;
END;
$$;

-- Delete an alert view
CREATE OR REPLACE FUNCTION public.fn_gate_e_delete_alert_view(p_view_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_deleted BOOLEAN := false;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  DELETE FROM public.gate_e_alert_views
  WHERE id = p_view_id
    AND tenant_id = v_tenant_id
    AND user_id = v_user_id
  RETURNING true INTO v_deleted;
  
  RETURN COALESCE(v_deleted, false);
END;
$$;

-- ============================================================
-- 2) Bulk Alert Operations Functions
-- ============================================================

-- Bulk activate/deactivate alert rules
CREATE OR REPLACE FUNCTION public.fn_gate_e_bulk_toggle_rules(
  p_rule_ids UUID[],
  p_is_active BOOLEAN,
  p_note_ar TEXT DEFAULT NULL
)
RETURNS TABLE(
  operation_id UUID,
  affected_count INTEGER,
  status TEXT,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_operation_id UUID;
  v_affected_count INTEGER := 0;
  v_errors JSONB := '[]'::jsonb;
  v_rule_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_e_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    alert_rule_ids,
    operation_data
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    CASE WHEN p_is_active THEN 'activate' ELSE 'deactivate' END,
    p_rule_ids,
    jsonb_build_object('isActive', p_is_active, 'noteAr', p_note_ar)
  )
  RETURNING id INTO v_operation_id;
  
  -- Update each rule
  FOREACH v_rule_id IN ARRAY p_rule_ids
  LOOP
    BEGIN
      UPDATE observability.alert_rules
      SET 
        is_active = p_is_active,
        updated_at = now()
      WHERE id = v_rule_id
        AND tenant_id = v_tenant_id;
      
      v_affected_count := v_affected_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'rule_id', v_rule_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_e_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_rule_ids, 1) THEN 'partial'
      ELSE 'completed'
    END,
    completed_at = now()
  WHERE id = v_operation_id;
  
  -- Return result
  RETURN QUERY
  SELECT 
    v_operation_id,
    v_affected_count,
    CASE 
      WHEN v_affected_count = 0 THEN 'failed'::TEXT
      WHEN v_affected_count < array_length(p_rule_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- Bulk update severity
CREATE OR REPLACE FUNCTION public.fn_gate_e_bulk_update_severity(
  p_rule_ids UUID[],
  p_severity TEXT,
  p_note_ar TEXT DEFAULT NULL
)
RETURNS TABLE(
  operation_id UUID,
  affected_count INTEGER,
  status TEXT,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_operation_id UUID;
  v_affected_count INTEGER := 0;
  v_errors JSONB := '[]'::jsonb;
  v_rule_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_e_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    alert_rule_ids,
    operation_data
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'update_severity',
    p_rule_ids,
    jsonb_build_object('severity', p_severity, 'noteAr', p_note_ar)
  )
  RETURNING id INTO v_operation_id;
  
  -- Update each rule
  FOREACH v_rule_id IN ARRAY p_rule_ids
  LOOP
    BEGIN
      UPDATE observability.alert_rules
      SET 
        severity = p_severity::observability.alert_severity,
        updated_at = now()
      WHERE id = v_rule_id
        AND tenant_id = v_tenant_id;
      
      v_affected_count := v_affected_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'rule_id', v_rule_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_e_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_rule_ids, 1) THEN 'partial'
      ELSE 'completed'
    END,
    completed_at = now()
  WHERE id = v_operation_id;
  
  RETURN QUERY
  SELECT 
    v_operation_id,
    v_affected_count,
    CASE 
      WHEN v_affected_count = 0 THEN 'failed'::TEXT
      WHEN v_affected_count < array_length(p_rule_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- Bulk delete alert rules
CREATE OR REPLACE FUNCTION public.fn_gate_e_bulk_delete_rules(
  p_rule_ids UUID[]
)
RETURNS TABLE(
  operation_id UUID,
  affected_count INTEGER,
  status TEXT,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_operation_id UUID;
  v_affected_count INTEGER := 0;
  v_errors JSONB := '[]'::jsonb;
  v_rule_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_e_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    alert_rule_ids,
    operation_data
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'delete',
    p_rule_ids,
    '{}'::jsonb
  )
  RETURNING id INTO v_operation_id;
  
  -- Delete each rule
  FOREACH v_rule_id IN ARRAY p_rule_ids
  LOOP
    BEGIN
      DELETE FROM observability.alert_rules
      WHERE id = v_rule_id
        AND tenant_id = v_tenant_id;
      
      v_affected_count := v_affected_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'rule_id', v_rule_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_e_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_rule_ids, 1) THEN 'partial'
      ELSE 'completed'
    END,
    completed_at = now()
  WHERE id = v_operation_id;
  
  RETURN QUERY
  SELECT 
    v_operation_id,
    v_affected_count,
    CASE 
      WHEN v_affected_count = 0 THEN 'failed'::TEXT
      WHEN v_affected_count < array_length(p_rule_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- ============================================================
-- 3) Import Alert Rules Functions
-- ============================================================

-- Import alert rules from JSON array
CREATE OR REPLACE FUNCTION public.fn_gate_e_import_rules(
  p_filename TEXT,
  p_format TEXT,
  p_rules JSONB
)
RETURNS TABLE(
  import_id UUID,
  total_rows INTEGER,
  success_count INTEGER,
  error_count INTEGER,
  errors JSONB,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_import_id UUID;
  v_total_rows INTEGER;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::jsonb;
  v_rule JSONB;
  v_row_num INTEGER := 0;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  v_total_rows := jsonb_array_length(p_rules);
  
  -- Create import history record
  INSERT INTO public.gate_e_import_history (
    tenant_id,
    user_id,
    filename,
    format,
    total_rows,
    status
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    p_filename,
    p_format,
    v_total_rows,
    'processing'
  )
  RETURNING id INTO v_import_id;
  
  -- Process each rule
  FOR v_rule IN SELECT * FROM jsonb_array_elements(p_rules)
  LOOP
    v_row_num := v_row_num + 1;
    
    BEGIN
      -- Insert alert rule
      INSERT INTO observability.alert_rules (
        tenant_id,
        name_ar,
        description_ar,
        category,
        severity,
        condition,
        threshold_config,
        notification_channels,
        cooldown_minutes,
        is_active,
        created_by,
        updated_by
      )
      VALUES (
        v_tenant_id,
        v_rule->>'nameAr',
        v_rule->>'descriptionAr',
        (v_rule->>'category')::observability.alert_category,
        COALESCE((v_rule->>'severity')::observability.alert_severity, 'medium'),
        v_rule->'condition',
        v_rule->'thresholdConfig',
        CASE 
          WHEN v_rule->'notificationChannels' IS NOT NULL 
          THEN ARRAY(SELECT jsonb_array_elements_text(v_rule->'notificationChannels'))
          ELSE ARRAY[]::TEXT[]
        END,
        COALESCE((v_rule->>'cooldownMinutes')::INTEGER, 60),
        COALESCE((v_rule->>'isActive')::BOOLEAN, true),
        v_user_id,
        v_user_id
      );
      
      v_success_count := v_success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'row', v_row_num,
        'data', v_rule,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update import history
  UPDATE public.gate_e_import_history
  SET 
    success_count = v_success_count,
    error_count = v_error_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_success_count = 0 THEN 'failed'
      ELSE 'completed'
    END
  WHERE id = v_import_id;
  
  -- Return result
  RETURN QUERY
  SELECT 
    v_import_id,
    v_total_rows,
    v_success_count,
    v_error_count,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    CASE 
      WHEN v_success_count = 0 THEN 'failed'::TEXT
      ELSE 'completed'::TEXT
    END;
END;
$$;

-- Get import history
CREATE OR REPLACE FUNCTION public.fn_gate_e_get_import_history(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  filename TEXT,
  format TEXT,
  total_rows INTEGER,
  success_count INTEGER,
  error_count INTEGER,
  errors JSONB,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  RETURN QUERY
  SELECT 
    h.id,
    h.filename,
    h.format,
    h.total_rows,
    h.success_count,
    h.error_count,
    h.errors,
    h.status,
    h.created_at
  FROM public.gate_e_import_history h
  WHERE h.tenant_id = v_tenant_id
    AND h.user_id = v_user_id
  ORDER BY h.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- 4) Comments
-- ============================================================
COMMENT ON FUNCTION public.fn_gate_e_save_alert_view IS 'Gate-E: Save or update an alert view (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_e_list_alert_views IS 'Gate-E: List all saved alert views for current user (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_e_delete_alert_view IS 'Gate-E: Delete a saved alert view (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_e_bulk_toggle_rules IS 'Gate-E: Bulk activate/deactivate alert rules (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_e_bulk_update_severity IS 'Gate-E: Bulk update alert rule severity (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_e_bulk_delete_rules IS 'Gate-E: Bulk delete alert rules (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_e_import_rules IS 'Gate-E: Import alert rules from JSON (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_e_get_import_history IS 'Gate-E: Get alert rules import history (D1 Standard)';