-- ============================================================
-- Phase 1: LMS Development - Database Schema Migration
-- ============================================================
-- Purpose: Create complete LMS database structure
-- Tables: 9 tables (categories, courses, modules, lessons, resources, enrollments, progress, assessments, certificates)
-- Security: RLS policies + tenant isolation
-- Performance: Composite indexes + triggers
-- ============================================================

-- ============================================================
-- 1. lms_categories - Course Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.lms_categories(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  CONSTRAINT lms_categories_name_check CHECK (char_length(name) >= 2),
  CONSTRAINT lms_categories_unique_name UNIQUE (tenant_id, name)
);

-- Indexes for lms_categories
CREATE INDEX IF NOT EXISTS idx_lms_categories_tenant ON public.lms_categories(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lms_categories_parent ON public.lms_categories(parent_id);

-- RLS for lms_categories
ALTER TABLE public.lms_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_categories_select" ON public.lms_categories
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_categories_insert" ON public.lms_categories
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "lms_categories_update" ON public.lms_categories
  FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_categories_delete" ON public.lms_categories
  FOR DELETE USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================================
-- 2. lms_courses - Training Courses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.lms_categories(id) ON DELETE SET NULL,
  instructor_id UUID,
  level TEXT NOT NULL DEFAULT 'beginner',
  duration_hours INTEGER NOT NULL DEFAULT 1,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT lms_courses_code_check CHECK (char_length(code) >= 2 AND char_length(code) <= 50),
  CONSTRAINT lms_courses_name_check CHECK (char_length(name) >= 3),
  CONSTRAINT lms_courses_level_check CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  CONSTRAINT lms_courses_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT lms_courses_unique_code UNIQUE (tenant_id, code)
);

-- Indexes for lms_courses
CREATE INDEX IF NOT EXISTS idx_lms_courses_tenant_status ON public.lms_courses(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lms_courses_instructor ON public.lms_courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lms_courses_category ON public.lms_courses(category_id);
CREATE INDEX IF NOT EXISTS idx_lms_courses_deleted ON public.lms_courses(deleted_at);

-- RLS for lms_courses
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_courses_select" ON public.lms_courses
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_courses_insert" ON public.lms_courses
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "lms_courses_update" ON public.lms_courses
  FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_courses_delete" ON public.lms_courses
  FOR DELETE USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================================
-- 3. lms_course_modules - Course Modules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT lms_modules_name_check CHECK (char_length(name) >= 2),
  CONSTRAINT lms_modules_unique_position UNIQUE (course_id, position)
);

-- Indexes for lms_course_modules
CREATE INDEX IF NOT EXISTS idx_lms_modules_course ON public.lms_course_modules(course_id, position);
CREATE INDEX IF NOT EXISTS idx_lms_modules_tenant ON public.lms_course_modules(tenant_id);

-- RLS for lms_course_modules
ALTER TABLE public.lms_course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_modules_select" ON public.lms_course_modules
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_modules_insert" ON public.lms_course_modules
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "lms_modules_update" ON public.lms_course_modules
  FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_modules_delete" ON public.lms_course_modules
  FOR DELETE USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================================
-- 4. lms_course_lessons - Course Lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  module_id UUID NOT NULL REFERENCES public.lms_course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  content_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT lms_lessons_name_check CHECK (char_length(name) >= 2),
  CONSTRAINT lms_lessons_type_check CHECK (content_type IN ('text', 'video', 'pdf', 'scorm', 'interactive')),
  CONSTRAINT lms_lessons_unique_position UNIQUE (module_id, position)
);

-- Indexes for lms_course_lessons
CREATE INDEX IF NOT EXISTS idx_lms_lessons_module ON public.lms_course_lessons(module_id, position);
CREATE INDEX IF NOT EXISTS idx_lms_lessons_course ON public.lms_course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_lessons_tenant ON public.lms_course_lessons(tenant_id);

-- RLS for lms_course_lessons
ALTER TABLE public.lms_course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_lessons_select" ON public.lms_course_lessons
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_lessons_insert" ON public.lms_course_lessons
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "lms_lessons_update" ON public.lms_course_lessons
  FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_lessons_delete" ON public.lms_course_lessons
  FOR DELETE USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================================
-- 5. lms_course_resources - Course Resources
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.lms_course_modules(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL DEFAULT 'document',
  file_url TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  is_downloadable BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  
  CONSTRAINT lms_resources_name_check CHECK (char_length(name) >= 2),
  CONSTRAINT lms_resources_type_check CHECK (resource_type IN ('document', 'video', 'link', 'attachment'))
);

-- Indexes for lms_course_resources
CREATE INDEX IF NOT EXISTS idx_lms_resources_course ON public.lms_course_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_resources_module ON public.lms_course_resources(module_id);
CREATE INDEX IF NOT EXISTS idx_lms_resources_tenant ON public.lms_course_resources(tenant_id);

