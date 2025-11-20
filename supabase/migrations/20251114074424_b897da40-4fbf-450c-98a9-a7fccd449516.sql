-- ============================================================================
-- Gate-H: D1 Standard Upgrade - Part 2 (RPC Functions)
-- ============================================================================
-- Saved Views, Bulk Operations, Import Functions

-- ============================================================
-- 1) Saved Views Functions
-- ============================================================

-- Save or update a view
CREATE OR REPLACE FUNCTION public.fn_gate_h_save_view(
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
    UPDATE public.gate_h_action_views
    SET is_default = false
    WHERE tenant_id = v_tenant_id
      AND user_id = v_user_id
      AND is_default = true;
  END IF;
  
  -- Upsert view
  RETURN QUERY
  INSERT INTO public.gate_h_action_views (
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
    gate_h_action_views.id,
    gate_h_action_views.view_name,
    gate_h_action_views.description_ar,
    gate_h_action_views.filters,
    gate_h_action_views.sort_config,
    gate_h_action_views.is_default,
    gate_h_action_views.is_shared,
    gate_h_action_views.created_at,
    gate_h_action_views.updated_at;
END;
$$;

-- List all views for current user
CREATE OR REPLACE FUNCTION public.fn_gate_h_list_views()
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
  FROM public.gate_h_action_views v
  WHERE v.tenant_id = v_tenant_id
    AND (v.user_id = v_user_id OR v.is_shared = true)
  ORDER BY v.is_default DESC, v.view_name;
END;
$$;

-- Delete a view
CREATE OR REPLACE FUNCTION public.fn_gate_h_delete_view(p_view_id UUID)
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
  
  DELETE FROM public.gate_h_action_views
  WHERE id = p_view_id
    AND tenant_id = v_tenant_id
    AND user_id = v_user_id
  RETURNING true INTO v_deleted;
  
  RETURN COALESCE(v_deleted, false);
END;
$$;

-- ============================================================
-- 2) Bulk Operations Functions
-- ============================================================

-- Bulk update action status
CREATE OR REPLACE FUNCTION public.fn_gate_h_bulk_update_status(
  p_action_ids UUID[],
  p_new_status TEXT,
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
  v_action_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_h_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    action_ids,
    operation_data
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'status_update',
    p_action_ids,
    jsonb_build_object('newStatus', p_new_status, 'noteAr', p_note_ar)
  )
  RETURNING id INTO v_operation_id;
  
  -- Update each action
  FOREACH v_action_id IN ARRAY p_action_ids
  LOOP
    BEGIN
      -- Update action status
      UPDATE gate_h.action_items
      SET 
        status = p_new_status::gate_h.action_status,
        updated_at = now(),
        updated_by = v_user_id
      WHERE id = v_action_id
        AND tenant_id = v_tenant_id;
      
      -- Add status change update if note provided
      IF p_note_ar IS NOT NULL THEN
        INSERT INTO gate_h.action_updates (
          tenant_id,
          action_id,
          update_type,
          body_ar,
          new_status,
          created_by
        )
        VALUES (
          v_tenant_id,
          v_action_id,
          'status_change',
          p_note_ar,
          p_new_status::gate_h.action_status,
          v_user_id
        );
      END IF;
      
      v_affected_count := v_affected_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'action_id', v_action_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_h_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_action_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_action_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- Bulk assign actions
CREATE OR REPLACE FUNCTION public.fn_gate_h_bulk_assign(
  p_action_ids UUID[],
  p_assignee_user_id UUID,
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
  v_action_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_h_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    action_ids,
    operation_data
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'assign',
    p_action_ids,
    jsonb_build_object('assigneeUserId', p_assignee_user_id, 'noteAr', p_note_ar)
  )
  RETURNING id INTO v_operation_id;
  
  -- Update each action
  FOREACH v_action_id IN ARRAY p_action_ids
  LOOP
    BEGIN
      UPDATE gate_h.action_items
      SET 
        assignee_user_id = p_assignee_user_id,
        updated_at = now(),
        updated_by = v_user_id
      WHERE id = v_action_id
        AND tenant_id = v_tenant_id;
      
      -- Add comment if provided
      IF p_note_ar IS NOT NULL THEN
        INSERT INTO gate_h.action_updates (
          tenant_id,
          action_id,
          update_type,
          body_ar,
          created_by
        )
        VALUES (
          v_tenant_id,
          v_action_id,
          'comment',
          p_note_ar,
          v_user_id
        );
      END IF;
      
      v_affected_count := v_affected_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'action_id', v_action_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_h_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_action_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_action_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- Bulk delete actions
CREATE OR REPLACE FUNCTION public.fn_gate_h_bulk_delete(
  p_action_ids UUID[]
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
  v_action_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_h_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    action_ids,
    operation_data
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'delete',
    p_action_ids,
    '{}'::jsonb
  )
  RETURNING id INTO v_operation_id;
  
  -- Delete each action
  FOREACH v_action_id IN ARRAY p_action_ids
  LOOP
    BEGIN
      DELETE FROM gate_h.action_items
      WHERE id = v_action_id
        AND tenant_id = v_tenant_id;
      
      v_affected_count := v_affected_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'action_id', v_action_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_h_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_action_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_action_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- ============================================================
-- 3) Import Functions
-- ============================================================

