-- Gate-P: Scheduled Tenant Transitions - minimal implementation for frontend RPCs
-- 1) Helper: updated_at trigger (create or replace to be idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2) Table: tenant_scheduled_transitions
CREATE TABLE IF NOT EXISTS public.tenant_scheduled_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  from_state text NOT NULL,
  to_state text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  condition_check jsonb NOT NULL DEFAULT '{}'::jsonb,
  executed_at timestamptz,
  error_message text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.a) Indexes
CREATE INDEX IF NOT EXISTS idx_tst_tenant ON public.tenant_scheduled_transitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tst_scheduled_at ON public.tenant_scheduled_transitions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tst_status ON public.tenant_scheduled_transitions(status);

-- 2.b) Trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tst_updated_at'
  ) THEN
    CREATE TRIGGER trg_tst_updated_at
    BEFORE UPDATE ON public.tenant_scheduled_transitions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) RLS
ALTER TABLE public.tenant_scheduled_transitions ENABLE ROW LEVEL SECURITY;

-- SELECT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tenant_scheduled_transitions' 
      AND policyname = 'tst_select_policy'
  ) THEN
    CREATE POLICY tst_select_policy
      ON public.tenant_scheduled_transitions
      FOR SELECT
      USING (tenant_id = get_user_tenant_id(auth.uid()));
  END IF;
END $$;

-- INSERT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tenant_scheduled_transitions' 
      AND policyname = 'tst_insert_policy'
  ) THEN
    CREATE POLICY tst_insert_policy
      ON public.tenant_scheduled_transitions
      FOR INSERT
      WITH CHECK ((tenant_id = get_user_tenant_id(auth.uid())) AND (auth.uid() IS NOT NULL));
  END IF;
END $$;

-- UPDATE policy (only pending rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tenant_scheduled_transitions' 
      AND policyname = 'tst_update_policy'
  ) THEN
    CREATE POLICY tst_update_policy
      ON public.tenant_scheduled_transitions
      FOR UPDATE
      USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (status = 'pending'))
      WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
  END IF;
END $$;

-- 4) RPC: fn_schedule_tenant_transition
CREATE OR REPLACE FUNCTION public.fn_schedule_tenant_transition(
  p_tenant_id uuid,
  p_from_state text,
  p_to_state text,
  p_scheduled_at timestamptz,
  p_reason text DEFAULT NULL,
  p_condition_check jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- RLS will enforce tenant ownership via INSERT policy
  INSERT INTO public.tenant_scheduled_transitions (
    tenant_id, from_state, to_state, scheduled_at, reason, status, condition_check, created_by
  ) VALUES (
    p_tenant_id, p_from_state, p_to_state, p_scheduled_at, p_reason, 'pending', COALESCE(p_condition_check, '{}'::jsonb), auth.uid()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 5) RPC: fn_cancel_scheduled_transition
CREATE OR REPLACE FUNCTION public.fn_cancel_scheduled_transition(
  p_transition_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  UPDATE public.tenant_scheduled_transitions
  SET status = 'cancelled', updated_by = auth.uid(), updated_at = now()
  WHERE id = p_transition_id
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND status = 'pending'
  RETURNING id INTO v_id;

  RETURN v_id IS NOT NULL;
END;
$$;
