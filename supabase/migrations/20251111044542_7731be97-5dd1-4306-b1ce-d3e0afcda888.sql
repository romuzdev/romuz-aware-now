-- Gate-K: KPI Catalog + Series + Trend Views (Fixed v2)
-- Part 2.C — SQL DDL Implementation

-- =====================================================
-- 0) ENUMS / TYPES
-- =====================================================
CREATE TYPE public.kpi_trend_window AS ENUM ('none','W12','M6','Q4','MTD','YTD');

-- =====================================================
-- 1) KPI Catalog (SSOT)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kpi_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID, -- NULL = Platform-level KPI, NOT NULL = Tenant-specific KPI
  kpi_key TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  formula TEXT,                -- pseudo-sql / documentation
  unit TEXT,                   -- %, count, score, mins, days
  aggregation TEXT,            -- sum, avg, count_distinct, median, max, min
  grain TEXT NOT NULL,         -- daily, weekly, monthly, quarterly
  default_trend_window public.kpi_trend_window NOT NULL DEFAULT 'none',
  dimensions TEXT[],           -- applicable dimensions array
  source_system TEXT,          -- Gate-I, Gate-J, Gate-F, Gate-H
  source_table TEXT,           -- underlying table/view
  freshness_target TEXT,       -- e.g., "daily by 02:00 Riyadh"
  owner_role TEXT,             -- platform_admin, tenant_admin, analyst, viewer
  quality_checks JSONB DEFAULT '{}'::jsonb, -- e.g., {"min_value": 0, "max_value": 100}
  version TEXT DEFAULT 'v1.0',
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,           -- NULL = currently active
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Indexes for kpi_catalog
CREATE INDEX idx_kpi_catalog_tenant ON public.kpi_catalog(tenant_id);
CREATE INDEX idx_kpi_catalog_key ON public.kpi_catalog(kpi_key);
CREATE INDEX idx_kpi_catalog_active ON public.kpi_catalog(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_kpi_catalog_source ON public.kpi_catalog(source_system);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_kpi_catalog_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_kpi_catalog_updated_at
  BEFORE UPDATE ON public.kpi_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kpi_catalog_updated_at();

-- RLS for kpi_catalog
ALTER TABLE public.kpi_catalog ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view KPIs in their tenant (or global KPIs where tenant_id IS NULL)
CREATE POLICY "Users can view KPIs in their tenant"
  ON public.kpi_catalog
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() 
    OR tenant_id IS NULL -- Global/Platform KPIs
  );

-- Policy: Platform admins can manage all KPIs
CREATE POLICY "Platform admins can manage all KPIs"
  ON public.kpi_catalog
  FOR ALL
  USING (app_has_role('platform_admin'))
  WITH CHECK (app_has_role('platform_admin'));

-- Policy: Tenant admins can insert tenant-specific KPIs
CREATE POLICY "Tenant admins can insert KPIs"
  ON public.kpi_catalog
  FOR INSERT
  WITH CHECK (
    app_has_role('tenant_admin')
    AND tenant_id = app_current_tenant_id()
  );

-- Policy: Tenant admins can update their tenant KPIs
CREATE POLICY "Tenant admins can update KPIs"
  ON public.kpi_catalog
  FOR UPDATE
  USING (
    app_has_role('tenant_admin')
    AND tenant_id = app_current_tenant_id()
  )
  WITH CHECK (
    app_has_role('tenant_admin')
    AND tenant_id = app_current_tenant_id()
  );

-- =====================================================
-- 2) KPI Series (time series store)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kpi_series (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  kpi_key TEXT NOT NULL,
  ts DATE NOT NULL,                    -- date grain (normalized from source)
  value NUMERIC,
  trend_window public.kpi_trend_window NOT NULL DEFAULT 'none',
  
  -- Dimensions (nullable for aggregate KPIs)
  dim_department TEXT,
  dim_campaign_type TEXT,
  dim_channel TEXT,
  dim_location TEXT,
  dim_audience_segment TEXT,
  dim_content_theme TEXT,
  dim_device_type TEXT,
  dim_user_role TEXT,
  
  -- Metadata
  sample_size INTEGER DEFAULT 0,
  anomaly_flag BOOLEAN DEFAULT FALSE,
  anomaly_severity TEXT, -- low, medium, high
  data_quality_score NUMERIC, -- 0-100
  meta JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Foreign Key to kpi_catalog
  CONSTRAINT fk_kpi_series_catalog 
    FOREIGN KEY (kpi_key) 
    REFERENCES public.kpi_catalog(kpi_key) 
    ON DELETE RESTRICT
);

-- Unique index to prevent duplicates (using COALESCE for nullable dimensions)
CREATE UNIQUE INDEX idx_kpi_series_unique 
  ON public.kpi_series(
    tenant_id, 
    kpi_key, 
    ts, 
    trend_window, 
    COALESCE(dim_department, ''),
    COALESCE(dim_campaign_type, ''),
    COALESCE(dim_channel, ''),
    COALESCE(dim_location, ''),
    COALESCE(dim_audience_segment, ''),
    COALESCE(dim_content_theme, ''),
    COALESCE(dim_device_type, ''),
    COALESCE(dim_user_role, '')
  );

