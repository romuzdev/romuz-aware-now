-- ============================================================================
-- M13.1 Content Hub - Database Enhancement (SIMPLIFIED)
-- Version: 1.4
-- ============================================================================

-- 1. Enhance content_items
ALTER TABLE public.content_items 
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS bookmark_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  ADD COLUMN IF NOT EXISTS template_id UUID;

-- 2. Create content_templates
CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL,
  structure JSONB NOT NULL,
  default_values JSONB,
  ai_prompt_template TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_system BOOLEAN DEFAULT false NOT NULL,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID NOT NULL,
  last_backed_up_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(tenant_id, name)
);

-- 3. Create user_content_interactions
CREATE TABLE IF NOT EXISTS public.user_content_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  view_duration_seconds INTEGER,
  completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  share_channel TEXT,
  interaction_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_interaction 
  ON public.user_content_interactions(tenant_id, user_id, content_id, interaction_type)
  WHERE interaction_type IN ('like', 'bookmark');

-- 4. Create content_comments
CREATE TABLE IF NOT EXISTS public.content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL CHECK (length(trim(comment_text)) >= 1),
  parent_comment_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT true NOT NULL,
  is_flagged BOOLEAN DEFAULT false NOT NULL,
  like_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_backed_up_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create content_bookmarks
CREATE TABLE IF NOT EXISTS public.content_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  folder_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, user_id, content_id)
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_content_templates_tenant ON public.content_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_tenant ON public.user_content_interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON public.user_content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_tenant ON public.content_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comments_content ON public.content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.content_bookmarks(user_id);

-- 7. Enable RLS
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_bookmarks ENABLE ROW LEVEL SECURITY;

-- 8. Simple RLS Policies
CREATE POLICY "Templates: tenant access" ON public.content_templates FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Interactions: own or tenant" ON public.user_content_interactions FOR ALL
  USING (user_id = auth.uid() OR tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Comments: tenant access" ON public.content_comments FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Bookmarks: own access" ON public.content_bookmarks FOR ALL
  USING (user_id = auth.uid());