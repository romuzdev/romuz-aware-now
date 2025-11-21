-- ============================================
-- Week 12: M18 Part 2 - Playbooks & SOAR Enhancement
-- ============================================

-- ============================================
-- Part 1: Enhanced Playbook Schema
-- ============================================

-- Add enhanced columns to soar_playbooks
ALTER TABLE soar_playbooks
ADD COLUMN IF NOT EXISTS playbook_version VARCHAR(20) DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approver_role VARCHAR(100),
ADD COLUMN IF NOT EXISTS execution_mode VARCHAR(50) DEFAULT 'manual' CHECK (execution_mode IN ('manual', 'automatic', 'semi-automatic')),
ADD COLUMN IF NOT EXISTS retry_config JSONB DEFAULT '{"max_retries": 3, "retry_delay_seconds": 60}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS success_rate_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;

-- Create playbook_steps table for detailed step configuration
CREATE TABLE IF NOT EXISTS playbook_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES soar_playbooks(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name VARCHAR(200) NOT NULL,
  step_description_ar TEXT,
  step_type VARCHAR(50) NOT NULL CHECK (step_type IN ('action', 'decision', 'wait', 'notification', 'integration', 'approval')),
  action_config JSONB NOT NULL,
  condition_logic JSONB,
  next_step_on_success UUID,
  next_step_on_failure UUID,
  timeout_seconds INTEGER DEFAULT 300,
  is_critical BOOLEAN DEFAULT false,
  retry_on_failure BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  last_backed_up_at TIMESTAMPTZ
);

-- Create indexes for playbook_steps
CREATE INDEX IF NOT EXISTS idx_playbook_steps_playbook ON playbook_steps(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_steps_tenant ON playbook_steps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_playbook_steps_order ON playbook_steps(playbook_id, step_order);

-- ============================================
-- Part 2: Enhanced Execution Tracking
-- ============================================

-- Add enhanced columns to soar_executions
ALTER TABLE soar_executions
ADD COLUMN IF NOT EXISTS execution_context JSONB,
ADD COLUMN IF NOT EXISTS current_step_id UUID,
ADD COLUMN IF NOT EXISTS steps_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS steps_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_details TEXT,
ADD COLUMN IF NOT EXISTS rollback_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create execution_step_logs table
CREATE TABLE IF NOT EXISTS execution_step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  execution_id UUID NOT NULL REFERENCES soar_executions(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES playbook_steps(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting_approval')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_backed_up_at TIMESTAMPTZ
);

-- Create indexes for execution_step_logs
CREATE INDEX IF NOT EXISTS idx_execution_step_logs_execution ON execution_step_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_step_logs_tenant ON execution_step_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_execution_step_logs_status ON execution_step_logs(status);
CREATE INDEX IF NOT EXISTS idx_execution_step_logs_step ON execution_step_logs(step_id);

-- ============================================
-- Part 3: Automation Rules & Triggers
-- ============================================

-- Create playbook_triggers table
CREATE TABLE IF NOT EXISTS playbook_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES soar_playbooks(id) ON DELETE CASCADE,
  trigger_name VARCHAR(200) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('event', 'schedule', 'webhook', 'threshold', 'manual')),
  trigger_config JSONB NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  cooldown_minutes INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  last_backed_up_at TIMESTAMPTZ
);

-- Create indexes for playbook_triggers
CREATE INDEX IF NOT EXISTS idx_playbook_triggers_playbook ON playbook_triggers(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_triggers_tenant ON playbook_triggers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_playbook_triggers_enabled ON playbook_triggers(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_playbook_triggers_type ON playbook_triggers(trigger_type);

-- ============================================
-- Part 4: Integration Connectors
-- ============================================

-- Create integration_actions table
CREATE TABLE IF NOT EXISTS integration_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action_name VARCHAR(200) NOT NULL,
  action_category VARCHAR(100) NOT NULL,
  integration_type VARCHAR(100) NOT NULL,
  action_config JSONB NOT NULL,
  input_schema JSONB,
  output_schema JSONB,
  is_active BOOLEAN DEFAULT true,
  requires_auth BOOLEAN DEFAULT true,
  rate_limit_per_minute INTEGER DEFAULT 60,
  timeout_seconds INTEGER DEFAULT 120,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  last_backed_up_at TIMESTAMPTZ,
  UNIQUE(tenant_id, action_name)
);

-- Create indexes for integration_actions
CREATE INDEX IF NOT EXISTS idx_integration_actions_tenant ON integration_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_actions_category ON integration_actions(action_category);
CREATE INDEX IF NOT EXISTS idx_integration_actions_type ON integration_actions(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_actions_active ON integration_actions(is_active) WHERE is_active = true;

-- ============================================
-- Part 5: RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE playbook_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_actions ENABLE ROW LEVEL SECURITY;

-- Playbook Steps Policies
CREATE POLICY "Users can view playbook steps in their tenant"
  ON playbook_steps FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage playbook steps"
  ON playbook_steps FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Execution Step Logs Policies
CREATE POLICY "Users can view execution logs in their tenant"
  ON execution_step_logs FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert execution logs"
  ON execution_step_logs FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Playbook Triggers Policies
CREATE POLICY "Users can view triggers in their tenant"
  ON playbook_triggers FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage triggers"
  ON playbook_triggers FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Integration Actions Policies
CREATE POLICY "Users can view integration actions in their tenant"
  ON integration_actions FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage integration actions"
  ON integration_actions FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- ============================================
-- Part 6: Database Functions
-- ============================================

-- Function to calculate playbook success rate
CREATE OR REPLACE FUNCTION calculate_playbook_success_rate(p_playbook_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_success_rate DECIMAL;
BEGIN
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE status = 'completed') * 100.0) / COUNT(*)
    END
  INTO v_success_rate
  FROM soar_executions
  WHERE playbook_id = p_playbook_id
    AND started_at >= NOW() - INTERVAL '30 days';
  
  RETURN COALESCE(v_success_rate, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next playbook step
CREATE OR REPLACE FUNCTION get_next_playbook_step(
  p_current_step_id UUID,
  p_execution_status VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_next_step_id UUID;
BEGIN
  IF p_execution_status = 'completed' THEN
    SELECT next_step_on_success INTO v_next_step_id
    FROM playbook_steps
    WHERE id = p_current_step_id;
  ELSE
    SELECT next_step_on_failure INTO v_next_step_id
    FROM playbook_steps
    WHERE id = p_current_step_id;
  END IF;
  
  RETURN v_next_step_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Part 7: Audit Triggers
-- ============================================

-- Audit triggers for new tables
CREATE TRIGGER audit_playbook_steps
  AFTER INSERT OR UPDATE OR DELETE ON playbook_steps
  FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER audit_execution_step_logs
  AFTER INSERT OR UPDATE OR DELETE ON execution_step_logs
  FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER audit_playbook_triggers
  AFTER INSERT OR UPDATE OR DELETE ON playbook_triggers
  FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER audit_integration_actions
  AFTER INSERT OR UPDATE OR DELETE ON integration_actions
  FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- ============================================
-- Part 8: Updated_at Triggers
-- ============================================

CREATE TRIGGER set_updated_at_playbook_steps
  BEFORE UPDATE ON playbook_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_playbook_triggers
  BEFORE UPDATE ON playbook_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_integration_actions
  BEFORE UPDATE ON integration_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();