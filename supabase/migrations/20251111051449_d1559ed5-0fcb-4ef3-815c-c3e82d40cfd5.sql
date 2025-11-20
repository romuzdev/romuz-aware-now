-- =====================================================
-- Part 3.B: Rule Controls + Delta & Anomaly Views
-- =====================================================

-- 1) KPI Thresholds Table
CREATE TABLE IF NOT EXISTS public.kpi_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  kpi_key TEXT NOT NULL,
  trend_window kpi_trend_window NOT NULL,
  min_sample INTEGER DEFAULT 30,
  warn_delta NUMERIC DEFAULT 0.05,
  alert_delta NUMERIC DEFAULT 0.15,
  zscore_alert NUMERIC DEFAULT 3.0,
  control_lower NUMERIC,
  control_upper NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  notes TEXT,
  UNIQUE (tenant_id, kpi_key, trend_window)
);

CREATE INDEX IF NOT EXISTS idx_kpi_thresholds_lookup 
  ON public.kpi_thresholds (tenant_id, kpi_key, trend_window) 
  WHERE is_active = true;

-- RLS Policies for kpi_thresholds
ALTER TABLE public.kpi_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view thresholds in their tenant"
  ON public.kpi_thresholds FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Admins can insert thresholds in their tenant"
  ON public.kpi_thresholds FOR INSERT
  WITH CHECK (
    app_has_role('tenant_admin') 
    AND tenant_id = app_current_tenant_id()
  );

CREATE POLICY "Admins can update thresholds in their tenant"
  ON public.kpi_thresholds FOR UPDATE
  USING (
    app_has_role('tenant_admin') 
    AND tenant_id = app_current_tenant_id()
  )
  WITH CHECK (
    app_has_role('tenant_admin') 
    AND tenant_id = app_current_tenant_id()
  );

CREATE POLICY "Admins can delete thresholds in their tenant"
  ON public.kpi_thresholds FOR DELETE
  USING (
    app_has_role('tenant_admin') 
    AND tenant_id = app_current_tenant_id()
  );

-- 2) Monthly Delta MV
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_kpi_monthly_delta AS
WITH base AS (
  SELECT
    tenant_id,
    kpi_key,
    month,
    trend_window,
    avg_value,
    sample_count,
    LAG(avg_value) OVER (
      PARTITION BY tenant_id, kpi_key, trend_window 
      ORDER BY month
    ) AS prev_avg
  FROM public.mv_kpi_trends_monthly
),
delta AS (
  SELECT
    tenant_id,
    kpi_key,
    month,
    trend_window,
    avg_value,
    prev_avg,
    sample_count,
    CASE 
      WHEN prev_avg IS NULL OR prev_avg = 0 THEN NULL
      ELSE (avg_value - prev_avg) / prev_avg
    END AS delta_pct
  FROM base
)
SELECT * FROM delta;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kpi_monthly_delta_unique
  ON public.mv_kpi_monthly_delta (tenant_id, kpi_key, month, trend_window);

CREATE INDEX IF NOT EXISTS idx_mv_kpi_monthly_delta_lookup
  ON public.mv_kpi_monthly_delta (tenant_id, kpi_key, trend_window);

-- 3) Monthly Anomalies MV (z-score)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_kpi_monthly_anomalies AS
WITH stats AS (
  SELECT
    tenant_id,
    kpi_key,
    trend_window,
    AVG(avg_value) AS mu,
    STDDEV_POP(avg_value) AS sigma,
    COUNT(*) AS baseline_months
  FROM public.mv_kpi_trends_monthly
  GROUP BY tenant_id, kpi_key, trend_window
),
joined AS (
  SELECT
    t.tenant_id,
    t.kpi_key,
    t.month,
    t.trend_window,
    t.avg_value,
    t.sample_count,
    s.mu,
    s.sigma,
    s.baseline_months,
    CASE 
      WHEN s.sigma > 0 THEN (t.avg_value - s.mu) / s.sigma 
      ELSE NULL 
    END AS zscore
  FROM public.mv_kpi_trends_monthly t
  JOIN stats s ON (
    s.tenant_id = t.tenant_id 
    AND s.kpi_key = t.kpi_key 
    AND s.trend_window = t.trend_window
  )
)
SELECT * FROM joined;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kpi_monthly_anomalies_unique
  ON public.mv_kpi_monthly_anomalies (tenant_id, kpi_key, month, trend_window);

