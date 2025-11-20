-- ============================================================================
-- Job Dependencies System
-- Create tables and functions for managing job dependencies
-- ============================================================================

-- Create job_dependencies table
CREATE TABLE IF NOT EXISTS public.job_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  parent_job_id UUID NOT NULL,
  dependent_job_id UUID NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'required', -- required, optional, conditional
  wait_for_success BOOLEAN NOT NULL DEFAULT true,
  retry_on_parent_failure BOOLEAN NOT NULL DEFAULT false,
  max_wait_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT fk_parent_job FOREIGN KEY (parent_job_id) REFERENCES public.system_jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_dependent_job FOREIGN KEY (dependent_job_id) REFERENCES public.system_jobs(id) ON DELETE CASCADE,
  CONSTRAINT no_self_dependency CHECK (parent_job_id != dependent_job_id),
  CONSTRAINT unique_dependency UNIQUE (tenant_id, parent_job_id, dependent_job_id)
);

-- Create index for faster lookups
CREATE INDEX idx_job_dependencies_parent ON public.job_dependencies(parent_job_id, is_active);
CREATE INDEX idx_job_dependencies_dependent ON public.job_dependencies(dependent_job_id, is_active);
CREATE INDEX idx_job_dependencies_tenant ON public.job_dependencies(tenant_id);

-- Enable RLS
ALTER TABLE public.job_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY job_dependencies_select_policy ON public.job_dependencies
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY job_dependencies_insert_policy ON public.job_dependencies
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin')
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY job_dependencies_update_policy ON public.job_dependencies
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY job_dependencies_delete_policy ON public.job_dependencies
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_job_dependencies_updated_at
  BEFORE UPDATE ON public.job_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Check if job can run (all dependencies satisfied)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_check_job_dependencies(p_job_id UUID)
