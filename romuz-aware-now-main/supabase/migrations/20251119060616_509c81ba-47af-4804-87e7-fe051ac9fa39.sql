-- ============================================================================
-- M13.1 - Content Hub Database Schema
-- مكتبة المحتوى التوعوي مع التحسينات الأمنية الكاملة
-- Created: 2025-11-19
-- ============================================================================

-- ============================================================================
-- 1. CONTENT ITEMS TABLE - المحتوى الرئيسي
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Content Basic Info
  title_ar TEXT NOT NULL,
  title_en TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN (
    'article', 'video', 'infographic', 'document', 
    'quiz', 'policy', 'guideline', 'template', 'micro_journey'
  )),
  
  -- Categorization
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- Content Body
  content_body_ar TEXT,
  content_body_en TEXT,
  
  -- Media
  media_url TEXT,
  thumbnail_url TEXT,
  
  -- Metadata
  author_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'review', 'published', 'archived'
  )),
  
  -- Engagement Metrics
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  
  -- AI & SEO
  ai_generated BOOLEAN DEFAULT false,
  seo_keywords TEXT[],
  seo_description TEXT,
  
  -- Publishing
  published_at TIMESTAMPTZ,
  scheduled_publish_at TIMESTAMPTZ,
  
  -- Security & Backup (من التوصيات الأمنية)
  backup_metadata JSONB DEFAULT '{}'::jsonb,
  last_backup_at TIMESTAMPTZ,
  
  -- Audit
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  
  -- Constraints
  CONSTRAINT content_items_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================================================
-- 2. CONTENT CATEGORIES TABLE - التصنيفات الهرمية
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Category Info
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  
  -- Hierarchy
  parent_category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  
  -- Display
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Usage Stats
  content_count INTEGER DEFAULT 0,
  
  -- Security & Backup
  backup_metadata JSONB DEFAULT '{}'::jsonb,
  last_backup_at TIMESTAMPTZ,
  
  -- Audit
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  
  -- Constraints
  CONSTRAINT content_categories_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT content_categories_unique_name UNIQUE (tenant_id, name_ar)
);

-- ============================================================================
-- 3. USER CONTENT INTERACTIONS TABLE - تفاعلات المستخدمين
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_content_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- User & Content
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  
  -- Interaction Details
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'view', 'like', 'unlike', 'share', 'comment', 
    'download', 'complete', 'bookmark', 'report'
  )),
  
  -- Interaction Data
  interaction_data JSONB DEFAULT '{}'::jsonb,
  
  -- Duration Tracking (for videos, articles)
  duration_seconds INTEGER,
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100),
  
  -- Context
  source_page TEXT,
  device_type TEXT,
  
  -- Security & Backup
  backup_metadata JSONB DEFAULT '{}'::jsonb,
  last_backup_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT user_content_interactions_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT user_content_interactions_unique UNIQUE (tenant_id, user_id, content_id, interaction_type)
);

-- ============================================================================
-- 4. PERFORMANCE INDEXES (من التوصيات الأمنية)
-- ============================================================================

