-- ============================================================
-- Gate-K Seed Data Script v1.0
-- Purpose: Create test data for Gate-K dashboards
-- Usage: Run this script to populate kpi_series for testing
-- ============================================================

-- Step 1: Add KPI Definitions (if not exist)
-- ============================================================
INSERT INTO kpi_catalog (
  tenant_id, kpi_key, name_ar, name_en, 
  description_ar, grain, unit, aggregation,
  default_trend_window, is_active, effective_from
) VALUES
  ('00000000-0000-0000-0000-000000000000', 'kpi_engagement_score', 'نقاط التفاعل', 'Engagement Score', 
   'متوسط نقاط التفاعل للمشاركين', 'campaign_participant', 'score', 'avg', 'M6', true, '2024-01-01'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_feedback_quality', 'جودة التغذية الراجعة', 'Feedback Quality', 
   'متوسط جودة التغذية الراجعة المقدمة', 'campaign_participant', 'score', 'avg', 'M6', true, '2024-01-01'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_compliance_linkage', 'الربط بالامتثال', 'Compliance Linkage', 
   'ربط الوعي بمتطلبات الامتثال', 'campaign_participant', 'score', 'avg', 'M6', true, '2024-01-01');

-- Step 2: Insert Time-Series Data (3 months)
-- ============================================================

-- September 2024 (Baseline Month)
-- --------------------------------
INSERT INTO kpi_series (
  tenant_id, kpi_key, ts, trend_window,
  value, sample_size,
  dim_department, dim_channel, dim_campaign_type
) VALUES
  -- Completion Rate by Department
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-09-01', 'M6', 75.5, 150, 'IT', 'email', 'security'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-09-01', 'M6', 82.3, 200, 'HR', 'email', 'compliance'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-09-01', 'M6', 68.7, 120, 'Finance', 'portal', 'security'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-09-01', 'M6', 91.2, 180, 'Operations', 'email', 'privacy'),
  
  -- Engagement Score by Department
  ('00000000-0000-0000-0000-000000000000', 'kpi_engagement_score', '2024-09-01', 'M6', 7.8, 150, 'IT', 'email', 'security'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_engagement_score', '2024-09-01', 'M6', 8.5, 200, 'HR', 'email', 'compliance'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_engagement_score', '2024-09-01', 'M6', 6.9, 120, 'Finance', 'portal', 'security'),
  
  -- Feedback Quality
  ('00000000-0000-0000-0000-000000000000', 'kpi_feedback_quality', '2024-09-01', 'M6', 7.2, 100, 'IT', 'email', 'security'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_feedback_quality', '2024-09-01', 'M6', 8.1, 150, 'HR', 'email', 'compliance'),
  
  -- Compliance Linkage
  ('00000000-0000-0000-0000-000000000000', 'kpi_compliance_linkage', '2024-09-01', 'M6', 6.8, 150, 'HR', 'email', 'compliance');

-- October 2024 (Growth Month)
-- ---------------------------
INSERT INTO kpi_series (
  tenant_id, kpi_key, ts, trend_window,
  value, sample_size,
  dim_department, dim_channel, dim_campaign_type
) VALUES
  -- Completion Rate - Improvement across board
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-10-01', 'M6', 78.2, 160, 'IT', 'email', 'security'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-10-01', 'M6', 85.1, 210, 'HR', 'email', 'compliance'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-10-01', 'M6', 72.4, 130, 'Finance', 'portal', 'security'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-10-01', 'M6', 93.5, 190, 'Operations', 'email', 'privacy'),
  
  -- Engagement Score - Steady growth
  ('00000000-0000-0000-0000-000000000000', 'kpi_engagement_score', '2024-10-01', 'M6', 8.1, 160, 'IT', 'email', 'security'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_engagement_score', '2024-10-01', 'M6', 8.8, 210, 'HR', 'email', 'compliance'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_engagement_score', '2024-10-01', 'M6', 7.2, 130, 'Finance', 'portal', 'security'),
  
  -- Feedback Quality
  ('00000000-0000-0000-0000-000000000000', 'kpi_feedback_quality', '2024-10-01', 'M6', 7.8, 110, 'IT', 'email', 'security'),
  ('00000000-0000-0000-0000-000000000000', 'kpi_feedback_quality', '2024-10-01', 'M6', 8.5, 160, 'HR', 'email', 'compliance'),
  
  -- Compliance Linkage
  ('00000000-0000-0000-0000-000000000000', 'kpi_compliance_linkage', '2024-10-01', 'M6', 7.5, 160, 'HR', 'email', 'compliance');

