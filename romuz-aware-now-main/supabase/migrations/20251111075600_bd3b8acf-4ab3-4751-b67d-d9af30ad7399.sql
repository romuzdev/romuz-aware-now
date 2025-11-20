-- ============================================================================
-- Gate-H Part 3.1 & 3.2: Demo Seed + Data Quality Constraints & Triggers
-- ============================================================================
-- Part 3.1: Demo seed helper function for current tenant
-- Part 3.2: Data quality constraints and integrity triggers
-- ============================================================================

-- ============================================================================
-- Part 3.1: Demo Seed Helper Function
-- ============================================================================

-- Function: gate_h.seed_demo_actions()
-- Purpose: Insert sample Gate-H actions and updates for the CURRENT tenant
-- Usage: Manually invoked by admins in dev/UAT environments
-- RBAC: Requires tenant_admin or awareness_analyst role
CREATE OR REPLACE FUNCTION gate_h.seed_demo_actions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Validate RBAC: requires tenant_admin or awareness_analyst
  IF NOT (app_has_role('tenant_admin') OR app_has_role('awareness_analyst')) THEN
    RAISE EXCEPTION 'insufficient_privilege: requires tenant_admin or awareness_analyst';
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
    gen_random_uuid(), -- dummy source_reco_id
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
    ARRAY['DEMO', 'governance', 'policies'],
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_action_id_3;
  
  -- Action 4: From Gate-I, HIGH priority, BLOCKED status
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
    'severity',
    'high',
    'تقليل وقت الاستجابة للحوادث الأمنية عالية الخطورة',
    'تحسين إجراءات الاستجابة السريعة للحوادث الأمنية من خلال تدريب الفريق وتحديث الأدوات.',
    'high',
    'blocked',
    'L',
    CURRENT_DATE + 21,
    21,
    v_user_id,
    v_user_id,
    ARRAY['DEMO', 'KPI:incident_response', 'severity:high'],
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_action_id_4;
  
  -- Action 5: From Gate-K, LOW priority, NEW status
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
    'security_awareness_engagement',
    'campaign_type',
    'newsletter',
    'زيادة معدل التفاعل مع النشرة الأمنية الشهرية',
    'تحسين محتوى وتصميم النشرة الأمنية الشهرية لزيادة نسبة الفتح والقراءة.',
    'low',
    'new',
    'S',
    CURRENT_DATE + 45,
    45,
    v_user_id,
    v_user_id,
    ARRAY['DEMO', 'KPI:engagement', 'campaign_type:newsletter'],
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_action_id_5;
  
  -- =========================================================================
  -- Insert action_updates for each action
  -- =========================================================================
  
  -- Updates for Action 1 (NEW status)
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, created_by
  ) VALUES
    (v_tenant_id, v_action_id_1, 'comment', 'تم تحديد قائمة الموظفين المستهدفين في قسم الموارد البشرية.', v_user_id);
  
  -- Updates for Action 2 (IN_PROGRESS status)
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, new_status, created_by
  ) VALUES
    (v_tenant_id, v_action_id_2, 'status_change', 'تم بدء العمل على الحملة التوعوية.', 'in_progress', v_user_id);
  
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, progress_pct, created_by
  ) VALUES
    (v_tenant_id, v_action_id_2, 'progress', 'تم إكمال المرحلة الأولى من ورش العمل (50% من الموظفين).', 50, v_user_id);
  
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, created_by
  ) VALUES
    (v_tenant_id, v_action_id_2, 'comment', 'تم إرسال تذكير بالبريد الإلكتروني للموظفين المتبقين.', v_user_id);
  
  -- Updates for Action 3 (VERIFY status)
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, new_status, created_by
  ) VALUES
    (v_tenant_id, v_action_id_3, 'status_change', 'تم إكمال تطوير الإجراءات الجديدة.', 'in_progress', v_user_id);
  
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, progress_pct, created_by
  ) VALUES
    (v_tenant_id, v_action_id_3, 'progress', 'تم مراجعة الإجراءات مع جميع الأطراف المعنية.', 100, v_user_id);
  
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, new_status, created_by
  ) VALUES
    (v_tenant_id, v_action_id_3, 'status_change', 'تم تقديم الإجراءات للمراجعة النهائية.', 'verify', v_user_id);
  
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, evidence_url, created_by
  ) VALUES
    (v_tenant_id, v_action_id_3, 'evidence', 'وثيقة الإجراءات المحدثة مع توقيعات المراجعين.', 'https://example.com/demo/policy-review-procedures-v2.pdf', v_user_id);
  
  -- Updates for Action 4 (BLOCKED status)
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, new_status, created_by
  ) VALUES
    (v_tenant_id, v_action_id_4, 'status_change', 'تم بدء العمل على تحسين إجراءات الاستجابة.', 'in_progress', v_user_id);
  
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, new_status, created_by
  ) VALUES
    (v_tenant_id, v_action_id_4, 'status_change', 'تم إيقاف العمل مؤقتاً بسبب نقص الميزانية المعتمدة.', 'blocked', v_user_id);
  
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, created_by
  ) VALUES
    (v_tenant_id, v_action_id_4, 'comment', 'في انتظار الموافقة على الميزانية الإضافية من الإدارة المالية.', v_user_id);
  
  -- Updates for Action 5 (NEW status)
  INSERT INTO gate_h.action_updates (
    tenant_id, action_id, update_type, body_ar, created_by
  ) VALUES
    (v_tenant_id, v_action_id_5, 'comment', 'تم إنشاء الإجراء وتحديد الأهداف المطلوبة.', v_user_id);
  
  -- =========================================================================
  -- Insert action_links for some actions
  -- =========================================================================
  
  -- Links for Action 2
  INSERT INTO gate_h.action_links (
    tenant_id, action_id, linked_entity_type, linked_entity_id, 
    link_url, link_title, created_by
  ) VALUES
    (v_tenant_id, v_action_id_2, 'external_ticket', gen_random_uuid(),
     'https://example.com/demo/jira/DEMO-123', 'Jira Ticket DEMO-123', v_user_id);
  
  INSERT INTO gate_h.action_links (
    tenant_id, action_id, linked_entity_type, linked_entity_id,
    link_url, link_title, created_by
  ) VALUES
    (v_tenant_id, v_action_id_2, 'internal_doc', gen_random_uuid(),
     'https://example.com/demo/docs/phishing-training-plan', 'خطة التدريب على التصيد', v_user_id);
  
  -- Links for Action 3
  INSERT INTO gate_h.action_links (
    tenant_id, action_id, linked_entity_type, linked_entity_id,
    link_url, link_title, created_by
  ) VALUES
    (v_tenant_id, v_action_id_3, 'internal_doc', gen_random_uuid(),
     'https://example.com/demo/docs/policy-review-procedures', 'وثيقة إجراءات المراجعة', v_user_id);
  
  -- Links for Action 4
  INSERT INTO gate_h.action_links (
    tenant_id, action_id, linked_entity_type, linked_entity_id,
    link_url, link_title, created_by
  ) VALUES
    (v_tenant_id, v_action_id_4, 'external_ticket', gen_random_uuid(),
     'https://example.com/demo/jira/DEMO-456', 'Jira Ticket DEMO-456', v_user_id);
  
  RAISE NOTICE 'Successfully seeded % demo actions for tenant %', 5, v_tenant_id;