-- Indexes for kpi_series
CREATE INDEX idx_kpi_series_lookup ON public.kpi_series(tenant_id, kpi_key, ts DESC, trend_window);
CREATE INDEX idx_kpi_series_tenant ON public.kpi_series(tenant_id);
CREATE INDEX idx_kpi_series_ts ON public.kpi_series(ts DESC);
CREATE INDEX idx_kpi_series_anomaly ON public.kpi_series(tenant_id, anomaly_flag) WHERE anomaly_flag = TRUE;
CREATE INDEX idx_kpi_series_dimensions ON public.kpi_series(dim_department, dim_campaign_type, dim_channel);

-- RLS for kpi_series
ALTER TABLE public.kpi_series ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view KPI series in their tenant
CREATE POLICY "Users can view KPI series in their tenant"
  ON public.kpi_series
  FOR SELECT
  USING (tenant_id = app_current_tenant_id());

-- Policy: System can insert KPI series (for computation jobs)
CREATE POLICY "System can insert KPI series"
  ON public.kpi_series
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND app_current_user_id() IS NOT NULL
  );

-- Policy: Platform admins can manage all series
CREATE POLICY "Platform admins can manage KPI series"
  ON public.kpi_series
  FOR ALL
  USING (app_has_role('platform_admin'))
  WITH CHECK (app_has_role('platform_admin'));

-- =====================================================
-- 3) Materialized View for Trends (Monthly)
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_kpi_trends_monthly AS
SELECT
  tenant_id,
  kpi_key,
  date_trunc('month', ts)::date AS month,
  trend_window,
  COUNT(*) AS sample_count,
  AVG(value) AS avg_value,
  STDDEV(value) AS stddev_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) AS p50_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95_value,
  -- Delta vs previous month (% change)
  (AVG(value) - LAG(AVG(value)) OVER (PARTITION BY tenant_id, kpi_key, trend_window ORDER BY date_trunc('month', ts))) 
    / NULLIF(LAG(AVG(value)) OVER (PARTITION BY tenant_id, kpi_key, trend_window ORDER BY date_trunc('month', ts)), 0) * 100
    AS delta_pct,
  -- Count anomalies
  COUNT(*) FILTER (WHERE anomaly_flag = TRUE) AS anomaly_count
FROM public.kpi_series
GROUP BY tenant_id, kpi_key, date_trunc('month', ts), trend_window;

-- Unique index to support CONCURRENT refresh
CREATE UNIQUE INDEX idx_mv_kpi_trends_monthly_unique 
  ON public.mv_kpi_trends_monthly(tenant_id, kpi_key, month, trend_window);

-- Additional indexes for queries
CREATE INDEX idx_mv_kpi_trends_monthly_tenant ON public.mv_kpi_trends_monthly(tenant_id);
CREATE INDEX idx_mv_kpi_trends_monthly_month ON public.mv_kpi_trends_monthly(month DESC);

-- =====================================================
-- 4) Function to refresh trend views
-- =====================================================
CREATE OR REPLACE FUNCTION public.refresh_gate_k_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refresh monthly trends view concurrently
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_monthly;
END;
$$;

-- =====================================================
-- 5) Comments for documentation
-- =====================================================
COMMENT ON TABLE public.kpi_catalog IS 'Gate-K: Single Source of Truth (SSOT) for all KPI definitions';
COMMENT ON TABLE public.kpi_series IS 'Gate-K: Time-series store for KPI values with dimensions';
COMMENT ON MATERIALIZED VIEW public.mv_kpi_trends_monthly IS 'Gate-K: Monthly aggregated KPI trends with delta calculations';
COMMENT ON FUNCTION public.refresh_gate_k_views() IS 'Gate-K: Refresh all materialized views (run daily via cron)';

COMMENT ON COLUMN public.kpi_catalog.tenant_id IS 'NULL = Platform-level KPI, NOT NULL = Tenant-specific KPI';
COMMENT ON COLUMN public.kpi_catalog.kpi_key IS 'Unique identifier (snake_case), e.g., kpi_completion_rate';
COMMENT ON COLUMN public.kpi_catalog.default_trend_window IS 'Default trend window: none, W12 (12 weeks), M6 (6 months), Q4 (4 quarters), MTD, YTD';
COMMENT ON COLUMN public.kpi_series.ts IS 'Date grain (normalized to daily/weekly/monthly/quarterly)';
COMMENT ON COLUMN public.kpi_series.trend_window IS 'Trend window for this data point';
COMMENT ON COLUMN public.kpi_series.anomaly_flag IS 'TRUE if value is detected as anomalous (outside control thresholds)';
