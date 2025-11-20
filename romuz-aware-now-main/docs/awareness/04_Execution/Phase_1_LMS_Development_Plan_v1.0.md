# Phase 1: LMS Development - خطة التنفيذ التفصيلية
## Learning Management System - Implementation Plan v1.0

> **المدة:** 4 أسابيع (20 يوم عمل)  
> **الأولوية:** Priority 1 - High  
> **الحالة:** Ready to Start  
> **المرجع:** Development Master Plan v1.0

---

## 📋 جدول المحتويات

1. [نظرة عامة Overview](#1-نظرة-عامة-overview)
2. [الأهداف والمخرجات Goals & Deliverables](#2-الأهداف-والمخرجات-goals--deliverables)
3. [Week 1: Core Setup & Database](#3-week-1-core-setup--database)
4. [Week 2: Course Management & Content](#4-week-2-course-management--content)
5. [Week 3: Enrollment & Progress](#5-week-3-enrollment--progress)
6. [Week 4: Assessments & Reporting](#6-week-4-assessments--reporting)
7. [Data Model التصميم الكامل](#7-data-model-التصميم-الكامل)
8. [Integration Architecture](#8-integration-architecture)
9. [UI/UX Components Structure](#9-uiux-components-structure)
10. [Security & Permissions](#10-security--permissions)
11. [Testing Strategy](#11-testing-strategy)
12. [Success Metrics](#12-success-metrics)

---

## 1. نظرة عامة Overview

### 1.1 ما هو LMS؟

**Learning Management System** - نظام إدارة التعلم الإلكتروني الذي يوفر:

- 📚 **إدارة الدورات التدريبية** - إنشاء وإدارة محتوى تدريبي منظم
- 👥 **إدارة المتدربين** - تسجيل وتتبع تقدم المتعلمين
- 📊 **التقييم والاختبارات** - اختبارات تفاعلية مع تصحيح آلي
- 📈 **التحليلات والتقارير** - قياس فعالية التدريب والتقدم
- 🎓 **الشهادات** - إصدار شهادات إتمام تلقائية

### 1.2 الارتباطات مع التطبيقات الأخرى

```
LMS ←→ Awareness Campaigns
  ↓ عند إتمام الحملة → توجيه للدورة ذات الصلة
  ↓ عند إتمام الدورة → تحديث حالة الحملة

LMS ←→ Phishing Simulation
  ↓ عند فشل التصيد → تعيين دورة تدريبية إلزامية
  ↓ عند إتمام الدورة → تحسين Risk Score

LMS ←→ Policies
  ↓ سياسة جديدة → دورة تدريبية مطلوبة
  ↓ إتمام الدورة → الإقرار على السياسة

LMS ←→ Objectives & KPIs
  ↓ تتبع KPI → نسبة إتمام الدورات
  ↓ هدف استراتيجي → برنامج تدريبي مرتبط

LMS ←→ Analytics
  ↓ جميع البيانات → تحليلات شاملة
  ↓ Dashboards → مؤشرات الأداء التدريبي
```

### 1.3 المستخدمون الرئيسيون

| الدور | الصلاحيات | الاستخدام |
|-------|-----------|-----------|
| **LMS Admin** | إدارة كاملة للنظام | إعداد وإدارة LMS |
| **Instructor** | إنشاء وإدارة الدورات | تطوير المحتوى التدريبي |
| **Training Manager** | تعيين وتتبع التدريبات | إدارة برامج التدريب |
| **Learner** | الوصول للدورات المسجل بها | التعلم والاختبارات |
| **Manager** | عرض تقدم فريقه | متابعة تدريب الفريق |
| **Auditor** | عرض التقارير | مراجعة الامتثال التدريبي |

---

## 2. الأهداف والمخرجات Goals & Deliverables

### 2.1 الأهداف الاستراتيجية

✅ **بناء نظام LMS متكامل** يغطي كل دورة حياة التدريب  
✅ **تكامل سلس** مع Awareness، Phishing، Policies  
✅ **تجربة مستخدم ممتازة** لكل من المدربين والمتعلمين  
✅ **تحليلات قوية** لقياس فعالية التدريب  
✅ **أمان وصلاحيات** محكمة مع Multi-tenancy كامل  

### 2.2 المخرجات التقنية

#### Week 1 Deliverables
- [ ] **Database Schema** - 9 جداول مع RLS كاملة
- [ ] **Integration Layer** - 9 ملفات integration
- [ ] **Type Definitions** - 9 ملفات types مع Zod validation
- [ ] **Core Functions** - جميع CRUD operations

#### Week 2 Deliverables
- [ ] **Course Management UI** - 7 مكونات رئيسية
- [ ] **Module & Lesson UI** - 9 مكونات
- [ ] **Resource Library** - 5 مكونات
- [ ] **Course Pages** - 4 صفحات رئيسية

#### Week 3 Deliverables
- [ ] **Enrollment System** - 6 مكونات + bulk operations
- [ ] **Progress Tracking** - 5 مكونات
- [ ] **Certificates** - 4 مكونات + PDF generation
- [ ] **Student Interface** - Course player + My Learning

#### Week 4 Deliverables
- [ ] **Assessment Builder** - 6 مكونات
- [ ] **Question Types** - 4 أنواع questions
- [ ] **Reporting & Analytics** - 6 مكونات
- [ ] **LMS Dashboard** - Complete analytics view

### 2.3 Success Criteria

**معايير النجاح التقنية:**
- ✅ جميع الجداول تحتوي على RLS policies صحيحة
- ✅ 100% type safety مع TypeScript
- ✅ Zero console errors في production
- ✅ Responsive على جميع الأحجام (mobile, tablet, desktop)
- ✅ RTL support كامل للعربية
- ✅ Loading states و Error handling في كل component

**معايير النجاح الوظيفية:**
- ✅ Instructor يمكنه إنشاء دورة كاملة في 10 دقائق
- ✅ Admin يمكنه تسجيل 100 متدرب في دورة في أقل من دقيقة
- ✅ Learner يمكنه إتمام درس والانتقال للتالي بسلاسة
- ✅ Assessment system يعمل مع 4 أنواع أسئلة على الأقل
- ✅ Certificates تُنشأ وتُحفظ تلقائياً عند الإتمام

---

## 3. Week 1: Core Setup & Database

### 📆 Timeline: Days 1-5

### 🎯 الهدف الأساسي
بناء الأساس الكامل: Database Schema، RLS Policies، Integration Layer، Types & Validation

---

### Day 1-2: Database Schema & RLS

#### 3.1 Database Tables (9 جداول)

##### **Table 1: lms_categories**
```sql
-- Purpose: تصنيف الدورات التدريبية (Security, Compliance, Technical, Soft Skills, etc.)

CREATE TABLE public.lms_categories (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy (REQUIRED)
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Core Fields
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255), -- Arabic translation
  description TEXT,
  description_ar TEXT,
  
  -- Hierarchy Support (للتصنيفات الفرعية)
  parent_id UUID REFERENCES public.lms_categories(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 0, -- 0 = root, 1 = child, etc.
  
  -- Display & Ordering
  icon VARCHAR(100), -- lucide icon name
  color VARCHAR(50), -- hex color for UI
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT uq_lms_categories_tenant_name UNIQUE (tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.lms_categories ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lms_categories_tenant_id ON public.lms_categories(tenant_id);
CREATE INDEX idx_lms_categories_parent_id ON public.lms_categories(parent_id);
CREATE INDEX idx_lms_categories_active ON public.lms_categories(tenant_id, is_active);
CREATE INDEX idx_lms_categories_position ON public.lms_categories(tenant_id, parent_id, position);

-- RLS Policies
CREATE POLICY "Users can view categories in their tenant"
  ON public.lms_categories FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.get_user_metadata()));

CREATE POLICY "Admins can manage categories"
  ON public.lms_categories FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND check_user_permission('lms.categories.manage')
  );

-- Trigger for updated_at
CREATE TRIGGER set_lms_categories_updated_at
  BEFORE UPDATE ON public.lms_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.lms_categories IS 'LMS: Course categories and sub-categories';
COMMENT ON COLUMN public.lms_categories.parent_id IS 'Enables hierarchical categories';
COMMENT ON COLUMN public.lms_categories.level IS 'Category depth: 0=root, 1=sub, 2=sub-sub';
```

---

##### **Table 2: lms_courses**
```sql
-- Purpose: الدورات التدريبية الرئيسية

CREATE TABLE public.lms_courses (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Core Identification
  code VARCHAR(50) NOT NULL, -- Unique course code (e.g., SEC-101)
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  
  -- Categorization
  category_id UUID REFERENCES public.lms_categories(id) ON DELETE SET NULL,
  
  -- Instructor
  instructor_id UUID, -- Reference to users (no FK to avoid auth schema)
  instructor_name VARCHAR(255), -- Denormalized for performance
  
  -- Course Details
  level VARCHAR(20) NOT NULL DEFAULT 'beginner' 
    CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  duration_hours INTEGER, -- Estimated total duration
  
  -- Media
  thumbnail_url TEXT,
  trailer_video_url TEXT,
  
  -- Publishing
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  
  -- Enrollment Settings
  max_enrollments INTEGER, -- NULL = unlimited
  enrollment_start_date TIMESTAMPTZ,
  enrollment_end_date TIMESTAMPTZ,
  allow_self_enrollment BOOLEAN DEFAULT false,
  
  -- Completion Settings
  completion_criteria JSONB DEFAULT '{
    "require_all_modules": true,
    "require_assessment": false,
    "min_assessment_score": 70
  }'::jsonb,
  
  -- Metadata (Flexible structure for future extensions)
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Example metadata structure:
  -- {
  --   "prerequisites": ["course-uuid-1", "course-uuid-2"],
  --   "tags": ["security", "awareness", "compliance"],
  --   "learning_objectives": ["Objective 1", "Objective 2"],
  --   "target_audience": "All employees",
  --   "certification_enabled": true,
  --   "certificate_template_id": "template-uuid"
  -- }
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  -- Constraints
  CONSTRAINT uq_lms_courses_tenant_code UNIQUE (tenant_id, code),
  CONSTRAINT chk_lms_courses_enrollment_dates CHECK (
    enrollment_start_date IS NULL OR 
    enrollment_end_date IS NULL OR 
    enrollment_end_date >= enrollment_start_date
  )
);

-- Enable RLS
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lms_courses_tenant_id ON public.lms_courses(tenant_id);
CREATE INDEX idx_lms_courses_status ON public.lms_courses(tenant_id, status) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_lms_courses_category ON public.lms_courses(category_id);
CREATE INDEX idx_lms_courses_instructor ON public.lms_courses(instructor_id);
CREATE INDEX idx_lms_courses_created_at ON public.lms_courses(created_at DESC);
CREATE INDEX idx_lms_courses_deleted_at ON public.lms_courses(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Full-text search
CREATE INDEX idx_lms_courses_search ON public.lms_courses 
  USING gin(to_tsvector('english', 
    name || ' ' || COALESCE(description, '') || ' ' || code
  )) WHERE deleted_at IS NULL;

-- RLS Policies
CREATE POLICY "Users can view published courses in their tenant"
  ON public.lms_courses FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND deleted_at IS NULL
    AND (
      status = 'published'
      OR instructor_id = auth.uid()
      OR check_user_permission('lms.courses.view_all')
    )
  );

CREATE POLICY "Instructors can create courses"
  ON public.lms_courses FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND check_user_permission('lms.courses.create')
  );

CREATE POLICY "Instructors can update their courses"
  ON public.lms_courses FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND deleted_at IS NULL
    AND (
      instructor_id = auth.uid()
      OR check_user_permission('lms.courses.edit_all')
    )
  );

CREATE POLICY "Admins can delete courses"
  ON public.lms_courses FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND check_user_permission('lms.courses.delete')
  );

-- Triggers
CREATE TRIGGER set_lms_courses_updated_at
  BEFORE UPDATE ON public.lms_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set published_at when status changes to 'published'
CREATE OR REPLACE FUNCTION set_lms_course_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_lms_course_published_at_trigger
  BEFORE UPDATE ON public.lms_courses
  FOR EACH ROW EXECUTE FUNCTION set_lms_course_published_at();

-- Comments
COMMENT ON TABLE public.lms_courses IS 'LMS: Training courses catalog';
COMMENT ON COLUMN public.lms_courses.completion_criteria IS 'JSON object defining what is required to complete the course';
COMMENT ON COLUMN public.lms_courses.metadata IS 'Flexible JSON field for course metadata (prerequisites, tags, objectives, etc.)';
```

---

##### **Table 3: lms_course_modules**
```sql
-- Purpose: وحدات/أقسام الدورة (Module = مجموعة من الدروس)

CREATE TABLE public.lms_course_modules (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Parent Course (CASCADE delete)
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  
  -- Content
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  
  -- Ordering & Requirements
  position INTEGER NOT NULL, -- Display order (1, 2, 3...)
  is_required BOOLEAN DEFAULT true, -- Must complete to finish course?
  
  -- Duration
  estimated_minutes INTEGER, -- Estimated time to complete module
  
  -- Unlock Logic (Sequential vs Open)
  unlock_mode VARCHAR(20) DEFAULT 'sequential'
    CHECK (unlock_mode IN ('sequential', 'open', 'scheduled')),
  unlock_after_module_id UUID REFERENCES public.lms_course_modules(id) ON DELETE SET NULL,
  available_from TIMESTAMPTZ, -- For scheduled unlock
  available_until TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "learning_objectives": ["Objective 1"],
  --   "resources": [{"name": "PDF Guide", "url": "..."}],
  --   "icon": "book-open"
  -- }
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT uq_lms_course_modules_position UNIQUE (course_id, position)
);

-- Enable RLS
ALTER TABLE public.lms_course_modules ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lms_course_modules_course_id ON public.lms_course_modules(course_id);
CREATE INDEX idx_lms_course_modules_position ON public.lms_course_modules(course_id, position);

-- RLS Policies
CREATE POLICY "Users can view modules of accessible courses"
  ON public.lms_course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lms_courses
      WHERE lms_courses.id = course_id
      AND lms_courses.tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    )
  );

CREATE POLICY "Instructors can manage course modules"
  ON public.lms_course_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lms_courses
      WHERE lms_courses.id = course_id
      AND lms_courses.tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
      AND (
        lms_courses.instructor_id = auth.uid()
        OR check_user_permission('lms.courses.edit_all')
      )
    )
  );

-- Triggers
CREATE TRIGGER set_lms_course_modules_updated_at
  BEFORE UPDATE ON public.lms_course_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.lms_course_modules IS 'LMS: Course modules/chapters';
COMMENT ON COLUMN public.lms_course_modules.unlock_mode IS 'sequential: unlock after previous, open: all unlocked, scheduled: unlock by date';
```

---

##### **Table 4: lms_course_lessons**
```sql
-- Purpose: الدروس الفردية داخل كل Module

CREATE TABLE public.lms_course_lessons (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Parent Module (CASCADE delete)
  module_id UUID NOT NULL REFERENCES public.lms_course_modules(id) ON DELETE CASCADE,
  
  -- Denormalized course_id for performance
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  
  -- Content
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  
  -- Content Type
  content_type VARCHAR(30) NOT NULL DEFAULT 'text'
    CHECK (content_type IN (
      'text',        -- Rich text/HTML
      'video',       -- Video (YouTube, Vimeo, uploaded)
      'pdf',         -- PDF document
      'scorm',       -- SCORM package
      'interactive', -- H5P, interactive content
      'quiz',        -- Embedded quiz
      'external'     -- External link
    )),
  
  -- Content Storage (based on type)
  content TEXT, -- HTML content for 'text' type
  content_url TEXT, -- Video URL, PDF path, SCORM package URL, etc.
  embed_code TEXT, -- For external embeds
  
  -- Ordering & Requirements
  position INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  
  -- Duration
  estimated_minutes INTEGER,
  
  -- Completion Tracking
  completion_criteria VARCHAR(30) DEFAULT 'viewed'
    CHECK (completion_criteria IN (
      'viewed',           -- Just open the lesson
      'time_spent',       -- Spend X minutes
      'interaction',      -- Complete interaction (for SCORM)
      'quiz_passed'       -- Pass embedded quiz
    )),
  min_time_seconds INTEGER, -- For time_spent criteria
  
  -- Resources
  has_downloadable BOOLEAN DEFAULT false,
  downloadable_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "video_duration_seconds": 600,
  --   "transcript": "...",
  --   "captions_url": "...",
  --   "thumbnail_url": "...",
  --   "scorm_config": {...}
  -- }
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT uq_lms_course_lessons_position UNIQUE (module_id, position)
);

-- Enable RLS
ALTER TABLE public.lms_course_lessons ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lms_course_lessons_module_id ON public.lms_course_lessons(module_id);
CREATE INDEX idx_lms_course_lessons_course_id ON public.lms_course_lessons(course_id);
CREATE INDEX idx_lms_course_lessons_position ON public.lms_course_lessons(module_id, position);
CREATE INDEX idx_lms_course_lessons_type ON public.lms_course_lessons(content_type);

-- RLS Policies
CREATE POLICY "Users can view lessons of accessible courses"
  ON public.lms_course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lms_courses
      WHERE lms_courses.id = course_id
      AND lms_courses.tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    )
  );

CREATE POLICY "Instructors can manage course lessons"
  ON public.lms_course_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lms_courses
      WHERE lms_courses.id = course_id
      AND lms_courses.tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
      AND (
        lms_courses.instructor_id = auth.uid()
        OR check_user_permission('lms.courses.edit_all')
      )
    )
  );

-- Triggers
CREATE TRIGGER set_lms_course_lessons_updated_at
  BEFORE UPDATE ON public.lms_course_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.lms_course_lessons IS 'LMS: Individual lessons within modules';
COMMENT ON COLUMN public.lms_course_lessons.content_type IS 'Type of lesson content: text, video, pdf, scorm, interactive, quiz, external';
COMMENT ON COLUMN public.lms_course_lessons.completion_criteria IS 'What is required to mark this lesson as complete';
```

---

##### **Table 5: lms_course_resources**
```sql
-- Purpose: المصادر والملفات الإضافية المرفقة بالدورة

CREATE TABLE public.lms_course_resources (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Parent (Course level or Module level)
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.lms_course_modules(id) ON DELETE CASCADE,
  -- If module_id IS NULL → course-level resource
  -- If module_id IS NOT NULL → module-specific resource
  
  -- Resource Details
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  
  -- Resource Type
  resource_type VARCHAR(30) NOT NULL
    CHECK (resource_type IN (
      'document',    -- PDF, Word, Excel, etc.
      'video',       -- Video file
      'audio',       -- Audio file
      'link',        -- External URL
      'attachment',  -- Generic file
      'image'        -- Image file
    )),
  
  -- File Information
  file_url TEXT, -- Storage URL (Supabase Storage)
  external_url TEXT, -- For 'link' type
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  
  -- Access Control
  is_downloadable BOOLEAN DEFAULT true,
  requires_enrollment BOOLEAN DEFAULT true, -- Must be enrolled to access?
  
  -- Ordering
  position INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT chk_lms_course_resources_url CHECK (
    file_url IS NOT NULL OR external_url IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE public.lms_course_resources ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lms_course_resources_course_id ON public.lms_course_resources(course_id);
CREATE INDEX idx_lms_course_resources_module_id ON public.lms_course_resources(module_id);
CREATE INDEX idx_lms_course_resources_type ON public.lms_course_resources(resource_type);

-- RLS Policies
CREATE POLICY "Users can view resources of accessible courses"
  ON public.lms_course_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lms_courses
      WHERE lms_courses.id = course_id
      AND lms_courses.tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
      AND (
        NOT requires_enrollment
        OR EXISTS (
          SELECT 1 FROM lms_enrollments
          WHERE lms_enrollments.course_id = lms_courses.id
          AND lms_enrollments.user_id = auth.uid()
          AND lms_enrollments.status IN ('enrolled', 'in_progress', 'completed')
        )
      )
    )
  );

CREATE POLICY "Instructors can manage course resources"
  ON public.lms_course_resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lms_courses
      WHERE lms_courses.id = course_id
      AND lms_courses.tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
      AND (
        lms_courses.instructor_id = auth.uid()
        OR check_user_permission('lms.courses.edit_all')
      )
    )
  );

-- Triggers
CREATE TRIGGER set_lms_course_resources_updated_at
  BEFORE UPDATE ON public.lms_course_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.lms_course_resources IS 'LMS: Course resources and downloadable files';
COMMENT ON COLUMN public.lms_course_resources.module_id IS 'NULL = course-level resource, NOT NULL = module-specific resource';
```

---

##### **Table 6: lms_enrollments**
```sql
-- Purpose: تسجيل المتدربين في الدورات

CREATE TABLE public.lms_enrollments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Course & User
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Reference to auth user
  
  -- Enrollment Details
  enrollment_type VARCHAR(20) DEFAULT 'assigned'
    CHECK (enrollment_type IN ('self', 'assigned', 'mandatory', 'prerequisite')),
  enrolled_by UUID, -- Admin who enrolled (NULL for self-enrollment)
  
  -- Dates
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ, -- When first lesson was accessed
  completed_at TIMESTAMPTZ, -- When course was completed
  due_date TIMESTAMPTZ, -- Deadline (NULL = no deadline)
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'enrolled'
    CHECK (status IN (
      'enrolled',      -- Enrolled but not started
      'in_progress',   -- Started but not completed
      'completed',     -- Successfully completed
      'withdrawn',     -- User withdrew
      'expired'        -- Past due date without completion
    )),
  
  -- Progress Tracking
  progress_percentage NUMERIC(5,2) DEFAULT 0.00 
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_lessons_count INTEGER DEFAULT 0,
  total_lessons_count INTEGER, -- Cached from course structure
  
  -- Assessment
  assessment_score NUMERIC(5,2), -- Final assessment score (0-100)
  assessment_attempts INTEGER DEFAULT 0,
  assessment_passed BOOLEAN,
  
  -- Time Tracking
  total_time_spent_seconds INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  last_lesson_id UUID, -- Bookmark: last accessed lesson
  
  -- Certificate
  certificate_issued BOOLEAN DEFAULT false,
  certificate_id UUID, -- Link to lms_certificates
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "notes": "User notes",
  --   "assigned_by_campaign_id": "uuid",
  --   "assigned_by_policy_id": "uuid",
  --   "reminder_sent_count": 2,
  --   "last_reminder_at": "2024-01-15T10:00:00Z"
  -- }
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT uq_lms_enrollments_user_course UNIQUE (tenant_id, course_id, user_id)
);

-- Enable RLS
ALTER TABLE public.lms_enrollments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lms_enrollments_course_id ON public.lms_enrollments(course_id);
CREATE INDEX idx_lms_enrollments_user_id ON public.lms_enrollments(user_id);
CREATE INDEX idx_lms_enrollments_status ON public.lms_enrollments(tenant_id, status);
CREATE INDEX idx_lms_enrollments_due_date ON public.lms_enrollments(due_date) 
  WHERE due_date IS NOT NULL AND status NOT IN ('completed', 'withdrawn');
CREATE INDEX idx_lms_enrollments_user_status ON public.lms_enrollments(user_id, status);
CREATE INDEX idx_lms_enrollments_completed ON public.lms_enrollments(completed_at DESC) 
  WHERE completed_at IS NOT NULL;

-- RLS Policies
CREATE POLICY "Users can view their own enrollments"
  ON public.lms_enrollments FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND (
      user_id = auth.uid()
      OR check_user_permission('lms.enrollments.view_all')
    )
  );

CREATE POLICY "Admins can manage enrollments"
  ON public.lms_enrollments FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND check_user_permission('lms.enrollments.manage')
  );

-- Triggers
CREATE TRIGGER set_lms_enrollments_updated_at
  BEFORE UPDATE ON public.lms_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update status based on dates
CREATE OR REPLACE FUNCTION update_lms_enrollment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Set to in_progress when started
  IF NEW.started_at IS NOT NULL AND OLD.started_at IS NULL THEN
    NEW.status = 'in_progress';
  END IF;
  
  -- Set to completed when completed_at is set
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    NEW.status = 'completed';
  END IF;
  
  -- Set to expired if past due_date and not completed
  IF NEW.due_date IS NOT NULL 
     AND NEW.due_date < now() 
     AND NEW.status NOT IN ('completed', 'withdrawn') THEN
    NEW.status = 'expired';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lms_enrollment_status_trigger
  BEFORE UPDATE ON public.lms_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_lms_enrollment_status();

-- Comments
COMMENT ON TABLE public.lms_enrollments IS 'LMS: User enrollments in courses';
COMMENT ON COLUMN public.lms_enrollments.enrollment_type IS 'How the user was enrolled: self-registered, assigned by admin, mandatory, or prerequisite';
COMMENT ON COLUMN public.lms_enrollments.progress_percentage IS 'Calculated completion percentage (0-100)';
```

---

##### **Table 7: lms_progress**
```sql
-- Purpose: تتبع تقدم المتدرب في كل درس

CREATE TABLE public.lms_progress (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- References (denormalized for query performance)
  enrollment_id UUID NOT NULL REFERENCES public.lms_enrollments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.lms_course_modules(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lms_course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Denormalized from enrollment
  
  -- Progress Status
  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  
  -- Time Tracking
  time_spent_seconds INTEGER DEFAULT 0,
  first_accessed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Completion Details
  completion_percentage INTEGER DEFAULT 0 
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  completion_method VARCHAR(30),
    -- 'viewed', 'time_spent', 'quiz_passed', 'interaction_completed'
  
  -- Bookmarking (for video lessons)
  current_position_seconds INTEGER DEFAULT 0, -- Video timestamp
  
  -- Interaction Data (for SCORM, H5P, etc.)
  interaction_data JSONB DEFAULT '{}'::jsonb,
  -- Example for SCORM:
  -- {
  --   "cmi.core.lesson_status": "completed",
  --   "cmi.core.score.raw": 85,
  --   "cmi.suspend_data": "..."
  -- }
  
  -- Notes & Highlights
  user_notes TEXT,
  highlights JSONB, -- Array of highlighted text positions
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT uq_lms_progress_enrollment_lesson UNIQUE (enrollment_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.lms_progress ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lms_progress_enrollment_id ON public.lms_progress(enrollment_id);
CREATE INDEX idx_lms_progress_user_id ON public.lms_progress(user_id);
CREATE INDEX idx_lms_progress_course_id ON public.lms_progress(course_id);
CREATE INDEX idx_lms_progress_lesson_id ON public.lms_progress(lesson_id);
CREATE INDEX idx_lms_progress_status ON public.lms_progress(user_id, status);
CREATE INDEX idx_lms_progress_completed ON public.lms_progress(completed_at DESC) 
  WHERE completed_at IS NOT NULL;

-- RLS Policies
CREATE POLICY "Users can view their own progress"
  ON public.lms_progress FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND (
      user_id = auth.uid()
      OR check_user_permission('lms.progress.view_all')
    )
  );

CREATE POLICY "Users can update their own progress"
  ON public.lms_progress FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can modify their own progress"
  ON public.lms_progress FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND user_id = auth.uid()
  );

-- Triggers
CREATE TRIGGER set_lms_progress_updated_at
  BEFORE UPDATE ON public.lms_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update enrollment progress when lesson progress changes
CREATE OR REPLACE FUNCTION update_enrollment_progress_on_lesson_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_completed_count INTEGER;
  v_total_count INTEGER;
  v_progress_pct NUMERIC;
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Count completed lessons
    SELECT COUNT(*) INTO v_completed_count
    FROM lms_progress
    WHERE enrollment_id = NEW.enrollment_id
    AND status = 'completed';
    
    -- Get total lessons count
    SELECT COUNT(*) INTO v_total_count
    FROM lms_course_lessons
    WHERE course_id = NEW.course_id;
    
    -- Calculate percentage
    IF v_total_count > 0 THEN
      v_progress_pct = (v_completed_count::NUMERIC / v_total_count::NUMERIC) * 100;
    ELSE
      v_progress_pct = 0;
    END IF;
    
    -- Update enrollment
    UPDATE lms_enrollments
    SET 
      progress_percentage = v_progress_pct,
      completed_lessons_count = v_completed_count,
      total_lessons_count = v_total_count,
      last_accessed_at = now(),
      last_lesson_id = NEW.lesson_id,
      started_at = COALESCE(started_at, now()),
      updated_at = now()
    WHERE id = NEW.enrollment_id;
    
    -- Check if course is complete
    IF v_progress_pct >= 100 THEN
      UPDATE lms_enrollments
      SET 
        completed_at = now(),
        status = 'completed'
      WHERE id = NEW.enrollment_id
      AND completed_at IS NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollment_on_lesson_complete
  AFTER INSERT OR UPDATE ON public.lms_progress
  FOR EACH ROW EXECUTE FUNCTION update_enrollment_progress_on_lesson_complete();

-- Comments
COMMENT ON TABLE public.lms_progress IS 'LMS: Detailed progress tracking for each lesson';
COMMENT ON COLUMN public.lms_progress.interaction_data IS 'SCORM/xAPI data or other interactive content tracking';
COMMENT ON COLUMN public.lms_progress.current_position_seconds IS 'Video bookmark position for resume';
```

---

##### **Table 8: lms_assessments**
```sql
-- Purpose: الاختبارات والتقييمات

CREATE TABLE public.lms_assessments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Parent Course
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.lms_course_modules(id) ON DELETE SET NULL,
  -- If module_id IS NULL → final course assessment
  -- If module_id IS NOT NULL → module quiz
  
  -- Assessment Details
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  
  -- Type
  assessment_type VARCHAR(20) NOT NULL DEFAULT 'quiz'
    CHECK (assessment_type IN (
      'quiz',        -- Multiple choice, T/F, short questions
      'exam',        -- Formal proctored exam
      'assignment',  -- Upload assignment
      'survey',      -- Feedback survey (no grading)
      'practice'     -- Practice test (doesn't count toward grade)
    )),
  
  -- Passing Criteria
  passing_score NUMERIC(5,2), -- 0-100 (NULL = no passing requirement)
  is_required BOOLEAN DEFAULT false, -- Must pass to complete course?
  
  -- Timing
  time_limit_minutes INTEGER, -- NULL = untimed
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  -- Attempts
  max_attempts INTEGER, -- NULL = unlimited
  retry_delay_minutes INTEGER, -- Wait time between attempts
  
  -- Question Settings
  total_questions INTEGER DEFAULT 0,
  randomize_questions BOOLEAN DEFAULT false,
  randomize_answers BOOLEAN DEFAULT false,
  questions_per_page INTEGER DEFAULT 1,
  
  -- Feedback Settings
  show_correct_answers BOOLEAN DEFAULT true,
  show_correct_answers_after VARCHAR(20) DEFAULT 'submit'
    CHECK (show_correct_answers_after IN ('immediately', 'submit', 'pass', 'never')),
  show_score BOOLEAN DEFAULT true,
  
  -- Ordering
  position INTEGER DEFAULT 0,
  
  -- Questions Data (JSONB Array)
  questions JSONB DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   {
  --     "id": "q1",
  --     "type": "multiple_choice",
  --     "question": "What is...?",
  --     "question_ar": "ما هو...؟",
  --     "points": 10,
  --     "options": [
  --       {"id": "a", "text": "Option A", "text_ar": "الخيار أ", "is_correct": true},
  --       {"id": "b", "text": "Option B", "text_ar": "الخيار ب", "is_correct": false}
  --     ],
  --     "explanation": "Because...",
  --     "explanation_ar": "لأن..."
  --   },
  --   {
  --     "id": "q2",
  --     "type": "true_false",
  --     "question": "True or false...",
  --     "points": 5,
  --     "correct_answer": true,
  --     "explanation": "..."
  --   },
  --   {
  --     "id": "q3",
  --     "type": "essay",
  --     "question": "Explain...",
  --     "points": 20,
  --     "max_words": 500,
  --     "requires_manual_grading": true
  --   }
  -- ]
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT chk_lms_assessments_availability CHECK (
    available_from IS NULL OR 
    available_until IS NULL OR 
    available_until >= available_from
  )
);

-- Enable RLS
ALTER TABLE public.lms_assessments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lms_assessments_course_id ON public.lms_assessments(course_id);
CREATE INDEX idx_lms_assessments_module_id ON public.lms_assessments(module_id);
CREATE INDEX idx_lms_assessments_type ON public.lms_assessments(assessment_type);

-- RLS Policies
CREATE POLICY "Users can view assessments of accessible courses"
  ON public.lms_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lms_courses
      WHERE lms_courses.id = course_id
      AND lms_courses.tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    )
  );

CREATE POLICY "Instructors can manage assessments"
  ON public.lms_assessments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lms_courses
      WHERE lms_courses.id = course_id
      AND lms_courses.tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
      AND (
        lms_courses.instructor_id = auth.uid()
        OR check_user_permission('lms.assessments.manage')
      )
    )
  );

-- Triggers
CREATE TRIGGER set_lms_assessments_updated_at
  BEFORE UPDATE ON public.lms_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update total_questions count
CREATE OR REPLACE FUNCTION update_assessment_questions_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_questions = jsonb_array_length(NEW.questions);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessment_questions_count_trigger
  BEFORE INSERT OR UPDATE OF questions ON public.lms_assessments
  FOR EACH ROW EXECUTE FUNCTION update_assessment_questions_count();

-- Comments
COMMENT ON TABLE public.lms_assessments IS 'LMS: Course assessments and quizzes';
COMMENT ON COLUMN public.lms_assessments.questions IS 'JSONB array of question objects with answers and explanations';
COMMENT ON COLUMN public.lms_assessments.show_correct_answers_after IS 'When to show correct answers: immediately, after submit, after pass, or never';
```

---

##### **Table 9: lms_certificates**
```sql
-- Purpose: الشهادات الصادرة للمتدربين

CREATE TABLE public.lms_certificates (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- References
  enrollment_id UUID NOT NULL REFERENCES public.lms_enrollments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  
  -- Certificate Identification
  certificate_number VARCHAR(100) NOT NULL, -- Unique certificate ID (e.g., LMS-2024-001234)
  
  -- Certificate Data
  user_full_name VARCHAR(255) NOT NULL, -- Cached for PDF generation
  course_name VARCHAR(255) NOT NULL,
  course_name_ar VARCHAR(255),
  
  -- Dates
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  
  -- Template
  template_id UUID, -- Reference to certificate template (future)
  template_data JSONB DEFAULT '{}'::jsonb,
  -- Template variables:
  -- {
  --   "completion_date": "2024-01-15",
  --   "score": 95,
  --   "duration_hours": 10,
  --   "instructor_name": "John Doe",
  --   "instructor_signature_url": "...",
  --   "organization_logo_url": "...",
  --   "qr_code_data": "verify_url",
  --   "custom_fields": {...}
  -- }
  
  -- Generated Certificate
  certificate_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Complete certificate info for PDF generation:
  -- {
  --   "user": {...},
  --   "course": {...},
  --   "completion": {...},
  --   "organization": {...}
  -- }
  
  file_url TEXT, -- Generated PDF URL (Supabase Storage)
  file_generated_at TIMESTAMPTZ,
  
  -- Verification
  verification_code VARCHAR(100), -- For public verification
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  revoke_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT uq_lms_certificates_number UNIQUE (tenant_id, certificate_number),
  CONSTRAINT uq_lms_certificates_enrollment UNIQUE (enrollment_id)
);

-- Enable RLS
ALTER TABLE public.lms_certificates ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_lms_certificates_user_id ON public.lms_certificates(user_id);
CREATE INDEX idx_lms_certificates_course_id ON public.lms_certificates(course_id);
CREATE INDEX idx_lms_certificates_number ON public.lms_certificates(certificate_number);
CREATE INDEX idx_lms_certificates_verification ON public.lms_certificates(verification_code);
CREATE INDEX idx_lms_certificates_issued ON public.lms_certificates(issued_at DESC);
CREATE INDEX idx_lms_certificates_expires ON public.lms_certificates(expires_at) 
  WHERE expires_at IS NOT NULL AND is_revoked = false;

-- RLS Policies
CREATE POLICY "Users can view their own certificates"
  ON public.lms_certificates FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND (
      user_id = auth.uid()
      OR check_user_permission('lms.certificates.view_all')
    )
  );

CREATE POLICY "System can create certificates"
  ON public.lms_certificates FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND check_user_permission('lms.certificates.issue')
  );

CREATE POLICY "Admins can revoke certificates"
  ON public.lms_certificates FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM auth.get_user_metadata())
    AND check_user_permission('lms.certificates.revoke')
  );

-- Function: Generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year VARCHAR(4);
  v_sequence INTEGER;
  v_cert_number VARCHAR(100);
BEGIN
  v_year = EXTRACT(YEAR FROM now())::VARCHAR;
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(certificate_number FROM 'LMS-' || v_year || '-(.*)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM lms_certificates
  WHERE tenant_id = NEW.tenant_id
  AND certificate_number LIKE 'LMS-' || v_year || '-%';
  
  -- Format: LMS-2024-001234
  v_cert_number = 'LMS-' || v_year || '-' || LPAD(v_sequence::VARCHAR, 6, '0');
  
  NEW.certificate_number = v_cert_number;
  
  -- Generate verification code (8-char alphanumeric)
  NEW.verification_code = UPPER(
    SUBSTRING(MD5(NEW.id::TEXT || now()::TEXT) FROM 1 FOR 8)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_certificate_number_trigger
  BEFORE INSERT ON public.lms_certificates
  FOR EACH ROW
  WHEN (NEW.certificate_number IS NULL)
  EXECUTE FUNCTION generate_certificate_number();

-- Comments
COMMENT ON TABLE public.lms_certificates IS 'LMS: Issued certificates for course completions';
COMMENT ON COLUMN public.lms_certificates.certificate_number IS 'Unique certificate ID (format: LMS-YYYY-NNNNNN)';
COMMENT ON COLUMN public.lms_certificates.verification_code IS '8-character code for public verification';
COMMENT ON COLUMN public.lms_certificates.template_data IS 'Variables to populate certificate template';
```

---

### 3.2 Helper Functions & Views

```sql
-- Function: Calculate course completion percentage
CREATE OR REPLACE FUNCTION calculate_course_completion(
  p_enrollment_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_completed INTEGER;
  v_total INTEGER;
  v_percentage NUMERIC;
BEGIN
  SELECT 
    COUNT(CASE WHEN status = 'completed' THEN 1 END),
    COUNT(*)
  INTO v_completed, v_total
  FROM lms_progress
  WHERE enrollment_id = p_enrollment_id;
  
  IF v_total = 0 THEN
    RETURN 0;
  END IF;
  
  v_percentage = (v_completed::NUMERIC / v_total::NUMERIC) * 100;
  RETURN ROUND(v_percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- View: Course with stats
CREATE OR REPLACE VIEW vw_lms_courses_with_stats AS
SELECT
  c.*,
  cat.name AS category_name,
  COUNT(DISTINCT e.id) AS enrollment_count,
  COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) AS completion_count,
  ROUND(
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT e.id), 0) * 100,
    2
  ) AS completion_rate,
  COUNT(DISTINCT m.id) AS modules_count,
  COUNT(DISTINCT l.id) AS lessons_count,
  SUM(l.estimated_minutes) AS total_duration_minutes
FROM lms_courses c
LEFT JOIN lms_categories cat ON cat.id = c.category_id
LEFT JOIN lms_enrollments e ON e.course_id = c.id
LEFT JOIN lms_course_modules m ON m.course_id = c.id
LEFT JOIN lms_course_lessons l ON l.course_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, cat.name;

-- View: User learning progress
CREATE OR REPLACE VIEW vw_lms_user_learning_progress AS
SELECT
  e.user_id,
  e.id AS enrollment_id,
  c.id AS course_id,
  c.name AS course_name,
  c.thumbnail_url,
  e.status,
  e.progress_percentage,
  e.enrolled_at,
  e.started_at,
  e.completed_at,
  e.due_date,
  e.total_time_spent_seconds,
  e.assessment_score,
  e.certificate_issued,
  cert.certificate_number,
  CASE
    WHEN e.due_date IS NOT NULL AND e.due_date < now() AND e.status NOT IN ('completed', 'withdrawn')
    THEN true
    ELSE false
  END AS is_overdue
FROM lms_enrollments e
JOIN lms_courses c ON c.id = e.course_id
LEFT JOIN lms_certificates cert ON cert.enrollment_id = e.id
WHERE c.deleted_at IS NULL;

COMMENT ON VIEW vw_lms_user_learning_progress IS 'LMS: User learning progress summary';
```

---

### Day 3-4: Integration Layer

#### 3.3 Integration Layer Files

سأقوم بإنشاء جميع ملفات Integration Layer:

##### **1. categories.integration.ts**
```typescript
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Category, CreateCategoryInput, UpdateCategoryInput, CategoryFilters } from '../types';

type CategoryRow = Database['public']['Tables']['lms_categories']['Row'];

// Helper: Get current tenant ID
async function getCurrentTenantId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const tenantId = session?.user?.user_metadata?.tenant_id;
  if (!tenantId) throw new Error('No tenant context');
  return tenantId;
}

// Helper: Log audit
async function logAudit(entityId: string, action: string, payload?: Record<string, any>) {
  const { data: { session } } = await supabase.auth.getSession();
  const tenantId = await getCurrentTenantId();
  
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor: session?.user?.id || 'system',
    entity_type: 'lms_category',
    entity_id: entityId,
    action,
    payload,
  });
}

/**
 * Fetch all categories with optional filters
 */
export async function fetchCategories(filters?: CategoryFilters): Promise<Category[]> {
  const tenantId = await getCurrentTenantId();
  
  let query = supabase
    .from('lms_categories')
    .select(`
      *,
      parent:lms_categories!parent_id(id, name, name_ar),
      children:lms_categories!parent_id(count)
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('position', { ascending: true });
  
  if (filters?.parent_id) {
    query = query.eq('parent_id', filters.parent_id);
  } else if (filters?.only_root) {
    query = query.is('parent_id', null);
  }
  
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%`);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  await logAudit('list', 'read', { filters });
  
  return data as Category[];
}

/**
 * Fetch single category by ID
 */
export async function fetchCategoryById(id: string): Promise<Category> {
  const tenantId = await getCurrentTenantId();
  
  const { data, error } = await supabase
    .from('lms_categories')
    .select(`
      *,
      parent:lms_categories!parent_id(id, name, name_ar),
      children:lms_categories!parent_id(*)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
  
  if (error) throw error;
  if (!data) throw new Error('Category not found');
  
  await logAudit(id, 'read');
  
  return data as Category;
}

/**
 * Create new category
 */
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const tenantId = await getCurrentTenantId();
  const { data: { session } } = await supabase.auth.getSession();
  
  const { data, error } = await supabase
    .from('lms_categories')
    .insert({
      ...input,
      tenant_id: tenantId,
      created_by: session?.user?.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  await logAudit(data.id, 'create', { input });
  
  return data as Category;
}

/**
 * Update category
 */
export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const tenantId = await getCurrentTenantId();
  const { data: { session } } = await supabase.auth.getSession();
  
  const { data, error } = await supabase
    .from('lms_categories')
    .update({
      ...input,
      updated_by: session?.user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  
  if (error) throw error;
  
  await logAudit(id, 'update', { input });
  
  return data as Category;
}

/**
 * Delete category (soft delete by setting is_active = false)
 */
export async function deleteCategory(id: string): Promise<void> {
  const tenantId = await getCurrentTenantId();
  
  const { error } = await supabase
    .from('lms_categories')
    .update({ is_active: false })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
  
  await logAudit(id, 'delete');
}

/**
 * Reorder categories
 */
export async function reorderCategories(updates: Array<{ id: string; position: number }>): Promise<void> {
  const tenantId = await getCurrentTenantId();
  
  // Batch update positions
  const promises = updates.map(({ id, position }) =>
    supabase
      .from('lms_categories')
      .update({ position })
      .eq('id', id)
      .eq('tenant_id', tenantId)
  );
  
  await Promise.all(promises);
  
  await logAudit('batch', 'reorder', { updates });
}
```

##### **2. courses.integration.ts** (الملف الأهم)
```typescript
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { 
  Course, 
  CreateCourseInput, 
  UpdateCourseInput, 
  CourseFilters,
  CourseStats 
} from '../types';

type CourseRow = Database['public']['Tables']['lms_courses']['Row'];

// Helper functions (same as above)
async function getCurrentTenantId(): Promise<string> { ... }
async function logAudit(entityId: string, action: string, payload?: Record<string, any>) { ... }

/**
 * Fetch courses with filters
 */
export async function fetchCourses(filters?: CourseFilters): Promise<Course[]> {
  const tenantId = await getCurrentTenantId();
  
  let query = supabase
    .from('lms_courses')
    .select(`
      *,
      category:lms_categories(id, name, name_ar),
      instructor:users(id, full_name, email),
      enrollments:lms_enrollments(count),
      modules:lms_course_modules(count)
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  
  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  
  if (filters?.instructor_id) {
    query = query.eq('instructor_id', filters.instructor_id);
  }
  
  if (filters?.level) {
    query = query.eq('level', filters.level);
  }
  
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  
  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  
  if (filters?.date_to) {
    query = query.lte('created_at', filters.date_to);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  await logAudit('list', 'read', { filters });
  
  return data as Course[];
}

/**
 * Fetch single course with full details
 */
export async function fetchCourseById(id: string): Promise<Course> {
  const tenantId = await getCurrentTenantId();
  
  const { data, error } = await supabase
    .from('lms_courses')
    .select(`
      *,
      category:lms_categories(id, name, name_ar),
      instructor:users(id, full_name, email, avatar_url),
      modules:lms_course_modules(
        *,
        lessons:lms_course_lessons(*)
      ),
      resources:lms_course_resources(*),
      assessments:lms_assessments(*)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single();
  
  if (error) throw error;
  if (!data) throw new Error('Course not found');
  
  await logAudit(id, 'read');
  
  return data as Course;
}

/**
 * Create new course
 */
export async function createCourse(input: CreateCourseInput): Promise<Course> {
  const tenantId = await getCurrentTenantId();
  const { data: { session } } = await supabase.auth.getSession();
  
  const { data, error } = await supabase
    .from('lms_courses')
    .insert({
      ...input,
      tenant_id: tenantId,
      created_by: session?.user?.id,
      status: 'draft', // Always start as draft
    })
    .select()
    .single();
  
  if (error) throw error;
  
  await logAudit(data.id, 'create', { input });
  
  return data as Course;
}

/**
 * Update course
 */
export async function updateCourse(id: string, input: UpdateCourseInput): Promise<Course> {
  const tenantId = await getCurrentTenantId();
  const { data: { session } } = await supabase.auth.getSession();
  
  const { data, error } = await supabase
    .from('lms_courses')
    .update({
      ...input,
      updated_by: session?.user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .select()
    .single();
  
  if (error) throw error;
  
  await logAudit(id, 'update', { input });
  
  return data as Course;
}

/**
 * Delete course (soft delete)
 */
export async function deleteCourse(id: string): Promise<void> {
  const tenantId = await getCurrentTenantId();
  const { data: { session } } = await supabase.auth.getSession();
  
  const { error } = await supabase
    .from('lms_courses')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: session?.user?.id,
    })
    .eq('id', id)
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
  
  await logAudit(id, 'delete');
}

/**
 * Publish course
 */
export async function publishCourse(id: string): Promise<Course> {
  return updateCourse(id, { 
    status: 'published',
    published_at: new Date().toISOString()
  });
}

/**
 * Archive course
 */
export async function archiveCourse(id: string): Promise<Course> {
  return updateCourse(id, { status: 'archived' });
}

/**
 * Duplicate course
 */
export async function duplicateCourse(id: string): Promise<Course> {
  const original = await fetchCourseById(id);
  
  // Create new course with copied data
  const newCourse = await createCourse({
    code: `${original.code}-COPY`,
    name: `${original.name} (Copy)`,
    name_ar: original.name_ar ? `${original.name_ar} (نسخة)` : undefined,
    description: original.description,
    description_ar: original.description_ar,
    category_id: original.category_id,
    instructor_id: original.instructor_id,
    level: original.level,
    duration_hours: original.duration_hours,
    metadata: original.metadata,
  });
  
  await logAudit(newCourse.id, 'duplicate', { original_id: id });
  
  return newCourse;
}

/**
 * Get course statistics
 */
export async function fetchCourseStats(id: string): Promise<CourseStats> {
  const tenantId = await getCurrentTenantId();
  
  const [
    { data: enrollments },
    { data: completions },
    { data: avgScore }
  ] = await Promise.all([
    supabase.from('lms_enrollments').select('*', { count: 'exact', head: true }).eq('course_id', id).eq('tenant_id', tenantId),
    supabase.from('lms_enrollments').select('*', { count: 'exact', head: true }).eq('course_id', id).eq('status', 'completed').eq('tenant_id', tenantId),
    supabase.from('lms_enrollments').select('assessment_score').eq('course_id', id).eq('tenant_id', tenantId).not('assessment_score', 'is', null)
  ]);
  
  const enrollmentCount = enrollments?.count || 0;
  const completionCount = completions?.count || 0;
  const completionRate = enrollmentCount > 0 ? (completionCount / enrollmentCount) * 100 : 0;
  
  const scores = avgScore || [];
  const averageScore = scores.length > 0
    ? scores.reduce((sum, item) => sum + (item.assessment_score || 0), 0) / scores.length
    : 0;
  
  return {
    enrollmentCount,
    completionCount,
    completionRate,
    averageScore,
  };
}
```

سأكمل باقي ملفات Integration Layer والوثيقة في الرد التالي...

هل تريد أن أكمل؟ 🚀
