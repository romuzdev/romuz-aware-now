-- ============================================================================
-- D4-M22: Objectives & KPIs Module - Database Schema
-- ============================================================================

-- ============================================================================
-- 1. OBJECTIVES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  owner_user_id UUID,
  horizon TEXT CHECK (horizon IN ('annual', 'quarterly', 'monthly', 'custom')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT objectives_tenant_code_unique UNIQUE (tenant_id, code)
);

-- Index for tenant isolation
CREATE INDEX IF NOT EXISTS idx_objectives_tenant_id ON public.objectives(tenant_id);
CREATE INDEX IF NOT EXISTS idx_objectives_status ON public.objectives(status);
CREATE INDEX IF NOT EXISTS idx_objectives_owner ON public.objectives(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_objectives_created_at ON public.objectives(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_objectives_updated_at
  BEFORE UPDATE ON public.objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for objectives
CREATE POLICY "objectives_tenant_isolation"
  ON public.objectives
  FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================================================
-- 2. KPIs TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  objective_id UUID NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  unit TEXT NOT NULL, -- %, number, SAR, hours, etc.
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')), -- up = higher is better
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT kpis_tenant_code_unique UNIQUE (tenant_id, code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kpis_tenant_id ON public.kpis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kpis_objective_id ON public.kpis(objective_id);
CREATE INDEX IF NOT EXISTS idx_kpis_created_at ON public.kpis(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_kpis_updated_at
  BEFORE UPDATE ON public.kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kpis
CREATE POLICY "kpis_tenant_isolation"
  ON public.kpis
  FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================================================
-- 3. KPI_TARGETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL,
  period TEXT NOT NULL, -- YYYYQn / YYYY-MM / custom label
  target_value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT kpi_targets_kpi_period_unique UNIQUE (kpi_id, period)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kpi_targets_kpi_id ON public.kpi_targets(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_period ON public.kpi_targets(period);

-- Enable RLS
ALTER TABLE public.kpi_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kpi_targets (via parent kpi)
CREATE POLICY "kpi_targets_tenant_isolation"
  ON public.kpi_targets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kpis
      WHERE kpis.id = kpi_targets.kpi_id
        AND kpis.tenant_id = get_user_tenant_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kpis
      WHERE kpis.id = kpi_targets.kpi_id
        AND kpis.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

-- ============================================================================
-- 4. KPI_READINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.kpi_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL,
  period TEXT NOT NULL, -- YYYYQn / YYYY-MM / custom label
  actual_value NUMERIC NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT kpi_readings_kpi_period_unique UNIQUE (kpi_id, period)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kpi_readings_kpi_id ON public.kpi_readings(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_readings_period ON public.kpi_readings(period);
CREATE INDEX IF NOT EXISTS idx_kpi_readings_collected_at ON public.kpi_readings(collected_at DESC);

-- Enable RLS
ALTER TABLE public.kpi_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kpi_readings (via parent kpi)
CREATE POLICY "kpi_readings_tenant_isolation"
  ON public.kpi_readings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kpis
      WHERE kpis.id = kpi_readings.kpi_id
        AND kpis.tenant_id = get_user_tenant_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kpis
      WHERE kpis.id = kpi_readings.kpi_id
        AND kpis.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

-- ============================================================================
-- 5. INITIATIVES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL,
  title TEXT NOT NULL,
  owner_user_id UUID,
  start_at DATE,
  end_at DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'done', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_initiatives_objective_id ON public.initiatives(objective_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_status ON public.initiatives(status);
CREATE INDEX IF NOT EXISTS idx_initiatives_owner ON public.initiatives(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_dates ON public.initiatives(start_at, end_at);

-- Trigger for updated_at
CREATE TRIGGER update_initiatives_updated_at
  BEFORE UPDATE ON public.initiatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for initiatives (via parent objective)
CREATE POLICY "initiatives_tenant_isolation"
  ON public.initiatives
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.objectives
      WHERE objectives.id = initiatives.objective_id
        AND objectives.tenant_id = get_user_tenant_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.objectives
      WHERE objectives.id = initiatives.objective_id
        AND objectives.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

-- ============================================================================
-- AUDIT LOG HELPERS
-- ============================================================================
-- Add audit log entries for tracking
COMMENT ON TABLE public.objectives IS 'D4-M22: Strategic objectives table';
COMMENT ON TABLE public.kpis IS 'D4-M22: Key Performance Indicators table';
COMMENT ON TABLE public.kpi_targets IS 'D4-M22: KPI target values table';
COMMENT ON TABLE public.kpi_readings IS 'D4-M22: KPI actual readings table';
COMMENT ON TABLE public.initiatives IS 'D4-M22: Strategic initiatives table';