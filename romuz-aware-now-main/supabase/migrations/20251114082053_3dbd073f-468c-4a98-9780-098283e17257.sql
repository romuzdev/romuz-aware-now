-- ============================================================================
-- Gate-F D1 Standard Upgrade: Part 2 - RPC Functions
-- ============================================================================

-- ============================================================================
-- Function 1: fn_gate_f_save_view (Upsert Saved View)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_f_save_view(
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
  v_user_id := auth.uid();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  
  -- If setting as default, unset other defaults for this user
  IF p_is_default THEN
    UPDATE public.gate_f_policy_views
    SET is_default = false
    WHERE tenant_id = v_tenant_id
      AND user_id = v_user_id
      AND is_default = true;
  END IF;
  
  -- Upsert view
  RETURN QUERY
  INSERT INTO public.gate_f_policy_views (
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
    gate_f_policy_views.id,
    gate_f_policy_views.view_name,
    gate_f_policy_views.description_ar,
    gate_f_policy_views.filters,
    gate_f_policy_views.sort_config,
    gate_f_policy_views.is_default,
    gate_f_policy_views.is_shared,
    gate_f_policy_views.created_at,
    gate_f_policy_views.updated_at;
END;
$$;

-- ============================================================================
-- Function 2: fn_gate_f_list_views (List Saved Views)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_f_list_views()
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
  v_user_id := auth.uid();
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
  FROM public.gate_f_policy_views v
  WHERE v.tenant_id = v_tenant_id
    AND (v.user_id = v_user_id OR v.is_shared = true)
  ORDER BY v.is_default DESC, v.view_name;
END;
$$;

-- ============================================================================
-- Function 3: fn_gate_f_delete_view (Delete Saved View)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_f_delete_view(p_view_id UUID)
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
  v_user_id := auth.uid();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  DELETE FROM public.gate_f_policy_views
  WHERE id = p_view_id
    AND tenant_id = v_tenant_id
    AND user_id = v_user_id
  RETURNING true INTO v_deleted;
  
  RETURN COALESCE(v_deleted, false);
END;
$$;

-- ============================================================================
-- Function 4: fn_gate_f_bulk_update_status (Bulk Status Update)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_f_bulk_update_status(
  p_policy_ids UUID[],
  p_new_status TEXT
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
  v_policy_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Validate status
  IF p_new_status NOT IN ('draft', 'active', 'archived') THEN
    RAISE EXCEPTION 'INVALID_STATUS: Must be draft, active, or archived';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_f_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    policy_ids,
    operation_data,
    status
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'status_update',
    p_policy_ids,
    jsonb_build_object('newStatus', p_new_status),
    'processing'
  )
  RETURNING id INTO v_operation_id;
  
  -- Update each policy
  FOREACH v_policy_id IN ARRAY p_policy_ids
  LOOP
    BEGIN
      UPDATE public.policies
      SET 
        status = p_new_status,
        updated_at = now()
      WHERE id = v_policy_id
        AND tenant_id = v_tenant_id;
      
      IF FOUND THEN
        v_affected_count := v_affected_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'policy_id', v_policy_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_f_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_policy_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_policy_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- ============================================================================
-- Function 5: fn_gate_f_bulk_delete (Bulk Delete Policies)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_f_bulk_delete(p_policy_ids UUID[])
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
  v_policy_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_f_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    policy_ids,
    operation_data,
    status
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'delete',
    p_policy_ids,
    '{}'::jsonb,
    'processing'
  )
  RETURNING id INTO v_operation_id;
  
  -- Delete each policy
  FOREACH v_policy_id IN ARRAY p_policy_ids
  LOOP
    BEGIN
      DELETE FROM public.policies
      WHERE id = v_policy_id
        AND tenant_id = v_tenant_id;
      
      IF FOUND THEN
        v_affected_count := v_affected_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'policy_id', v_policy_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_f_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_policy_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_policy_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- ============================================================================
-- Function 6: fn_gate_f_import_policies (Import Policies from JSON/CSV)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_f_import_policies(
  p_filename TEXT,
  p_format TEXT,
  p_policies JSONB
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
  v_policy JSONB;
  v_row_num INTEGER := 0;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  v_total_rows := jsonb_array_length(p_policies);
  
  -- Create import history record
  INSERT INTO public.gate_f_import_history (
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
  
  -- Process each policy
  FOR v_policy IN SELECT * FROM jsonb_array_elements(p_policies)
  LOOP
    v_row_num := v_row_num + 1;
    
    BEGIN
      -- Insert or update policy
      INSERT INTO public.policies (
        tenant_id,
        code,
        title,
        owner,
        status,
        category,
        last_review_date,
        next_review_date
      )
      VALUES (
        v_tenant_id,
        v_policy->>'code',
        v_policy->>'title',
        v_policy->>'owner',
        COALESCE((v_policy->>'status')::TEXT, 'draft'),
        v_policy->>'category',
        (v_policy->>'lastReviewDate')::DATE,
        (v_policy->>'nextReviewDate')::DATE
      )
      ON CONFLICT (tenant_id, code)
      DO UPDATE SET
        title = EXCLUDED.title,
        owner = EXCLUDED.owner,
        status = EXCLUDED.status,
        category = EXCLUDED.category,
        last_review_date = EXCLUDED.last_review_date,
        next_review_date = EXCLUDED.next_review_date,
        updated_at = now();
      
      v_success_count := v_success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'row', v_row_num,
        'data', v_policy,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update import history
  UPDATE public.gate_f_import_history
  SET 
    success_count = v_success_count,
    error_count = v_error_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_success_count = 0 THEN 'failed'
      ELSE 'completed'
    END
  WHERE id = v_import_id;
  
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

-- ============================================================================
-- Function 7: fn_gate_f_get_import_history (Get Import History)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_f_get_import_history(p_limit INTEGER DEFAULT 20)
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
  v_user_id := auth.uid();
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
  FROM public.gate_f_import_history h
  WHERE h.tenant_id = v_tenant_id
    AND h.user_id = v_user_id
  ORDER BY h.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- Function 8: fn_gate_f_get_bulk_operations (Get Bulk Operations History)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_f_get_bulk_operations(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  operation_type TEXT,
  policy_count INTEGER,
  affected_count INTEGER,
  errors JSONB,
  status TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  RETURN QUERY
  SELECT 
    bo.id,
    bo.operation_type,
    array_length(bo.policy_ids, 1) as policy_count,
    bo.affected_count,
    bo.errors,
    bo.status,
    bo.created_at,
    bo.completed_at
  FROM public.gate_f_bulk_operations bo
  WHERE bo.tenant_id = v_tenant_id
    AND bo.user_id = v_user_id
  ORDER BY bo.created_at DESC
  LIMIT p_limit;
END;
$$;