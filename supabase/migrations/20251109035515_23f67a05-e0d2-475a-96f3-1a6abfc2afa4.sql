-- D3 Part 9: Add soft archive support to awareness_campaigns
-- Add archived_at and archived_by columns with index

ALTER TABLE awareness_campaigns
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID;

-- Create index for efficient filtering of archived records
CREATE INDEX IF NOT EXISTS idx_awareness_campaigns_archived
  ON awareness_campaigns (archived_at);

COMMENT ON COLUMN awareness_campaigns.archived_at IS 'Timestamp when campaign was archived (soft delete)';
COMMENT ON COLUMN awareness_campaigns.archived_by IS 'User ID who archived the campaign';