-- Content Items Indexes
CREATE INDEX IF NOT EXISTS idx_content_items_tenant_status 
  ON content_items(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_content_items_category 
  ON content_items(category);

CREATE INDEX IF NOT EXISTS idx_content_items_tags 
  ON content_items USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_content_items_created 
  ON content_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_items_published 
  ON content_items(published_at DESC) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_content_items_author 
  ON content_items(author_id);

CREATE INDEX IF NOT EXISTS idx_content_items_type_status 
  ON content_items(content_type, status);

-- Content Categories Indexes
CREATE INDEX IF NOT EXISTS idx_content_categories_tenant 
  ON content_categories(tenant_id);

CREATE INDEX IF NOT EXISTS idx_content_categories_parent 
  ON content_categories(parent_category_id);

CREATE INDEX IF NOT EXISTS idx_content_categories_active 
  ON content_categories(is_active) WHERE is_active = true;

-- User Interactions Indexes
CREATE INDEX IF NOT EXISTS idx_user_interactions_tenant_user 
  ON user_content_interactions(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_user_interactions_content 
  ON user_content_interactions(content_id);

CREATE INDEX IF NOT EXISTS idx_user_interactions_type 
  ON user_content_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_user_interactions_created 
  ON user_content_interactions(created_at DESC);

-- ============================================================================
-- 5. TRANSACTION LOGGING TRIGGERS (من التوصيات الأمنية)
-- ============================================================================

-- Content Items Audit Trigger
CREATE TRIGGER content_items_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Content Categories Audit Trigger
CREATE TRIGGER content_categories_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON content_categories
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- User Interactions Audit Trigger
CREATE TRIGGER user_content_interactions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_content_interactions
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- ============================================================================
-- 6. AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_content_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_items_updated_at_trigger
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_content_items_updated_at();

CREATE TRIGGER content_categories_updated_at_trigger
  BEFORE UPDATE ON content_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_content_items_updated_at();

-- ============================================================================
-- 7. RLS POLICIES (من التوصيات الأمنية)
-- ============================================================================

-- Enable RLS
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_interactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Content Items RLS Policies
-- ============================================================================

-- SELECT: Users can view published content or their own drafts
CREATE POLICY "content_items_select_policy"
  ON content_items FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() AND (
      status = 'published' OR 
      author_id = app_current_user_id() OR
      app_has_role('admin') OR
      app_has_role('content_manager')
    )
  );

-- INSERT: Authenticated users can create content in their tenant
CREATE POLICY "content_items_insert_policy"
  ON content_items FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() AND
    author_id = app_current_user_id() AND
    created_by = app_current_user_id() AND
    updated_by = app_current_user_id()
  );

-- UPDATE: Authors can update their own content, managers can update all
CREATE POLICY "content_items_update_policy"
  ON content_items FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() AND (
      author_id = app_current_user_id() OR
      app_has_role('admin') OR
      app_has_role('content_manager')
    )
  )
  WITH CHECK (
    tenant_id = app_current_tenant_id() AND
    updated_by = app_current_user_id()
  );

-- DELETE: Only managers and admins can delete
CREATE POLICY "content_items_delete_policy"
  ON content_items FOR DELETE
  USING (
    tenant_id = app_current_tenant_id() AND (
      app_has_role('admin') OR
      app_has_role('content_manager')
    )
  );

-- ============================================================================
-- Content Categories RLS Policies
-- ============================================================================

-- SELECT: All authenticated users can view active categories
CREATE POLICY "content_categories_select_policy"
  ON content_categories FOR SELECT
  USING (
    tenant_id = app_current_tenant_id()
  );

-- INSERT: Only managers can create categories
CREATE POLICY "content_categories_insert_policy"
  ON content_categories FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() AND
    (app_has_role('admin') OR app_has_role('content_manager')) AND
    created_by = app_current_user_id() AND
    updated_by = app_current_user_id()
  );

-- UPDATE: Only managers can update categories
CREATE POLICY "content_categories_update_policy"
  ON content_categories FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() AND
    (app_has_role('admin') OR app_has_role('content_manager'))
  )
  WITH CHECK (
    tenant_id = app_current_tenant_id() AND
    updated_by = app_current_user_id()
  );

-- DELETE: Only admins can delete categories
CREATE POLICY "content_categories_delete_policy"
  ON content_categories FOR DELETE
  USING (
    tenant_id = app_current_tenant_id() AND
    app_has_role('admin')
  );

-- ============================================================================
-- User Content Interactions RLS Policies
-- ============================================================================

-- SELECT: Users can view their own interactions, managers can view all
CREATE POLICY "user_interactions_select_policy"
  ON user_content_interactions FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() AND (
      user_id = app_current_user_id() OR
      app_has_role('admin') OR
      app_has_role('content_manager')
    )
  );

-- INSERT: Users can create their own interactions
CREATE POLICY "user_interactions_insert_policy"
  ON user_content_interactions FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() AND
    user_id = app_current_user_id()
  );

-- UPDATE: Users can update their own interactions
CREATE POLICY "user_interactions_update_policy"
  ON user_content_interactions FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() AND
    user_id = app_current_user_id()
  );

