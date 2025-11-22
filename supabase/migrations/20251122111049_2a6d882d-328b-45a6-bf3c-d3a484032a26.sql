-- Phase 3: Advanced Risk Analytics & Compliance Automation (CORRECTED)
-- Part 1: Database Functions & Views

-- ==========================================
-- ADVANCED RISK ANALYTICS
-- ==========================================

-- Risk Heat Map Aggregation View
CREATE OR REPLACE VIEW vw_risk_heat_map AS
SELECT 
  tenant_id,
  risk_category,
  likelihood_score,
  impact_score,
  COALESCE(current_likelihood_score, likelihood_score) as current_likelihood,
  COALESCE(current_impact_score, impact_score) as current_impact,
  risk_status,
  COUNT(*) as risk_count
FROM grc_risks
WHERE is_active = true
GROUP BY 
  tenant_id, 
  risk_category, 
  likelihood_score, 
  impact_score,
  current_likelihood_score,
  current_impact_score,
  risk_status;

-- Risk Trends Analysis Function
CREATE OR REPLACE FUNCTION fn_grc_get_risk_trends(
  p_tenant_id UUID,
  p_period_days INTEGER DEFAULT 90
)
RETURNS TABLE(
  snapshot_date DATE,
  risk_category TEXT,
  total_risks INTEGER,
  high_risks INTEGER,
  medium_risks INTEGER,
  low_risks INTEGER,
  avg_inherent_score NUMERIC,
  avg_current_score NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - p_period_days,
      CURRENT_DATE,
      '1 day'::interval
    )::date AS snapshot_date
  ),
  risk_snapshots AS (
    SELECT 
      ds.snapshot_date,
      r.risk_category,
      r.likelihood_score * r.impact_score as inherent_score,
      COALESCE(r.current_likelihood_score, r.likelihood_score) * 
      COALESCE(r.current_impact_score, r.impact_score) as current_score
    FROM date_series ds
    CROSS JOIN grc_risks r
    WHERE r.tenant_id = p_tenant_id
      AND r.created_at::date <= ds.snapshot_date
      AND r.is_active = true
  )
  SELECT 
    rs.snapshot_date,
    rs.risk_category,
    COUNT(*)::INTEGER as total_risks,
    COUNT(*) FILTER (WHERE current_score >= 15)::INTEGER as high_risks,
    COUNT(*) FILTER (WHERE current_score >= 6 AND current_score < 15)::INTEGER as medium_risks,
    COUNT(*) FILTER (WHERE current_score < 6)::INTEGER as low_risks,
    ROUND(AVG(inherent_score), 2) as avg_inherent_score,
    ROUND(AVG(current_score), 2) as avg_current_score
  FROM risk_snapshots rs
  GROUP BY rs.snapshot_date, rs.risk_category
  ORDER BY rs.snapshot_date DESC, rs.risk_category;
END;
$$;

