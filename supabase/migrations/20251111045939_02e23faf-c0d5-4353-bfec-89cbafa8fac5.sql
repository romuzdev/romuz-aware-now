-- Gate-K Part 2.D: Schema & Views Only (No Data)

-- ============================================================
-- 1) ADD UNIQUE CONSTRAINTS
-- ============================================================
-- Partial unique index for non-null tenant_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_kpi_catalog_tenant_key_version_not_null
ON public.kpi_catalog (tenant_id, kpi_key, version)
WHERE tenant_id IS NOT NULL;

-- Separate unique index for null tenant_id (global KPIs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_kpi_catalog_null_tenant_key_version
ON public.kpi_catalog (kpi_key, version)
WHERE tenant_id IS NULL;

-- ============================================================
-- 2) DATA QUALITY CHECK VIEWS (For monitoring)
-- ============================================================

-- DQ Check 1: Freshness Monitor
CREATE OR REPLACE VIEW public.vw_kpi_data_freshness AS
SELECT
  kpi_key,
  MAX(created_at) AS last_ingest,
  (NOW() - MAX(created_at)) AS age_duration,
  EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))/3600 AS age_hours,
  CASE 
    WHEN (NOW() - MAX(created_at)) > INTERVAL '36 hours' THEN 'STALE'
    WHEN (NOW() - MAX(created_at)) > INTERVAL '24 hours' THEN 'WARNING'
    ELSE 'FRESH'
  END AS freshness_status
FROM public.kpi_series
GROUP BY kpi_key
ORDER BY last_ingest DESC;

COMMENT ON VIEW public.vw_kpi_data_freshness IS 'Gate-K DQ: Monitor data freshness per KPI (expect updates within 36h)';

-- DQ Check 2: Null Value Ratio Monitor
CREATE OR REPLACE VIEW public.vw_kpi_null_ratio AS
SELECT 
  kpi_key, 
  trend_window,
  COUNT(*) AS total_records,
  COUNT(*) FILTER (WHERE value IS NULL) AS null_count,
  ROUND(
    COUNT(*) FILTER (WHERE value IS NULL)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 
    2
  ) AS null_ratio_pct,
  CASE 
    WHEN COUNT(*) FILTER (WHERE value IS NULL)::NUMERIC / NULLIF(COUNT(*), 0) > 0.2 THEN 'HIGH'
    WHEN COUNT(*) FILTER (WHERE value IS NULL)::NUMERIC / NULLIF(COUNT(*), 0) > 0.1 THEN 'MEDIUM'
    ELSE 'LOW'
  END AS null_severity
FROM public.kpi_series
GROUP BY kpi_key, trend_window
ORDER BY null_ratio_pct DESC;

COMMENT ON VIEW public.vw_kpi_null_ratio IS 'Gate-K DQ: Monitor null value ratios per KPI/window (threshold: 10%=medium, 20%=high)';

-- DQ Check 3: Outlier Detection (Z-Score based)
CREATE OR REPLACE VIEW public.vw_kpi_outliers AS
WITH monthly_stats AS (
  SELECT 
    tenant_id, 
    kpi_key, 
    month, 
    trend_window,
    avg_value,
    AVG(avg_value) OVER (PARTITION BY tenant_id, kpi_key, trend_window) AS mu,
    STDDEV_POP(avg_value) OVER (PARTITION BY tenant_id, kpi_key, trend_window) AS sigma
  FROM public.mv_kpi_trends_monthly
),
outlier_calc AS (
  SELECT 
    *,
    CASE 
      WHEN sigma > 0 THEN ABS((avg_value - mu) / sigma)
      ELSE 0
    END AS z_score,
    CASE 
      WHEN sigma > 0 AND ABS((avg_value - mu) / sigma) >= 3 THEN true 
      ELSE false 
    END AS is_outlier
  FROM monthly_stats
)
SELECT 
  tenant_id,
  kpi_key,
  month,
  trend_window,
  avg_value,
  mu AS baseline_avg,
  sigma AS baseline_stddev,
  ROUND(z_score, 2) AS z_score,
  is_outlier,
  CASE
    WHEN z_score >= 3 THEN 'SEVERE'
    WHEN z_score >= 2 THEN 'MODERATE'
    ELSE 'NORMAL'
  END AS outlier_severity
FROM outlier_calc
WHERE is_outlier = true
ORDER BY z_score DESC;

COMMENT ON VIEW public.vw_kpi_outliers IS 'Gate-K DQ: Detect statistical outliers using Z-score (|z| >= 3 = outlier)';

-- ============================================================
-- 3) GRANT PERMISSIONS on views
-- ============================================================
GRANT SELECT ON public.vw_kpi_data_freshness TO authenticated;
GRANT SELECT ON public.vw_kpi_null_ratio TO authenticated;
GRANT SELECT ON public.vw_kpi_outliers TO authenticated;