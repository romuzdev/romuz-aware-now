-- =====================================================
-- Gate-M: Master Data RPC Functions (with DROP first)
-- =====================================================

-- Drop existing functions that might have different signatures
DROP FUNCTION IF EXISTS public.fn_md_bump_catalog_version(UUID);
DROP FUNCTION IF EXISTS public.fn_md_reorder_terms(UUID[]);
DROP FUNCTION IF EXISTS public.fn_md_bulk_set_active(UUID[], BOOLEAN);
DROP FUNCTION IF EXISTS public.fn_md_lookup_terms(UUID, TEXT, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS public.fn_md_import_terms_csv(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.fn_md_export_terms(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.fn_md_save_saved_view(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.fn_md_list_saved_views(TEXT);
DROP FUNCTION IF EXISTS public.fn_md_delete_saved_view(UUID);
DROP FUNCTION IF EXISTS public.fn_md_get_default_view(TEXT);
DROP FUNCTION IF EXISTS public.fn_md_set_default_view(UUID);

-- 1. fn_md_bump_catalog_version
CREATE FUNCTION public.fn_md_bump_catalog_version(p_catalog_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_version INTEGER;
BEGIN
  UPDATE public.ref_catalogs
  SET version = version + 1, updated_at = now()
  WHERE id = p_catalog_id
  RETURNING version INTO v_new_version;
  RETURN COALESCE(v_new_version, 0);
END;
$$;

-- 2. fn_md_reorder_terms
CREATE FUNCTION public.fn_md_reorder_terms(p_term_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_term_id UUID;
  v_index INTEGER := 0;
BEGIN
  FOREACH v_term_id IN ARRAY p_term_ids
  LOOP
    UPDATE public.ref_terms SET sort_order = v_index WHERE id = v_term_id;
    v_index := v_index + 1;
  END LOOP;
END;
$$;

-- 3. fn_md_bulk_set_active
CREATE FUNCTION public.fn_md_bulk_set_active(p_term_ids UUID[], p_active BOOLEAN)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affected_count INTEGER;
BEGIN
  UPDATE public.ref_terms
  SET active = p_active, updated_at = now()
  WHERE id = ANY(p_term_ids);
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  RETURN v_affected_count;
END;
$$;

-- 4. fn_md_lookup_terms
CREATE FUNCTION public.fn_md_lookup_terms(
  p_catalog_id UUID,
  p_query TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_include_inactive BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID, catalog_id UUID, parent_id UUID, code TEXT,
  label_ar TEXT, label_en TEXT, sort_order INTEGER, active BOOLEAN,
  attrs JSONB, created_by UUID, updated_by UUID,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.catalog_id, t.parent_id, t.code, t.label_ar, t.label_en,
         t.sort_order, t.active, t.attrs, t.created_by, t.updated_by,
         t.created_at, t.updated_at
  FROM public.ref_terms t
  WHERE t.catalog_id = p_catalog_id
    AND (p_include_inactive OR t.active = true)
    AND (p_query IS NULL OR t.label_ar ILIKE '%' || p_query || '%'
         OR t.label_en ILIKE '%' || p_query || '%' OR t.code ILIKE '%' || p_query || '%')
  ORDER BY t.sort_order ASC, t.label_ar ASC
  LIMIT p_limit;
END;
$$;

-- 5. fn_md_import_terms_csv
CREATE FUNCTION public.fn_md_import_terms_csv(
  p_catalog_id UUID, p_file_url TEXT, p_rows JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row JSONB;
  v_parent_id UUID;
  v_updated_count INTEGER := 0;
  v_inserted_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    BEGIN
      v_parent_id := NULL;
      IF v_row->>'parent_code' IS NOT NULL THEN
        SELECT id INTO v_parent_id FROM public.ref_terms
        WHERE catalog_id = p_catalog_id AND code = v_row->>'parent_code' LIMIT 1;
      END IF;
      
      INSERT INTO public.ref_terms (catalog_id, parent_id, code, label_ar, label_en, sort_order, active, attrs)
      VALUES (
        p_catalog_id, v_parent_id, v_row->>'code', v_row->>'label_ar', v_row->>'label_en',
        COALESCE((v_row->>'sort_order')::INTEGER, 0),
        COALESCE((v_row->>'active')::BOOLEAN, true),
        COALESCE(v_row->'attrs', '{}'::JSONB)
      )
      ON CONFLICT (catalog_id, code) DO UPDATE SET
        parent_id = EXCLUDED.parent_id, label_ar = EXCLUDED.label_ar, label_en = EXCLUDED.label_en,
        sort_order = EXCLUDED.sort_order, active = EXCLUDED.active, attrs = EXCLUDED.attrs, updated_at = now();
      
      IF FOUND THEN v_updated_count := v_updated_count + 1;
      ELSE v_inserted_count := v_inserted_count + 1; END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object('code', v_row->>'code', 'error', SQLERRM);
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'status', 'ok', 'updated', v_updated_count, 'inserted', v_inserted_count,
    'errors', CASE WHEN v_errors::TEXT != '[]' THEN v_errors ELSE NULL END
  );
END;
$$;

-- 6. fn_md_export_terms
CREATE FUNCTION public.fn_md_export_terms(p_catalog_id UUID, p_include_inactive BOOLEAN DEFAULT false)
RETURNS TABLE (code TEXT, label_ar TEXT, label_en TEXT, parent_code TEXT, sort_order INTEGER, active BOOLEAN, attrs JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT t.code, t.label_ar, t.label_en, p.code AS parent_code, t.sort_order, t.active, t.attrs
  FROM public.ref_terms t
  LEFT JOIN public.ref_terms p ON t.parent_id = p.id
  WHERE t.catalog_id = p_catalog_id AND (p_include_inactive OR t.active = true)
  ORDER BY t.sort_order ASC, t.label_ar ASC;
END;
$$;

-- 7. fn_md_save_saved_view
CREATE FUNCTION public.fn_md_save_saved_view(
  p_view_id UUID, p_entity_type TEXT, p_view_name TEXT, p_description_ar TEXT,
  p_filters JSONB, p_sort_config JSONB, p_is_default BOOLEAN, p_is_shared BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := (SELECT tenant_id FROM public.user_roles WHERE user_id = v_user_id LIMIT 1);
  
  IF p_is_default THEN
    UPDATE public.md_saved_views SET is_default = false
    WHERE entity_type = p_entity_type AND user_id = v_user_id AND is_default = true;
  END IF;
  
  INSERT INTO public.md_saved_views (
    id, entity_type, user_id, tenant_id, view_name, description_ar,
    filters, sort_config, is_default, is_shared
  )
  VALUES (
    COALESCE(p_view_id, gen_random_uuid()), p_entity_type, v_user_id, v_tenant_id,
    p_view_name, p_description_ar, p_filters, p_sort_config, p_is_default, p_is_shared
  )
  ON CONFLICT (id) DO UPDATE SET
    view_name = EXCLUDED.view_name, description_ar = EXCLUDED.description_ar,
    filters = EXCLUDED.filters, sort_config = EXCLUDED.sort_config,
    is_default = EXCLUDED.is_default, is_shared = EXCLUDED.is_shared, updated_at = now()
  RETURNING jsonb_build_object(
    'id', id, 'entity_type', entity_type, 'view_name', view_name,
    'description_ar', description_ar, 'filters', filters, 'sort_config', sort_config,
    'is_default', is_default, 'is_shared', is_shared, 'created_at', created_at, 'updated_at', updated_at
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 8. fn_md_list_saved_views
CREATE FUNCTION public.fn_md_list_saved_views(p_entity_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', v.id, 'entity_type', v.entity_type, 'view_name', v.view_name,
      'description_ar', v.description_ar, 'filters', v.filters, 'sort_config', v.sort_config,
      'is_default', v.is_default, 'is_shared', v.is_shared,
      'created_at', v.created_at, 'updated_at', v.updated_at
    ) ORDER BY v.is_default DESC, v.view_name
  ) INTO v_result
  FROM public.md_saved_views v
  WHERE v.entity_type = p_entity_type AND (v.user_id = v_user_id OR v.is_shared = true);
  
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- 9. fn_md_delete_saved_view
CREATE FUNCTION public.fn_md_delete_saved_view(p_view_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_deleted BOOLEAN := false;
BEGIN
  v_user_id := auth.uid();
  DELETE FROM public.md_saved_views WHERE id = p_view_id AND user_id = v_user_id
  RETURNING true INTO v_deleted;
  RETURN COALESCE(v_deleted, false);
END;
$$;

-- 10. fn_md_get_default_view
CREATE FUNCTION public.fn_md_get_default_view(p_entity_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  
  SELECT jsonb_build_object(
    'id', v.id, 'entity_type', v.entity_type, 'view_name', v.view_name,
    'description_ar', v.description_ar, 'filters', v.filters, 'sort_config', v.sort_config,
    'is_default', v.is_default, 'is_shared', v.is_shared,
    'created_at', v.created_at, 'updated_at', v.updated_at
  ) INTO v_result
  FROM public.md_saved_views v
  WHERE v.entity_type = p_entity_type AND v.user_id = v_user_id AND v.is_default = true
  LIMIT 1;
  
  RETURN v_result;
END;
$$;

-- 11. fn_md_set_default_view
CREATE FUNCTION public.fn_md_set_default_view(p_view_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_entity_type TEXT;
  v_success BOOLEAN := false;
BEGIN
  v_user_id := auth.uid();
  
  SELECT entity_type INTO v_entity_type FROM public.md_saved_views
  WHERE id = p_view_id AND user_id = v_user_id;
  
  IF v_entity_type IS NULL THEN RETURN false; END IF;
  
  UPDATE public.md_saved_views SET is_default = false
  WHERE entity_type = v_entity_type AND user_id = v_user_id AND is_default = true;
  
  UPDATE public.md_saved_views SET is_default = true
  WHERE id = p_view_id AND user_id = v_user_id
  RETURNING true INTO v_success;
  
  RETURN COALESCE(v_success, false);
END;
$$;