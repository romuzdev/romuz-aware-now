-- ============================================================================
-- M23 - Week 5-6: Disaster Recovery Plan Schema
-- ============================================================================

-- Create disaster recovery plans table
CREATE TABLE IF NOT EXISTS backup_disaster_recovery_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  description TEXT,
  
  -- Recovery objectives
  rto_minutes INTEGER NOT NULL DEFAULT 240, -- Recovery Time Objective (4 hours)
  rpo_minutes INTEGER NOT NULL DEFAULT 60,  -- Recovery Point Objective (1 hour)
  
  -- Backup strategy
  backup_frequency TEXT NOT NULL DEFAULT 'daily', -- hourly, daily, weekly
  retention_days INTEGER NOT NULL DEFAULT 30,
  backup_types TEXT[] NOT NULL DEFAULT ARRAY['full', 'incremental'],
  
  -- Testing schedule
  test_frequency TEXT NOT NULL DEFAULT 'monthly', -- weekly, monthly, quarterly
  next_test_date TIMESTAMPTZ,
  last_test_date TIMESTAMPTZ,
  last_test_status TEXT, -- passed, failed, pending
  
  -- Notification settings
  notification_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  alert_on_failure BOOLEAN DEFAULT true,
  alert_on_test_due BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT backup_dr_plans_tenant_name_unique UNIQUE(tenant_id, plan_name),
  CONSTRAINT backup_dr_plans_rto_positive CHECK (rto_minutes > 0),
  CONSTRAINT backup_dr_plans_rpo_positive CHECK (rpo_minutes > 0)
);

-- Create recovery tests table
CREATE TABLE IF NOT EXISTS backup_recovery_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dr_plan_id UUID REFERENCES backup_disaster_recovery_plans(id) ON DELETE CASCADE,
  backup_job_id UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
  
  -- Test details
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL, -- manual, automated, scheduled
  test_status TEXT NOT NULL DEFAULT 'pending', -- pending, running, passed, failed
  
  -- Test execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Test results
  validation_results JSONB DEFAULT '{}'::jsonb,
  data_integrity_check BOOLEAN,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Issues found
  issues_found INTEGER DEFAULT 0,
  issues_details JSONB DEFAULT '[]'::jsonb,
  
  -- Test scope
  tables_tested TEXT[] DEFAULT ARRAY[]::TEXT[],
  records_validated INTEGER DEFAULT 0,
  
  -- Notes and recommendations
  notes TEXT,
  recommendations TEXT,
  
  -- Test artifacts
  test_log_path TEXT,
  report_path TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  
  -- Constraints
  CONSTRAINT backup_recovery_tests_duration_positive CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  CONSTRAINT backup_recovery_tests_issues_positive CHECK (issues_found >= 0)
);

