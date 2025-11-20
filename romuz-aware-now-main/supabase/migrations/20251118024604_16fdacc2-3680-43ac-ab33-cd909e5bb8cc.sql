-- =========================================
-- M15: Integrations Framework - Database Schema
-- Gate-M15: External Systems Integration Layer
-- =========================================

-- Integration Connectors Table
-- Stores configuration for external system integrations
CREATE TABLE IF NOT EXISTS public.integration_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Connector Info
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('slack', 'google_workspace', 'odoo', 'webhook', 'api', 'custom')),
  
  -- Configuration (encrypted sensitive data)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status & Sync
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'testing')),
  last_sync_at TIMESTAMPTZ,
  sync_frequency_minutes INT DEFAULT 60,
  
  -- Metadata
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(tenant_id, name)
);

-- Integration Logs Table
-- Tracks all integration events and operations
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  connector_id UUID REFERENCES public.integration_connectors(id) ON DELETE CASCADE,
  
  -- Event Info
  event_type TEXT NOT NULL,
  event_category TEXT CHECK (event_category IN ('sync', 'notification', 'webhook', 'api_call', 'error')),
  
  -- Payload & Response
  payload JSONB,
  response JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending', 'retrying')),
  error_message TEXT,
  error_code TEXT,
  
  -- Retry Logic
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Metadata
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API Keys Table
-- Manages API keys for external access to Romuz
CREATE TABLE IF NOT EXISTS public.integration_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Key Info
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  
  -- Permissions
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_ips TEXT[],
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id, key_name)
);

-- Webhooks Table
-- Manages incoming webhooks from external systems
CREATE TABLE IF NOT EXISTS public.integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  connector_id UUID REFERENCES public.integration_connectors(id) ON DELETE SET NULL,
  
  -- Webhook Info
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  
  -- Configuration
  events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Verification
  verify_signature BOOLEAN NOT NULL DEFAULT true,
  signature_header TEXT DEFAULT 'X-Webhook-Signature',
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id, name)
);

-- =========================================
-- Indexes for Performance
-- =========================================

CREATE INDEX IF NOT EXISTS idx_integration_connectors_tenant 
  ON public.integration_connectors(tenant_id);

CREATE INDEX IF NOT EXISTS idx_integration_connectors_status 
  ON public.integration_connectors(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_integration_connectors_type 
  ON public.integration_connectors(tenant_id, type);

CREATE INDEX IF NOT EXISTS idx_integration_logs_tenant_connector 
  ON public.integration_logs(tenant_id, connector_id);

CREATE INDEX IF NOT EXISTS idx_integration_logs_status 
  ON public.integration_logs(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_integration_logs_created 
  ON public.integration_logs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_api_keys_tenant 
  ON public.integration_api_keys(tenant_id);

CREATE INDEX IF NOT EXISTS idx_integration_api_keys_status 
  ON public.integration_api_keys(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_integration_webhooks_tenant 
  ON public.integration_webhooks(tenant_id);

CREATE INDEX IF NOT EXISTS idx_integration_webhooks_url 
  ON public.integration_webhooks(url);

-- =========================================
-- Updated_at Triggers
-- =========================================

CREATE OR REPLACE FUNCTION public.update_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integration_connectors_updated_at
  BEFORE UPDATE ON public.integration_connectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integration_updated_at();

CREATE TRIGGER integration_api_keys_updated_at
  BEFORE UPDATE ON public.integration_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integration_updated_at();

CREATE TRIGGER integration_webhooks_updated_at
  BEFORE UPDATE ON public.integration_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integration_updated_at();

-- =========================================
-- Row Level Security (RLS) Policies
-- =========================================

-- Enable RLS
ALTER TABLE public.integration_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_webhooks ENABLE ROW LEVEL SECURITY;

-- Integration Connectors Policies
CREATE POLICY "Users can view their tenant's connectors"
  ON public.integration_connectors FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.user_tenants 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can create connectors"
  ON public.integration_connectors FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.user_id = ut.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role IN ('tenant_admin', 'super_admin', 'platform_admin')
    )
  );

CREATE POLICY "Admins can update connectors"
  ON public.integration_connectors FOR UPDATE
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.user_id = ut.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role IN ('tenant_admin', 'super_admin', 'platform_admin')
    )
  );

CREATE POLICY "Admins can delete connectors"
  ON public.integration_connectors FOR DELETE
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.user_id = ut.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role IN ('tenant_admin', 'super_admin', 'platform_admin')
    )
  );

-- Integration Logs Policies
CREATE POLICY "Users can view their tenant's logs"
  ON public.integration_logs FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.user_tenants 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert logs"
  ON public.integration_logs FOR INSERT
  WITH CHECK (true);

-- API Keys Policies
CREATE POLICY "Admins can view their tenant's API keys"
  ON public.integration_api_keys FOR SELECT
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.user_id = ut.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role IN ('tenant_admin', 'super_admin', 'platform_admin')
    )
  );

CREATE POLICY "Admins can create API keys"
  ON public.integration_api_keys FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.user_id = ut.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role IN ('tenant_admin', 'super_admin', 'platform_admin')
    )
  );

CREATE POLICY "Admins can update API keys"
  ON public.integration_api_keys FOR UPDATE
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.user_id = ut.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role IN ('tenant_admin', 'super_admin', 'platform_admin')
    )
  );

CREATE POLICY "Admins can delete API keys"
  ON public.integration_api_keys FOR DELETE
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.user_id = ut.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role IN ('tenant_admin', 'super_admin', 'platform_admin')
    )
  );

-- Webhooks Policies
CREATE POLICY "Users can view their tenant's webhooks"
  ON public.integration_webhooks FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.user_tenants 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can create webhooks"
  ON public.integration_webhooks FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.user_id = ut.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role IN ('tenant_admin', 'super_admin', 'platform_admin')
    )
  );

CREATE POLICY "Admins can update webhooks"
  ON public.integration_webhooks FOR UPDATE
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.user_id = ut.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role IN ('tenant_admin', 'super_admin', 'platform_admin')
    )
  );

CREATE POLICY "Admins can delete webhooks"
  ON public.integration_webhooks FOR DELETE
  USING (
    tenant_id IN (
      SELECT ut.tenant_id FROM public.user_tenants ut
      JOIN public.user_roles ur ON ur.user_id = ut.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role IN ('tenant_admin', 'super_admin', 'platform_admin')
    )
  );

-- =========================================
-- Audit Logging
-- =========================================

CREATE OR REPLACE FUNCTION public.log_integration_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    tenant_id,
    entity_type,
    entity_id,
    action,
    actor,
    payload
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER integration_connectors_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.integration_connectors
  FOR EACH ROW
  EXECUTE FUNCTION public.log_integration_audit();

CREATE TRIGGER integration_api_keys_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.integration_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.log_integration_audit();

CREATE TRIGGER integration_webhooks_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.integration_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_integration_audit();