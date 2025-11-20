-- ============================================================================
-- GRC Platform - Test Data Seed Script
-- ============================================================================
-- Purpose: Create comprehensive test data for GRC Platform (Risks, Controls, Compliance, Audits)
-- Usage: Run this script in Lovable Backend SQL Editor
-- ============================================================================

-- IMPORTANT: Replace these UUIDs with your actual values
-- Your Tenant ID: Get from tenants table
-- Your User ID: Get from auth.users table
DO $$
DECLARE
  v_tenant_id UUID := 'fae7dcf4-76ae-47c1-9e9e-13947d525351'; -- Current tenant ID from session
  v_user_id UUID := 'bc32716f-3b0d-413d-9315-0c1b0b468f8f'; -- Current user ID from session
  
  -- Generated IDs for relationships
  v_risk_strategic_1 UUID;
  v_risk_operational_1 UUID;
  v_risk_financial_1 UUID;
  v_risk_compliance_1 UUID;
  v_risk_tech_1 UUID;
  v_risk_rep_1 UUID;
  
  v_control_ac_1 UUID;
  v_control_dp_1 UUID;
  v_control_ps_1 UUID;
  v_control_tech_1 UUID;
  v_control_admin_1 UUID;
  
  v_framework_iso27001 UUID;
  v_framework_nca_ecc UUID;
  v_framework_pdpl UUID;
  v_framework_internal UUID;
  
  v_req_iso_1 UUID;
  v_req_iso_2 UUID;
  v_req_nca_1 UUID;
  v_req_pdpl_1 UUID;
  
  v_audit_iso_1 UUID;
  v_audit_internal_1 UUID;
  
