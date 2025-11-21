-- ============================================================================
-- Part 1: Database Schema - M21 (System Command) + M22 (Admin Console) + M24 (Tenant Lifecycle)
-- Week 19-22 Implementation - Without Audit Triggers (will be added separately)
-- Includes: RLS Policies, last_backed_up_at columns
-- ============================================================================

-- ============================================================================
-- M21: System Command Dashboard Tables
-- ============================================================================

-- Table: system_metrics
-- Purpose: Store real-time platform metrics for monitoring
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT,
  metric_type VARCHAR(100) NOT NULL, -- 'cpu_usage', 'memory_usage', 'disk_usage', 'api_calls', 'active_users'
  metric_value NUMERIC(10, 2) NOT NULL,
  metric_unit VARCHAR(20), -- '%', 'GB', 'count', 'ms'
  source_component VARCHAR(100), -- 'database', 'api', 'auth', 'storage'
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ,
  CONSTRAINT system_metrics_severity_check CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Indexes for system_metrics
CREATE INDEX idx_system_metrics_tenant_id ON public.system_metrics(tenant_id);
CREATE INDEX idx_system_metrics_metric_type ON public.system_metrics(metric_type);
CREATE INDEX idx_system_metrics_recorded_at ON public.system_metrics(recorded_at DESC);
CREATE INDEX idx_system_metrics_severity ON public.system_metrics(severity) WHERE severity IN ('warning', 'critical');

-- RLS for system_metrics
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_metrics_tenant_read"
  ON public.system_metrics
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
  );

CREATE POLICY "system_metrics_system_insert"
  ON public.system_metrics
  FOR INSERT
  WITH CHECK (true);

-- Table: platform_alerts
-- Purpose: Centralized alert management for platform-level issues
CREATE TABLE IF NOT EXISTS public.platform_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT,
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info',
  title VARCHAR(500) NOT NULL,
  description TEXT,
  source_module VARCHAR(100),
  source_entity_type VARCHAR(100),
  source_entity_id UUID,
  status VARCHAR(50) DEFAULT 'active',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ,
  CONSTRAINT platform_alerts_severity_check CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  CONSTRAINT platform_alerts_status_check CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed'))
);

-- Indexes for platform_alerts
CREATE INDEX idx_platform_alerts_tenant_id ON public.platform_alerts(tenant_id);
CREATE INDEX idx_platform_alerts_alert_type ON public.platform_alerts(alert_type);
CREATE INDEX idx_platform_alerts_severity ON public.platform_alerts(severity);
CREATE INDEX idx_platform_alerts_status ON public.platform_alerts(status);
CREATE INDEX idx_platform_alerts_created_at ON public.platform_alerts(created_at DESC);

-- RLS for platform_alerts
ALTER TABLE public.platform_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_alerts_tenant_read"
  ON public.platform_alerts
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
  );

CREATE POLICY "platform_alerts_tenant_update"
  ON public.platform_alerts
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
  );

CREATE POLICY "platform_alerts_system_insert"
  ON public.platform_alerts
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- M22: Admin Console Enhancement
-- ============================================================================

-- Update admin_settings table with new columns
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS custom_css TEXT,
  ADD COLUMN IF NOT EXISTS custom_js TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_message TEXT,
  ADD COLUMN IF NOT EXISTS allowed_domains TEXT[],
  ADD COLUMN IF NOT EXISTS blocked_ips TEXT[],
  ADD COLUMN IF NOT EXISTS security_headers JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS backup_settings JSONB DEFAULT '{}';

-- Table: system_configurations
-- Purpose: Store platform-wide system configurations
CREATE TABLE IF NOT EXISTS public.system_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT,
  config_key VARCHAR(200) NOT NULL,
  config_value JSONB NOT NULL,
  config_type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  is_readonly BOOLEAN DEFAULT false,
  validation_rules JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  last_backed_up_at TIMESTAMPTZ,
  CONSTRAINT system_configurations_unique_key UNIQUE (tenant_id, config_key)
);

-- Indexes for system_configurations
CREATE INDEX idx_system_configurations_tenant_id ON public.system_configurations(tenant_id);
CREATE INDEX idx_system_configurations_config_key ON public.system_configurations(config_key);
CREATE INDEX idx_system_configurations_category ON public.system_configurations(category);

