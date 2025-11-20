-- ============================================================================
-- Part 13.1: Notification System Tables (tenant-scoped with RLS)
-- ============================================================================

-- 1️⃣ notification_templates: Template library for messages
CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  key TEXT NOT NULL, -- e.g., 'campaign_start', 'due_soon', 'completion'
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- Can include {{campaign_name}}, {{employee_ref}}, etc.
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notification_templates_tenant_key_unique UNIQUE (tenant_id, key)
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view templates in their tenant"
  ON public.notification_templates
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create templates in their tenant"
  ON public.notification_templates
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Users can update templates in their tenant"
  ON public.notification_templates
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete templates in their tenant"
  ON public.notification_templates
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_awareness_campaigns_updated_at();

-- Indexes
CREATE INDEX idx_notification_templates_tenant ON public.notification_templates(tenant_id);
CREATE INDEX idx_notification_templates_key ON public.notification_templates(tenant_id, key);


-- 2️⃣ notification_queue: Queue for scheduled/pending messages
CREATE TABLE public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  template_key TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  last_error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view queue in their tenant"
  ON public.notification_queue
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create queue items in their tenant"
  ON public.notification_queue
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Users can update queue in their tenant"
  ON public.notification_queue
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete queue items in their tenant"
  ON public.notification_queue
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Indexes for efficient queries
CREATE INDEX idx_notification_queue_tenant_campaign ON public.notification_queue(tenant_id, campaign_id);
CREATE INDEX idx_notification_queue_status ON public.notification_queue(tenant_id, campaign_id, status);
CREATE INDEX idx_notification_queue_scheduled ON public.notification_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_notification_queue_participant ON public.notification_queue(participant_id);


-- 3️⃣ notification_log: Audit log for sent messages
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  template_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  transport TEXT NOT NULL, -- 'email', 'sms', 'webhook', 'simulated'
  status TEXT NOT NULL, -- 'success', 'failed', 'bounced', etc.
  meta JSONB NULL, -- Additional metadata (error details, response, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view logs in their tenant"
  ON public.notification_log
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create logs in their tenant"
  ON public.notification_log
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- No UPDATE/DELETE policies for log (append-only audit)

-- Indexes for log queries
CREATE INDEX idx_notification_log_tenant_campaign ON public.notification_log(tenant_id, campaign_id);
CREATE INDEX idx_notification_log_sent_at ON public.notification_log(sent_at DESC);
CREATE INDEX idx_notification_log_participant ON public.notification_log(participant_id);
CREATE INDEX idx_notification_log_status ON public.notification_log(tenant_id, status);