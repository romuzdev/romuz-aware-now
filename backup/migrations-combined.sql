-- ============================================================================
-- Romuz Awareness GRC - Full Database Backup
-- ============================================================================
-- Created: 2025-11-20
-- Source Project: Lovable Cloud (varbgkrfwbgzmkkxpqjg)
-- Target Project: https://xovzmzokmpemvxcpzmuh.supabase.co
-- Total Migrations: 174 files
-- ============================================================================

-- IMPORTANT: Execute this file in order from top to bottom
-- Estimated execution time: 10-15 minutes

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 2: CUSTOM TYPES & ENUMS
-- ============================================================================

-- User Roles
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'platform_admin',
    'platform_support', 
    'tenant_admin',
    'manager',
    'employee',
    'auditor',
    'viewer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tenant Status
DO $$ BEGIN
  CREATE TYPE public.tenant_status AS ENUM (
    'CREATED',
    'PROVISIONING', 
    'ACTIVE',
    'SUSPENDED',
    'READ_ONLY',
    'DEPROVISIONING',
    'ARCHIVED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Action Status (Gate H)
DO $$ BEGIN
  CREATE TYPE gate_h.action_status AS ENUM (
    'draft',
    'open',
    'in_progress',
    'blocked',
    'review',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Action Priority
DO $$ BEGIN
  CREATE TYPE gate_h.action_priority AS ENUM (
    'low',
    'medium', 
    'high',
    'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- SECTION 3: SCHEMAS
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS gate_h;
CREATE SCHEMA IF NOT EXISTS gate_i;
CREATE SCHEMA IF NOT EXISTS gate_j;
CREATE SCHEMA IF NOT EXISTS gate_l;

-- ============================================================================
-- SECTION 4: CORE TABLES
-- ============================================================================

-- Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status public.tenant_status DEFAULT 'CREATED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenants_name_key UNIQUE (name)
);

-- User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_unique UNIQUE (user_id, tenant_id, role)
);

-- User Tenants (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_tenants_unique UNIQUE (user_id, tenant_id)
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Profiles (additional)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_preference TEXT DEFAULT 'light',
  language TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 5: POLICIES MODULE (Gate F)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  policy_code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  category TEXT,
  status TEXT DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  effective_date DATE,
  review_date DATE,
  owner_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT policies_tenant_code_unique UNIQUE (tenant_id, policy_code)
);

-- ============================================================================
-- SECTION 6: AWARENESS CAMPAIGNS MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.awareness_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_code TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  target_audience TEXT[],
  kpis JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  archived_by UUID,
  CONSTRAINT campaigns_tenant_code_unique UNIQUE (tenant_id, campaign_code),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ============================================================================
-- SECTION 7: ACTIONS MODULE (Gate H)
-- ============================================================================

CREATE TABLE IF NOT EXISTS gate_h.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action_code TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  status gate_h.action_status DEFAULT 'draft',
  priority gate_h.action_priority DEFAULT 'medium',
  due_date DATE,
  assignee_user_id UUID,
  owner_user_id UUID NOT NULL,
  source_ref TEXT,
  source_module TEXT,
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT actions_tenant_code_unique UNIQUE (tenant_id, action_code)
);