-- Risk Correlation Analysis Function
CREATE OR REPLACE FUNCTION fn_grc_analyze_risk_correlations(
  p_tenant_id UUID
)
RETURNS TABLE(
  category_a TEXT,
  category_b TEXT,
  correlation_strength NUMERIC,
  shared_controls INTEGER,
  recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH category_pairs AS (
    SELECT DISTINCT
      r1.risk_category as cat_a,
      r2.risk_category as cat_b,
      COUNT(DISTINCT rc1.control_id) as shared_controls
    FROM grc_risks r1
    JOIN grc_risks r2 ON r1.tenant_id = r2.tenant_id AND r1.risk_category < r2.risk_category
    LEFT JOIN grc_risk_controls rc1 ON r1.id = rc1.risk_id
    LEFT JOIN grc_risk_controls rc2 ON r2.id = rc2.risk_id AND rc1.control_id = rc2.control_id
    WHERE r1.tenant_id = p_tenant_id
      AND r1.is_active = true
      AND r2.is_active = true
    GROUP BY r1.risk_category, r2.risk_category
  )
  SELECT 
    cat_a as category_a,
    cat_b as category_b,
    ROUND(
      CASE 
        WHEN shared_controls = 0 THEN 0
        WHEN shared_controls >= 5 THEN 0.9
        WHEN shared_controls >= 3 THEN 0.6
        ELSE 0.3
      END, 2
    ) as correlation_strength,
    shared_controls::INTEGER,
    CASE
      WHEN shared_controls >= 5 THEN 'ارتباط قوي - يُنصح بإدارة موحدة'
      WHEN shared_controls >= 3 THEN 'ارتباط متوسط - مراجعة الضوابط المشتركة'
      ELSE 'ارتباط ضعيف - إدارة مستقلة'
    END as recommendation
  FROM category_pairs
  WHERE shared_controls > 0
  ORDER BY shared_controls DESC;
END;
$$;

-- ==========================================
-- COMPLIANCE AUTOMATION
-- ==========================================

-- Compliance Gap Detection Function
CREATE OR REPLACE FUNCTION fn_grc_detect_compliance_gaps(
  p_tenant_id UUID,
  p_framework_id UUID DEFAULT NULL
)
RETURNS TABLE(
  gap_id UUID,
  requirement_id UUID,
  requirement_code TEXT,
  requirement_title TEXT,
  framework_name TEXT,
  gap_type TEXT,
  gap_severity TEXT,
  gap_description TEXT,
  recommended_action TEXT,
  estimated_effort_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH requirement_analysis AS (
    SELECT 
      cr.id,
      cr.requirement_code,
      cr.requirement_title,
      cf.framework_name,
      cr.compliance_status,
      cr.priority,
      COUNT(DISTINCT ccr.control_id) as control_count,
      COUNT(DISTINCT CASE WHEN c.implementation_status = 'implemented' THEN c.id END) as implemented_controls,
      COUNT(DISTINCT CASE WHEN ct.effectiveness_conclusion = 'effective' THEN ct.id END) as effective_controls
    FROM grc_compliance_requirements cr
    JOIN grc_compliance_frameworks cf ON cr.framework_id = cf.id
    LEFT JOIN grc_compliance_control_requirements ccr ON cr.id = ccr.requirement_id
    LEFT JOIN grc_controls c ON ccr.control_id = c.id AND c.is_active = true
    LEFT JOIN grc_control_tests ct ON c.id = ct.control_id 
      AND ct.test_date >= CURRENT_DATE - INTERVAL '1 year'
    WHERE cr.tenant_id = p_tenant_id
      AND cr.is_active = true
      AND (p_framework_id IS NULL OR cf.id = p_framework_id)
    GROUP BY cr.id, cr.requirement_code, cr.requirement_title, cf.framework_name, cr.compliance_status, cr.priority
  )
  SELECT 
    gen_random_uuid() as gap_id,
    ra.id as requirement_id,
    ra.requirement_code,
    ra.requirement_title,
    ra.framework_name,
    CASE
      WHEN ra.compliance_status = 'non_compliant' THEN 'non_compliance'
      WHEN ra.compliance_status = 'partially_compliant' THEN 'partial_compliance'
      WHEN ra.control_count = 0 THEN 'missing_controls'
      WHEN ra.implemented_controls = 0 THEN 'no_implementation'
      WHEN ra.effective_controls = 0 THEN 'ineffective_controls'
      WHEN ra.effective_controls < ra.control_count * 0.5 THEN 'weak_controls'
      ELSE 'minor_gap'
    END as gap_type,
    CASE
      WHEN ra.priority = 'critical' OR ra.compliance_status = 'non_compliant' THEN 'critical'
      WHEN ra.priority = 'high' OR ra.compliance_status = 'partially_compliant' THEN 'high'
      WHEN ra.control_count = 0 OR ra.implemented_controls = 0 THEN 'medium'
      ELSE 'low'
    END as gap_severity,
    CASE
      WHEN ra.compliance_status = 'non_compliant' THEN 'عدم امتثال كامل للمتطلب'
      WHEN ra.compliance_status = 'partially_compliant' THEN 'امتثال جزئي - يتطلب تحسين'
      WHEN ra.control_count = 0 THEN 'لا توجد ضوابط مطبقة لهذا المتطلب'
      WHEN ra.implemented_controls = 0 THEN 'الضوابط موجودة لكن غير منفذة'
      WHEN ra.effective_controls = 0 THEN 'الضوابط المنفذة غير فعالة'
      WHEN ra.effective_controls < ra.control_count * 0.5 THEN 'أقل من 50% من الضوابط فعالة'
      ELSE 'فجوات بسيطة - تحسينات طفيفة مطلوبة'
    END as gap_description,
    CASE
      WHEN ra.control_count = 0 THEN 'إنشاء وتطبيق ضوابط جديدة'
      WHEN ra.implemented_controls = 0 THEN 'تفعيل الضوابط الموجودة'
      WHEN ra.effective_controls = 0 THEN 'مراجعة وتحسين فعالية الضوابط'
      ELSE 'تحسين وتقوية الضوابط الحالية'
    END as recommended_action,
    CASE
      WHEN ra.control_count = 0 THEN 30
      WHEN ra.implemented_controls = 0 THEN 15
      WHEN ra.effective_controls = 0 THEN 20
      ELSE 10
    END as estimated_effort_days
  FROM requirement_analysis ra
  WHERE ra.compliance_status IN ('non_compliant', 'partially_compliant', 'not_assessed')
     OR ra.control_count = 0
     OR ra.implemented_controls = 0
     OR ra.effective_controls < ra.control_count * 0.5
  ORDER BY 
    CASE gap_severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    ra.requirement_code;
END;
$$;

-- Compliance Score Dashboard Function
CREATE OR REPLACE FUNCTION fn_grc_get_compliance_dashboard(
  p_tenant_id UUID
)
RETURNS TABLE(
  framework_id UUID,
  framework_name TEXT,
  total_requirements INTEGER,
  compliant_count INTEGER,
  partial_compliant_count INTEGER,
  non_compliant_count INTEGER,
  not_assessed_count INTEGER,
  compliance_score NUMERIC,
  trend_direction TEXT,
  last_assessment_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cf.id as framework_id,
    cf.framework_name,
    COUNT(cr.id)::INTEGER as total_requirements,
    COUNT(*) FILTER (WHERE cr.compliance_status = 'compliant')::INTEGER as compliant_count,
    COUNT(*) FILTER (WHERE cr.compliance_status = 'partially_compliant')::INTEGER as partial_compliant_count,
    COUNT(*) FILTER (WHERE cr.compliance_status = 'non_compliant')::INTEGER as non_compliant_count,
    COUNT(*) FILTER (WHERE cr.compliance_status = 'not_assessed')::INTEGER as not_assessed_count,
    ROUND(
      (COUNT(*) FILTER (WHERE cr.compliance_status = 'compliant')::NUMERIC * 100 + 
       COUNT(*) FILTER (WHERE cr.compliance_status = 'partially_compliant')::NUMERIC * 50) / 
      NULLIF(COUNT(*), 0),
      2
    ) as compliance_score,
    CASE
      WHEN COUNT(*) FILTER (WHERE cr.compliance_status = 'compliant') > 
           COUNT(*) FILTER (WHERE cr.compliance_status IN ('partially_compliant', 'non_compliant')) THEN 'improving'
      WHEN COUNT(*) FILTER (WHERE cr.compliance_status = 'non_compliant') > 0 THEN 'declining'
      ELSE 'stable'
    END as trend_direction,
    MAX(cr.updated_at) as last_assessment_date
  FROM grc_compliance_frameworks cf
  LEFT JOIN grc_compliance_requirements cr ON cf.id = cr.framework_id AND cr.is_active = true
  WHERE cf.tenant_id = p_tenant_id
    AND cf.is_active = true
  GROUP BY cf.id, cf.framework_name
  ORDER BY compliance_score DESC NULLS LAST;
END;
$$;

-- Auto-mapping Suggestion Function
CREATE OR REPLACE FUNCTION fn_grc_suggest_control_mappings(
  p_tenant_id UUID,
  p_requirement_id UUID
)
RETURNS TABLE(
  control_id UUID,
  control_code TEXT,
  control_title TEXT,
  match_score NUMERIC,
  match_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req_title TEXT;
  v_req_description TEXT;
  v_req_category TEXT;
BEGIN
  -- Get requirement details
  SELECT requirement_title, requirement_description, category
  INTO v_req_title, v_req_description, v_req_category
  FROM grc_compliance_requirements
  WHERE id = p_requirement_id AND tenant_id = p_tenant_id;

  RETURN QUERY
  SELECT 
    c.id as control_id,
    c.control_code,
    c.control_title,
    ROUND(
      (CASE WHEN c.control_title ILIKE '%' || v_req_title || '%' THEN 0.4 ELSE 0 END +
       CASE WHEN c.control_description ILIKE '%' || v_req_description || '%' THEN 0.3 ELSE 0 END +
       CASE WHEN c.control_category::TEXT = v_req_category THEN 0.3 ELSE 0 END),
      2
    ) as match_score,
    CASE
      WHEN c.control_title ILIKE '%' || v_req_title || '%' THEN 'تطابق في العنوان'
      WHEN c.control_description ILIKE '%' || v_req_description || '%' THEN 'تطابق في الوصف'
      WHEN c.control_category::TEXT = v_req_category THEN 'نفس الفئة'
      ELSE 'تطابق عام'
    END as match_reason
  FROM grc_controls c
  WHERE c.tenant_id = p_tenant_id
    AND c.is_active = true
    AND c.implementation_status IN ('implemented', 'in_progress')
    AND NOT EXISTS (
      SELECT 1 FROM grc_compliance_control_requirements ccr
      WHERE ccr.requirement_id = p_requirement_id AND ccr.control_id = c.id
    )
  ORDER BY match_score DESC
  LIMIT 10;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION fn_grc_get_risk_trends TO authenticated;
GRANT EXECUTE ON FUNCTION fn_grc_analyze_risk_correlations TO authenticated;
GRANT EXECUTE ON FUNCTION fn_grc_detect_compliance_gaps TO authenticated;
GRANT EXECUTE ON FUNCTION fn_grc_get_compliance_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION fn_grc_suggest_control_mappings TO authenticated;

COMMENT ON FUNCTION fn_grc_get_risk_trends IS 'Phase 3: Advanced Risk Analytics - Trend Analysis over time';
COMMENT ON FUNCTION fn_grc_analyze_risk_correlations IS 'Phase 3: Advanced Risk Analytics - Risk Correlation Analysis';
COMMENT ON FUNCTION fn_grc_detect_compliance_gaps IS 'Phase 3: Compliance Automation - Gap Detection';
COMMENT ON FUNCTION fn_grc_get_compliance_dashboard IS 'Phase 3: Compliance Automation - Dashboard KPIs';
COMMENT ON FUNCTION fn_grc_suggest_control_mappings IS 'Phase 3: Compliance Automation - Auto-mapping Suggestions';