-- RLS for lms_course_resources
ALTER TABLE public.lms_course_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_resources_select" ON public.lms_course_resources
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_resources_insert" ON public.lms_course_resources
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "lms_resources_update" ON public.lms_course_resources
  FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_resources_delete" ON public.lms_course_resources
  FOR DELETE USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================================
-- 6. lms_enrollments - Course Enrollments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enrollment_type TEXT NOT NULL DEFAULT 'self',
  enrolled_by UUID,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'enrolled',
  progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  score NUMERIC(5,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT lms_enrollments_type_check CHECK (enrollment_type IN ('self', 'assigned', 'mandatory')),
  CONSTRAINT lms_enrollments_status_check CHECK (status IN ('enrolled', 'in_progress', 'completed', 'withdrawn')),
  CONSTRAINT lms_enrollments_progress_check CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  CONSTRAINT lms_enrollments_unique_user_course UNIQUE (tenant_id, course_id, user_id)
);

-- Indexes for lms_enrollments
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_user_status ON public.lms_enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_course_status ON public.lms_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_due_date ON public.lms_enrollments(due_date) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_tenant ON public.lms_enrollments(tenant_id);

-- RLS for lms_enrollments
ALTER TABLE public.lms_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_enrollments_select" ON public.lms_enrollments
  FOR SELECT USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "lms_enrollments_insert" ON public.lms_enrollments
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "lms_enrollments_update" ON public.lms_enrollments
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "lms_enrollments_delete" ON public.lms_enrollments
  FOR DELETE USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- ============================================================
-- 7. lms_progress - Learning Progress Tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  enrollment_id UUID NOT NULL REFERENCES public.lms_enrollments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lms_course_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT lms_progress_status_check CHECK (status IN ('not_started', 'in_progress', 'completed')),
  CONSTRAINT lms_progress_unique_enrollment_lesson UNIQUE (enrollment_id, lesson_id)
);

-- Indexes for lms_progress
CREATE INDEX IF NOT EXISTS idx_lms_progress_enrollment ON public.lms_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_user_course ON public.lms_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_lesson ON public.lms_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_tenant ON public.lms_progress(tenant_id);

-- RLS for lms_progress
ALTER TABLE public.lms_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_progress_select" ON public.lms_progress
  FOR SELECT USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "lms_progress_insert" ON public.lms_progress
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "lms_progress_update" ON public.lms_progress
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND user_id = auth.uid()
  );

-- ============================================================
-- 8. lms_assessments - Course Assessments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL DEFAULT 'quiz',
  passing_score NUMERIC(5,2) NOT NULL DEFAULT 70.00,
  time_limit_minutes INTEGER,
  max_attempts INTEGER,
  randomize_questions BOOLEAN NOT NULL DEFAULT false,
  show_correct_answers BOOLEAN NOT NULL DEFAULT true,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  is_required BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  
  CONSTRAINT lms_assessments_name_check CHECK (char_length(name) >= 2),
  CONSTRAINT lms_assessments_type_check CHECK (assessment_type IN ('quiz', 'exam', 'assignment', 'survey')),
  CONSTRAINT lms_assessments_passing_check CHECK (passing_score >= 0 AND passing_score <= 100)
);

-- Indexes for lms_assessments
CREATE INDEX IF NOT EXISTS idx_lms_assessments_course ON public.lms_assessments(course_id, is_required);
CREATE INDEX IF NOT EXISTS idx_lms_assessments_tenant ON public.lms_assessments(tenant_id);

-- RLS for lms_assessments
ALTER TABLE public.lms_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_assessments_select" ON public.lms_assessments
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_assessments_insert" ON public.lms_assessments
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "lms_assessments_update" ON public.lms_assessments
  FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "lms_assessments_delete" ON public.lms_assessments
  FOR DELETE USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================================
-- 9. lms_certificates - Course Certificates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  enrollment_id UUID NOT NULL REFERENCES public.lms_enrollments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  certificate_number TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  template_id UUID,
  certificate_data JSONB DEFAULT '{}',
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT lms_certificates_number_check CHECK (char_length(certificate_number) >= 10),
  CONSTRAINT lms_certificates_unique_number UNIQUE (tenant_id, certificate_number)
);

-- Indexes for lms_certificates
CREATE INDEX IF NOT EXISTS idx_lms_certificates_user ON public.lms_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_lms_certificates_course ON public.lms_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_certificates_number ON public.lms_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_lms_certificates_tenant ON public.lms_certificates(tenant_id);

-- RLS for lms_certificates
ALTER TABLE public.lms_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lms_certificates_select" ON public.lms_certificates
  FOR SELECT USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "lms_certificates_insert" ON public.lms_certificates
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND auth.uid() IS NOT NULL
  );

