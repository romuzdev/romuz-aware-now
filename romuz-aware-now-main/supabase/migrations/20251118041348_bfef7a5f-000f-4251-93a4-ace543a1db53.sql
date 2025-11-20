
-- ============================================================================
-- M14 Enhancement: Add LMS/Training KPIs to Unified Dashboard (Simplified)
-- ============================================================================

-- Update vw_unified_kpis view to include Training/LMS module KPIs
-- Keep existing KPIs and add training module with simplified metrics
CREATE OR REPLACE VIEW public.vw_unified_kpis AS
-- Existing Risk Module KPIs
SELECT r.tenant_id,
    'risk'::text AS module,
    'risk_'::text || r.risk_code AS kpi_key,
    r.risk_title AS kpi_name,
    r.id AS entity_id,
    r.risk_title AS entity_name,
    r.residual_risk_score AS current_value,
    25 AS target_value,
    r.risk_status AS status,
    r.updated_at AS last_updated,
    jsonb_build_object('description', r.risk_description, 'category', r.risk_category, 'owner', r.risk_owner_id) AS metadata
FROM grc_risks r
WHERE r.is_active = true

UNION ALL

-- Existing Compliance Module KPIs
SELECT cg.tenant_id,
    'compliance'::text AS module,
    'gap_'::text || cg.id::text AS kpi_key,
    cg.gap_title AS kpi_name,
    cg.id AS entity_id,
    cr.requirement_title AS entity_name,
    CASE
        WHEN cg.gap_status = 'closed'::text THEN 100
        WHEN cg.gap_status = 'in_progress'::text THEN 50
        ELSE 0
    END AS current_value,
    100 AS target_value,
    cg.gap_status AS status,
    cg.updated_at AS last_updated,
    jsonb_build_object('requirement_id', cg.requirement_id, 'gap_type', cg.gap_type, 'severity', cg.severity) AS metadata
FROM grc_compliance_gaps cg
JOIN grc_compliance_requirements cr ON cr.id = cg.requirement_id

UNION ALL

-- Existing Campaign Module KPIs
SELECT ac.tenant_id,
    'campaign'::text AS module,
    'campaign_'::text || ac.id::text AS kpi_key,
    ac.name AS kpi_name,
    ac.id AS entity_id,
    ac.name AS entity_name,
    COALESCE((SELECT avg(CASE WHEN cp.status = 'completed'::text THEN 100 ELSE 0 END) AS avg
              FROM campaign_participants cp WHERE cp.campaign_id = ac.id), 0::numeric) AS current_value,
    100 AS target_value,
    ac.status::text AS status,
    ac.updated_at AS last_updated,
    jsonb_build_object('owner', ac.owner_name, 'start_date', ac.start_date, 'end_date', ac.end_date) AS metadata
FROM awareness_campaigns ac
WHERE ac.archived_at IS NULL

UNION ALL

-- Existing Audit Module KPIs
SELECT a.tenant_id,
    'audit'::text AS module,
    'audit_'::text || a.audit_code AS kpi_key,
    a.audit_title AS kpi_name,
    a.id AS entity_id,
    a.audit_title AS entity_name,
    CASE
        WHEN a.audit_status = 'completed'::text THEN 100
        WHEN a.audit_status = 'in_progress'::text THEN 50
        WHEN a.audit_status = 'planned'::text THEN 25
        ELSE 0
    END::numeric AS current_value,
    100 AS target_value,
    a.audit_status AS status,
    a.updated_at AS last_updated,
    jsonb_build_object('audit_type', a.audit_type, 'scope', a.audit_scope) AS metadata
FROM grc_audits a

UNION ALL

