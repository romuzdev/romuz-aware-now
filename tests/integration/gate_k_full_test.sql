-- Gate-K Full Integration Test
-- Tests: Seed → Refresh MVs → Generate Recommendations → Query RPCs
-- Run this script with service role credentials

-- ============================================================
-- STEP 1: Cleanup (optional - for fresh test)
-- ============================================================
-- TRUNCATE TABLE public.kpi_series CASCADE;
-- TRUNCATE TABLE public.reco_generated CASCADE;
-- TRUNCATE TABLE public.reco_templates CASCADE;

-- ============================================================
-- STEP 2: Insert Test Tenant & User
-- ============================================================
DO $$
DECLARE
  v_tenant_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
  v_user_id UUID := 'u0000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  -- Insert test tenant (if not exists)
  INSERT INTO public.user_tenants (user_id, tenant_id)
  VALUES (v_user_id, v_tenant_id)
  ON CONFLICT DO NOTHING;

  -- Insert test user role (if not exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'tenant_admin'::app_role)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Test tenant and user created: tenant_id=%, user_id=%', v_tenant_id, v_user_id;
END $$;

-- ============================================================
-- STEP 3: Insert KPI Catalog Entries
-- ============================================================
INSERT INTO public.kpi_catalog (
  tenant_id,
  kpi_key,
  name_ar,
  description_ar,
  grain,
  unit,
  default_trend_window,
  dimensions,
  is_active
) VALUES 
(
  'a0000000-0000-0000-0000-000000000001'::UUID,
  'campaign_completion_rate',
  'معدل إتمام الحملات',
  'نسبة الموظفين الذين أكملوا الحملة من إجمالي المستهدفين',
  'monthly',
  'percentage',
  'm1',
  ARRAY['department', 'channel', 'campaign_type'],
  true
),
(
  'a0000000-0000-0000-0000-000000000001'::UUID,
  'phishing_click_rate',
  'معدل النقر على التصيّد',
  'نسبة الموظفين الذين نقروا على روابط التصيّد من إجمالي المستهدفين',
  'monthly',
  'percentage',
  'm1',
  ARRAY['department', 'channel'],
  true
),
(
  'a0000000-0000-0000-0000-000000000001'::UUID,
  'training_engagement_score',
  'درجة التفاعل مع التدريب',
  'متوسط درجة التفاعل مع المحتوى التدريبي',
  'monthly',
  'score',
  'm1',
  ARRAY['department', 'role_category'],
  true
)
ON CONFLICT (tenant_id, kpi_key) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = now();

RAISE NOTICE 'KPI catalog entries inserted: 3 KPIs';

-- ============================================================
-- STEP 4: Insert KPI Series Data (3 months of data)
-- ============================================================

