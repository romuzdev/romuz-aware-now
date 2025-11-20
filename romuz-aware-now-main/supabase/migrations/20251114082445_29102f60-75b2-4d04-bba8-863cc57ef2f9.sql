-- ============================================================================
-- Gate-K D1 Standard Upgrade: Part 2 - RPC Functions
-- ============================================================================

-- ============================================================================
-- Function 1: fn_gate_k_save_view (Upsert Saved View)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_k_save_view(
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
    UPDATE public.gate_k_job_views
    SET is_default = false
    WHERE tenant_id = v_tenant_id
      AND user_id = v_user_id
      AND is_default = true;
  END IF;
  
  -- Upsert view
  RETURN QUERY
  INSERT INTO public.gate_k_job_views (
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
    gate_k_job_views.id,
    gate_k_job_views.view_name,
    gate_k_job_views.description_ar,
    gate_k_job_views.filters,
    gate_k_job_views.sort_config,
    gate_k_job_views.is_default,
    gate_k_job_views.is_shared,
    gate_k_job_views.created_at,
    gate_k_job_views.updated_at;
END;
$$;

-- ============================================================================
-- Function 2: fn_gate_k_list_views (List Saved Views)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_k_list_views()
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
  FROM public.gate_k_job_views v
  WHERE v.tenant_id = v_tenant_id
    AND (v.user_id = v_user_id OR v.is_shared = true)
  ORDER BY v.is_default DESC, v.view_name;
END;
$$;

-- ============================================================================
-- Function 3: fn_gate_k_delete_view (Delete Saved View)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_k_delete_view(p_view_id UUID)
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
  
  DELETE FROM public.gate_k_job_views
  WHERE id = p_view_id
    AND tenant_id = v_tenant_id
    AND user_id = v_user_id
  RETURNING true INTO v_deleted;
  
  RETURN COALESCE(v_deleted, false);
END;
$$;

-- ============================================================================
-- Function 4: fn_gate_k_bulk_toggle_jobs (Bulk Enable/Disable Jobs)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_k_bulk_toggle_jobs(
  p_job_ids UUID[],
  p_is_enabled BOOLEAN
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
  v_job_id UUID;
  v_operation_type TEXT;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  v_operation_type := CASE WHEN p_is_enabled THEN 'enable_jobs' ELSE 'disable_jobs' END;
  
  -- Create bulk operation record
  INSERT INTO public.gate_k_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    target_ids,
    operation_data,
    status
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    v_operation_type,
    p_job_ids,
    jsonb_build_object('isEnabled', p_is_enabled),
    'processing'
  )
  RETURNING id INTO v_operation_id;
  
  -- Update each job
  FOREACH v_job_id IN ARRAY p_job_ids
  LOOP
    BEGIN
      UPDATE public.system_jobs
      SET 
        is_enabled = p_is_enabled,
        updated_at = now()
      WHERE id = v_job_id
        AND (tenant_id = v_tenant_id OR tenant_id IS NULL);
      
      IF FOUND THEN
        v_affected_count := v_affected_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'job_id', v_job_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_k_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_job_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_job_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- ============================================================================
-- Function 5: fn_gate_k_bulk_trigger_jobs (Bulk Trigger Jobs)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_k_bulk_trigger_jobs(p_job_ids UUID[])
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
  v_job_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_k_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    target_ids,
    operation_data,
    status
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'trigger_jobs',
    p_job_ids,
    '{}'::jsonb,
    'processing'
  )
  RETURNING id INTO v_operation_id;
  
  -- Trigger each job
  FOREACH v_job_id IN ARRAY p_job_ids
  LOOP
    BEGIN
      -- Insert job run with 'queued' status
      INSERT INTO public.system_job_runs (
        tenant_id,
        job_id,
        status,
        trigger_source,
        triggered_by_user_id,
        started_at
      )
      VALUES (
        v_tenant_id,
        v_job_id,
        'queued',
        'manual',
        v_user_id,
        now()
      );
      
      v_affected_count := v_affected_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'job_id', v_job_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_k_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_job_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_job_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- ============================================================================
-- Function 6: fn_gate_k_bulk_delete_runs (Bulk Delete Job Runs)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_k_bulk_delete_runs(p_run_ids UUID[])
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
  v_run_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_k_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    target_ids,
    operation_data,
    status
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'delete_runs',
    p_run_ids,
    '{}'::jsonb,
    'processing'
  )
  RETURNING id INTO v_operation_id;
  
  -- Delete each run
  FOREACH v_run_id IN ARRAY p_run_ids
  LOOP
    BEGIN
      DELETE FROM public.system_job_runs
      WHERE id = v_run_id
        AND tenant_id = v_tenant_id;
      
      IF FOUND THEN
        v_affected_count := v_affected_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'run_id', v_run_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_k_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_run_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_run_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- ============================================================================
-- Function 7: fn_gate_k_get_import_history (Get Import History)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_k_get_import_history(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  filename TEXT,
  format TEXT,
  import_type TEXT,
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
    h.import_type,
    h.total_rows,
    h.success_count,
    h.error_count,
    h.errors,
    h.status,
    h.created_at
  FROM public.gate_k_import_history h
  WHERE h.tenant_id = v_tenant_id
    AND h.user_id = v_user_id
  ORDER BY h.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- Function 8: fn_gate_k_get_bulk_operations (Get Bulk Operations History)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_k_get_bulk_operations(p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  operation_type TEXT,
  target_count INTEGER,
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
    array_length(bo.target_ids, 1) as target_count,
    bo.affected_count,
    bo.errors,
    bo.status,
    bo.created_at,
    bo.completed_at
  FROM public.gate_k_bulk_operations bo
  WHERE bo.tenant_id = v_tenant_id
    AND bo.user_id = v_user_id
  ORDER BY bo.created_at DESC
  LIMIT p_limit;
END;
$$;