CREATE INDEX IF NOT EXISTS idx_mv_kpi_monthly_anomalies_lookup
  ON public.mv_kpi_monthly_anomalies (tenant_id, kpi_key, trend_window);

-- 4) Monthly Flags MV (combining delta + anomalies + thresholds)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_kpi_monthly_flags AS
SELECT
  d.tenant_id,
  d.kpi_key,
  d.month,
  d.trend_window,
  d.avg_value,
  d.prev_avg,
  d.delta_pct,
  d.sample_count,
  a.zscore,
  a.mu,
  a.sigma,
  COALESCE(th.min_sample, 30) AS min_sample,
  COALESCE(th.warn_delta, 0.05) AS warn_delta,
  COALESCE(th.alert_delta, 0.15) AS alert_delta,
  COALESCE(th.zscore_alert, 3.0) AS zscore_alert,
  th.control_lower,
  th.control_upper,
  CASE 
    WHEN d.sample_count < COALESCE(th.min_sample, 30) THEN 'insufficient_data'
    WHEN d.delta_pct IS NULL THEN 'no_reference'
    WHEN ABS(d.delta_pct) >= COALESCE(th.alert_delta, 0.15) 
      OR (a.zscore IS NOT NULL AND ABS(a.zscore) >= COALESCE(th.zscore_alert, 3.0))
      THEN 'alert'
    WHEN ABS(d.delta_pct) >= COALESCE(th.warn_delta, 0.05)
      THEN 'warn'
    ELSE 'ok'
  END AS flag
FROM public.mv_kpi_monthly_delta d
LEFT JOIN public.mv_kpi_monthly_anomalies a
  ON (
    a.tenant_id = d.tenant_id 
    AND a.kpi_key = d.kpi_key 
    AND a.month = d.month 
    AND a.trend_window = d.trend_window
  )
LEFT JOIN public.kpi_thresholds th
  ON (
    th.tenant_id = d.tenant_id 
    AND th.kpi_key = d.kpi_key 
    AND th.trend_window = d.trend_window 
    AND th.is_active = true
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kpi_monthly_flags_unique
  ON public.mv_kpi_monthly_flags (tenant_id, kpi_key, month, trend_window);

CREATE INDEX IF NOT EXISTS idx_mv_kpi_monthly_flags_lookup
  ON public.mv_kpi_monthly_flags (tenant_id, kpi_key, trend_window);

CREATE INDEX IF NOT EXISTS idx_mv_kpi_monthly_flags_alert
  ON public.mv_kpi_monthly_flags (tenant_id, flag, month) 
  WHERE flag IN ('alert', 'warn');

-- 5) Security Definer Functions for secure access