-- Campaign Completion Rate - Overall declining trend
INSERT INTO public.kpi_series (
  tenant_id, kpi_key, ts, trend_window, value, sample_size, dim
) VALUES
-- Month 1 (3 months ago) - Good baseline
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 75.5, 250, '{}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 80.2, 50, '{"department": "Finance"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 72.1, 60, '{"department": "HR"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 78.5, 70, '{"department": "IT"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 73.2, 70, '{"department": "Operations"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 76.8, 45, '{"channel": "email"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 74.1, 55, '{"channel": "sms"}'),

-- Month 2 (2 months ago) - Slight decline
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 72.3, 260, '{}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 77.5, 52, '{"department": "Finance"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 68.9, 62, '{"department": "HR"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 75.2, 72, '{"department": "IT"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 70.1, 74, '{"department": "Operations"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 73.5, 47, '{"channel": "email"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 71.1, 57, '{"channel": "sms"}'),

-- Month 3 (last month) - ALERT: Sharp decline, especially HR & Operations
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 64.2, 270, '{}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 74.8, 54, '{"department": "Finance"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 52.3, 64, '{"department": "HR"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 71.5, 74, '{"department": "IT"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 58.9, 78, '{"department": "Operations"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 66.2, 49, '{"channel": "email"}'),
('a0000000-0000-0000-0000-000000000001', 'campaign_completion_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 62.1, 59, '{"channel": "sms"}');

-- Phishing Click Rate - Concerning upward trend in specific departments
INSERT INTO public.kpi_series (
  tenant_id, kpi_key, ts, trend_window, value, sample_size, dim
) VALUES
-- Month 1 - Acceptable baseline
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 8.5, 200, '{}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 6.2, 45, '{"department": "Finance"}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 9.8, 50, '{"department": "HR"}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 7.1, 55, '{"department": "IT"}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')::DATE, 'm1', 10.5, 50, '{"department": "Operations"}'),

-- Month 2 - Slight increase
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 10.2, 210, '{}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 7.8, 47, '{"department": "Finance"}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 12.5, 52, '{"department": "HR"}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 8.3, 57, '{"department": "IT"}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::DATE, 'm1', 11.8, 54, '{"department": "Operations"}'),

-- Month 3 - WARN: Significant spike in Operations
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 13.7, 220, '{}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 8.5, 49, '{"department": "Finance"}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 14.2, 54, '{"department": "HR"}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 9.1, 59, '{"department": "IT"}'),
('a0000000-0000-0000-0000-000000000001', 'phishing_click_rate', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE, 'm1', 18.6, 58, '{"department": "Operations"}');

RAISE NOTICE 'KPI series data inserted: 2 KPIs × 3 months × multiple dimensions';

-- ============================================================
-- STEP 5: Insert Recommendation Templates
-- ============================================================
INSERT INTO public.reco_templates (
  tenant_id,
  kpi_key,
  trend_window,
  dim_key,
  trigger_flag,
  action_type_code,
  title_ar,
  body_ar,
  impact_level,
  effort_estimate,
  is_active
) VALUES
-- Template 1: Campaign completion rate alert for departments
(
  'a0000000-0000-0000-0000-000000000001',
  'campaign_completion_rate',
  'm1',
  'department',
  'alert',
  'intensive_training_campaign',
  'حملة توعية مكثفة للقسم',
  'القسم {dim_value} يُظهر انخفاضاً حاداً بنسبة {delta_pct}% في معدل إتمام الحملات. يُوصى بإطلاق حملة توعية مكثفة مستهدفة تتضمن ورش عمل تفاعلية ومتابعة فردية.',
  'high',
  'L',
  true
),
-- Template 2: Campaign completion rate warning for departments
(
  'a0000000-0000-0000-0000-000000000001',
  'campaign_completion_rate',
  'm1',
  'department',
  'warn',
  'refresher_training',
  'تدريب تنشيطي للقسم',
  'القسم {dim_value} يُظهر انخفاضاً ملحوظاً بنسبة {delta_pct}% في معدل الإتمام. يُوصى بتنظيم جلسة تدريب تنشيطية لتحسين الالتزام.',
  'medium',
  'M',
  true
),
-- Template 3: Phishing click rate alert for departments
(
  'a0000000-0000-0000-0000-000000000001',
  'phishing_click_rate',
  'm1',
  'department',
  'alert',
  'phishing_simulation_campaign',
  'حملة محاكاة تصيّد مكثفة',
  'القسم {dim_value} يُظهر ارتفاعاً خطيراً بنسبة {delta_pct}% في معدل النقر على روابط التصيّد. يُوصى بإطلاق حملة محاكاة تصيّد مكثفة مع تدريب فوري.',
  'high',
  'M',
  true
),
-- Template 4: Phishing click rate warning for departments
(
  'a0000000-0000-0000-0000-000000000001',
  'phishing_click_rate',
  'm1',
  'department',
  'warn',
  'targeted_awareness_session',
  'جلسة توعية مستهدفة حول التصيّد',
  'القسم {dim_value} يُظهر زيادة ملحوظة بنسبة {delta_pct}% في معدل النقر على التصيّد. يُوصى بتنظيم جلسة توعية مستهدفة تركز على التعرف على محاولات التصيّد.',
  'medium',
  'S',
  true
),
-- Template 5: Campaign completion rate alert for channels
(
  'a0000000-0000-0000-0000-000000000001',
  'campaign_completion_rate',
  'm1',
  'channel',
  'alert',
  'channel_optimization',
  'تحسين فعالية القناة',
  'القناة {dim_value} تُظهر انخفاضاً حاداً بنسبة {delta_pct}% في معدل الإتمام. يُوصى بمراجعة استراتيجية التواصل عبر هذه القناة وتحسين المحتوى.',
  'high',
  'M',
  true
)
ON CONFLICT (tenant_id, kpi_key, trend_window, dim_key, trigger_flag, action_type_code)
DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = now();

RAISE NOTICE 'Recommendation templates inserted: 5 templates';

-- ============================================================
-- STEP 6: Refresh All Gate-K Materialized Views
-- ============================================================
SELECT public.refresh_gate_k_views();
RAISE NOTICE 'All Gate-K materialized views refreshed successfully';

-- ============================================================
-- STEP 7: Generate Recommendations for Last Month
-- ============================================================
DO $$
DECLARE
  v_last_month DATE;
  v_reco_count INTEGER;
BEGIN
  v_last_month := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE;
  
  SELECT public.generate_recommendations(v_last_month, 1000) INTO v_reco_count;
  
  RAISE NOTICE 'Recommendations generated for %: % recommendations', v_last_month, v_reco_count;
END $$;

-- ============================================================
-- STEP 8: Query & Validate Results
-- ============================================================

-- 8.1: Check KPI Monthly Flags
RAISE NOTICE '=== KPI Monthly Flags (Last Month) ===';
SELECT 
  kpi_key,
  month,
  trend_window,
  flag,
  avg_value,
  delta_pct,
  sample_count
FROM public.mv_kpi_monthly_flags
WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'
  AND month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
  AND flag IN ('warn', 'alert')
ORDER BY flag DESC, kpi_key;

-- 8.2: Check RCA Top Contributors
RAISE NOTICE '=== RCA Top Contributors (Last Month) ===';
SELECT 
  kpi_key,
  trend_window,
  dim_key,
  dim_value,
  delta_pct,
  contribution_score,
  contributor_rnk
FROM public.mv_rca_monthly_top_contributors
WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'
  AND month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
  AND contributor_rnk <= 3
ORDER BY kpi_key, trend_window, dim_key, contributor_rnk;

-- 8.3: Check Generated Recommendations
RAISE NOTICE '=== Generated Recommendations (Last Month) ===';
SELECT 
  kpi_key,
  dim_key,
  dim_value,
  flag,
  title_ar,
  action_type_code,
  impact_level,
  effort_estimate,
  (source_ref->>'priority_rnk')::INTEGER as priority_rnk,
  (source_ref->>'delta_pct')::NUMERIC as delta_pct
FROM public.reco_generated
WHERE tenant_id = 'a0000000-0000-0000-0000-000000000001'
  AND month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
ORDER BY (source_ref->>'priority_rnk')::INTEGER;

-- ============================================================
-- STEP 9: Test RPCs with Service Role
-- ============================================================

-- Note: These RPC tests require proper authentication context
-- For automated testing, use service role client with proper tenant_id injection

RAISE NOTICE '=== Test Complete ===';
RAISE NOTICE 'Next Steps:';
RAISE NOTICE '1. Run RPC tests from application: get_rca_top_contributors()';
RAISE NOTICE '2. Run RPC tests from application: get_recommendations()';
RAISE NOTICE '3. Verify UI displays recommendations correctly';
RAISE NOTICE '4. Test recommendation approval workflow';