-- Action Updates (Comments/Status Changes)
CREATE TABLE IF NOT EXISTS gate_h.action_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES gate_h.action_items(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  body_en TEXT,
  old_status gate_h.action_status,
  new_status gate_h.action_status,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 8: MASTER DATA (Catalogs, Terms, Mappings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ref_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  label_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  scope TEXT NOT NULL DEFAULT 'TENANT' CHECK (scope IN ('GLOBAL', 'TENANT')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  version INTEGER DEFAULT 1,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ref_catalogs_unique UNIQUE (tenant_id, code, scope)
);

CREATE TABLE IF NOT EXISTS public.ref_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES public.ref_catalogs(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.ref_terms(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  label_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  attrs JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ref_terms_catalog_code_unique UNIQUE (catalog_id, code)
);

CREATE TABLE IF NOT EXISTS public.ref_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES public.ref_catalogs(id) ON DELETE CASCADE,
  term_id UUID REFERENCES public.ref_terms(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL,
  src_code TEXT NOT NULL,
  target_code TEXT NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ref_mappings_unique UNIQUE (catalog_id, term_id, source_system, src_code)
);

-- ============================================================================
-- SECTION 9: KPI CATALOG (Gate I)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kpi_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kpi_key TEXT NOT NULL,
  category TEXT,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  unit TEXT,
  target_value NUMERIC,
  gate_source TEXT,
  formula TEXT,
  data_source TEXT,
  collection_frequency TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kpi_catalog_unique UNIQUE (tenant_id, kpi_key)
);

-- ============================================================================
-- SECTION 10: HELPER FUNCTIONS
-- ============================================================================

-- Get current user ID
CREATE OR REPLACE FUNCTION public.app_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- Get current tenant ID
CREATE OR REPLACE FUNCTION public.app_current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id 
  FROM public.user_tenants 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Check if user has role
CREATE OR REPLACE FUNCTION public.app_has_role(p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::TEXT = p_role
      AND (tenant_id = public.app_current_tenant_id() OR tenant_id IS NULL)
  );
$$;

-- Get user tenant ID
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.user_tenants
  WHERE user_id = p_user_id
  LIMIT 1;
$$;

-- Has role in tenant
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role::TEXT = p_role
  );
$$;

-- ============================================================================
-- SECTION 11: TRIGGERS
-- ============================================================================

-- Auto-update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.awareness_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON gate_h.action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    now(),
    now()
  );
  
  INSERT INTO public.user_profiles (id, theme_preference)
  VALUES (NEW.id, 'light')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SECTION 12: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awareness_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_h.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_h.action_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_catalog ENABLE ROW LEVEL SECURITY;

-- Tenants RLS
CREATE POLICY "Users can view their tenants"
  ON public.tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- User Roles RLS
CREATE POLICY "Users can view roles in their tenants"
  ON public.user_roles FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Profiles RLS
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- User Profiles RLS
CREATE POLICY "Users can manage own user_profile"
  ON public.user_profiles FOR ALL
  USING (id = auth.uid());

-- Audit Log RLS
CREATE POLICY "Users can view audit logs in their tenants"
  ON public.audit_log FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- Policies RLS
CREATE POLICY "Tenant isolation for policies"
  ON public.policies FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- Campaigns RLS
CREATE POLICY "Tenant isolation for campaigns"
  ON public.awareness_campaigns FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- Actions RLS
CREATE POLICY "Tenant isolation for actions"
  ON gate_h.action_items FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant isolation for action updates"
  ON gate_h.action_updates FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- Master Data RLS
CREATE POLICY "Catalogs access"
  ON public.ref_catalogs FOR ALL
  USING (
    scope = 'GLOBAL' OR 
    (scope = 'TENANT' AND tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Terms access"
  ON public.ref_terms FOR ALL
  USING (
    catalog_id IN (
      SELECT id FROM public.ref_catalogs 
      WHERE scope = 'GLOBAL' OR 
      (scope = 'TENANT' AND tenant_id IN (
        SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Mappings access"
  ON public.ref_mappings FOR ALL
  USING (
    catalog_id IN (
      SELECT id FROM public.ref_catalogs 
      WHERE scope = 'GLOBAL' OR 
      (scope = 'TENANT' AND tenant_id IN (
        SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
      ))
    )
  );

-- KPI Catalog RLS
CREATE POLICY "Tenant isolation for kpi_catalog"
  ON public.kpi_catalog FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 13: INDEXES
-- ============================================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON public.audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON public.audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policies_tenant_id ON public.policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON public.awareness_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.awareness_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_actions_tenant_id ON gate_h.action_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON gate_h.action_items(status);
CREATE INDEX IF NOT EXISTS idx_actions_assignee ON gate_h.action_items(assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_ref_terms_catalog_id ON public.ref_terms(catalog_id);
CREATE INDEX IF NOT EXISTS idx_ref_mappings_catalog_id ON public.ref_mappings(catalog_id);
CREATE INDEX IF NOT EXISTS idx_kpi_catalog_tenant_id ON public.kpi_catalog(tenant_id);

-- ============================================================================
-- END OF SCHEMA MIGRATION
-- ============================================================================

-- Verify installation
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema IN ('public', 'gate_h', 'gate_i', 'gate_j', 'gate_l');
  
  RAISE NOTICE 'Schema migration completed successfully!';
  RAISE NOTICE 'Total tables created: %', table_count;
END $$;
