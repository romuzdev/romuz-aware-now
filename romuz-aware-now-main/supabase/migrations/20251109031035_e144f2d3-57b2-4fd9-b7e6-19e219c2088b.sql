-- Migration: D3_Part6_add_columns_to_awareness_campaigns
-- Add missing columns for campaign description and owner

ALTER TABLE awareness_campaigns
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_awareness_campaigns_status ON awareness_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_awareness_campaigns_dates ON awareness_campaigns (start_date, end_date);