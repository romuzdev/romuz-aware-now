-- Create LMS Courses table
CREATE TABLE IF NOT EXISTS public.lms_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  estimated_duration_minutes INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- Create LMS Modules table
CREATE TABLE IF NOT EXISTS public.lms_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lms_courses_tenant ON public.lms_courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lms_courses_status ON public.lms_courses(status);
CREATE INDEX IF NOT EXISTS idx_lms_modules_course ON public.lms_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_modules_position ON public.lms_modules(course_id, position);

-- Enable RLS
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lms_courses
CREATE POLICY "Users can view courses in their tenant"
  ON public.lms_courses FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create courses in their tenant"
  ON public.lms_courses FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update courses in their tenant"
  ON public.lms_courses FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete courses in their tenant"
  ON public.lms_courses FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

-- RLS Policies for lms_modules
CREATE POLICY "Users can view modules in their tenant"
  ON public.lms_modules FOR SELECT
  USING (course_id IN (
    SELECT id FROM public.lms_courses WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can create modules in their tenant"
  ON public.lms_modules FOR INSERT
  WITH CHECK (course_id IN (
    SELECT id FROM public.lms_courses WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can update modules in their tenant"
  ON public.lms_modules FOR UPDATE
  USING (course_id IN (
    SELECT id FROM public.lms_courses WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete modules in their tenant"
  ON public.lms_modules FOR DELETE
  USING (course_id IN (
    SELECT id FROM public.lms_courses WHERE tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lms_courses_updated_at
  BEFORE UPDATE ON public.lms_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lms_modules_updated_at
  BEFORE UPDATE ON public.lms_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();