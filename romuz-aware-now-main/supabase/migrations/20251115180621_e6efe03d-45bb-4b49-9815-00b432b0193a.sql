-- ============================================================================
-- Event System - Phase 1: Core Database Tables
-- Migration: Create 5 core tables with indexes and RLS policies
-- ============================================================================

-- ==================================================
-- 1. SYSTEM_EVENTS TABLE (الجدول الرئيسي للأحداث)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  source_module TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  user_id UUID,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  payload JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  
  CONSTRAINT fk_system_events_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes for system_events
CREATE INDEX IF NOT EXISTS idx_system_events_tenant ON public.system_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_events_type ON public.system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_category ON public.system_events(event_category);
CREATE INDEX IF NOT EXISTS idx_system_events_source ON public.system_events(source_module);
CREATE INDEX IF NOT EXISTS idx_system_events_created ON public.system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_status ON public.system_events(status);
CREATE INDEX IF NOT EXISTS idx_system_events_entity ON public.system_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_events_priority ON public.system_events(priority);

-- RLS for system_events
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their tenant"
  ON public.system_events FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "System can insert events"
  ON public.system_events FOR INSERT
  WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY "System can update events"
  ON public.system_events FOR UPDATE
  USING (tenant_id = app_current_tenant_id());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_events;

-- ==================================================
-- 2. AUTOMATION_RULES TABLE (قواعد الأتمتة)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  description_ar TEXT,
  trigger_event_types TEXT[] NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{"logic": "AND", "rules": []}'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  execution_mode TEXT DEFAULT 'immediate' CHECK (execution_mode IN ('immediate', 'scheduled', 'delayed')),
  schedule_config JSONB DEFAULT '{}'::jsonb,
  retry_config JSONB DEFAULT '{"max_retries": 3, "backoff_seconds": [60, 300, 900]}'::jsonb,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_automation_rules_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT uq_automation_rules_name UNIQUE (tenant_id, rule_name)
);

-- Indexes for automation_rules
CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant ON public.automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON public.automation_rules(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_automation_rules_events ON public.automation_rules USING GIN(trigger_event_types);
CREATE INDEX IF NOT EXISTS idx_automation_rules_priority ON public.automation_rules(priority DESC);

-- RLS for automation_rules
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rules in their tenant"
  ON public.automation_rules FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Admins can insert rules"
  ON public.automation_rules FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('admin')
  );

CREATE POLICY "Admins can update rules"
  ON public.automation_rules FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('admin')
  );

CREATE POLICY "Admins can delete rules"
  ON public.automation_rules FOR DELETE
  USING (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('admin')
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_rules;

-- ==================================================
-- 3. EVENT_SUBSCRIPTIONS TABLE (اشتراكات الأحداث)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  subscriber_module TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  callback_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_event_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes for event_subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON public.event_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_module ON public.event_subscriptions(subscriber_module);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.event_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_events ON public.event_subscriptions USING GIN(event_types);

-- RLS for event_subscriptions
ALTER TABLE public.event_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subscriptions in their tenant"
  ON public.event_subscriptions FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "System can manage subscriptions"
  ON public.event_subscriptions FOR ALL
  USING (tenant_id = app_current_tenant_id());

-- ==================================================
-- 4. EVENT_EXECUTION_LOG TABLE (سجل تنفيذ الأحداث)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.event_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  event_id UUID REFERENCES public.system_events(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'failed', 'partial', 'skipped')),
  execution_result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  execution_duration_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_execution_log_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes for event_execution_log
CREATE INDEX IF NOT EXISTS idx_execution_log_tenant ON public.event_execution_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_execution_log_event ON public.event_execution_log(event_id);
CREATE INDEX IF NOT EXISTS idx_execution_log_rule ON public.event_execution_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_execution_log_status ON public.event_execution_log(execution_status);
CREATE INDEX IF NOT EXISTS idx_execution_log_executed ON public.event_execution_log(executed_at DESC);

-- RLS for event_execution_log
ALTER TABLE public.event_execution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view execution logs in their tenant"
  ON public.event_execution_log FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "System can insert execution logs"
  ON public.event_execution_log FOR INSERT
  WITH CHECK (tenant_id = app_current_tenant_id());

-- ==================================================
-- 5. INTEGRATION_WEBHOOKS TABLE (الـ Webhooks الخارجية)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  webhook_name TEXT NOT NULL,
  url TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  auth_type TEXT DEFAULT 'none' CHECK (auth_type IN ('none', 'basic', 'bearer', 'api_key')),
  auth_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_webhooks_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT uq_webhooks_name UNIQUE (tenant_id, webhook_name)
);

-- Indexes for integration_webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON public.integration_webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON public.integration_webhooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON public.integration_webhooks USING GIN(event_types);

-- RLS for integration_webhooks
ALTER TABLE public.integration_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhooks in their tenant"
  ON public.integration_webhooks FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Admins can manage webhooks"
  ON public.integration_webhooks FOR ALL
  USING (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('admin')
  );

-- ==================================================
-- HELPER: Updated_at Trigger Function
-- ==================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_subscriptions_updated_at
  BEFORE UPDATE ON public.event_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_webhooks_updated_at
  BEFORE UPDATE ON public.integration_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================================
-- COMMENTS (للتوثيق)
-- ==================================================
COMMENT ON TABLE public.system_events IS 'Core events table - all system events are logged here';
COMMENT ON TABLE public.automation_rules IS 'Automation rules definition - conditions and actions';
COMMENT ON TABLE public.event_subscriptions IS 'Module subscriptions to specific event types';
COMMENT ON TABLE public.event_execution_log IS 'Execution history of automation rules';
COMMENT ON TABLE public.integration_webhooks IS 'External webhook integrations';

-- ==================================================
-- END OF MIGRATION
-- ==================================================