-- November 2024 (Current - with Alerts!)
-- ---------------------------------------
INSERT INTO kpi_series (
  tenant_id, kpi_key, ts, trend_window,
  value, sample_size,
  dim_department, dim_channel, dim_campaign_type, anomaly_flag
) VALUES
  -- Completion Rate - IT & Finance DROPPED (Alerts!)
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-11-01', 'M6', 65.3, 155, 'IT', 'email', 'security', true),
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-11-01', 'M6', 88.7, 220, 'HR', 'email', 'compliance', false),
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-11-01', 'M6', 55.2, 125, 'Finance', 'portal', 'security', true),
  ('00000000-0000-0000-0000-000000000000', 'kpi_completion_rate', '2024-11-01', 'M6', 95.8, 195, 'Operations', 'email', 'privacy', false),
  
  -- Engagement Score - IT & Finance also dropped
  ('00000000-0000-0000-0000-000000000000', 'kpi_engagement_score', '2024-11-01', 'M6', 6.5, 155, 'IT', 'email', 'security', true),
  ('00000000-0000-0000-0000-000000000000', 'kpi_engagement_score', '2024-11-01', 'M6', 9.2, 220, 'HR', 'email', 'compliance', false),
  ('00000000-0000-0000-0000-000000000000', 'kpi_engagement_score', '2024-11-01', 'M6', 5.8, 125, 'Finance', 'portal', 'security', true),
  
  -- Feedback Quality - Steady
  ('00000000-0000-0000-0000-000000000000', 'kpi_feedback_quality', '2024-11-01', 'M6', 8.5, 105, 'IT', 'email', 'security', false),
  ('00000000-0000-0000-0000-000000000000', 'kpi_feedback_quality', '2024-11-01', 'M6', 9.0, 170, 'HR', 'email', 'compliance', false),
  
  -- Compliance Linkage - Improvement
  ('00000000-0000-0000-0000-000000000000', 'kpi_compliance_linkage', '2024-11-01', 'M6', 8.2, 170, 'HR', 'email', 'compliance', false);

-- Step 3: Refresh Materialized Views
-- ============================================================
-- Run this after inserting data:
SELECT refresh_gate_k_views();

-- Step 4: Verify Data
-- ============================================================
-- Check that MVs have data:
SELECT 
  kpi_key,
  month,
  flag,
  avg_value,
  delta_pct,
  sample_count
FROM mv_kpi_monthly_flags
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
  AND trend_window = 'M6'
ORDER BY month DESC, kpi_key
LIMIT 20;

-- ============================================================
-- Expected Results
-- ============================================================
-- You should see:
-- - 3 months of data (Sep, Oct, Nov 2024)
-- - Multiple KPIs (completion_rate, engagement_score, feedback_quality, compliance_linkage)
-- - Flags: mostly "insufficient_data" initially (need more data points)
-- - Delta % showing trends
-- - Z-scores for anomaly detection

-- ============================================================
-- Notes
-- ============================================================
-- 1. Replace tenant_id with your actual tenant ID
-- 2. Add more months of data to get better flags (ok/warn/alert)
-- 3. Increase sample_size to reduce "insufficient_data" flags
-- 4. Refresh MVs after any data changes
-- 5. For production: schedule automatic refresh via cron