-- Import actions from JSON array
CREATE OR REPLACE FUNCTION public.fn_gate_h_import_actions(
  p_filename TEXT,
  p_format TEXT,
  p_actions JSONB
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
  v_action JSONB;
  v_row_num INTEGER := 0;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  v_total_rows := jsonb_array_length(p_actions);
  
  -- Create import history record
  INSERT INTO public.gate_h_import_history (
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
  
  -- Process each action
  FOR v_action IN SELECT * FROM jsonb_array_elements(p_actions)
  LOOP
    v_row_num := v_row_num + 1;
    
    BEGIN
      -- Insert action
      INSERT INTO gate_h.action_items (
        tenant_id,
        source,
        source_reco_id,
        kpi_key,
        dim_key,
        dim_value,
        title_ar,
        desc_ar,
        priority,
        status,
        effort,
        sla_days,
        due_date,
        owner_user_id,
        assignee_user_id,
        tags,
        created_by,
        updated_by
      )
      VALUES (
        v_tenant_id,
        COALESCE((v_action->>'source')::gate_h.action_source, 'manual'),
        (v_action->>'sourceRecoId')::UUID,
        v_action->>'kpiKey',
        v_action->>'dimKey',
        v_action->>'dimValue',
        v_action->>'titleAr',
        v_action->>'descAr',
        COALESCE((v_action->>'priority')::gate_h.action_priority, 'medium'),
        COALESCE((v_action->>'status')::gate_h.action_status, 'new'),
        (v_action->>'effort')::gate_h.action_effort,
        (v_action->>'slaDays')::INTEGER,
        (v_action->>'dueDate')::DATE,
        v_user_id,
        (v_action->>'assigneeUserId')::UUID,
        CASE 
          WHEN v_action->'tags' IS NOT NULL 
          THEN ARRAY(SELECT jsonb_array_elements_text(v_action->'tags'))
          ELSE NULL
        END,
        v_user_id,
        v_user_id
      );
      
      v_success_count := v_success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'row', v_row_num,
        'data', v_action,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update import history
  UPDATE public.gate_h_import_history
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
CREATE OR REPLACE FUNCTION public.fn_gate_h_get_import_history(p_limit INTEGER DEFAULT 20)
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
  FROM public.gate_h_import_history h
  WHERE h.tenant_id = v_tenant_id
    AND h.user_id = v_user_id
  ORDER BY h.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- 4) Comments
-- ============================================================
COMMENT ON FUNCTION public.fn_gate_h_save_view IS 'Gate-H: Save or update a filter view (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_h_list_views IS 'Gate-H: List all saved views for current user (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_h_delete_view IS 'Gate-H: Delete a saved view (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_h_bulk_update_status IS 'Gate-H: Bulk update action status (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_h_bulk_assign IS 'Gate-H: Bulk assign actions to user (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_h_bulk_delete IS 'Gate-H: Bulk delete actions (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_h_import_actions IS 'Gate-H: Import actions from JSON (D1 Standard)';
COMMENT ON FUNCTION public.fn_gate_h_get_import_history IS 'Gate-H: Get import history (D1 Standard)';