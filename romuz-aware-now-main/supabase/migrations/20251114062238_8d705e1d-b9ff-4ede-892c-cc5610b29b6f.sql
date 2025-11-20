-- ============================================================================
-- D4 Enhancement: Workflow System, Notifications, Analytics
-- Part 1: Database Schema
-- ============================================================================

-- ============================================================================
-- 1. Committee Workflows
-- ============================================================================

-- Workflow states enum
CREATE TYPE committee_workflow_state AS ENUM (
  'draft',
  'in_progress',
  'review',
  'approved',
  'rejected',
  'completed',
  'cancelled'
);

-- Workflow types enum
CREATE TYPE committee_workflow_type AS ENUM (
  'meeting_approval',
  'decision_review',
  'document_approval',
  'member_onboarding',
  'budget_approval',
  'custom'
);

-- Committee workflows table
CREATE TABLE public.committee_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  workflow_type committee_workflow_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  current_stage_id UUID,
  state committee_workflow_state NOT NULL DEFAULT 'draft',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workflow stages table
CREATE TABLE public.committee_workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.committee_workflows(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  stage_type TEXT NOT NULL CHECK (stage_type IN ('approval', 'review', 'action', 'notification')),
  assigned_to UUID,
  state committee_workflow_state NOT NULL DEFAULT 'draft',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, stage_order)
);

-- Indexes for workflows
CREATE INDEX idx_committee_workflows_tenant ON public.committee_workflows(tenant_id);
CREATE INDEX idx_committee_workflows_committee ON public.committee_workflows(committee_id);
CREATE INDEX idx_committee_workflows_state ON public.committee_workflows(state);
CREATE INDEX idx_committee_workflows_type ON public.committee_workflows(workflow_type);
CREATE INDEX idx_committee_workflow_stages_workflow ON public.committee_workflow_stages(workflow_id);
CREATE INDEX idx_committee_workflow_stages_assigned ON public.committee_workflow_stages(assigned_to);

-- RLS for workflows
ALTER TABLE public.committee_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_workflow_stages ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can view workflows in their tenant"
  ON public.committee_workflows FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Users with committee.manage can create workflows"
  ON public.committee_workflows FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() AND
    app_has_role('admin')
  );

CREATE POLICY "Users with committee.manage can update workflows"
  ON public.committee_workflows FOR UPDATE
  USING (tenant_id = app_current_tenant_id() AND app_has_role('admin'));

CREATE POLICY "Users with committee.manage can delete workflows"
  ON public.committee_workflows FOR DELETE
  USING (tenant_id = app_current_tenant_id() AND app_has_role('admin'));

-- Workflow stages policies
CREATE POLICY "Users can view workflow stages in their tenant"
  ON public.committee_workflow_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.committee_workflows w
      WHERE w.id = workflow_id AND w.tenant_id = app_current_tenant_id()
    )
  );

CREATE POLICY "Users with committee.manage can manage workflow stages"
  ON public.committee_workflow_stages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.committee_workflows w
      WHERE w.id = workflow_id AND w.tenant_id = app_current_tenant_id()
    ) AND app_has_role('admin')
  );

-- ============================================================================
-- 2. Committee Notifications
-- ============================================================================

-- Notification types enum
CREATE TYPE committee_notification_type AS ENUM (
  'meeting_scheduled',
  'meeting_reminder',
  'meeting_cancelled',
  'decision_made',
  'followup_assigned',
  'followup_due',
  'workflow_assigned',
  'workflow_completed',
  'member_added',
  'document_shared',
  'custom'
);

-- Notification channels enum
CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'sms',
  'webhook'
);

-- Notification status enum
CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'read',
  'failed'
);

-- Committee notifications table
CREATE TABLE public.committee_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
  notification_type committee_notification_type NOT NULL,
  recipient_id UUID NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status notification_status NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for notifications
CREATE INDEX idx_committee_notifications_tenant ON public.committee_notifications(tenant_id);
CREATE INDEX idx_committee_notifications_committee ON public.committee_notifications(committee_id);
CREATE INDEX idx_committee_notifications_recipient ON public.committee_notifications(recipient_id);
CREATE INDEX idx_committee_notifications_status ON public.committee_notifications(status);
CREATE INDEX idx_committee_notifications_channel ON public.committee_notifications(channel);
CREATE INDEX idx_committee_notifications_type ON public.committee_notifications(notification_type);
CREATE INDEX idx_committee_notifications_scheduled ON public.committee_notifications(scheduled_at) WHERE status = 'pending';

-- RLS for notifications
ALTER TABLE public.committee_notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.committee_notifications FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() AND
    (recipient_id = app_current_user_id() OR app_has_role('admin'))
  );

CREATE POLICY "System can create notifications"
  ON public.committee_notifications FOR INSERT
  WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY "Users can update their own notifications"
  ON public.committee_notifications FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() AND
    (recipient_id = app_current_user_id() OR app_has_role('admin'))
  );

CREATE POLICY "Admins can delete notifications"
  ON public.committee_notifications FOR DELETE
  USING (tenant_id = app_current_tenant_id() AND app_has_role('admin'));

-- ============================================================================
-- 3. Committee Analytics Snapshots
-- ============================================================================

