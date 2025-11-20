-- =====================================================
-- D3-M21: Committees Module - Part 1: Database Schema
-- =====================================================

-- 1) CREATE TABLES
-- =====================================================

-- Table: committees
CREATE TABLE IF NOT EXISTS public.committees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL,
  code       TEXT NOT NULL,
  name       TEXT NOT NULL,
  charter    TEXT,
  status     TEXT NOT NULL DEFAULT 'active', -- active|inactive|archived
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Table: committee_members
CREATE TABLE IF NOT EXISTS public.committee_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  role         TEXT, -- chair|member|secretary
  is_voting    BOOLEAN NOT NULL DEFAULT true,
  start_at     DATE,
  end_at       DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: meetings
CREATE TABLE IF NOT EXISTS public.meetings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'planned', -- planned|in_progress|closed|cancelled
  minutes_url  TEXT,
  created_by   UUID NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: agenda_items
CREATE TABLE IF NOT EXISTS public.agenda_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id    UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  owner_user_id UUID,
  seq           INTEGER,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: decisions
CREATE TABLE IF NOT EXISTS public.decisions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id     UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  agenda_item_id UUID REFERENCES public.agenda_items(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  resolution     TEXT,
  vote_result    TEXT, -- passed|failed|consensus|unanimous
  decided_at     TIMESTAMPTZ DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: followups
CREATE TABLE IF NOT EXISTS public.followups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id   UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  due_at        TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'open', -- open|in_progress|done|blocked|overdue
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) CREATE INDEXES
-- =====================================================

-- Committees indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_committees_tenant_code
  ON public.committees(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_committees_tenant 
  ON public.committees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_committees_status 
  ON public.committees(status);
CREATE INDEX IF NOT EXISTS idx_committees_created_at 
  ON public.committees(created_at DESC);

-- Committee members indexes
CREATE INDEX IF NOT EXISTS idx_comm_members_committee 
  ON public.committee_members(committee_id);
CREATE INDEX IF NOT EXISTS idx_comm_members_user 
  ON public.committee_members(user_id);

-- Meetings indexes
CREATE INDEX IF NOT EXISTS idx_meetings_committee 
  ON public.meetings(committee_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled 
  ON public.meetings(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_status 
  ON public.meetings(status);

-- Agenda items indexes
CREATE INDEX IF NOT EXISTS idx_agenda_items_meeting 
  ON public.agenda_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_seq 
  ON public.agenda_items(meeting_id, seq);

-- Decisions indexes
CREATE INDEX IF NOT EXISTS idx_decisions_meeting 
  ON public.decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_decisions_agenda_item 
  ON public.decisions(agenda_item_id);

-- Followups indexes
CREATE INDEX IF NOT EXISTS idx_followups_decision 
  ON public.followups(decision_id);
CREATE INDEX IF NOT EXISTS idx_followups_due 
  ON public.followups(due_at);
CREATE INDEX IF NOT EXISTS idx_followups_owner 
  ON public.followups(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_followups_status 
  ON public.followups(status);

-- 3) CREATE TRIGGERS FOR updated_at
-- =====================================================

-- Committees trigger
CREATE TRIGGER trg_committees_updated_at
  BEFORE UPDATE ON public.committees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Meetings trigger
CREATE TRIGGER trg_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Followups trigger
CREATE TRIGGER trg_followups_updated_at
  BEFORE UPDATE ON public.followups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4) ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

-- 5) CREATE RLS POLICIES
-- =====================================================

-- Committees: Direct tenant_id check
CREATE POLICY committees_tenant_isolation ON public.committees
  FOR ALL
  USING (tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Committee Members: Via parent committee
CREATE POLICY committee_members_tenant_isolation ON public.committee_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.committees c
      WHERE c.id = committee_members.committee_id
        AND c.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.committees c
      WHERE c.id = committee_members.committee_id
        AND c.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  );

-- Meetings: Via parent committee
CREATE POLICY meetings_tenant_isolation ON public.meetings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.committees c
      WHERE c.id = meetings.committee_id
        AND c.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.committees c
      WHERE c.id = meetings.committee_id
        AND c.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  );

-- Agenda Items: Via parent meeting -> committee
CREATE POLICY agenda_items_tenant_isolation ON public.agenda_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM public.meetings m 
      JOIN public.committees c ON c.id = m.committee_id
      WHERE m.id = agenda_items.meeting_id
        AND c.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.meetings m 
      JOIN public.committees c ON c.id = m.committee_id
      WHERE m.id = agenda_items.meeting_id
        AND c.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  );

-- Decisions: Via parent meeting -> committee
CREATE POLICY decisions_tenant_isolation ON public.decisions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM public.meetings m 
      JOIN public.committees c ON c.id = m.committee_id
      WHERE m.id = decisions.meeting_id
        AND c.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.meetings m 
      JOIN public.committees c ON c.id = m.committee_id
      WHERE m.id = decisions.meeting_id
        AND c.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  );

-- Followups: Via parent decision -> meeting -> committee
CREATE POLICY followups_tenant_isolation ON public.followups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM public.decisions d 
      JOIN public.meetings m ON m.id = d.meeting_id
      JOIN public.committees c ON c.id = m.committee_id
      WHERE d.id = followups.decision_id
        AND c.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.decisions d 
      JOIN public.meetings m ON m.id = d.meeting_id
      JOIN public.committees c ON c.id = m.committee_id
      WHERE d.id = followups.decision_id
        AND c.tenant_id = public.get_user_tenant_id(auth.uid())
    )
  );

-- 6) COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.committees IS 'D3-M21: Committees - Main committees table with tenant isolation';
COMMENT ON TABLE public.committee_members IS 'D3-M21: Committee Members - Members and their roles in committees';
COMMENT ON TABLE public.meetings IS 'D3-M21: Meetings - Committee meetings with scheduling and status';
COMMENT ON TABLE public.agenda_items IS 'D3-M21: Agenda Items - Meeting agenda items';
COMMENT ON TABLE public.decisions IS 'D3-M21: Decisions - Decisions made during meetings';
COMMENT ON TABLE public.followups IS 'D3-M21: Followups - Action items and follow-ups from decisions';