-- Get Monthly Delta
CREATE OR REPLACE FUNCTION public.get_kpi_monthly_delta(
  p_kpi_key TEXT DEFAULT NULL,
  p_trend_window kpi_trend_window DEFAULT NULL,
  p_from_month DATE DEFAULT NULL,
  p_to_month DATE DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  kpi_key TEXT,
  month DATE,
  trend_window kpi_trend_window,
  avg_value NUMERIC,
  prev_avg NUMERIC,
  sample_count BIGINT,
  delta_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with any tenant';
  END IF;
  
  RETURN QUERY
  SELECT 
    mv.tenant_id,
    mv.kpi_key,
    mv.month,
    mv.trend_window,
    mv.avg_value,
    mv.prev_avg,
    mv.sample_count,
    mv.delta_pct
  FROM public.mv_kpi_monthly_delta mv
  WHERE mv.tenant_id = v_tenant_id
    AND (p_kpi_key IS NULL OR mv.kpi_key = p_kpi_key)
    AND (p_trend_window IS NULL OR mv.trend_window = p_trend_window)
    AND (p_from_month IS NULL OR mv.month >= p_from_month)
    AND (p_to_month IS NULL OR mv.month <= p_to_month)
  ORDER BY mv.month DESC, mv.kpi_key;
END;
$$;

-- Get Monthly Anomalies
CREATE OR REPLACE FUNCTION public.get_kpi_monthly_anomalies(
  p_kpi_key TEXT DEFAULT NULL,
  p_trend_window kpi_trend_window DEFAULT NULL,
  p_from_month DATE DEFAULT NULL,
  p_to_month DATE DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  kpi_key TEXT,
  month DATE,
  trend_window kpi_trend_window,
  avg_value NUMERIC,
  sample_count BIGINT,
  mu NUMERIC,
  sigma NUMERIC,
  baseline_months BIGINT,
  zscore NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with any tenant';
  END IF;
  
  RETURN QUERY
  SELECT 
    mv.tenant_id,
    mv.kpi_key,
    mv.month,
    mv.trend_window,
    mv.avg_value,
    mv.sample_count,
    mv.mu,
    mv.sigma,
    mv.baseline_months,
    mv.zscore
  FROM public.mv_kpi_monthly_anomalies mv
  WHERE mv.tenant_id = v_tenant_id
    AND (p_kpi_key IS NULL OR mv.kpi_key = p_kpi_key)
    AND (p_trend_window IS NULL OR mv.trend_window = p_trend_window)
    AND (p_from_month IS NULL OR mv.month >= p_from_month)
    AND (p_to_month IS NULL OR mv.month <= p_to_month)
  ORDER BY mv.month DESC, mv.kpi_key;
END;
$$;

-- Get Monthly Flags
CREATE OR REPLACE FUNCTION public.get_kpi_monthly_flags(
  p_kpi_key TEXT DEFAULT NULL,
  p_trend_window kpi_trend_window DEFAULT NULL,
  p_flag TEXT DEFAULT NULL,
  p_from_month DATE DEFAULT NULL,
  p_to_month DATE DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  kpi_key TEXT,
  month DATE,
  trend_window kpi_trend_window,
  avg_value NUMERIC,
  prev_avg NUMERIC,
  delta_pct NUMERIC,
  sample_count BIGINT,
  zscore NUMERIC,
  mu NUMERIC,
  sigma NUMERIC,
  min_sample INTEGER,
  warn_delta NUMERIC,
  alert_delta NUMERIC,
  zscore_alert NUMERIC,
  control_lower NUMERIC,
  control_upper NUMERIC,
  flag TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with any tenant';
  END IF;
  
  RETURN QUERY
  SELECT 
    mv.tenant_id,
    mv.kpi_key,
    mv.month,
    mv.trend_window,
    mv.avg_value,
    mv.prev_avg,
    mv.delta_pct,
    mv.sample_count,
    mv.zscore,
    mv.mu,
    mv.sigma,
    mv.min_sample,
    mv.warn_delta,
    mv.alert_delta,
    mv.zscore_alert,
    mv.control_lower,
    mv.control_upper,
    mv.flag
  FROM public.mv_kpi_monthly_flags mv
  WHERE mv.tenant_id = v_tenant_id
    AND (p_kpi_key IS NULL OR mv.kpi_key = p_kpi_key)
    AND (p_trend_window IS NULL OR mv.trend_window = p_trend_window)
    AND (p_flag IS NULL OR mv.flag = p_flag)
    AND (p_from_month IS NULL OR mv.month >= p_from_month)
    AND (p_to_month IS NULL OR mv.month <= p_to_month)
  ORDER BY mv.month DESC, mv.kpi_key;
END;
$$;

-- 6) Update refresh function
CREATE OR REPLACE FUNCTION public.refresh_gate_k_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refresh trend views
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_weekly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_monthly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_quarterly;
  
  -- Refresh delta and anomaly views
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_delta;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_anomalies;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_flags;
END;
$$;

-- 7) Revoke direct access to MVs (force use of functions)
REVOKE ALL ON public.mv_kpi_monthly_delta FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.mv_kpi_monthly_anomalies FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.mv_kpi_monthly_flags FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.mv_kpi_monthly_delta TO service_role;
GRANT SELECT ON public.mv_kpi_monthly_anomalies TO service_role;
GRANT SELECT ON public.mv_kpi_monthly_flags TO service_role;

-- 8) Initial refresh
REFRESH MATERIALIZED VIEW public.mv_kpi_monthly_delta;
REFRESH MATERIALIZED VIEW public.mv_kpi_monthly_anomalies;
REFRESH MATERIALIZED VIEW public.mv_kpi_monthly_flags;