-- Analytics snapshots table
CREATE TABLE public.committee_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  
  -- Meeting metrics
  total_meetings INTEGER NOT NULL DEFAULT 0,
  completed_meetings INTEGER NOT NULL DEFAULT 0,
  cancelled_meetings INTEGER NOT NULL DEFAULT 0,
  avg_attendance_rate NUMERIC(5,2),
  avg_meeting_duration_minutes INTEGER,
  
  -- Decision metrics
  total_decisions INTEGER NOT NULL DEFAULT 0,
  approved_decisions INTEGER NOT NULL DEFAULT 0,
  rejected_decisions INTEGER NOT NULL DEFAULT 0,
  pending_decisions INTEGER NOT NULL DEFAULT 0,
  
  -- Followup metrics
  total_followups INTEGER NOT NULL DEFAULT 0,
  completed_followups INTEGER NOT NULL DEFAULT 0,
  overdue_followups INTEGER NOT NULL DEFAULT 0,
  avg_completion_days NUMERIC(5,2),
  
  -- Workflow metrics
  total_workflows INTEGER NOT NULL DEFAULT 0,
  completed_workflows INTEGER NOT NULL DEFAULT 0,
  avg_workflow_duration_days NUMERIC(5,2),
  
  -- Member metrics
  total_members INTEGER NOT NULL DEFAULT 0,
  active_members INTEGER NOT NULL DEFAULT 0,
  
  -- Efficiency score (0-100)
  efficiency_score NUMERIC(5,2),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (tenant_id, committee_id, snapshot_date)
);

-- Indexes for analytics
CREATE INDEX idx_committee_analytics_tenant ON public.committee_analytics_snapshots(tenant_id);
CREATE INDEX idx_committee_analytics_committee ON public.committee_analytics_snapshots(committee_id);
CREATE INDEX idx_committee_analytics_date ON public.committee_analytics_snapshots(snapshot_date DESC);
CREATE INDEX idx_committee_analytics_score ON public.committee_analytics_snapshots(efficiency_score DESC);

-- RLS for analytics
ALTER TABLE public.committee_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Analytics policies
CREATE POLICY "Users can view analytics in their tenant"
  ON public.committee_analytics_snapshots FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "System can manage analytics"
  ON public.committee_analytics_snapshots FOR ALL
  USING (tenant_id = app_current_tenant_id() AND app_has_role('admin'));

-- ============================================================================
-- 4. Triggers
-- ============================================================================

-- Update updated_at triggers
CREATE TRIGGER update_committee_workflows_updated_at
  BEFORE UPDATE ON public.committee_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_committee_workflow_stages_updated_at
  BEFORE UPDATE ON public.committee_workflow_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_committee_notifications_updated_at
  BEFORE UPDATE ON public.committee_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_committee_analytics_snapshots_updated_at
  BEFORE UPDATE ON public.committee_analytics_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to calculate committee efficiency score
CREATE OR REPLACE FUNCTION calculate_committee_efficiency(
  p_committee_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC AS $$
DECLARE
  v_score NUMERIC := 0;
  v_meeting_completion NUMERIC := 0;
  v_decision_rate NUMERIC := 0;
  v_followup_completion NUMERIC := 0;
  v_workflow_efficiency NUMERIC := 0;
BEGIN
  -- Meeting completion rate (40% weight)
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)) * 40
      ELSE 0 
    END INTO v_meeting_completion
  FROM public.meetings
  WHERE committee_id = p_committee_id
    AND scheduled_at >= p_date - INTERVAL '30 days'
    AND scheduled_at < p_date;
  
  -- Decision making rate (25% weight)
  SELECT 
    CASE 
      WHEN COUNT(DISTINCT m.id) > 0 
      THEN (COUNT(d.id)::NUMERIC / COUNT(DISTINCT m.id)) * 25
      ELSE 0 
    END INTO v_decision_rate
  FROM public.meetings m
  LEFT JOIN public.decisions d ON m.id = d.meeting_id
  WHERE m.committee_id = p_committee_id
    AND m.scheduled_at >= p_date - INTERVAL '30 days'
    AND m.scheduled_at < p_date
    AND m.status = 'completed';
  
  -- Followup completion rate (20% weight)
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE status = 'done')::NUMERIC / COUNT(*)) * 20
      ELSE 0 
    END INTO v_followup_completion
  FROM public.followups f
  JOIN public.decisions d ON f.decision_id = d.id
  JOIN public.meetings m ON d.meeting_id = m.id
  WHERE m.committee_id = p_committee_id
    AND f.created_at >= p_date - INTERVAL '30 days'
    AND f.created_at < p_date;
  
  -- Workflow efficiency (15% weight)
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE state = 'completed')::NUMERIC / COUNT(*)) * 15
      ELSE 0 
    END INTO v_workflow_efficiency
  FROM public.committee_workflows
  WHERE committee_id = p_committee_id
    AND created_at >= p_date - INTERVAL '30 days'
    AND created_at < p_date;
  
  v_score := COALESCE(v_meeting_completion, 0) + 
             COALESCE(v_decision_rate, 0) + 
             COALESCE(v_followup_completion, 0) + 
             COALESCE(v_workflow_efficiency, 0);
  
  RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;