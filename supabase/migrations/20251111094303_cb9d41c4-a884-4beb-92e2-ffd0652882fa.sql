-- Fix gate_h.seed_demo_actions effort enum value
-- Change 'XS' to 'S' (valid enum value)

CREATE OR REPLACE FUNCTION gate_h.seed_demo_actions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_action_id_1 UUID;
  v_action_id_2 UUID;
  v_action_id_3 UUID;
  v_action_id_4 UUID;
  v_action_id_5 UUID;
  v_demo_count INTEGER;
BEGIN
  -- Get current tenant and user
  v_tenant_id := app_current_tenant_id();
  v_user_id := app_current_user_id();
  
  -- Validate tenant
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'seed_demo_actions: missing current tenant';
  END IF;
  
  -- Validate RBAC: requires admin or analyst
  IF NOT (app_has_role('admin') OR app_has_role('analyst')) THEN
    RAISE EXCEPTION 'insufficient_privilege: requires admin or analyst role';
  END IF;
  
  -- Check if demo data already exists for this tenant
  SELECT COUNT(*) INTO v_demo_count
  FROM gate_h.action_items
  WHERE tenant_id = v_tenant_id
    AND 'DEMO' = ANY(tags);
  
  IF v_demo_count > 0 THEN
    -- Demo data already exists, skip insertion
    RAISE NOTICE 'Demo actions already exist for tenant %. Skipping.', v_tenant_id;
    RETURN;
  END IF;
  
  -- =========================================================================
  -- Insert 5 sample actions with different scenarios
  -- =========================================================================
  
  -- Action 1: From Gate-K, HIGH priority, NEW status
  INSERT INTO gate_h.action_items (
    tenant_id,
    source,
    source_reco_id,
    kpi_key,
    dim_key,
    dim_value,
    title_ar,
    desc_ar,
    priority,
    status,
    effort,
    due_date,
    sla_days,
    owner_user_id,
    assignee_user_id,
    tags,
    created_by,
    updated_by
  ) VALUES (
    v_tenant_id,
    'K',
    gen_random_uuid(),
    'training_completion_rate',
    'department',
    'HR',
    'رفع نسبة إكمال دورات الوعي الأمني لقسم الموارد البشرية',
    'خطة عمل لتحسين إكمال الموظفين لدورات الوعي الأمني خلال الربع القادم. يتطلب تنسيق مع مدير الموارد البشرية وإرسال تذكيرات دورية.',
    'high',
    'new',
    'M',
    CURRENT_DATE + 30,
    30,
    v_user_id,
    v_user_id,
    ARRAY['DEMO', 'KPI:training_completion', 'department:HR'],
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_action_id_1;
  
  -- Action 2: From Gate-J, CRITICAL priority, IN_PROGRESS status
  INSERT INTO gate_h.action_items (
    tenant_id,
    source,
    source_reco_id,
    kpi_key,
    dim_key,
    dim_value,
    title_ar,
    desc_ar,
    priority,
    status,
    effort,
    due_date,
    sla_days,
    owner_user_id,
    assignee_user_id,
    tags,
    created_by,
    updated_by
  ) VALUES (
    v_tenant_id,
    'J',
    gen_random_uuid(),
    'phishing_click_rate',
    'location',
    'Riyadh',
    'خفض نسبة النقر على رسائل التصيد في فرع الرياض',
    'تنفيذ حملة توعية مكثفة حول مخاطر التصيد الإلكتروني لموظفي فرع الرياض. يشمل ورش عمل وتدريبات عملية.',
    'critical',
    'in_progress',
    'L',
    CURRENT_DATE + 14,
    14,
    v_user_id,
    v_user_id,
    ARRAY['DEMO', 'KPI:phishing', 'location:Riyadh'],
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_action_id_2;
  
  -- Action 3: Manual source, MEDIUM priority, VERIFY status
  INSERT INTO gate_h.action_items (
    tenant_id,
    source,
    kpi_key,
    title_ar,
    desc_ar,
    priority,
    status,
    effort,
    due_date,
    sla_days,
    owner_user_id,
    assignee_user_id,
    tags,
    created_by,
    updated_by
  ) VALUES (
    v_tenant_id,
    'manual',
    'policy_review_compliance',
    'تحسين عملية مراجعة سياسات الأمن السيبراني سنويًا',
    'تطوير إجراءات مراجعة السياسات الأمنية بشكل منظم وموثق، مع إشراك جميع الأطراف المعنية.',
    'medium',
    'verify',
    'M',
    CURRENT_DATE + 7,
    7,
    v_user_id,
    v_user_id,
    ARRAY['DEMO', 'policy', 'annual_review'],
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_action_id_3;
  
  -- Action 4: Gate-I source, LOW priority, BLOCKED status (overdue)
  INSERT INTO gate_h.action_items (
    tenant_id,
    source,
    source_reco_id,
    kpi_key,
    dim_key,
    dim_value,
    title_ar,
    desc_ar,
    priority,
    status,
    effort,
    due_date,
    sla_days,
    owner_user_id,
    assignee_user_id,
    tags,
    created_by,
    updated_by
  ) VALUES (
    v_tenant_id,
    'I',
    gen_random_uuid(),
    'incident_response_time',
    'org_unit',
    'IT',
    'تحسين زمن الاستجابة للحوادث الأمنية في قسم تقنية المعلومات',
    'مراجعة وتحديث إجراءات الاستجابة للحوادث الأمنية لتقليل زمن الاستجابة. معطل بسبب انتظار موافقة الإدارة العليا.',
    'low',
    'blocked',
    'S',
    CURRENT_DATE - 5, -- Overdue by 5 days
    14,
    v_user_id,
    v_user_id,
    ARRAY['DEMO', 'KPI:incident_response', 'org_unit:IT'],
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_action_id_4;
  
  -- Action 5: Gate-K source, MEDIUM priority, CLOSED status
  -- FIX: Changed 'XS' to 'S' (valid enum value)
  INSERT INTO gate_h.action_items (
    tenant_id,
    source,
    source_reco_id,
    kpi_key,
    title_ar,
    desc_ar,
    priority,
    status,
    effort,
    due_date,
    sla_days,
    owner_user_id,
    assignee_user_id,
    verified_by,
    verified_at,
    closed_at,
    tags,
    created_by,
    updated_by
  ) VALUES (
    v_tenant_id,
    'K',
    gen_random_uuid(),
    'password_policy_compliance',
    'تطبيق سياسة كلمات المرور الجديدة على جميع الأنظمة',
    'تم تطبيق سياسة كلمات المرور المحدثة على جميع أنظمة الشركة بنجاح. تم التحقق من الامتثال.',
    'medium',
    'closed',
    'S',  -- FIXED: Changed from 'XS' to 'S'
    CURRENT_DATE - 10,
    21,
    v_user_id,
    v_user_id,
    v_user_id,
    CURRENT_DATE - 3,
    CURRENT_DATE - 3,
    ARRAY['DEMO', 'KPI:password_policy', 'completed'],
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_action_id_5;
  
  -- Add sample updates for in_progress action
  INSERT INTO gate_h.action_updates (
    tenant_id,
    action_id,
    update_type,
    body_ar,
    progress_pct,
    created_by
  ) VALUES (
    v_tenant_id,
    v_action_id_2,
    'progress',
    'تم عقد ورشة العمل الأولى مع 25 موظفًا. الملاحظات إيجابية والمشاركة عالية.',
    40,
    v_user_id
  );
  
  -- Add evidence for verify action
  INSERT INTO gate_h.action_updates (
    tenant_id,
    action_id,
    update_type,
    body_ar,
    evidence_url,
    created_by
  ) VALUES (
    v_tenant_id,
    v_action_id_3,
    'evidence',
    'تم رفع مستند الإجراءات المحدثة للمراجعة',
    'https://example.com/policy-review-procedures.pdf',
    v_user_id
  );
  
  RAISE NOTICE 'Successfully seeded 5 demo actions for tenant %', v_tenant_id;
END;
$function$;

COMMENT ON FUNCTION gate_h.seed_demo_actions() IS 
'Seeds 5 demo action items for testing and UAT. Requires admin or analyst role. Idempotent - skips if demo data already exists.';