-- Existing Objective Module KPIs
SELECT k.tenant_id,
    'objective'::text AS module,
    'kpi_'::text || k.code AS kpi_key,
    k.title AS kpi_name,
    k.id AS entity_id,
    o.title AS entity_name,
    COALESCE((SELECT kr.actual_value FROM kpi_readings kr
              WHERE kr.kpi_id = k.id ORDER BY kr.collected_at DESC LIMIT 1), 0::numeric) AS current_value,
    COALESCE((SELECT kt.target_value FROM kpi_targets kt
              WHERE kt.kpi_id = k.id ORDER BY kt.period DESC LIMIT 1), 100::numeric) AS target_value,
    o.status,
    k.updated_at AS last_updated,
    jsonb_build_object('objective_id', k.objective_id, 'unit', k.unit, 'direction', k.direction) AS metadata
FROM kpis k
JOIN objectives o ON o.id = k.objective_id

UNION ALL

-- NEW: Training/LMS Module KPIs - Course Completion Rate
SELECT c.tenant_id,
    'training'::text AS module,
    'training_course_'::text || c.code AS kpi_key,
    c.name || ' - معدل الإنجاز'::text AS kpi_name,
    c.id AS entity_id,
    c.name AS entity_name,
    COALESCE((SELECT ROUND((COUNT(*) FILTER (WHERE e.status = 'completed')::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 2)
              FROM lms_enrollments e WHERE e.course_id = c.id), 0::numeric) AS current_value,
    80::numeric AS target_value,
    c.status AS status,
    c.updated_at AS last_updated,
    jsonb_build_object('level', c.level, 'duration_hours', c.duration_hours, 'category_id', c.category_id, 'kpi_type', 'completion_rate') AS metadata
FROM lms_courses c
WHERE c.status = 'published' AND c.deleted_at IS NULL

UNION ALL

-- NEW: Training/LMS Module KPIs - Enrollment Progress
SELECT c.tenant_id,
    'training'::text AS module,
    'training_progress_'::text || c.code AS kpi_key,
    c.name || ' - متوسط التقدم'::text AS kpi_name,
    c.id AS entity_id,
    c.name AS entity_name,
    COALESCE((SELECT ROUND(AVG(e.progress_percentage)::numeric, 2) 
              FROM lms_enrollments e 
              WHERE e.course_id = c.id AND e.status IN ('in_progress', 'completed')), 0::numeric) AS current_value,
    90::numeric AS target_value,
    c.status AS status,
    c.updated_at AS last_updated,
    jsonb_build_object('level', c.level, 'instructor_id', c.instructor_id, 'kpi_type', 'progress_average') AS metadata
FROM lms_courses c
WHERE c.status = 'published' AND c.deleted_at IS NULL

UNION ALL

-- NEW: Training/LMS Module KPIs - Certificate Issuance Rate
SELECT c.tenant_id,
    'training'::text AS module,
    'training_cert_'::text || c.code AS kpi_key,
    c.name || ' - إصدار الشهادات'::text AS kpi_name,
    c.id AS entity_id,
    c.name AS entity_name,
    COALESCE((SELECT ROUND((COUNT(cert.id)::numeric / NULLIF(COUNT(e.id), 0) * 100)::numeric, 2)
              FROM lms_enrollments e
              LEFT JOIN lms_certificates cert ON cert.enrollment_id = e.id
              WHERE e.course_id = c.id AND e.status = 'completed'), 0::numeric) AS current_value,
    95::numeric AS target_value,
    c.status AS status,
    c.updated_at AS last_updated,
    jsonb_build_object('level', c.level, 'has_assessment', EXISTS(SELECT 1 FROM lms_assessments WHERE course_id = c.id), 'kpi_type', 'certificate_rate') AS metadata
FROM lms_courses c
WHERE c.status = 'published' AND c.deleted_at IS NULL;

-- Grant permissions
GRANT SELECT ON public.vw_unified_kpis TO authenticated;

-- Update comment
COMMENT ON VIEW public.vw_unified_kpis IS 'M14 Unified KPI Dashboard - Enhanced with LMS/Training metrics: completion rates, progress averages, and certificate issuance rates across Risk, Compliance, Campaign, Audit, Objective, and Training modules';