BEGIN
  RAISE NOTICE '🌱 Starting GRC Platform test data seeding...';
  
  -- ============================================================================
  -- 1. GRC RISKS - Sample Risk Register
  -- ============================================================================
  RAISE NOTICE '📊 Seeding Risks...';
  
  -- Strategic Risk 1: Market Competition
  INSERT INTO public.grc_risks (
    tenant_id, risk_code, risk_title, risk_description, risk_category,
    risk_owner_id, risk_type, likelihood_score, impact_score,
    current_likelihood_score, current_impact_score,
    risk_status, treatment_strategy, risk_appetite,
    identified_date, next_review_date, is_active,
    tags, created_by
  ) VALUES (
    v_tenant_id, 'RISK-STR-001', 'منافسة السوق المتزايدة',
    'زيادة المنافسة في السوق قد تؤدي إلى فقدان حصة سوقية وانخفاض الإيرادات',
    'strategic', v_user_id, 'threat', 4, 4, 3, 3,
    'treated', 'mitigate', 'medium',
    CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '90 days', true,
    ARRAY['market', 'competition', 'revenue'], v_user_id
  ) RETURNING id INTO v_risk_strategic_1;
  
  -- Operational Risk 1: System Downtime
  INSERT INTO public.grc_risks (
    tenant_id, risk_code, risk_title, risk_description, risk_category,
    risk_owner_id, risk_type, likelihood_score, impact_score,
    current_likelihood_score, current_impact_score,
    risk_status, treatment_strategy, risk_appetite,
    identified_date, next_review_date, is_active,
    tags, created_by
  ) VALUES (
    v_tenant_id, 'RISK-OPS-001', 'توقف الأنظمة التشغيلية',
    'احتمالية توقف الأنظمة الحرجة مما يؤثر على استمرارية الأعمال',
    'operational', v_user_id, 'threat', 3, 5, 2, 4,
    'monitored', 'mitigate', 'low',
    CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', true,
    ARRAY['systems', 'downtime', 'operations'], v_user_id
  ) RETURNING id INTO v_risk_operational_1;
  
  -- Financial Risk 1: Currency Fluctuation
  INSERT INTO public.grc_risks (
    tenant_id, risk_code, risk_title, risk_description, risk_category,
    risk_owner_id, risk_type, likelihood_score, impact_score,
    current_likelihood_score, current_impact_score,
    risk_status, treatment_strategy, risk_appetite,
    identified_date, next_review_date, is_active,
    tags, created_by
  ) VALUES (
    v_tenant_id, 'RISK-FIN-001', 'تقلبات أسعار الصرف',
    'التغيرات في أسعار صرف العملات تؤثر على الإيرادات والتكاليف',
    'financial', v_user_id, 'threat', 4, 3, 3, 2,
    'treated', 'transfer', 'medium',
    CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '120 days', true,
    ARRAY['currency', 'forex', 'financial'], v_user_id
  ) RETURNING id INTO v_risk_financial_1;
  
  -- Compliance Risk 1: PDPL Violation
  INSERT INTO public.grc_risks (
    tenant_id, risk_code, risk_title, risk_description, risk_category,
    risk_owner_id, risk_type, likelihood_score, impact_score,
    current_likelihood_score, current_impact_score,
    risk_status, treatment_strategy, risk_appetite,
    identified_date, next_review_date, is_active,
    tags, created_by
  ) VALUES (
    v_tenant_id, 'RISK-CMP-001', 'عدم الامتثال لنظام حماية البيانات PDPL',
    'احتمالية مخالفة متطلبات نظام حماية البيانات الشخصية السعودي',
    'compliance', v_user_id, 'threat', 2, 5, 1, 4,
    'treated', 'mitigate', 'low',
    CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '30 days', true,
    ARRAY['pdpl', 'compliance', 'data-privacy'], v_user_id
  ) RETURNING id INTO v_risk_compliance_1;
  
  -- Technology Risk 1: Cyber Attack
  INSERT INTO public.grc_risks (
    tenant_id, risk_code, risk_title, risk_description, risk_category,
    risk_owner_id, risk_type, likelihood_score, impact_score,
    current_likelihood_score, current_impact_score,
    risk_status, treatment_strategy, risk_appetite,
    identified_date, next_review_date, is_active,
    tags, created_by
  ) VALUES (
    v_tenant_id, 'RISK-TEC-001', 'هجمات سيبرانية متقدمة',
    'تهديدات سيبرانية متطورة قد تؤدي إلى اختراق الأنظمة وسرقة البيانات',
    'technology', v_user_id, 'threat', 5, 5, 3, 4,
    'treated', 'mitigate', 'low',
    CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '30 days', true,
    ARRAY['cybersecurity', 'hacking', 'data-breach'], v_user_id
  ) RETURNING id INTO v_risk_tech_1;
  
  -- Reputational Risk 1: Social Media Crisis
  INSERT INTO public.grc_risks (
    tenant_id, risk_code, risk_title, risk_description, risk_category,
    risk_owner_id, risk_type, likelihood_score, impact_score,
    current_likelihood_score, current_impact_score,
    risk_status, treatment_strategy, risk_appetite,
    identified_date, next_review_date, is_active,
    tags, created_by
  ) VALUES (
    v_tenant_id, 'RISK-REP-001', 'أزمة سمعة على وسائل التواصل',
    'انتشار معلومات سلبية على وسائل التواصل الاجتماعي يؤثر على السمعة',
    'reputational', v_user_id, 'threat', 3, 4, 2, 3,
    'monitored', 'mitigate', 'medium',
    CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days', true,
    ARRAY['reputation', 'social-media', 'pr'], v_user_id
  ) RETURNING id INTO v_risk_rep_1;
  
  RAISE NOTICE '  ✅ Created 6 sample risks';
  
  -- ============================================================================
  -- 2. RISK ASSESSMENTS
  -- ============================================================================
  RAISE NOTICE '📋 Seeding Risk Assessments...';
  
  -- Assessment for Strategic Risk
  INSERT INTO public.grc_risk_assessments (
    tenant_id, risk_id, assessment_date, assessment_type,
    likelihood_score, impact_score, risk_score, risk_level,
    assessment_method, scenario_description,
    assessed_by, reviewed_by, assessment_status,
    key_findings, recommendations, control_effectiveness_rating,
    created_by
  ) VALUES (
    v_tenant_id, v_risk_strategic_1, CURRENT_DATE - INTERVAL '50 days', 'initial',
    4, 4, 16, 'high',
    'qualitative', 'تقييم المنافسة الحالية في السوق وتحليل الحصة السوقية',
    v_user_id, v_user_id, 'approved',
    'المنافسة تتزايد بشكل ملحوظ مع دخول لاعبين جدد',
    'تطوير ميزات تنافسية جديدة وتحسين تجربة العملاء',
    'partially_effective', v_user_id
  );
  
  -- Assessment for Technology Risk
  INSERT INTO public.grc_risk_assessments (
    tenant_id, risk_id, assessment_date, assessment_type,
    likelihood_score, impact_score, risk_score, risk_level,
    assessment_method, scenario_description,
    assessed_by, assessment_status,
    key_findings, recommendations, control_effectiveness_rating,
    created_by
  ) VALUES (
    v_tenant_id, v_risk_tech_1, CURRENT_DATE - INTERVAL '5 days', 'periodic',
    5, 5, 25, 'very_high',
    'semi_quantitative', 'تقييم فعالية الضوابط الأمنية الحالية ضد التهديدات السيبرانية',
    v_user_id, 'approved',
    'هناك ثغرات أمنية محتملة تحتاج إلى معالجة فورية',
    'تطبيق patch management فوري وتعزيز المراقبة الأمنية',
    'partially_effective', v_user_id
  );
  
  RAISE NOTICE '  ✅ Created 2 risk assessments';
  
  -- ============================================================================
  -- 3. RISK TREATMENT PLANS
  -- ============================================================================
  RAISE NOTICE '🛡️ Seeding Risk Treatment Plans...';
  
  -- Treatment Plan for Technology Risk
  INSERT INTO public.grc_risk_treatment_plans (
    tenant_id, risk_id, plan_code, plan_title,
    treatment_strategy, plan_description,
    plan_status, priority, estimated_cost,
    assigned_to, start_date, target_completion_date,
    progress_percentage, effectiveness_rating,
    created_by
  ) VALUES (
    v_tenant_id, v_risk_tech_1, 'TRP-TEC-001', 'تعزيز الأمن السيبراني',
    'mitigate',
    'تطبيق حلول أمنية متقدمة وتدريب الموظفين على الأمن السيبراني',
    'in_progress', 'critical', 250000.00,
    v_user_id, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '60 days',
    45, 'good',
    v_user_id
  );
  
  -- Treatment Plan for Compliance Risk
  INSERT INTO public.grc_risk_treatment_plans (
    tenant_id, risk_id, plan_code, plan_title,
    treatment_strategy, plan_description,
    plan_status, priority, estimated_cost,
    assigned_to, start_date, target_completion_date,
    progress_percentage, effectiveness_rating,
    created_by
  ) VALUES (
    v_tenant_id, v_risk_compliance_1, 'TRP-CMP-001', 'برنامج الامتثال لـ PDPL',
    'mitigate',
    'تطوير سياسات حماية البيانات وتدريب الموظفين',
    'completed', 'high', 150000.00,
    v_user_id, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '10 days',
    100, 'excellent',
    v_user_id
  );
  
  RAISE NOTICE '  ✅ Created 2 treatment plans';
  
  -- ============================================================================
  -- 4. GRC CONTROLS - Control Library
  -- ============================================================================
  RAISE NOTICE '🔒 Seeding Controls...';
  
  -- Access Control 1
  INSERT INTO public.grc_controls (
    tenant_id, control_code, control_title, control_description,
    control_objective, control_type, control_category, control_nature,
    testing_frequency, effectiveness_rating, maturity_level,
    control_owner_id, control_status, implementation_date,
    next_test_date, linked_risk_ids, tags,
    framework_references, created_by
  ) VALUES (
    v_tenant_id, 'CTR-AC-001', 'مصادقة متعددة العوامل (MFA)',
    'تطبيق مصادقة متعددة العوامل لجميع الحسابات الإدارية والوصول للأنظمة الحرجة',
    'منع الوصول غير المصرح به للأنظمة الحرجة',
    'preventive', 'access_control', 'automated',
    'monthly', 'effective', 'managed',
    v_user_id, 'active', CURRENT_DATE - INTERVAL '180 days',
    CURRENT_DATE + INTERVAL '30 days', ARRAY[v_risk_tech_1],
    ARRAY['mfa', 'authentication', 'access-control'],
    '[{"framework": "ISO27001", "control_id": "A.9.4.2"}]'::jsonb,
    v_user_id
  ) RETURNING id INTO v_control_ac_1;
  
  -- Data Protection 1
  INSERT INTO public.grc_controls (
    tenant_id, control_code, control_title, control_description,
    control_objective, control_type, control_category, control_nature,
    testing_frequency, effectiveness_rating, maturity_level,
    control_owner_id, control_status, implementation_date,
    next_test_date, linked_risk_ids, tags,
    framework_references, created_by
  ) VALUES (
    v_tenant_id, 'CTR-DP-001', 'تشفير البيانات الحساسة',
    'تطبيق تشفير AES-256 لجميع البيانات الشخصية والحساسة في قواعد البيانات',
    'حماية سرية البيانات الحساسة',
    'preventive', 'data_protection', 'automated',
    'quarterly', 'highly_effective', 'optimized',
    v_user_id, 'active', CURRENT_DATE - INTERVAL '240 days',
    CURRENT_DATE + INTERVAL '60 days', ARRAY[v_risk_compliance_1, v_risk_tech_1],
    ARRAY['encryption', 'data-protection', 'privacy'],
    '[{"framework": "ISO27001", "control_id": "A.10.1.1"}, {"framework": "PDPL", "control_id": "Art.22"}]'::jsonb,
    v_user_id
  ) RETURNING id INTO v_control_dp_1;
  
  -- Physical Security 1
  INSERT INTO public.grc_controls (
    tenant_id, control_code, control_title, control_description,
    control_objective, control_type, control_category, control_nature,
    testing_frequency, effectiveness_rating, maturity_level,
    control_owner_id, control_status, implementation_date,
    next_test_date, tags, created_by
  ) VALUES (
    v_tenant_id, 'CTR-PS-001', 'مراقبة الوصول الفيزيائي لمركز البيانات',
    'نظام بطاقات وصول وكاميرات مراقبة على مدار الساعة',
    'منع الوصول الفيزيائي غير المصرح به',
    'detective', 'physical_security', 'hybrid',
    'weekly', 'effective', 'managed',
    v_user_id, 'active', CURRENT_DATE - INTERVAL '365 days',
    CURRENT_DATE + INTERVAL '7 days',
    ARRAY['physical', 'datacenter', 'access'],
    v_user_id
  ) RETURNING id INTO v_control_ps_1;
  
  -- Technical Control 1
  INSERT INTO public.grc_controls (
    tenant_id, control_code, control_title, control_description,
    control_objective, control_type, control_category, control_nature,
    testing_frequency, effectiveness_rating, maturity_level,
    control_owner_id, control_status, implementation_date,
    next_test_date, linked_risk_ids, tags, created_by
  ) VALUES (
    v_tenant_id, 'CTR-TEC-001', 'نظام كشف التسلل (IDS/IPS)',
    'نظام متقدم لكشف ومنع محاولات التسلل والهجمات السيبرانية',
    'كشف ومنع الهجمات السيبرانية في الوقت الفعلي',
    'detective', 'technical', 'automated',
    'daily', 'highly_effective', 'optimized',
    v_user_id, 'active', CURRENT_DATE - INTERVAL '120 days',
    CURRENT_DATE + INTERVAL '1 day', ARRAY[v_risk_tech_1],
    ARRAY['ids', 'ips', 'network-security'],
    v_user_id
  ) RETURNING id INTO v_control_tech_1;
  
  -- Administrative Control 1
  INSERT INTO public.grc_controls (
    tenant_id, control_code, control_title, control_description,
    control_objective, control_type, control_category, control_nature,
    testing_frequency, effectiveness_rating, maturity_level,
    control_owner_id, control_status, implementation_date,
    next_test_date, tags, created_by
  ) VALUES (
    v_tenant_id, 'CTR-ADM-001', 'سياسة أمن المعلومات',
    'سياسة شاملة لأمن المعلومات معتمدة من الإدارة العليا',
    'توفير إطار حوكمة لأمن المعلومات',
    'directive', 'administrative', 'manual',
    'annually', 'effective', 'defined',
    v_user_id, 'active', CURRENT_DATE - INTERVAL '200 days',
    CURRENT_DATE + INTERVAL '160 days',
    ARRAY['policy', 'governance', 'security'],
    v_user_id
  ) RETURNING id INTO v_control_admin_1;
  
  RAISE NOTICE '  ✅ Created 5 controls';
  
  -- ============================================================================
  -- 5. CONTROL TESTS
  -- ============================================================================
  RAISE NOTICE '🧪 Seeding Control Tests...';
  
  -- Test for MFA Control
  INSERT INTO public.grc_control_tests (
    tenant_id, control_id, test_code, test_title,
    test_date, test_type, test_method, test_result,
    effectiveness_conclusion, tested_by,
    test_description, findings, evidence_collected,
    remediation_required, remediation_status,
    created_by
  ) VALUES (
    v_tenant_id, v_control_ac_1, 'TST-AC-001-2024-01', 'اختبار فعالية MFA',
    CURRENT_DATE - INTERVAL '15 days', 'operating_effectiveness', 'sampling',
    'passed', 'effective', v_user_id,
    'اختبار 50 مستخدم عشوائي للتحقق من تفعيل MFA',
    'جميع الحسابات الإدارية مفعل لها MFA بشكل صحيح',
    ARRAY['screenshots', 'audit-logs', 'sample-list'],
    false, 'not_required',
    v_user_id
  );
  
  -- Test for Encryption Control
  INSERT INTO public.grc_control_tests (
    tenant_id, control_id, test_code, test_title,
    test_date, test_type, test_method, test_result,
    effectiveness_conclusion, tested_by,
    test_description, findings, evidence_collected,
    remediation_required, remediation_status,
    created_by
  ) VALUES (
    v_tenant_id, v_control_dp_1, 'TST-DP-001-2024-01', 'فحص تشفير قواعد البيانات',
    CURRENT_DATE - INTERVAL '30 days', 'design', 'inspection',
    'passed_with_exceptions', 'partially_effective', v_user_id,
    'مراجعة إعدادات التشفير في جميع قواعد البيانات',
    'التشفير مفعل لكن هناك جداول قديمة تحتاج ترحيل',
    ARRAY['config-files', 'db-schema', 'encryption-keys'],
    true, 'in_progress',
    v_user_id
  );
  
  -- Test for IDS/IPS Control
  INSERT INTO public.grc_control_tests (
    tenant_id, control_id, test_code, test_title,
    test_date, test_type, test_method, test_result,
    effectiveness_conclusion, tested_by,
    test_description, findings, evidence_collected,
    remediation_required, remediation_status,
    created_by
  ) VALUES (
    v_tenant_id, v_control_tech_1, 'TST-TEC-001-2024-01', 'اختبار نظام IDS/IPS',
    CURRENT_DATE - INTERVAL '5 days', 'operating_effectiveness', 'penetration_test',
    'passed', 'effective', v_user_id,
    'محاكاة هجمات سيبرانية لاختبار فعالية النظام',
    'النظام كشف ومنع جميع محاولات الهجوم بنجاح',
    ARRAY['test-results', 'alert-logs', 'incident-reports'],
    false, 'not_required',
    v_user_id
  );
  
  RAISE NOTICE '  ✅ Created 3 control tests';
  
  -- ============================================================================
  -- 6. COMPLIANCE FRAMEWORKS
  -- ============================================================================
  RAISE NOTICE '📜 Seeding Compliance Frameworks...';
  
  -- ISO 27001
  INSERT INTO public.grc_compliance_frameworks (
    tenant_id, framework_code, framework_name, framework_name_ar,
    framework_version, description, description_ar,
    issuing_authority, framework_type, framework_status,
    effective_date, next_review_date, owner_user_id,
    tags, external_url, created_by
  ) VALUES (
    v_tenant_id, 'ISO27001', 'ISO/IEC 27001:2022',
    'ISO/IEC 27001:2022 - نظام إدارة أمن المعلومات',
    '2022',
    'Information Security Management System Standard',
    'المعيار الدولي لنظام إدارة أمن المعلومات',
    'ISO/IEC', 'industry_standard', 'active',
    '2022-10-25', CURRENT_DATE + INTERVAL '365 days', v_user_id,
    ARRAY['iso', 'information-security', 'isms'],
    'https://www.iso.org/standard/27001',
    v_user_id
  ) RETURNING id INTO v_framework_iso27001;
  
  -- NCA ECC
  INSERT INTO public.grc_compliance_frameworks (
    tenant_id, framework_code, framework_name, framework_name_ar,
    framework_version, description, description_ar,
    issuing_authority, framework_type, framework_status,
    effective_date, next_review_date, owner_user_id,
    tags, external_url, created_by
  ) VALUES (
    v_tenant_id, 'NCA-ECC', 'NCA Essential Cybersecurity Controls',
    'الضوابط الأساسية للأمن السيبراني - الهيئة الوطنية للأمن السيبراني',
    '2.0',
    'Saudi National Cybersecurity Authority Essential Controls',
    'الضوابط الأساسية للأمن السيبراني الصادرة عن الهيئة الوطنية للأمن السيبراني',
    'NCA', 'regulatory', 'active',
    '2021-01-01', CURRENT_DATE + INTERVAL '180 days', v_user_id,
    ARRAY['nca', 'cybersecurity', 'saudi', 'regulatory'],
    'https://nca.gov.sa',
    v_user_id
  ) RETURNING id INTO v_framework_nca_ecc;
  
  -- PDPL
  INSERT INTO public.grc_compliance_frameworks (
    tenant_id, framework_code, framework_name, framework_name_ar,
    framework_version, description, description_ar,
    issuing_authority, framework_type, framework_status,
    effective_date, next_review_date, owner_user_id,
    tags, external_url, created_by
  ) VALUES (
    v_tenant_id, 'PDPL', 'Personal Data Protection Law',
    'نظام حماية البيانات الشخصية',
    '1.0',
    'Saudi Arabia Personal Data Protection Law',
    'نظام حماية البيانات الشخصية في المملكة العربية السعودية',
    'SDAIA', 'regulatory', 'active',
    '2022-03-24', CURRENT_DATE + INTERVAL '180 days', v_user_id,
    ARRAY['pdpl', 'data-privacy', 'gdpr-like', 'saudi'],
    'https://sdaia.gov.sa/ar/PDPL',
    v_user_id
  ) RETURNING id INTO v_framework_pdpl;
  
  -- Internal Framework
  INSERT INTO public.grc_compliance_frameworks (
    tenant_id, framework_code, framework_name, framework_name_ar,
    framework_version, description, description_ar,
    issuing_authority, framework_type, framework_status,
    effective_date, next_review_date, owner_user_id,
    tags, created_by
  ) VALUES (
    v_tenant_id, 'INT-SEC-001', 'Internal Security Policy Framework',
    'إطار السياسات الأمنية الداخلية',
    '1.0',
    'Organization internal security and compliance policies',
    'السياسات الأمنية والامتثال الداخلية للمؤسسة',
    'Internal IT', 'internal', 'active',
    CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days', v_user_id,
    ARRAY['internal', 'policy', 'security'],
    v_user_id
  ) RETURNING id INTO v_framework_internal;
  
  RAISE NOTICE '  ✅ Created 4 compliance frameworks';
  
  -- ============================================================================
  -- 7. COMPLIANCE REQUIREMENTS
  -- ============================================================================
  RAISE NOTICE '📋 Seeding Compliance Requirements...';
  
  -- ISO 27001 Requirements
  INSERT INTO public.grc_compliance_requirements (
    tenant_id, framework_id, requirement_code, requirement_title,
    requirement_title_ar, requirement_description, requirement_description_ar,
    category, domain, priority, compliance_status,
    owner_user_id, responsible_user_id,
    compliance_evidence_text, last_assessment_date, next_assessment_date,
    linked_control_ids, tags, created_by
  ) VALUES (
    v_tenant_id, v_framework_iso27001, 'A.9.1.1', 'Access Control Policy',
    'سياسة التحكم في الوصول',
    'An access control policy shall be established, documented and reviewed',
    'يجب إنشاء وتوثيق ومراجعة سياسة التحكم في الوصول',
    'Access Control', 'Access Control', 'high', 'compliant',
    v_user_id, v_user_id,
    'سياسة التحكم في الوصول معتمدة ومنشورة، آخر مراجعة: ' || TO_CHAR(CURRENT_DATE - INTERVAL '60 days', 'YYYY-MM-DD'),
    CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days',
    ARRAY[v_control_ac_1], ARRAY['iso27001', 'access-control', 'policy'],
    v_user_id
  ) RETURNING id INTO v_req_iso_1;
  
  INSERT INTO public.grc_compliance_requirements (
    tenant_id, framework_id, requirement_code, requirement_title,
    requirement_title_ar, requirement_description, requirement_description_ar,
    category, domain, priority, compliance_status,
    owner_user_id, responsible_user_id,
    linked_control_ids, tags, created_by
  ) VALUES (
    v_tenant_id, v_framework_iso27001, 'A.10.1.1', 'Cryptographic Controls',
    'الضوابط التشفيرية',
    'A policy on the use of cryptographic controls shall be developed and implemented',
    'يجب تطوير وتطبيق سياسة لاستخدام الضوابط التشفيرية',
    'Cryptography', 'Data Protection', 'critical', 'compliant',
    v_user_id, v_user_id,
    ARRAY[v_control_dp_1], ARRAY['iso27001', 'encryption', 'crypto'],
    v_user_id
  ) RETURNING id INTO v_req_iso_2;
  
  -- NCA ECC Requirements
  INSERT INTO public.grc_compliance_requirements (
    tenant_id, framework_id, requirement_code, requirement_title,
    requirement_title_ar, requirement_description, requirement_description_ar,
    category, domain, priority, compliance_status,
    owner_user_id, responsible_user_id,
    compliance_evidence_text, last_assessment_date, next_assessment_date,
    linked_control_ids, tags, created_by
  ) VALUES (
    v_tenant_id, v_framework_nca_ecc, '1-1-1', 'Cybersecurity Governance',
    'حوكمة الأمن السيبراني',
    'Establish cybersecurity governance structure',
    'إنشاء هيكل حوكمة الأمن السيبراني',
    'Governance', 'Governance & Risk Management', 'critical', 'partially_compliant',
    v_user_id, v_user_id,
    'تم إنشاء لجنة الأمن السيبراني لكن تحتاج تفعيل أكثر',
    CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days',
    ARRAY[v_control_admin_1], ARRAY['nca', 'governance', 'structure'],
    v_user_id
  ) RETURNING id INTO v_req_nca_1;
  
  -- PDPL Requirements
  INSERT INTO public.grc_compliance_requirements (
    tenant_id, framework_id, requirement_code, requirement_title,
    requirement_title_ar, requirement_description, requirement_description_ar,
    category, domain, priority, compliance_status,
    owner_user_id, responsible_user_id,
    compliance_evidence_text, last_assessment_date, next_assessment_date,
    linked_control_ids, tags, created_by
  ) VALUES (
    v_tenant_id, v_framework_pdpl, 'Art.22', 'Data Protection by Design',
    'حماية البيانات بالتصميم',
    'Implement technical and organizational measures for data protection',
    'تطبيق التدابير الفنية والتنظيمية لحماية البيانات',
    'Data Protection', 'Technical Safeguards', 'critical', 'compliant',
    v_user_id, v_user_id,
    'تشفير البيانات مفعل، وهناك سياسات واضحة لحماية البيانات',
    CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '70 days',
    ARRAY[v_control_dp_1], ARRAY['pdpl', 'privacy', 'encryption'],
    v_user_id
  ) RETURNING id INTO v_req_pdpl_1;
  
  RAISE NOTICE '  ✅ Created 4 compliance requirements';
  
  -- ============================================================================
  -- 8. COMPLIANCE GAPS
  -- ============================================================================
  RAISE NOTICE '⚠️ Seeding Compliance Gaps...';
  
  -- Gap for NCA requirement
  INSERT INTO public.grc_compliance_gaps (
    tenant_id, requirement_id, gap_title, gap_title_ar,
    gap_description, gap_description_ar,
    gap_type, severity, gap_status,
    identified_date, target_closure_date,
    assigned_to, root_cause_analysis, proposed_remediation,
    estimated_cost, actual_cost,
    tags, created_by
  ) VALUES (
    v_tenant_id, v_req_nca_1, 'Incomplete Governance Structure',
    'هيكل حوكمة غير مكتمل',
    'Cybersecurity governance committee exists but lacks formal charter and regular meetings',
    'لجنة حوكمة الأمن السيبراني موجودة لكن تفتقر إلى ميثاق رسمي واجتماعات منتظمة',
    'process', 'medium', 'in_progress',
    CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '30 days',
    v_user_id,
    'عدم وضوح المسؤوليات وغياب التوثيق الرسمي',
    'إنشاء ميثاق رسمي للجنة وجدولة اجتماعات ربع سنوية',
    25000.00, 15000.00,
    ARRAY['governance', 'process', 'documentation'],
    v_user_id
  );
  
  -- Gap for encryption control
  INSERT INTO public.grc_compliance_gaps (
    tenant_id, requirement_id, gap_title, gap_title_ar,
    gap_description, gap_description_ar,
    gap_type, severity, gap_status,
    identified_date, target_closure_date,
    assigned_to, root_cause_analysis, proposed_remediation,
    estimated_cost,
    tags, created_by
  ) VALUES (
    v_tenant_id, v_req_iso_2, 'Legacy Database Not Encrypted',
    'قاعدة بيانات قديمة غير مشفرة',
    'Some legacy database tables contain sensitive data but are not encrypted',
    'بعض جداول قاعدة البيانات القديمة تحتوي على بيانات حساسة لكنها غير مشفرة',
    'technology', 'high', 'open',
    CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days',
    v_user_id,
    'الجداول أنشئت قبل تطبيق سياسة التشفير الإلزامية',
    'ترحيل البيانات إلى جداول مشفرة جديدة',
    50000.00,
    ARRAY['encryption', 'legacy', 'database'],
    v_user_id
  );
  
  RAISE NOTICE '  ✅ Created 2 compliance gaps';
  
  -- ============================================================================
  -- 9. AUDITS
  -- ============================================================================
  RAISE NOTICE '🔍 Seeding Audits...';
  
  -- ISO 27001 Audit
  INSERT INTO public.grc_audits (
    tenant_id, audit_code, audit_title, audit_title_ar,
    audit_type, audit_scope, audit_scope_ar,
    framework_id, audit_status, planned_start_date, planned_end_date,
    actual_start_date, lead_auditor_id, audit_team_ids,
    audit_objectives, audit_objectives_ar,
    overall_rating, overall_conclusion,
    tags, created_by
  ) VALUES (
    v_tenant_id, 'AUD-ISO-2024-01', 'ISO 27001 Annual Surveillance Audit',
    'تدقيق المراقبة السنوي لـ ISO 27001',
    'external', 'Information Security Management System - All Controls',
    'نظام إدارة أمن المعلومات - جميع الضوابط',
    v_framework_iso27001, 'completed',
    CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '88 days',
    v_user_id, ARRAY[v_user_id],
    'Verify continued conformance to ISO 27001:2022 requirements',
    'التحقق من استمرارية المطابقة لمتطلبات ISO 27001:2022',
    'satisfactory',
    'ISMS is generally effective with minor improvement opportunities',
    ARRAY['iso27001', 'surveillance', 'certification'],
    v_user_id
  ) RETURNING id INTO v_audit_iso_1;
  
  -- Internal Security Audit
  INSERT INTO public.grc_audits (
    tenant_id, audit_code, audit_title, audit_title_ar,
    audit_type, audit_scope, audit_scope_ar,
    framework_id, audit_status, planned_start_date, planned_end_date,
    lead_auditor_id, audit_team_ids,
    audit_objectives, audit_objectives_ar,
    tags, created_by
  ) VALUES (
    v_tenant_id, 'AUD-INT-2024-Q2', 'Q2 Internal Security Controls Audit',
    'تدقيق الربع الثاني للضوابط الأمنية الداخلية',
    'internal', 'Technical Security Controls - Access Control & Encryption',
    'الضوابط الأمنية الفنية - التحكم في الوصول والتشفير',
    v_framework_internal, 'in_progress',
    CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days',
    v_user_id, ARRAY[v_user_id],
    'Assess effectiveness of technical security controls',
    'تقييم فعالية الضوابط الأمنية الفنية',
    ARRAY['internal', 'technical-controls', 'quarterly'],
    v_user_id
  ) RETURNING id INTO v_audit_internal_1;
  
  RAISE NOTICE '  ✅ Created 2 audits';
  
  -- ============================================================================
  -- 10. AUDIT FINDINGS
  -- ============================================================================
  RAISE NOTICE '📝 Seeding Audit Findings...';
  
  -- Finding 1 - Minor from ISO Audit
  INSERT INTO public.grc_audit_findings (
    tenant_id, audit_id, finding_code, finding_title, finding_title_ar,
    finding_description, finding_description_ar,
    finding_type, severity, finding_status,
    affected_control_ids, affected_requirement_ids,
    root_cause, root_cause_ar,
    recommended_action, recommended_action_ar,
    assigned_to, target_closure_date,
    created_by
  ) VALUES (
    v_tenant_id, v_audit_iso_1, 'FIND-ISO-2024-01', 'Outdated Access Control Procedure',
    'إجراء التحكم في الوصول قديم',
    'Access control procedure document version is from 2022 and does not reflect current MFA implementation',
    'وثيقة إجراءات التحكم في الوصول نسختها من 2022 ولا تعكس تطبيق MFA الحالي',
    'non_conformance', 'minor', 'open',
    ARRAY[v_control_ac_1], ARRAY[v_req_iso_1],
    'Document management process needs improvement',
    'عملية إدارة الوثائق تحتاج تحسين',
    'Update procedure document to reflect current state and establish document review cycle',
    'تحديث وثيقة الإجراءات لتعكس الوضع الحالي وإنشاء دورة مراجعة للوثائق',
    v_user_id, CURRENT_DATE + INTERVAL '30 days',
    v_user_id
  );
  
  -- Finding 2 - Observation from ISO Audit
  INSERT INTO public.grc_audit_findings (
    tenant_id, audit_id, finding_code, finding_title, finding_title_ar,
    finding_description, finding_description_ar,
    finding_type, severity, finding_status,
    affected_control_ids,
    recommended_action, recommended_action_ar,
    assigned_to, target_closure_date,
    created_by
  ) VALUES (
    v_tenant_id, v_audit_iso_1, 'FIND-ISO-2024-02', 'Inconsistent Security Awareness Training Records',
    'سجلات التدريب على الوعي الأمني غير متسقة',
    'Security awareness training records show inconsistent attendance tracking methods across departments',
    'سجلات التدريب على الوعي الأمني تظهر طرق تتبع حضور غير متسقة بين الأقسام',
    'observation', 'low', 'closed',
    ARRAY[v_control_admin_1],
    'Standardize training record keeping process and implement centralized tracking system',
    'توحيد عملية حفظ سجلات التدريب وتطبيق نظام تتبع مركزي',
    v_user_id, CURRENT_DATE - INTERVAL '10 days',
    v_user_id
  );
  
  -- Finding 3 - Positive from ISO Audit
  INSERT INTO public.grc_audit_findings (
    tenant_id, audit_id, finding_code, finding_title, finding_title_ar,
    finding_description, finding_description_ar,
    finding_type, severity, finding_status,
    affected_control_ids,
    created_by
  ) VALUES (
    v_tenant_id, v_audit_iso_1, 'FIND-ISO-2024-03', 'Excellent Encryption Implementation',
    'تطبيق ممتاز للتشفير',
    'Encryption controls exceed ISO 27001 requirements with AES-256 and proper key management',
    'ضوابط التشفير تتجاوز متطلبات ISO 27001 مع AES-256 وإدارة مفاتيح صحيحة',
    'positive', 'n/a', 'acknowledged',
    ARRAY[v_control_dp_1],
    v_user_id
  );
  
  RAISE NOTICE '  ✅ Created 3 audit findings';
  
  -- ============================================================================
  -- FINAL SUMMARY
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '=' || REPEAT('=', 60);
  RAISE NOTICE '✅ GRC Platform Test Data Seeding Complete!';
  RAISE NOTICE '=' || REPEAT('=', 60);
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  • Risks: 6';
  RAISE NOTICE '  • Risk Assessments: 2';
  RAISE NOTICE '  • Treatment Plans: 2';
  RAISE NOTICE '  • Controls: 5';
  RAISE NOTICE '  • Control Tests: 3';
  RAISE NOTICE '  • Frameworks: 4 (ISO27001, NCA ECC, PDPL, Internal)';
  RAISE NOTICE '  • Requirements: 4';
  RAISE NOTICE '  • Compliance Gaps: 2';
  RAISE NOTICE '  • Audits: 2';
  RAISE NOTICE '  • Audit Findings: 3';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Important IDs:';
  RAISE NOTICE '  • Tenant ID: %', v_tenant_id;
  RAISE NOTICE '  • User ID: %', v_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Login to GRC Platform';
  RAISE NOTICE '  2. Navigate to different modules to see the test data';
  RAISE NOTICE '  3. Test CRUD operations with the seeded data';
  RAISE NOTICE '  4. Run verification queries (see verification section below)';
  RAISE NOTICE '';
  
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to verify data)
-- ============================================================================
/*
-- Verify Risks
SELECT 'Risks' as entity, COUNT(*) as count FROM public.grc_risks 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000';

-- Verify Controls
SELECT 'Controls' as entity, COUNT(*) as count FROM public.grc_controls 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000';

-- Verify Frameworks
SELECT 'Frameworks' as entity, COUNT(*) as count FROM public.grc_compliance_frameworks 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000';

-- Verify Audits
SELECT 'Audits' as entity, COUNT(*) as count FROM public.grc_audits 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000';

-- Detail view of seeded data
SELECT 
  framework_code,
  framework_name,
  (SELECT COUNT(*) FROM grc_compliance_requirements WHERE framework_id = gcf.id) as requirements_count
FROM public.grc_compliance_frameworks gcf
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
ORDER BY framework_code;
*/

-- ============================================================================
-- CLEANUP SCRIPT (use when needed to reset test data)
-- ============================================================================
/*
DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Delete in correct order (respecting foreign keys)
  DELETE FROM public.grc_audit_findings WHERE tenant_id = v_tenant_id;
  DELETE FROM public.grc_audits WHERE tenant_id = v_tenant_id;
  DELETE FROM public.grc_compliance_gaps WHERE tenant_id = v_tenant_id;
  DELETE FROM public.grc_compliance_requirements WHERE tenant_id = v_tenant_id;
  DELETE FROM public.grc_compliance_frameworks WHERE tenant_id = v_tenant_id;
  DELETE FROM public.grc_control_tests WHERE tenant_id = v_tenant_id;
  DELETE FROM public.grc_controls WHERE tenant_id = v_tenant_id;
  DELETE FROM public.grc_risk_treatment_plans WHERE tenant_id = v_tenant_id;
  DELETE FROM public.grc_risk_assessments WHERE tenant_id = v_tenant_id;
  DELETE FROM public.grc_risks WHERE tenant_id = v_tenant_id;
  
  RAISE NOTICE '🧹 GRC test data cleaned up successfully!';
END $$;
*/
