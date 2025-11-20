-- =====================================================
-- Gate-I D1 Standard Upgrade: RPC Functions
-- Part 2: Stored Procedures for Views, Bulk Ops, Import
-- =====================================================

-- ===================
-- Saved Views Functions
-- ===================

-- Save or update a KPI view
CREATE OR REPLACE FUNCTION public.fn_gate_i_save_kpi_view(
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
    UPDATE public.gate_i_kpi_views
    SET is_default = false
    WHERE tenant_id = v_tenant_id
      AND user_id = v_user_id
      AND is_default = true;
  END IF;
  
  -- Upsert view
  RETURN QUERY
  INSERT INTO public.gate_i_kpi_views (
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
    gate_i_kpi_views.id,
    gate_i_kpi_views.view_name,
    gate_i_kpi_views.description_ar,
    gate_i_kpi_views.filters,
    gate_i_kpi_views.sort_config,
    gate_i_kpi_views.is_default,
    gate_i_kpi_views.is_shared,
    gate_i_kpi_views.created_at,
    gate_i_kpi_views.updated_at;
END;
$$;

-- List KPI views
CREATE OR REPLACE FUNCTION public.fn_gate_i_list_kpi_views()
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
  FROM public.gate_i_kpi_views v
  WHERE v.tenant_id = v_tenant_id
    AND (v.user_id = v_user_id OR v.is_shared = true)
  ORDER BY v.is_default DESC, v.view_name;
END;
$$;

-- Delete a KPI view
CREATE OR REPLACE FUNCTION public.fn_gate_i_delete_kpi_view(p_view_id UUID)
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
  
  DELETE FROM public.gate_i_kpi_views
  WHERE id = p_view_id
    AND tenant_id = v_tenant_id
    AND user_id = v_user_id
  RETURNING true INTO v_deleted;
  
  RETURN COALESCE(v_deleted, false);
END;
$$;

-- ===================
-- Bulk Operations Functions
-- ===================

-- Bulk activate KPIs
CREATE OR REPLACE FUNCTION public.fn_gate_i_bulk_activate(
  p_kpi_ids UUID[],
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
  v_kpi_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_i_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    kpi_ids,
    operation_data,
    status
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'activate',
    p_kpi_ids,
    jsonb_build_object('noteAr', p_note_ar),
    'processing'
  )
  RETURNING id INTO v_operation_id;
  
  -- Activate each KPI
  FOREACH v_kpi_id IN ARRAY p_kpi_ids
  LOOP
    BEGIN
      UPDATE public.kpi_catalog
      SET 
        is_active = true,
        updated_at = now()
      WHERE id = v_kpi_id
        AND tenant_id = v_tenant_id;
      
      v_affected_count := v_affected_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'kpi_id', v_kpi_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_i_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_kpi_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_kpi_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- Bulk deactivate KPIs
CREATE OR REPLACE FUNCTION public.fn_gate_i_bulk_deactivate(
  p_kpi_ids UUID[],
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
  v_kpi_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_i_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    kpi_ids,
    operation_data,
    status
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'deactivate',
    p_kpi_ids,
    jsonb_build_object('noteAr', p_note_ar),
    'processing'
  )
  RETURNING id INTO v_operation_id;
  
  -- Deactivate each KPI
  FOREACH v_kpi_id IN ARRAY p_kpi_ids
  LOOP
    BEGIN
      UPDATE public.kpi_catalog
      SET 
        is_active = false,
        updated_at = now()
      WHERE id = v_kpi_id
        AND tenant_id = v_tenant_id;
      
      v_affected_count := v_affected_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'kpi_id', v_kpi_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_i_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_kpi_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_kpi_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- Bulk delete KPIs
CREATE OR REPLACE FUNCTION public.fn_gate_i_bulk_delete(p_kpi_ids UUID[])
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
  v_kpi_id UUID;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Create bulk operation record
  INSERT INTO public.gate_i_bulk_operations (
    tenant_id,
    user_id,
    operation_type,
    kpi_ids,
    operation_data,
    status
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'delete',
    p_kpi_ids,
    '{}'::jsonb,
    'processing'
  )
  RETURNING id INTO v_operation_id;
  
  -- Delete each KPI
  FOREACH v_kpi_id IN ARRAY p_kpi_ids
  LOOP
    BEGIN
      DELETE FROM public.kpi_catalog
      WHERE id = v_kpi_id
        AND tenant_id = v_tenant_id;
      
      v_affected_count := v_affected_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'kpi_id', v_kpi_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update bulk operation record
  UPDATE public.gate_i_bulk_operations
  SET 
    affected_count = v_affected_count,
    errors = CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END,
    status = CASE 
      WHEN v_affected_count = 0 THEN 'failed'
      WHEN v_affected_count < array_length(p_kpi_ids, 1) THEN 'partial'
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
      WHEN v_affected_count < array_length(p_kpi_ids, 1) THEN 'partial'::TEXT
      ELSE 'completed'::TEXT
    END,
    CASE WHEN v_errors::text != '[]' THEN v_errors ELSE NULL END;
END;
$$;

-- ===================
-- Import/Export Functions
-- ===================

-- Import KPIs
CREATE OR REPLACE FUNCTION public.fn_gate_i_import_kpis(
  p_filename TEXT,
  p_format TEXT,
  p_kpis JSONB
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
  v_kpi JSONB;
  v_row_num INTEGER := 0;
BEGIN
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  v_total_rows := jsonb_array_length(p_kpis);
  
  -- Create import history record
  INSERT INTO public.gate_i_import_history (
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
  
  -- Process each KPI
  FOR v_kpi IN SELECT * FROM jsonb_array_elements(p_kpis)
  LOOP
    v_row_num := v_row_num + 1;
    
    BEGIN
      -- Insert or update KPI
      INSERT INTO public.kpi_catalog (
        tenant_id,
        kpi_key,
        category,
        name_ar,
        name_en,
        description_ar,
        description_en,
        unit,
        target_value,
        gate_source,
        formula,
        data_source,
        collection_frequency,
        is_active
      )
      VALUES (
        v_tenant_id,
        v_kpi->>'kpiKey',
        v_kpi->>'category',
        v_kpi->>'nameAr',
        v_kpi->>'nameEn',
        v_kpi->>'descriptionAr',
        v_kpi->>'descriptionEn',
        v_kpi->>'unit',
        (v_kpi->>'targetValue')::NUMERIC,
        v_kpi->>'gateSource',
        v_kpi->>'formula',
        v_kpi->>'dataSource',
        v_kpi->>'collectionFrequency',
        COALESCE((v_kpi->>'isActive')::BOOLEAN, true)
      )
      ON CONFLICT (tenant_id, kpi_key)
      DO UPDATE SET
        category = EXCLUDED.category,
        name_ar = EXCLUDED.name_ar,
        name_en = EXCLUDED.name_en,
        description_ar = EXCLUDED.description_ar,
        description_en = EXCLUDED.description_en,
        unit = EXCLUDED.unit,
        target_value = EXCLUDED.target_value,
        gate_source = EXCLUDED.gate_source,
        formula = EXCLUDED.formula,
        data_source = EXCLUDED.data_source,
        collection_frequency = EXCLUDED.collection_frequency,
        is_active = EXCLUDED.is_active,
        updated_at = now();
      
      v_success_count := v_success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'row', v_row_num,
        'data', v_kpi,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update import history
  UPDATE public.gate_i_import_history
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

-- Get import history
CREATE OR REPLACE FUNCTION public.fn_gate_i_get_import_history(p_limit INTEGER DEFAULT 20)
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
  FROM public.gate_i_import_history h
  WHERE h.tenant_id = v_tenant_id
    AND h.user_id = v_user_id
  ORDER BY h.created_at DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- Comments for Documentation
-- =====================================================
COMMENT ON FUNCTION public.fn_gate_i_save_kpi_view IS 'Gate-I D1: Save or update a KPI view';
COMMENT ON FUNCTION public.fn_gate_i_list_kpi_views IS 'Gate-I D1: List KPI views for current user';
COMMENT ON FUNCTION public.fn_gate_i_delete_kpi_view IS 'Gate-I D1: Delete a KPI view';
COMMENT ON FUNCTION public.fn_gate_i_bulk_activate IS 'Gate-I D1: Bulk activate KPIs';
COMMENT ON FUNCTION public.fn_gate_i_bulk_deactivate IS 'Gate-I D1: Bulk deactivate KPIs';
COMMENT ON FUNCTION public.fn_gate_i_bulk_delete IS 'Gate-I D1: Bulk delete KPIs';
COMMENT ON FUNCTION public.fn_gate_i_import_kpis IS 'Gate-I D1: Import KPIs from file';
COMMENT ON FUNCTION public.fn_gate_i_get_import_history IS 'Gate-I D1: Get import history for current user';