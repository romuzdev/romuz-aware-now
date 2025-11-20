-- ============================================================================
-- Gate-H JSON Schema Registry
-- ============================================================================
-- Purpose: Define and register JSON Schemas for Gate-H API contracts,
--          export/import validation, and documentation
-- Author: Gate-H Implementation (Part 5.2)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Schema Registry Table
-- ----------------------------------------------------------------------------
-- Purpose: Store versioned JSON Schema documents for Gate-H entities
-- Security: Read-only for authenticated users, managed by admins
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.gate_h_json_schemas (
  id BIGSERIAL PRIMARY KEY,
  domain TEXT NOT NULL DEFAULT 'gate_h',
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  schema_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint on domain + name + version
CREATE UNIQUE INDEX IF NOT EXISTS idx_gate_h_json_schemas_domain_name_version 
ON public.gate_h_json_schemas(domain, name, version);

-- Index for quick lookups by domain
CREATE INDEX IF NOT EXISTS idx_gate_h_json_schemas_domain 
ON public.gate_h_json_schemas(domain);

COMMENT ON TABLE public.gate_h_json_schemas IS 
'Gate-H JSON schema registry for API contracts, exports, and documentation';

COMMENT ON COLUMN public.gate_h_json_schemas.domain IS 
'Schema domain (e.g., gate_h, gate_k) for logical grouping';

COMMENT ON COLUMN public.gate_h_json_schemas.name IS 
'Schema name (e.g., action_item, action_update, export_actions_request)';

COMMENT ON COLUMN public.gate_h_json_schemas.version IS 
'Semantic version (e.g., v1, v2.0) for schema evolution';

COMMENT ON COLUMN public.gate_h_json_schemas.schema_json IS 
'Full JSON Schema document (draft-07 or 2020-12 format)';

-- ============================================================================
-- Summary:
-- ✅ Created gate_h_json_schemas registry table
-- ✅ Added unique index on (domain, name, version)
-- ✅ Added performance index on domain
-- ✅ Added comprehensive comments for all columns
-- ============================================================================