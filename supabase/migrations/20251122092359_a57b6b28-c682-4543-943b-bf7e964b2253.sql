-- ============================================================================
-- M23 - Phase 1: Add last_backed_up_at to Core Tables
-- Simple metadata column addition (no indexes or triggers yet)
-- ============================================================================

-- Add last_backed_up_at to verified core tables
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

ALTER TABLE public.grc_risks 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

ALTER TABLE public.grc_controls 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

ALTER TABLE public.awareness_campaigns 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

ALTER TABLE public.audit_log 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN public.policies.last_backed_up_at IS 'Timestamp of last backup (M23 - Backup & Recovery System)';
COMMENT ON COLUMN public.documents.last_backed_up_at IS 'Timestamp of last backup (M23 - Backup & Recovery System)';
COMMENT ON COLUMN public.grc_risks.last_backed_up_at IS 'Timestamp of last backup (M23 - Backup & Recovery System)';
COMMENT ON COLUMN public.grc_controls.last_backed_up_at IS 'Timestamp of last backup (M23 - Backup & Recovery System)';
COMMENT ON COLUMN public.awareness_campaigns.last_backed_up_at IS 'Timestamp of last backup (M23 - Backup & Recovery System)';
COMMENT ON COLUMN public.audit_log.last_backed_up_at IS 'Timestamp of last backup (M23 - Backup & Recovery System)';