END;
$$;

COMMENT ON FUNCTION gate_h.seed_demo_actions() IS 
'Gate-H Demo Helper: Seeds 5 sample actions with updates and links for the current tenant. 
Meant for dev/UAT environments only. Requires tenant_admin or awareness_analyst role.
Skips if demo data (tags containing DEMO) already exists.';

-- ============================================================================
-- Part 3.2: Data Quality Constraints & Integrity Triggers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) CHECK constraint on gate_h.action_items.sla_days
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'action_items_sla_days_positive'
  ) THEN
    ALTER TABLE gate_h.action_items
    ADD CONSTRAINT action_items_sla_days_positive
    CHECK (sla_days IS NULL OR sla_days > 0);
  END IF;
END $$;

COMMENT ON CONSTRAINT action_items_sla_days_positive ON gate_h.action_items IS
'Gate-H Data Quality: Ensure sla_days is positive when specified.';

-- ---------------------------------------------------------------------------
-- 2) BEFORE INSERT/UPDATE Trigger: Lifecycle & Timestamps Integrity
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gate_h.trg_fn_action_items_lifecycle_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always update timestamps
  NEW.updated_at := now();
  NEW.updated_by := app_current_user_id();
  
  -- Enforce lifecycle integrity for CLOSED status
  IF NEW.status = 'closed' THEN
    -- Ensure closed_at is set
    IF NEW.closed_at IS NULL THEN
      NEW.closed_at := now();
    END IF;
    
    -- Ensure verified_at is set
    IF NEW.verified_at IS NULL THEN
      NEW.verified_at := now();
    END IF;
    
    -- Ensure verified_by is set
    IF NEW.verified_by IS NULL THEN
      NEW.verified_by := app_current_user_id();
    END IF;
  END IF;
  
  -- Prevent reopening closed actions
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'closed' AND NEW.status <> 'closed' THEN
      RAISE EXCEPTION 'invalid_status_transition: cannot reopen closed action (id: %)', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION gate_h.trg_fn_action_items_lifecycle_integrity() IS
'Gate-H Data Quality: Enforces lifecycle integrity and timestamps consistency.
- Sets updated_at/updated_by automatically
- Ensures closed actions have closed_at, verified_at, verified_by
- Prevents reopening closed actions';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_action_items_lifecycle_integrity ON gate_h.action_items;