RETURNS TABLE(
  can_run BOOLEAN,
  blocking_jobs JSONB,
  message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id UUID;
  v_blocking_count INTEGER := 0;
  v_blocking_jobs JSONB := '[]'::jsonb;
  v_dep RECORD;
BEGIN
  -- Get tenant from job
  SELECT tenant_id INTO v_tenant_id
  FROM public.system_jobs
  WHERE id = p_job_id;
  
  IF v_tenant_id IS NULL THEN
    RETURN QUERY SELECT false, '[]'::jsonb, 'Job not found'::text;
    RETURN;
  END IF;
  
  -- Check all active dependencies
  FOR v_dep IN
    SELECT 
      jd.id as dep_id,
      jd.parent_job_id,
      jd.dependency_type,
      jd.wait_for_success,
      jd.max_wait_minutes,
      pj.job_key as parent_job_key,
      pj.last_run_status,
      pj.last_run_at
    FROM public.job_dependencies jd
    INNER JOIN public.system_jobs pj ON jd.parent_job_id = pj.id
    WHERE jd.dependent_job_id = p_job_id
      AND jd.is_active = true
      AND jd.tenant_id = v_tenant_id
  LOOP
    -- Check if parent job has run successfully
    IF v_dep.wait_for_success THEN
      -- Required dependency must have succeeded
      IF v_dep.dependency_type = 'required' THEN
        IF v_dep.last_run_status IS NULL OR v_dep.last_run_status != 'succeeded' THEN
          v_blocking_count := v_blocking_count + 1;
          v_blocking_jobs := v_blocking_jobs || jsonb_build_object(
            'job_key', v_dep.parent_job_key,
            'dependency_type', v_dep.dependency_type,
            'last_status', COALESCE(v_dep.last_run_status, 'never_run'),
            'reason', 'Parent job must succeed first'
          );
        END IF;
      END IF;
      
      -- Check if parent is currently running (optional wait)
      IF v_dep.last_run_status = 'running' OR v_dep.last_run_status = 'queued' THEN
        v_blocking_count := v_blocking_count + 1;
        v_blocking_jobs := v_blocking_jobs || jsonb_build_object(
          'job_key', v_dep.parent_job_key,
          'dependency_type', v_dep.dependency_type,
          'last_status', v_dep.last_run_status,
          'reason', 'Parent job is currently running'
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Return result
  IF v_blocking_count > 0 THEN
    RETURN QUERY SELECT 
      false,
      v_blocking_jobs,
      format('Blocked by %s parent job(s)', v_blocking_count)::text;
  ELSE
    RETURN QUERY SELECT 
      true,
      '[]'::jsonb,
      'All dependencies satisfied'::text;
  END IF;
END;
$$;

-- ============================================================================
-- Function: Get job dependency tree (visual hierarchy)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_job_dependency_tree(p_job_id UUID DEFAULT NULL)
RETURNS TABLE(
  job_id UUID,
  job_key TEXT,
  level INTEGER,
  parent_job_id UUID,
  dependency_type TEXT,
  is_active BOOLEAN,
  last_run_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := get_user_tenant_id(auth.uid());
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- If specific job provided, get its tree
  IF p_job_id IS NOT NULL THEN
    RETURN QUERY
    WITH RECURSIVE dep_tree AS (
      -- Base: the specified job
      SELECT 
        sj.id as job_id,
        sj.job_key,
        0 as level,
        NULL::UUID as parent_job_id,
        NULL::TEXT as dependency_type,
        true as is_active,
        sj.last_run_status
      FROM public.system_jobs sj
      WHERE sj.id = p_job_id
      
      UNION ALL
      
      -- Recursive: parent jobs
      SELECT
        psj.id,
        psj.job_key,
        dt.level - 1,
        jd.dependent_job_id,
        jd.dependency_type,
        jd.is_active,
        psj.last_run_status
      FROM dep_tree dt
      INNER JOIN public.job_dependencies jd ON dt.job_id = jd.dependent_job_id
      INNER JOIN public.system_jobs psj ON jd.parent_job_id = psj.id
      WHERE jd.tenant_id = v_tenant_id
        AND dt.level > -10 -- Prevent infinite loops
    )
    SELECT * FROM dep_tree
    ORDER BY level, job_key;
  ELSE
    -- Return all jobs with their immediate parents
    RETURN QUERY
    SELECT 
      sj.id,
      sj.job_key,
      0 as level,
      jd.parent_job_id,
      jd.dependency_type,
      COALESCE(jd.is_active, true),
      sj.last_run_status
    FROM public.system_jobs sj
    LEFT JOIN public.job_dependencies jd ON sj.id = jd.dependent_job_id
    WHERE sj.tenant_id = v_tenant_id OR sj.tenant_id IS NULL
    ORDER BY sj.job_key;
  END IF;
END;
$$;

-- ============================================================================
-- Function: Detect circular dependencies
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_detect_circular_dependency(
  p_parent_job_id UUID,
  p_dependent_job_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_has_cycle BOOLEAN := false;
BEGIN
  -- Check if adding this dependency would create a cycle
  -- by checking if parent_job depends (directly or indirectly) on dependent_job
  
  WITH RECURSIVE dep_chain AS (
    -- Start from the proposed dependent job
    SELECT dependent_job_id as job_id, 0 as depth
    FROM public.job_dependencies
    WHERE parent_job_id = p_dependent_job_id
      AND is_active = true
    
    UNION ALL
    
    SELECT jd.dependent_job_id, dc.depth + 1
    FROM dep_chain dc
    INNER JOIN public.job_dependencies jd ON dc.job_id = jd.parent_job_id
    WHERE jd.is_active = true
      AND dc.depth < 20 -- Max depth to prevent infinite loops
  )
  SELECT EXISTS(
    SELECT 1 FROM dep_chain WHERE job_id = p_parent_job_id
  ) INTO v_has_cycle;
  
  RETURN v_has_cycle;
END;
$$;

COMMENT ON TABLE public.job_dependencies IS 'Job dependency relationships for execution ordering';
COMMENT ON FUNCTION public.fn_check_job_dependencies IS 'Check if a job can run based on its dependencies';
COMMENT ON FUNCTION public.fn_get_job_dependency_tree IS 'Get hierarchical dependency tree for visualization';
COMMENT ON FUNCTION public.fn_detect_circular_dependency IS 'Detect if adding a dependency would create a circular reference';