-- ============================================================
-- Triggers - Auto-update timestamps
-- ============================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_lms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
CREATE TRIGGER trg_lms_categories_updated 
  BEFORE UPDATE ON public.lms_categories 
  FOR EACH ROW EXECUTE FUNCTION update_lms_updated_at();

CREATE TRIGGER trg_lms_courses_updated 
  BEFORE UPDATE ON public.lms_courses 
  FOR EACH ROW EXECUTE FUNCTION update_lms_updated_at();

CREATE TRIGGER trg_lms_modules_updated 
  BEFORE UPDATE ON public.lms_course_modules 
  FOR EACH ROW EXECUTE FUNCTION update_lms_updated_at();

CREATE TRIGGER trg_lms_lessons_updated 
  BEFORE UPDATE ON public.lms_course_lessons 
  FOR EACH ROW EXECUTE FUNCTION update_lms_updated_at();

CREATE TRIGGER trg_lms_resources_updated 
  BEFORE UPDATE ON public.lms_course_resources 
  FOR EACH ROW EXECUTE FUNCTION update_lms_updated_at();

CREATE TRIGGER trg_lms_enrollments_updated 
  BEFORE UPDATE ON public.lms_enrollments 
  FOR EACH ROW EXECUTE FUNCTION update_lms_updated_at();

CREATE TRIGGER trg_lms_progress_updated 
  BEFORE UPDATE ON public.lms_progress 
  FOR EACH ROW EXECUTE FUNCTION update_lms_updated_at();

CREATE TRIGGER trg_lms_assessments_updated 
  BEFORE UPDATE ON public.lms_assessments 
  FOR EACH ROW EXECUTE FUNCTION update_lms_updated_at();

-- ============================================================
-- Helper Views
-- ============================================================

-- View: Course with enrollment stats
CREATE OR REPLACE VIEW vw_lms_course_stats AS
SELECT 
  c.id,
  c.tenant_id,
  c.code,
  c.name,
  c.status,
  c.level,
  c.duration_hours,
  COUNT(DISTINCT e.id) as enrollment_count,
  COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completion_count,
  CASE 
    WHEN COUNT(DISTINCT e.id) > 0 
    THEN ROUND((COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END)::NUMERIC / COUNT(DISTINCT e.id)::NUMERIC) * 100, 2)
    ELSE 0 
  END as completion_rate
FROM public.lms_courses c
LEFT JOIN public.lms_enrollments e ON c.id = e.course_id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.tenant_id, c.code, c.name, c.status, c.level, c.duration_hours;

-- View: User progress summary
CREATE OR REPLACE VIEW vw_lms_user_progress AS
SELECT 
  e.id as enrollment_id,
  e.tenant_id,
  e.user_id,
  e.course_id,
  c.name as course_name,
  e.status as enrollment_status,
  e.progress_percentage,
  COUNT(DISTINCT p.id) as lessons_started,
  COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as lessons_completed,
  SUM(p.time_spent_seconds) as total_time_spent_seconds
FROM public.lms_enrollments e
INNER JOIN public.lms_courses c ON e.course_id = c.id
LEFT JOIN public.lms_progress p ON e.id = p.enrollment_id
GROUP BY e.id, e.tenant_id, e.user_id, e.course_id, c.name, e.status, e.progress_percentage;

-- ============================================================
-- Documentation Entry
-- ============================================================
INSERT INTO public._gate_g_rls_intentions (table_name, policy_intent, rbac_roles, notes)
VALUES 
  ('lms_categories', 'Tenant isolation + CRUD based on permissions', 'admin, manager', 'Course categories management'),
  ('lms_courses', 'Tenant isolation + CRUD based on permissions', 'admin, manager, instructor', 'Course creation and management'),
  ('lms_course_modules', 'Tenant isolation + Linked to course', 'admin, manager, instructor', 'Course content structure'),
  ('lms_course_lessons', 'Tenant isolation + Linked to course', 'admin, manager, instructor', 'Individual lessons'),
  ('lms_course_resources', 'Tenant isolation + Linked to course', 'admin, manager, instructor', 'Course resources and files'),
  ('lms_enrollments', 'User can see own + admins can see all', 'admin, manager, user', 'User enrollments in courses'),
  ('lms_progress', 'User can see/update own + admins can see all', 'user, admin, manager', 'Learning progress tracking'),
  ('lms_assessments', 'Tenant isolation + CRUD based on permissions', 'admin, manager, instructor', 'Course assessments and quizzes'),
  ('lms_certificates', 'User can see own + admins can manage', 'admin, user', 'Course completion certificates')
ON CONFLICT (table_name) DO NOTHING;