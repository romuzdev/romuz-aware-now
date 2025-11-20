-- ============================================================
-- Gate-I • Part 2A — Awareness Data Schema Normalization
-- ============================================================
-- Objective: Enhance awareness schema for advanced analytics
-- Changes:
--   1. Add participant journey tracking (invited_at, opened_at)
--   2. Add campaign timing precision (start_at, end_at timestamps)
--   3. Add analytics-optimized indexes
-- ============================================================

-- Step 1: Add journey tracking timestamps to campaign_participants
ALTER TABLE campaign_participants
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE;

-- Backfill invited_at from created_at for existing records
UPDATE campaign_participants
SET invited_at = created_at
WHERE invited_at IS NULL;

-- Backfill opened_at from updated_at for records that are in_progress or completed
UPDATE campaign_participants
SET opened_at = updated_at
WHERE opened_at IS NULL 
  AND status IN ('in_progress', 'completed');

-- Step 2: Add precise timing columns to awareness_campaigns
ALTER TABLE awareness_campaigns
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMP WITH TIME ZONE;

-- Backfill start_at and end_at from start_date and end_date
UPDATE awareness_campaigns
SET 
  start_at = start_date::timestamp with time zone,
  end_at = (end_date + interval '1 day' - interval '1 second')::timestamp with time zone
WHERE start_at IS NULL OR end_at IS NULL;

-- Step 3: Create analytics-optimized indexes

-- Index for time-based participant analytics (invited)
CREATE INDEX IF NOT EXISTS idx_cp_invited_at 
ON campaign_participants(tenant_id, campaign_id, invited_at)
WHERE invited_at IS NOT NULL AND deleted_at IS NULL;

-- Index for time-based participant analytics (opened)
CREATE INDEX IF NOT EXISTS idx_cp_opened_at 
ON campaign_participants(tenant_id, campaign_id, opened_at)
WHERE opened_at IS NOT NULL AND deleted_at IS NULL;

-- Index for campaign timing analytics
CREATE INDEX IF NOT EXISTS idx_campaigns_timing 
ON awareness_campaigns(tenant_id, start_at, end_at)
WHERE archived_at IS NULL;

-- Index for participant score analytics (feedback)
CREATE INDEX IF NOT EXISTS idx_cp_score 
ON campaign_participants(tenant_id, campaign_id, score)
WHERE score IS NOT NULL AND deleted_at IS NULL;

-- Step 4: Add helpful comments for documentation
COMMENT ON COLUMN campaign_participants.invited_at IS 
  'Gate-I: Timestamp when participant was invited to campaign (analytics-ready)';

COMMENT ON COLUMN campaign_participants.opened_at IS 
  'Gate-I: Timestamp when participant first opened/accessed campaign (analytics-ready)';

COMMENT ON COLUMN campaign_participants.score IS 
  'Gate-I: Participant feedback score (embedded feedback, no separate table needed)';

COMMENT ON COLUMN campaign_participants.notes IS 
  'Gate-I: Participant feedback comments (embedded feedback, no separate table needed)';

COMMENT ON COLUMN awareness_campaigns.start_at IS 
  'Gate-I: Precise campaign start timestamp for intraday analytics';

COMMENT ON COLUMN awareness_campaigns.end_at IS 
  'Gate-I: Precise campaign end timestamp for intraday analytics';

-- ============================================================
-- Summary:
-- ✅ campaign_participants enhanced with journey tracking
-- ✅ awareness_campaigns enhanced with precise timing
-- ✅ Analytics-optimized indexes added
-- ✅ Feedback embedded in campaign_participants (no separate table)
-- ✅ All tables are multi-tenant with tenant_id
-- ✅ Backward compatible: existing data preserved
-- ============================================================