CREATE TRIGGER trg_action_items_lifecycle_integrity
BEFORE INSERT OR UPDATE ON gate_h.action_items
FOR EACH ROW
EXECUTE FUNCTION gate_h.trg_fn_action_items_lifecycle_integrity();

-- ---------------------------------------------------------------------------
-- 3) AFTER UPDATE Trigger: Require Evidence for Closed Actions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gate_h.trg_fn_action_items_require_evidence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evidence_count INTEGER;
BEGIN
  -- Only check when transitioning TO closed status
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status <> 'closed') THEN
    -- Count evidence updates
    SELECT COUNT(*) INTO v_evidence_count
    FROM gate_h.action_updates
    WHERE action_id = NEW.id
      AND update_type = 'evidence';
    
    -- Raise exception if no evidence found
    IF v_evidence_count = 0 THEN
      RAISE EXCEPTION 'cannot_close_without_evidence: action % has no evidence updates', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION gate_h.trg_fn_action_items_require_evidence() IS
'Gate-H Data Quality: Defensive check to ensure closed actions have at least one evidence update.
This is a safety net in addition to the verify_and_close() RPC logic.';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_action_items_require_evidence ON gate_h.action_items;

CREATE TRIGGER trg_action_items_require_evidence
AFTER UPDATE ON gate_h.action_items
FOR EACH ROW
EXECUTE FUNCTION gate_h.trg_fn_action_items_require_evidence();

-- ---------------------------------------------------------------------------
-- 4) BEFORE INSERT Trigger: Data Quality on action_updates
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gate_h.trg_fn_action_updates_quality()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_tenant_id UUID;
BEGIN
  -- Ensure tenant_id consistency with parent action
  SELECT tenant_id INTO v_parent_tenant_id
  FROM gate_h.action_items
  WHERE id = NEW.action_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_action_id: action % does not exist', NEW.action_id;
  END IF;
  
  IF NEW.tenant_id <> v_parent_tenant_id THEN
    RAISE EXCEPTION 'tenant_mismatch: update tenant_id (%) does not match action tenant_id (%)', 
      NEW.tenant_id, v_parent_tenant_id;
  END IF;
  
  -- Validate update_type specific requirements
  CASE NEW.update_type
    WHEN 'progress' THEN
      -- Require progress_pct for progress updates
      IF NEW.progress_pct IS NULL THEN
        RAISE EXCEPTION 'invalid_progress_pct: progress_pct is required for progress updates';
      END IF;
      
      -- Ensure progress_pct is between 0 and 100
      IF NEW.progress_pct < 0 OR NEW.progress_pct > 100 THEN
        RAISE EXCEPTION 'invalid_progress_pct: must be between 0 and 100 (got: %)', NEW.progress_pct;
      END IF;
      
    WHEN 'status_change' THEN
      -- Require new_status for status_change updates
      IF NEW.new_status IS NULL THEN
        RAISE EXCEPTION 'invalid_status_change: new_status is required for status_change updates';
      END IF;
      
    WHEN 'evidence' THEN
      -- Require evidence_url for evidence updates
      IF NEW.evidence_url IS NULL OR NEW.evidence_url = '' THEN
        RAISE EXCEPTION 'invalid_evidence: evidence_url is required for evidence updates';
      END IF;
  END CASE;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION gate_h.trg_fn_action_updates_quality() IS
'Gate-H Data Quality: Validates action_updates data before insertion.
- Ensures tenant_id consistency with parent action
- Validates progress: requires progress_pct (0-100)
- Validates status_change: requires new_status
- Validates evidence: requires evidence_url';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_action_updates_quality ON gate_h.action_updates;

CREATE TRIGGER trg_action_updates_quality
BEFORE INSERT ON gate_h.action_updates
FOR EACH ROW
EXECUTE FUNCTION gate_h.trg_fn_action_updates_quality();

-- ============================================================================
-- Optional: Helper function to check if demo data exists
-- ============================================================================
CREATE OR REPLACE FUNCTION gate_h.has_demo_actions()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM gate_h.action_items
    WHERE tenant_id = app_current_tenant_id()
      AND 'DEMO' = ANY(tags)
  );
$$;

COMMENT ON FUNCTION gate_h.has_demo_actions() IS
'Gate-H Helper: Returns true if demo actions exist for the current tenant.';

-- ============================================================================
-- Summary
-- ============================================================================
-- Part 3.1: ✅ gate_h.seed_demo_actions() - Demo seed helper
--           ✅ gate_h.has_demo_actions() - Check for demo data
--
-- Part 3.2: ✅ CHECK constraint on sla_days (must be positive)
--           ✅ BEFORE trigger: lifecycle & timestamps integrity
--           ✅ AFTER trigger: require evidence for closed actions
--           ✅ BEFORE trigger: action_updates data quality validation
-- ============================================================================