-- Create backup health monitoring table
CREATE TABLE IF NOT EXISTS backup_health_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Health check timestamp
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Overall health
  health_status TEXT NOT NULL, -- healthy, warning, critical
  health_score INTEGER NOT NULL DEFAULT 100, -- 0-100
  
  -- Backup metrics
  total_backups INTEGER DEFAULT 0,
  successful_backups INTEGER DEFAULT 0,
  failed_backups INTEGER DEFAULT 0,
  last_backup_at TIMESTAMPTZ,
  next_scheduled_backup TIMESTAMPTZ,
  
  -- Storage metrics
  total_storage_bytes BIGINT DEFAULT 0,
  storage_growth_rate NUMERIC(10,2), -- MB per day
  storage_utilization_pct NUMERIC(5,2), -- percentage
  
  -- Recovery metrics
  avg_backup_duration_seconds INTEGER,
  avg_restore_duration_seconds INTEGER,
  last_successful_restore_at TIMESTAMPTZ,
  
  -- Compliance metrics
  rto_compliance_pct NUMERIC(5,2), -- percentage of backups meeting RTO
  rpo_compliance_pct NUMERIC(5,2), -- percentage of backups meeting RPO
  retention_compliance_pct NUMERIC(5,2), -- percentage of retention policy compliance
  
  -- Issues and alerts
  active_issues JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  
  -- Recommendations
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dr_plans_tenant_active ON backup_disaster_recovery_plans(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_dr_plans_next_test ON backup_disaster_recovery_plans(next_test_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recovery_tests_tenant_status ON backup_recovery_tests(tenant_id, test_status);
CREATE INDEX IF NOT EXISTS idx_recovery_tests_dr_plan ON backup_recovery_tests(dr_plan_id);
CREATE INDEX IF NOT EXISTS idx_recovery_tests_created ON backup_recovery_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_monitoring_tenant ON backup_health_monitoring(tenant_id, checked_at DESC);

-- Enable RLS
ALTER TABLE backup_disaster_recovery_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_recovery_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_health_monitoring ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disaster recovery plans
CREATE POLICY "Users can view DR plans in their tenant"
  ON backup_disaster_recovery_plans FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Admins can insert DR plans in their tenant"
  ON backup_disaster_recovery_plans FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Admins can update DR plans in their tenant"
  ON backup_disaster_recovery_plans FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Admins can delete DR plans in their tenant"
  ON backup_disaster_recovery_plans FOR DELETE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- RLS Policies for recovery tests
CREATE POLICY "Users can view recovery tests in their tenant"
  ON backup_recovery_tests FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Admins can insert recovery tests in their tenant"
  ON backup_recovery_tests FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Admins can update recovery tests in their tenant"
  ON backup_recovery_tests FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Admins can delete recovery tests in their tenant"
  ON backup_recovery_tests FOR DELETE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- RLS Policies for health monitoring
CREATE POLICY "Users can view health monitoring in their tenant"
  ON backup_health_monitoring FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "System can insert health monitoring"
  ON backup_health_monitoring FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Function to calculate backup health score
CREATE OR REPLACE FUNCTION calculate_backup_health_score(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score INTEGER := 100;
  v_success_rate NUMERIC;
  v_last_backup_age INTEGER;
  v_storage_utilization NUMERIC;
BEGIN
  -- Calculate success rate (40 points)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)) * 40
    END
  INTO v_success_rate
  FROM backup_jobs
  WHERE tenant_id = p_tenant_id
    AND created_at > now() - INTERVAL '7 days';
  
  -- Check last backup age (30 points)
  SELECT EXTRACT(EPOCH FROM (now() - MAX(created_at)))/3600
  INTO v_last_backup_age
  FROM backup_jobs
  WHERE tenant_id = p_tenant_id
    AND status = 'completed';
  
  -- Deduct points based on age
  IF v_last_backup_age IS NULL THEN
    v_score := v_score - 30;
  ELSIF v_last_backup_age > 24 THEN
    v_score := v_score - 30;
  ELSIF v_last_backup_age > 12 THEN
    v_score := v_score - 15;
  END IF;
  
  -- Check storage utilization (30 points)
  -- Assuming 100GB limit for now
  SELECT 
    (SUM(backup_size_bytes)::NUMERIC / (100 * 1024 * 1024 * 1024)) * 100
  INTO v_storage_utilization
  FROM backup_jobs
  WHERE tenant_id = p_tenant_id
    AND status = 'completed';
  
  -- Deduct points if over 80% utilization
  IF v_storage_utilization > 90 THEN
    v_score := v_score - 20;
  ELSIF v_storage_utilization > 80 THEN
    v_score := v_score - 10;
  END IF;
  
  -- Add success rate points
  v_score := v_score - 40 + COALESCE(v_success_rate, 0);
  
  -- Ensure score is between 0 and 100
  v_score := GREATEST(0, LEAST(100, v_score));
  
  RETURN v_score;
END;
$$;

-- Function to get DR plan compliance status
CREATE OR REPLACE FUNCTION get_dr_plan_compliance(p_dr_plan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan RECORD;
  v_compliance JSONB;
  v_last_backup TIMESTAMPTZ;
  v_backup_age_minutes INTEGER;
BEGIN
  -- Get DR plan details
  SELECT * INTO v_plan
  FROM backup_disaster_recovery_plans
  WHERE id = p_dr_plan_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'DR plan not found');
  END IF;
  
  -- Get last backup timestamp
  SELECT MAX(created_at) INTO v_last_backup
  FROM backup_jobs
  WHERE tenant_id = v_plan.tenant_id
    AND status = 'completed';
  
  -- Calculate backup age
  v_backup_age_minutes := EXTRACT(EPOCH FROM (now() - v_last_backup))/60;
  
  -- Build compliance report
  v_compliance := jsonb_build_object(
    'dr_plan_id', p_dr_plan_id,
    'plan_name', v_plan.plan_name,
    'rpo_minutes', v_plan.rpo_minutes,
    'rto_minutes', v_plan.rto_minutes,
    'last_backup_at', v_last_backup,
    'backup_age_minutes', v_backup_age_minutes,
    'rpo_compliant', v_backup_age_minutes <= v_plan.rpo_minutes,
    'next_test_date', v_plan.next_test_date,
    'test_overdue', v_plan.next_test_date < now(),
    'last_test_status', v_plan.last_test_status,
    'is_active', v_plan.is_active
  );
  
  RETURN v_compliance;
END;
$$;

-- Trigger to update DR plan test dates
CREATE OR REPLACE FUNCTION update_dr_plan_next_test()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate next test date based on frequency
  NEW.next_test_date := CASE NEW.test_frequency
    WHEN 'weekly' THEN now() + INTERVAL '7 days'
    WHEN 'monthly' THEN now() + INTERVAL '30 days'
    WHEN 'quarterly' THEN now() + INTERVAL '90 days'
    ELSE now() + INTERVAL '30 days'
  END;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_dr_plan_next_test
  BEFORE INSERT OR UPDATE ON backup_disaster_recovery_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_dr_plan_next_test();

-- Add updated_at trigger for DR plans
CREATE TRIGGER set_updated_at_dr_plans
  BEFORE UPDATE ON backup_disaster_recovery_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();