-- DELETE: Users can delete their own interactions, managers can delete all
CREATE POLICY "user_interactions_delete_policy"
  ON user_content_interactions FOR DELETE
  USING (
    tenant_id = app_current_tenant_id() AND (
      user_id = app_current_user_id() OR
      app_has_role('admin') OR
      app_has_role('content_manager')
    )
  );

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to get content analytics
CREATE OR REPLACE FUNCTION get_content_analytics(
  p_tenant_id UUID,
  p_content_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  content_id UUID,
  content_title TEXT,
  content_type TEXT,
  total_views BIGINT,
  total_likes BIGINT,
  total_shares BIGINT,
  total_downloads BIGINT,
  unique_users BIGINT,
  avg_completion_percentage NUMERIC,
  engagement_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id AS content_id,
    ci.title_ar AS content_title,
    ci.content_type,
    COUNT(CASE WHEN uci.interaction_type = 'view' THEN 1 END) AS total_views,
    COUNT(CASE WHEN uci.interaction_type = 'like' THEN 1 END) AS total_likes,
    COUNT(CASE WHEN uci.interaction_type = 'share' THEN 1 END) AS total_shares,
    COUNT(CASE WHEN uci.interaction_type = 'download' THEN 1 END) AS total_downloads,
    COUNT(DISTINCT uci.user_id) AS unique_users,
    AVG(uci.completion_percentage)::NUMERIC(5,2) AS avg_completion_percentage,
    (
      COUNT(CASE WHEN uci.interaction_type = 'view' THEN 1 END) * 1 +
      COUNT(CASE WHEN uci.interaction_type = 'like' THEN 1 END) * 5 +
      COUNT(CASE WHEN uci.interaction_type = 'share' THEN 1 END) * 10 +
      COUNT(CASE WHEN uci.interaction_type = 'complete' THEN 1 END) * 15
    )::NUMERIC AS engagement_score
  FROM content_items ci
  LEFT JOIN user_content_interactions uci ON ci.id = uci.content_id
    AND (p_start_date IS NULL OR uci.created_at >= p_start_date)
    AND (p_end_date IS NULL OR uci.created_at <= p_end_date)
  WHERE ci.tenant_id = p_tenant_id
    AND (p_content_id IS NULL OR ci.id = p_content_id)
  GROUP BY ci.id, ci.title_ar, ci.content_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update category content count
CREATE OR REPLACE FUNCTION update_category_content_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update content count for the category
  UPDATE content_categories
  SET content_count = (
    SELECT COUNT(*)
    FROM content_items
    WHERE category = content_categories.name_ar
      AND tenant_id = content_categories.tenant_id
      AND status = 'published'
  )
  WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_category_content_count();

-- ============================================================================
-- 9. INSERT DEFAULT CATEGORIES
-- ============================================================================

-- Note: Default categories will be inserted per tenant
-- This is a template that can be used by tenant admins

COMMENT ON TABLE content_items IS 'M13.1 - Content Hub: مكتبة المحتوى التوعوي الرئيسية';
COMMENT ON TABLE content_categories IS 'M13.1 - Content Hub: التصنيفات الهرمية للمحتوى';
COMMENT ON TABLE user_content_interactions IS 'M13.1 - Content Hub: تفاعلات المستخدمين مع المحتوى';

-- ============================================================================
-- SECURITY DOCUMENTATION
-- ============================================================================

INSERT INTO _security_documentation (
  entity_name,
  entity_type,
  category,
  security_rationale
) VALUES
  ('content_items', 'table', 'Content Management',
   'RLS: محتوى منشور للكل، المسودات للمؤلف فقط. Audit logging enabled. Backup metadata included.'),
  
  ('content_categories', 'table', 'Content Management',
   'RLS: قراءة للكل، تعديل للمدراء فقط. Audit logging enabled.'),
  
  ('user_content_interactions', 'table', 'Analytics',
   'RLS: كل مستخدم يرى تفاعلاته فقط، المدراء يرون الكل. Audit logging enabled.');

-- ============================================================================
-- END OF M13.1 CONTENT HUB MIGRATION
-- ============================================================================