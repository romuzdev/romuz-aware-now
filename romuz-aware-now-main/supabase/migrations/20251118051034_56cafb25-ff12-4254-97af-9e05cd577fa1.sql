-- ============================================================================
-- M23 - Backup & Recovery System
-- Storage Bucket Configuration
-- Purpose: إنشاء Storage Bucket للنسخ الاحتياطية
-- ============================================================================

-- Create backups storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'backups',
  'backups',
  false, -- Private bucket
  104857600, -- 100MB limit per file
  ARRAY['application/json', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for backups bucket
CREATE POLICY "Admin users can upload backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backups' 
  AND (auth.jwt()->>'role' IN ('super_admin', 'tenant_admin'))
);

CREATE POLICY "Admin users can view their tenant backups"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'backups'
  AND (auth.jwt()->>'role' IN ('super_admin', 'tenant_admin'))
  AND (storage.foldername(name))[1] = (auth.jwt()->>'tenant_id')
);

CREATE POLICY "Admin users can delete their tenant backups"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'backups'
  AND (auth.jwt()->>'role' IN ('super_admin', 'tenant_admin'))
  AND (storage.foldername(name))[1] = (auth.jwt()->>'tenant_id')
);

-- Enable pg_cron extension for scheduled backups
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;

COMMENT ON SCHEMA extensions IS 'Extensions schema for pg_cron and pg_net';
