set search_path = public;

-- Ensure RLS is enabled on backup_jobs
alter table if exists public.backup_jobs enable row level security;

-- Create SELECT policy for tenant members (idempotent)
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view tenant backup jobs"
      ON public.backup_jobs
      FOR SELECT
      TO authenticated
      USING (
        tenant_id IN (
          SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
        )
      );
  EXCEPTION WHEN duplicate_object THEN
    -- policy already exists
    NULL;
  END;
END $$;

-- Optionally allow platform admins to view all rows if user_roles exists (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='user_roles'
  ) THEN
    BEGIN
      CREATE POLICY "Platform admins can view all backup jobs"
        ON public.backup_jobs
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role IN ('platform_admin','super_admin','admin')
          )
        );
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;