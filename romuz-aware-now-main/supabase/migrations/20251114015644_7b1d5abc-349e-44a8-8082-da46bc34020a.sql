-- =====================================================
-- D3-M21: Committees Module - Part 1.B: Fixes & Enhancements
-- =====================================================

-- 1) ADD MISSING COLUMNS TO followups
-- =====================================================

-- Add meeting_id for convenience queries (denormalized but useful)
ALTER TABLE public.followups 
ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE;

-- Add completion tracking fields
ALTER TABLE public.followups 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE public.followups 
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- 2) CREATE INDEX ON NEW COLUMNS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_followups_meeting 
  ON public.followups(meeting_id);

CREATE INDEX IF NOT EXISTS idx_followups_status 
  ON public.followups(status);

CREATE INDEX IF NOT EXISTS idx_followups_owner 
  ON public.followups(owner_user_id);

-- 3) ADD MISSING STATUS INDEX ON decisions
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_decisions_decided_at 
  ON public.decisions(decided_at DESC);

-- 4) COMMENT DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.committees IS 'M21: Committee management - tenant isolated';
COMMENT ON TABLE public.committee_members IS 'M21: Committee membership with roles and voting rights';
COMMENT ON TABLE public.meetings IS 'M21: Committee meetings with scheduling and status tracking';
COMMENT ON TABLE public.agenda_items IS 'M21: Meeting agenda items with sequencing';
COMMENT ON TABLE public.decisions IS 'M21: Meeting decisions with voting results';
COMMENT ON TABLE public.followups IS 'M21: Decision follow-up tasks with completion tracking';

COMMENT ON COLUMN public.followups.meeting_id IS 'Denormalized for convenience - references parent meeting';
COMMENT ON COLUMN public.followups.decision_id IS 'Primary reference to decision that created this followup';
COMMENT ON COLUMN public.followups.completed_at IS 'Timestamp when followup was marked complete';
COMMENT ON COLUMN public.followups.completion_notes IS 'Notes added when completing the followup';