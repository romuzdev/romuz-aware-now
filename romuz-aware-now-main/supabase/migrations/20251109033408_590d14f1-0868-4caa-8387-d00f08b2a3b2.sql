-- D3 Part 8.1: campaign_views with RLS + UPDATE + limit 10
CREATE TABLE IF NOT EXISTS campaign_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_views_tenant_user
  ON campaign_views (tenant_id, user_id, created_at DESC);

ALTER TABLE campaign_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS campaign_views_read ON campaign_views;
CREATE POLICY campaign_views_read ON campaign_views
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS campaign_views_insert ON campaign_views;
CREATE POLICY campaign_views_insert ON campaign_views
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS campaign_views_update ON campaign_views;
CREATE POLICY campaign_views_update ON campaign_views
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND user_id = auth.uid()
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS campaign_views_delete ON campaign_views;
CREATE POLICY campaign_views_delete ON campaign_views
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND user_id = auth.uid()
);

-- Enforce per-user limit (10 views max)
CREATE OR REPLACE FUNCTION enforce_campaign_views_limit()
RETURNS TRIGGER AS $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM campaign_views
  WHERE tenant_id = NEW.tenant_id AND user_id = NEW.user_id;

  IF cnt >= 10 THEN
    RAISE EXCEPTION 'Saved views limit reached (10 per user)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_campaign_views_limit ON campaign_views;
CREATE TRIGGER trg_campaign_views_limit
BEFORE INSERT ON campaign_views
FOR EACH ROW
EXECUTE FUNCTION enforce_campaign_views_limit();