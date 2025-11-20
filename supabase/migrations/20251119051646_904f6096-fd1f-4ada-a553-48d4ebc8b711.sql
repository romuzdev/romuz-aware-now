-- M14 Enhancement: Custom KPI Formulas & Dashboard Layouts
-- Part 1: Custom KPI Formulas

-- Table for custom KPI formulas
CREATE TABLE IF NOT EXISTS public.custom_kpi_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  kpi_name TEXT NOT NULL,
  kpi_name_ar TEXT,
  description TEXT,
  formula TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}',
  unit TEXT,
  target_value NUMERIC,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT custom_kpi_formulas_tenant_name_unique UNIQUE(tenant_id, kpi_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_kpi_formulas_tenant 
  ON custom_kpi_formulas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_kpi_formulas_active 
  ON custom_kpi_formulas(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_custom_kpi_formulas_category 
  ON custom_kpi_formulas(category);

-- Enable RLS
ALTER TABLE custom_kpi_formulas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "custom_kpi_formulas_select_policy" ON custom_kpi_formulas
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "custom_kpi_formulas_insert_policy" ON custom_kpi_formulas
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('tenant_admin', 'manager')
    )
  );

CREATE POLICY "custom_kpi_formulas_update_policy" ON custom_kpi_formulas
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('tenant_admin', 'manager')
    )
  );

CREATE POLICY "custom_kpi_formulas_delete_policy" ON custom_kpi_formulas
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'tenant_admin'
    )
  );

-- Audit trigger
CREATE TRIGGER custom_kpi_formulas_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON custom_kpi_formulas
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Updated timestamp trigger
CREATE TRIGGER custom_kpi_formulas_updated_at
  BEFORE UPDATE ON custom_kpi_formulas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE custom_kpi_formulas IS 'M14: Custom KPI formulas with dynamic variables';
COMMENT ON COLUMN custom_kpi_formulas.formula IS 'Formula expression with variables in {variable_name} format';
COMMENT ON COLUMN custom_kpi_formulas.variables IS 'JSON object with variable mappings: {variable_name: source_table.column}';

-- Table for dashboard layouts
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  layout_name TEXT NOT NULL DEFAULT 'default',
  widgets JSONB NOT NULL DEFAULT '[]',
  grid_layout TEXT DEFAULT 'grid',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT dashboard_layouts_user_layout_unique UNIQUE(tenant_id, user_id, layout_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_tenant_user 
  ON dashboard_layouts(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_default 
  ON dashboard_layouts(tenant_id, user_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "dashboard_layouts_select_policy" ON dashboard_layouts
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "dashboard_layouts_insert_policy" ON dashboard_layouts
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "dashboard_layouts_update_policy" ON dashboard_layouts
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "dashboard_layouts_delete_policy" ON dashboard_layouts
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

-- Audit trigger
CREATE TRIGGER dashboard_layouts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Updated timestamp trigger
CREATE TRIGGER dashboard_layouts_updated_at
  BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE dashboard_layouts IS 'M14: User-specific dashboard widget layouts';
COMMENT ON COLUMN dashboard_layouts.widgets IS 'Array of widget configurations with position and size';

-- Function to evaluate custom KPI formulas
CREATE OR REPLACE FUNCTION public.evaluate_custom_kpi(
  p_formula_id UUID,
  p_tenant_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_formula TEXT;
  v_variables JSONB;
  v_result NUMERIC;
  v_key TEXT;
  v_value TEXT;
  v_query TEXT;
  v_calculated_value NUMERIC;
BEGIN
  -- Get formula and variables
  SELECT formula, variables INTO v_formula, v_variables
  FROM custom_kpi_formulas
  WHERE id = p_formula_id AND tenant_id = p_tenant_id AND is_active = true;

  IF v_formula IS NULL THEN
    RAISE EXCEPTION 'Formula not found or inactive';
  END IF;

  -- Replace variables with actual values
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(v_variables) LOOP
    -- Build dynamic query based on variable mapping
    -- Format: "table.column" or "table.column.aggregate"
    v_query := format('SELECT %s FROM %s WHERE tenant_id = %L LIMIT 1', 
                     split_part(v_value, '.', 2), 
                     split_part(v_value, '.', 1),
                     p_tenant_id);
    
    BEGIN
      EXECUTE v_query INTO v_calculated_value;
      v_formula := replace(v_formula, '{' || v_key || '}', COALESCE(v_calculated_value::TEXT, '0'));
    EXCEPTION WHEN OTHERS THEN
      -- If query fails, use 0 as default
      v_formula := replace(v_formula, '{' || v_key || '}', '0');
    END;
  END LOOP;

  -- Evaluate the formula (basic math operations)
  -- Note: For production, consider using a safer expression evaluator
  BEGIN
    EXECUTE format('SELECT %s', v_formula) INTO v_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid formula expression: %', SQLERRM;
  END;

  RETURN COALESCE(v_result, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION evaluate_custom_kpi TO authenticated;

COMMENT ON FUNCTION evaluate_custom_kpi IS 'M14: Evaluate custom KPI formula with dynamic variables';