-- RLS for system_configurations
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_configurations_tenant_read"
  ON public.system_configurations
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
    AND is_sensitive = false
  );

CREATE POLICY "system_configurations_tenant_manage"
  ON public.system_configurations
  FOR ALL
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
    AND is_readonly = false
  )
  WITH CHECK (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
    AND is_readonly = false
  );

-- ============================================================================
-- M24: Tenant Lifecycle Management Tables
-- ============================================================================

-- Table: tenant_lifecycle_events
CREATE TABLE IF NOT EXISTS public.tenant_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  event_type VARCHAR(100) NOT NULL,
  event_status VARCHAR(50) DEFAULT 'pending',
  triggered_by UUID,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  rollback_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ,
  CONSTRAINT tenant_lifecycle_events_status_check CHECK (event_status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back'))
);

-- Indexes
CREATE INDEX idx_tenant_lifecycle_events_tenant_id ON public.tenant_lifecycle_events(tenant_id);
CREATE INDEX idx_tenant_lifecycle_events_event_type ON public.tenant_lifecycle_events(event_type);
CREATE INDEX idx_tenant_lifecycle_events_triggered_at ON public.tenant_lifecycle_events(triggered_at DESC);
CREATE INDEX idx_tenant_lifecycle_events_status ON public.tenant_lifecycle_events(event_status);

-- RLS
ALTER TABLE public.tenant_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_lifecycle_events_tenant_read"
  ON public.tenant_lifecycle_events
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_lifecycle_events_system_all"
  ON public.tenant_lifecycle_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table: tenant_subscriptions
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE RESTRICT,
  plan_name VARCHAR(100) NOT NULL,
  plan_tier VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  subscription_status VARCHAR(50) DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  trial_end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  pricing_currency VARCHAR(10) DEFAULT 'SAR',
  monthly_price NUMERIC(10, 2),
  yearly_price NUMERIC(10, 2),
  user_limit INTEGER,
  storage_limit_gb INTEGER,
  api_calls_limit INTEGER,
  features JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ,
  CONSTRAINT tenant_subscriptions_status_check CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled', 'expired')),
  CONSTRAINT tenant_subscriptions_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly'))
);

-- Indexes
CREATE INDEX idx_tenant_subscriptions_tenant_id ON public.tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_subscriptions_plan_name ON public.tenant_subscriptions(plan_name);
CREATE INDEX idx_tenant_subscriptions_status ON public.tenant_subscriptions(subscription_status);
CREATE INDEX idx_tenant_subscriptions_end_date ON public.tenant_subscriptions(end_date) WHERE end_date IS NOT NULL;

-- RLS
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_subscriptions_tenant_read"
  ON public.tenant_subscriptions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_subscriptions_system_manage"
  ON public.tenant_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table: tenant_usage_stats
CREATE TABLE IF NOT EXISTS public.tenant_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  stat_date DATE NOT NULL,
  active_users_count INTEGER DEFAULT 0,
  total_storage_gb NUMERIC(10, 2) DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  database_queries_count INTEGER DEFAULT 0,
  awareness_campaigns_count INTEGER DEFAULT 0,
  phishing_simulations_count INTEGER DEFAULT 0,
  incidents_count INTEGER DEFAULT 0,
  policies_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ,
  CONSTRAINT tenant_usage_stats_unique_tenant_date UNIQUE (tenant_id, stat_date)
);

-- Indexes
CREATE INDEX idx_tenant_usage_stats_tenant_id ON public.tenant_usage_stats(tenant_id);
CREATE INDEX idx_tenant_usage_stats_stat_date ON public.tenant_usage_stats(stat_date DESC);

-- RLS
ALTER TABLE public.tenant_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_usage_stats_tenant_read"
  ON public.tenant_usage_stats
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_usage_stats_system_manage"
  ON public.tenant_usage_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE public.system_metrics IS 'M21: Real-time platform metrics';
COMMENT ON TABLE public.platform_alerts IS 'M21: Platform-level alerts';
COMMENT ON TABLE public.system_configurations IS 'M22: System configurations';
COMMENT ON TABLE public.tenant_lifecycle_events IS 'M24: Tenant lifecycle tracking';
COMMENT ON TABLE public.tenant_subscriptions IS 'M24: Tenant subscription management';
COMMENT ON TABLE public.tenant_usage_stats IS 'M24: Tenant usage statistics';