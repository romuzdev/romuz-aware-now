# Gate-K — KPI Catalog (v1.0)

## 1) الغرض والنطاق

### السياق
Gate-K (Continuous Improvement Analytics) يُمثل طبقة التحليلات المتقدمة والتحسين المستمر للمنصة. هذا الكتالوج يُعتبر **Single Source of Truth (SSOT)** لجميع مؤشرات الأداء الرئيسية (KPIs) المستخدمة في:
- لوحات التحكم التحليلية (Analytics Dashboards)
- التقارير التنفيذية (Executive Reports)
- أنظمة التنبيهات (Alert Systems)
- تحليل الأسباب الجذرية (Root Cause Analysis)
- محرك التوصيات (Recommendations Engine)

### العلاقة مع Gates الأخرى
| Gate | الدور | البيانات المستمدة |
|------|-------|-------------------|
| **Gate-I** | Awareness Campaign Insights | Campaign KPIs, Engagement Metrics, Daily Engagement |
| **Gate-J** | Impact Scores & Validation | Impact Scores, Validation Results, Weight Calibration |
| **Gate-F** | Reports & Exports | Report KPIs (Daily/CTD), Export Metrics |
| **Gate-H** | Action Plans | Action Plan Metrics, Task Completion, Follow-up Rates |

### الهدف
- **توحيد** جميع تعريفات KPIs في مصدر واحد
- **ضمان** الاتساق عبر جميع التطبيقات والتقارير
- **تمكين** التحليلات متعددة الأبعاد (Multi-dimensional Analytics)
- **دعم** التحكم في الإصدارات (Version Control)
- **تطبيق** معايير الجودة والحوكمة

---

## 2) مبادئ التصميم

### 2.1) Multi-Tenant Architecture
- **Tenant Isolation**: كل KPI يحمل `tenant_id` لضمان عزل البيانات الكامل
- **RLS Enforcement**: جميع الجداول والـ Views مؤمّنة بـ Row-Level Security
- **Cross-Tenant Benchmarking**: غير مدعوم في v1 (مخطط لـ v3 مع مراجعة قانونية)

### 2.2) RBAC — أدوار الوصول
| Role | الصلاحيات |
|------|-----------|
| **platform_admin** | - قراءة جميع KPIs عبر جميع Tenants<br>- إدارة KPI Catalog (CRUD)<br>- تعريف Platform-level KPIs |
| **tenant_admin** | - قراءة جميع KPIs في Tenant الخاص<br>- تخصيص Thresholds<br>- تخصيص Recommendation Rules<br>- إدارة Tenant-specific KPIs |
| **analyst** | - قراءة KPIs<br>- عرض Trends & RCA<br>- تصدير التقارير |
| **viewer** | - قراءة KPIs (Read-only)<br>- عرض Dashboards الأساسية فقط |

### 2.3) Grain — مستويات التفصيل
```
Raw Events (Real-time)
    ↓
Daily Aggregates (00:00 - 23:59 Riyadh Time)
    ↓
Weekly Aggregates (Sunday - Saturday)
    ↓
Monthly Aggregates (1st - Last day of month)
    ↓
Quarterly Aggregates (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
```

**Default Grain**: Daily (most KPIs)  
**Aggregation Strategy**: Pre-computed Materialized Views + On-demand Rollups

### 2.4) Trend Windows
| Window Code | الوصف | الاستخدام |
|-------------|-------|-----------|
| **W12** | آخر 12 أسبوع | اتجاهات قصيرة المدى، اكتشاف التغيرات السريعة |
| **M6** | آخر 6 أشهر | اتجاهات متوسطة المدى، التخطيط الفصلي |
| **Q4** | آخر 4 أرباع | اتجاهات طويلة المدى، التقارير التنفيذية السنوية |
| **MTD** | Month-to-Date | التتبع اللحظي للأداء الشهري |
| **YTD** | Year-to-Date | التتبع اللحظي للأداء السنوي |

### 2.5) Naming Conventions
- **KPI Key**: `kpi_{domain}_{metric_name}` (snake_case)
  - مثال: `kpi_awareness_completion_rate`, `kpi_impact_avg_score`
- **Dimension Key**: `dim_{entity}` (snake_case)
  - مثال: `dim_department`, `dim_campaign_type`
- **Table Naming**: 
  - Facts: `fact_kpi_values_{grain}` (e.g., `fact_kpi_values_daily`)
  - Dimensions: `dim_{entity_name}` (e.g., `dim_org_units`)
  - Views: `vw_kpi_{purpose}` (e.g., `vw_kpi_trends_weekly`)

### 2.6) Versioning Strategy
```sql
CREATE TABLE public.kpi_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID, -- NULL = Platform-level KPI
  kpi_key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE, -- NULL = currently active
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  -- ... KPI metadata fields
  UNIQUE(kpi_key, version)
);
```

**Change Control**:
1. أي تغيير في تعريف KPI يتطلب إنشاء نسخة جديدة
2. النسخة القديمة تُحفظ مع `effective_to = date of change`
3. النسخة الجديدة تُنشط مع `effective_from = date of change`
4. جميع الاستعلامات تستخدم `WHERE is_active = TRUE`

---

## 3) الأبعاد (Dimensions)

### 3.1) قائمة الأبعاد الأساسية

#### 1. **Department** (`dim_department`)
- **الوصف**: الأقسام التنظيمية (HR, IT, Finance, Operations, etc.)
- **المصدر**: HRMS Integration (Gate-M12) أو إدخال يدوي
- **الحقول**: 
  - `id` (UUID)
  - `tenant_id` (UUID)
  - `code` (TEXT, unique per tenant)
  - `name_ar` (TEXT)
  - `name_en` (TEXT)
  - `parent_department_id` (UUID, nullable)
  - `is_active` (BOOLEAN)
- **أمثلة**: `HR`, `IT`, `FINANCE`, `OPERATIONS`, `LEGAL`

#### 2. **Campaign Type** (`dim_campaign_type`)
- **الوصف**: نوع الحملة التوعوية
- **المصدر**: awareness_campaigns.type
- **أمثلة**: `security_awareness`, `compliance_training`, `policy_update`, `phishing_simulation`

#### 3. **Channel** (`dim_channel`)
- **الوصف**: قناة التواصل المستخدمة
- **المصدر**: notification_log.channel
- **أمثلة**: `email`, `sms`, `in_app_notification`, `whatsapp`, `teams`

#### 4. **Location** (`dim_location`)
- **الوصف**: المواقع الجغرافية للموظفين
- **المصدر**: employee_profiles.location
- **الحقول**: `id`, `tenant_id`, `city`, `region`, `country`, `is_active`
- **أمثلة**: `Riyadh`, `Jeddah`, `Dammam`, `Remote`

#### 5. **Audience Segment** (`dim_audience_segment`)
- **الوصف**: شرائح الجمهور المستهدف
- **المصدر**: campaign_participants + segmentation rules
- **أمثلة**: 
  - `new_hires` (hired in last 90 days)
  - `high_risk_roles` (IT, Finance, Executive)
  - `low_engagement` (completion rate < 50%)
  - `repeat_offenders` (failed phishing tests > 2 times)

#### 6. **Content Theme** (`dim_content_theme`)
- **الوصف**: موضوع المحتوى
- **المصدر**: campaign_modules.tags
- **أمثلة**: `data_privacy`, `password_security`, `social_engineering`, `incident_response`, `policy_compliance`

#### 7. **Device Type** (`dim_device_type`)
- **الوصف**: نوع الجهاز المستخدم
- **المصدر**: User-Agent parsing (if available)
- **أمثلة**: `desktop`, `mobile`, `tablet`, `unknown`

#### 8. **User Role** (`dim_user_role`)
- **الوصف**: دور المستخدم في النظام
- **المصدر**: user_roles.role
- **أمثلة**: `admin`, `compliance_manager`, `standard_user`, `viewer`

### 3.2) جداول الأبعاد المرجعية

**Template Schema** (ينطبق على جميع الأبعاد):
```sql
CREATE TABLE public.dim_{dimension_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- RLS isolation
  code TEXT NOT NULL, -- Unique identifier
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  parent_id UUID, -- For hierarchical dimensions
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- RLS Policy
ALTER TABLE public.dim_{dimension_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dimensions in their tenant"
  ON public.dim_{dimension_name}
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));
```

---

## 4) المقاييس (KPIs) — جدول معرّف

### 4.1) KPI Catalog Schema

```sql
CREATE TABLE public.kpi_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID, -- NULL = Platform-level KPI
  
  -- Identity
  kpi_key TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  
  -- Formula & Computation
  formula TEXT, -- Pseudo-SQL or business logic
  unit TEXT, -- '%', 'count', 'score', 'mins', 'days'
  aggregation TEXT, -- 'sum', 'avg', 'count', 'count_distinct', 'median', 'max', 'min'
  grain TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  window TEXT, -- 'W12', 'M6', 'Q4', 'MTD', 'YTD', NULL
  
  -- Data Lineage
  source_gate TEXT NOT NULL, -- 'Gate-I', 'Gate-J', 'Gate-F', 'Gate-H'
  source_table TEXT, -- Underlying table/view
  dimensions JSONB, -- Array of applicable dimension keys
  
  -- Quality & Governance
  freshness_target TEXT, -- e.g., 'daily by 02:00 Riyadh'
  owner_role TEXT NOT NULL, -- 'platform_admin', 'tenant_admin', 'analyst'
  quality_checks JSONB, -- { "allow_nulls": false, "min_sample": 10, "outlier_iqr": 3 }
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  notes TEXT
);

-- Indexes
CREATE INDEX idx_kpi_catalog_tenant ON public.kpi_catalog(tenant_id);
CREATE INDEX idx_kpi_catalog_key ON public.kpi_catalog(kpi_key);
CREATE INDEX idx_kpi_catalog_active ON public.kpi_catalog(is_active) WHERE is_active = TRUE;

-- RLS
ALTER TABLE public.kpi_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KPIs in their tenant"
  ON public.kpi_catalog
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);
```

### 4.2) KPIs المحددة (Master List)

#### **4.2.1) Awareness & Engagement KPIs** (من Gate-I)

| KPI Key | Name (AR) | Description | Formula | Unit | Aggregation | Grain | Window | Dimensions | Source | Freshness | Owner | Quality Checks |
|---------|-----------|-------------|---------|------|-------------|-------|--------|------------|--------|-----------|-------|----------------|
| `kpi_awareness_reach` | نطاق الوصول | عدد الموظفين الذين تم دعوتهم للحملة | `COUNT(DISTINCT participant_id) WHERE invited_at IS NOT NULL` | count | count_distinct | daily | W12 | department, location, audience_segment | Gate-I: campaign_participants | daily by 02:00 | tenant_admin | `{"allow_nulls": false, "min_sample": 1}` |
| `kpi_awareness_opened` | معدل الفتح | نسبة الموظفين الذين فتحوا المحتوى | `(COUNT(DISTINCT participant_id WHERE opened_at IS NOT NULL) / COUNT(DISTINCT participant_id WHERE invited_at IS NOT NULL)) * 100` | % | avg | daily | W12 | department, campaign_type, channel | Gate-I: campaign_participants | daily by 02:00 | tenant_admin | `{"min_value": 0, "max_value": 100}` |
| `kpi_completion_rate` | معدل الإكمال | نسبة الموظفين الذين أكملوا الحملة | `(completed_count / total_participants) * 100` | % | avg | daily | W12, M6 | department, campaign_type, content_theme | Gate-I: mv_awareness_campaign_kpis | daily by 02:00 | tenant_admin | `{"min_value": 0, "max_value": 100, "warn_below": 50}` |
| `kpi_activation_rate` | معدل التفعيل | نسبة الموظفين الذين بدأوا الحملة (first interaction) | `(activated_count / invited_count) * 100` | % | avg | daily | W12 | department, channel | Gate-I: mv_awareness_campaign_kpis | daily by 02:00 | tenant_admin | `{"min_value": 0, "max_value": 100}` |
| `kpi_avg_time_to_complete` | متوسط وقت الإكمال | متوسط الوقت (بالدقائق) من الدعوة إلى الإكمال | `AVG(EXTRACT(EPOCH FROM (completed_at - invited_at)) / 60)` | mins | avg | weekly | M6 | campaign_type, content_theme | Gate-I: campaign_participants | weekly | analyst | `{"min_value": 0, "outlier_iqr": 3}` |
| `kpi_engagement_score` | درجة التفاعل | مقياس مركّب للتفاعل (clicks, time spent, interactions) | `(0.3 * open_rate + 0.4 * completion_rate + 0.3 * avg_interactions)` | score (0-100) | avg | weekly | W12, M6 | department, audience_segment | Gate-I: mv_awareness_feedback_insights | weekly | tenant_admin | `{"min_value": 0, "max_value": 100}` |

#### **4.2.2) Quiz & Assessment KPIs** (من Gate-I)

| KPI Key | Name (AR) | Description | Formula | Unit | Aggregation | Grain | Window | Dimensions | Source | Freshness | Owner | Quality Checks |
|---------|-----------|-------------|---------|------|-------------|-------|--------|------------|--------|-----------|-------|----------------|
| `kpi_quiz_avg_score` | متوسط درجة الاختبار | متوسط درجات الاختبارات (0-100) | `AVG(score) WHERE score IS NOT NULL` | score (0-100) | avg | daily | W12, M6 | department, content_theme, attempt_number | Gate-I: module_quizzes + quiz_attempts | daily by 02:00 | analyst | `{"min_value": 0, "max_value": 100, "min_sample": 5}` |
| `kpi_quiz_pass_rate` | معدل النجاح | نسبة المحاولات الناجحة (score >= pass_score) | `(COUNT(*) WHERE score >= pass_score) / COUNT(*) * 100` | % | avg | daily | W12 | department, content_theme | Gate-I: module_quizzes + quiz_attempts | daily by 02:00 | analyst | `{"min_value": 0, "max_value": 100, "warn_below": 70}` |
| `kpi_quiz_avg_attempts` | متوسط عدد المحاولات | متوسط عدد محاولات الاختبار حتى النجاح | `AVG(attempt_count) WHERE passed = TRUE` | count | avg | weekly | M6 | content_theme, difficulty_level | Gate-I: quiz_attempts | weekly | analyst | `{"min_value": 1, "warn_above": 3}` |
| `kpi_quiz_first_attempt_pass` | نسبة النجاح من أول محاولة | نسبة المستخدمين الذين نجحوا من المحاولة الأولى | `(COUNT(*) WHERE attempt_number = 1 AND passed = TRUE) / COUNT(DISTINCT user_id) * 100` | % | avg | weekly | W12 | content_theme, department | Gate-I: quiz_attempts | weekly | analyst | `{"min_value": 0, "max_value": 100}` |

#### **4.2.3) Impact & Risk KPIs** (من Gate-J)

| KPI Key | Name (AR) | Description | Formula | Unit | Aggregation | Grain | Window | Dimensions | Source | Freshness | Owner | Quality Checks |
|---------|-----------|-------------|---------|------|-------------|-------|--------|------------|--------|-----------|-------|----------------|
| `kpi_impact_avg_score` | متوسط درجة التأثير | متوسط Impact Score لجميع Org Units | `AVG(impact_score)` | score (0-100) | avg | monthly | Q4 | department, location | Gate-J: awareness_impact_scores | monthly | tenant_admin | `{"min_value": 0, "max_value": 100, "min_sample": 3}` |
| `kpi_impact_high_risk_orgs` | عدد الوحدات عالية المخاطر | عدد Org Units ذات risk_level = 'high' | `COUNT(DISTINCT org_unit_id) WHERE risk_level = 'high'` | count | sum | monthly | M6, Q4 | department | Gate-J: awareness_impact_scores | monthly | tenant_admin | `{"allow_nulls": false}` |
| `kpi_validation_gap_avg` | متوسط فجوة التحقق | متوسط الفرق بين Impact Score المحسوب والسلوك الفعلي | `AVG(validation_gap)` | score | avg | monthly | Q4 | department | Gate-J: awareness_impact_validations | monthly | platform_admin | `{"warn_above": 15}` |
| `kpi_calibration_accuracy` | دقة المعايرة | نسبة Impact Scores ضمن نطاق ±10% من السلوك الفعلي | `(COUNT(*) WHERE ABS(validation_gap) <= 10) / COUNT(*) * 100` | % | avg | quarterly | Q4 | department | Gate-J: awareness_impact_calibration_cells | quarterly | platform_admin | `{"min_value": 0, "max_value": 100, "warn_below": 80}` |

#### **4.2.4) Delivery & Communication KPIs** (من Gate-F/Gate-I)

| KPI Key | Name (AR) | Description | Formula | Unit | Aggregation | Grain | Window | Dimensions | Source | Freshness | Owner | Quality Checks |
|---------|-----------|-------------|---------|------|-------------|-------|--------|------------|--------|-----------|-------|----------------|
| `kpi_delivery_success_rate` | معدل نجاح التسليم | نسبة الرسائل المُسلّمة بنجاح (لم ترتد) | `(deliveries - bounces) / deliveries * 100` | % | avg | daily | W12 | channel | Gate-F: mv_report_kpis_daily | daily by 02:00 | tenant_admin | `{"min_value": 0, "max_value": 100, "warn_below": 95}` |
| `kpi_bounce_rate` | معدل الارتداد | نسبة الرسائل التي ارتدت (فشل التسليم) | `(bounces / deliveries) * 100` | % | avg | daily | W12 | channel | Gate-F: mv_report_kpis_daily | daily by 02:00 | tenant_admin | `{"min_value": 0, "max_value": 100, "warn_above": 5}` |
| `kpi_open_rate` | معدل الفتح | نسبة الرسائل التي تم فتحها | `(opens / deliveries) * 100` | % | avg | daily | W12, M6 | channel, campaign_type | Gate-F: mv_report_kpis_daily | daily by 02:00 | tenant_admin | `{"min_value": 0, "max_value": 100}` |
| `kpi_click_through_rate` | معدل النقر | نسبة الرسائل التي تم النقر على روابطها | `(clicks / opens) * 100` | % | avg | daily | W12 | channel, content_theme | Gate-F: mv_report_kpis_daily | daily by 02:00 | tenant_admin | `{"min_value": 0, "max_value": 100}` |
| `kpi_reminder_effectiveness` | فعالية التذكيرات | نسبة الإكمالات بعد إرسال تذكير | `(completed_after_reminder / reminders_sent) * 100` | % | avg | weekly | M6 | channel | Gate-I: campaign_participants | weekly | analyst | `{"min_value": 0, "max_value": 100}` |

#### **4.2.5) Adoption & Usage KPIs** (من Gate-I/Gate-F)

| KPI Key | Name (AR) | Description | Formula | Unit | Aggregation | Grain | Window | Dimensions | Source | Freshness | Owner | Quality Checks |
|---------|-----------|-------------|---------|------|-------------|-------|--------|------------|--------|-----------|-------|----------------|
| `kpi_adoption_active_users` | المستخدمون النشطون | عدد المستخدمين الفريدين الذين تفاعلوا مع النظام | `COUNT(DISTINCT user_id) WHERE last_activity >= CURRENT_DATE - INTERVAL '30 days'` | count | count_distinct | daily | W12, M6 | department, user_role | Gate-I: campaign_participants | daily by 02:00 | tenant_admin | `{"min_value": 0}` |
| `kpi_adoption_dau_mau` | نسبة DAU/MAU | Daily Active Users / Monthly Active Users | `(DAU / MAU) * 100` | % | avg | daily | M6 | None | Gate-I: derived | daily by 02:00 | platform_admin | `{"min_value": 0, "max_value": 100}` |
| `kpi_feature_adoption_rate` | معدل اعتماد الميزات | نسبة المستخدمين الذين استخدموا ميزة معينة | `(users_used_feature / total_active_users) * 100` | % | avg | weekly | M6 | feature_name | Gate-I: feature_usage_log | weekly | product_owner | `{"min_value": 0, "max_value": 100}` |
| `kpi_report_exports_count` | عدد عمليات تصدير التقارير | عدد التقارير المُصدّرة | `COUNT(*) FROM report_exports` | count | sum | daily | W12, M6 | report_type, file_format | Gate-F: report_exports | daily by 02:00 | analyst | `{"min_value": 0}` |

#### **4.2.6) Action Plans & Follow-up KPIs** (من Gate-H)

| KPI Key | Name (AR) | Description | Formula | Unit | Aggregation | Grain | Window | Dimensions | Source | Freshness | Owner | Quality Checks |
|---------|-----------|-------------|---------|------|-------------|-------|--------|------------|--------|-----------|-------|----------------|
| `kpi_action_plans_created` | عدد خطط العمل المنشأة | عدد Action Plans الجديدة | `COUNT(*) WHERE created_at >= period_start` | count | sum | weekly | M6, Q4 | department, priority | Gate-H: action_plans | weekly | tenant_admin | `{"min_value": 0}` |
| `kpi_action_followup_closure_rate` | معدل إغلاق المتابعات | نسبة Action Plans المكتملة | `(COUNT(*) WHERE status = 'completed') / COUNT(*) * 100` | % | avg | monthly | M6, Q4 | priority, department | Gate-H: action_plans | monthly | tenant_admin | `{"min_value": 0, "max_value": 100, "warn_below": 70}` |
| `kpi_action_avg_days_to_close` | متوسط الأيام للإغلاق | متوسط الوقت (بالأيام) من الإنشاء إلى الإكمال | `AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400)` | days | avg | monthly | M6 | priority, department | Gate-H: action_plans | monthly | analyst | `{"min_value": 0, "warn_above": 30}` |
| `kpi_action_overdue_count` | عدد المهام المتأخرة | عدد Action Plans المتجاوزة لتاريخ الاستحقاق | `COUNT(*) WHERE due_date < CURRENT_DATE AND status != 'completed'` | count | sum | daily | W12 | priority, department | Gate-H: action_plans | daily by 02:00 | tenant_admin | `{"min_value": 0, "warn_above": 10}` |

#### **4.2.7) Trend & Anomaly KPIs** (Computed per KPI)

| KPI Key | Name (AR) | Description | Formula | Unit | Aggregation | Grain | Window | Dimensions | Source | Freshness | Owner | Quality Checks |
|---------|-----------|-------------|---------|------|-------------|-------|--------|------------|--------|-----------|-------|----------------|
| `kpi_trend_delta_pct` | نسبة التغيير | النسبة المئوية للتغيير مقارنة بالفترة السابقة | `((current_value - previous_value) / previous_value) * 100` | % | computed | varies | W12, M6, Q4 | source_kpi, comparison_period | Gate-K: computed | per source KPI | platform_admin | `{"warn_above": 20, "warn_below": -20}` |
| `kpi_anomaly_flag` | علامة الشذوذ | 0/1 flag للقيم الشاذة (خارج نطاق الثقة) | `IF (ABS(current_value - baseline) > threshold, 1, 0)` | flag (0/1) | computed | varies | W12, M6 | source_kpi, threshold_type | Gate-K: computed | per source KPI | platform_admin | `{"values": [0, 1]}` |
| `kpi_anomaly_severity` | شدة الشذوذ | مستوى خطورة الشذوذ (low/medium/high) | `CASE WHEN delta_pct > 20 THEN 'high' WHEN delta_pct > 10 THEN 'medium' ELSE 'low' END` | enum | computed | varies | W12, M6 | source_kpi | Gate-K: computed | per source KPI | platform_admin | `{"values": ["low", "medium", "high"]}` |

#### **4.2.8) Feedback & Sentiment KPIs** (من Gate-I)

| KPI Key | Name (AR) | Description | Formula | Unit | Aggregation | Grain | Window | Dimensions | Source | Freshness | Owner | Quality Checks |
|---------|-----------|-------------|---------|------|-------------|-------|--------|------------|--------|-----------|-------|----------------|
| `kpi_feedback_avg_score` | متوسط درجة الرضا | متوسط تقييمات المستخدمين (1-5 or 0-100) | `AVG(score) WHERE score IS NOT NULL` | score | avg | weekly | W12, M6 | campaign_type, content_theme | Gate-I: campaign_feedback | weekly | tenant_admin | `{"min_value": 0, "max_value": 100, "min_sample": 5}` |
| `kpi_feedback_response_rate` | معدل الاستجابة للتقييم | نسبة المشاركين الذين قدموا تقييماً | `(COUNT(DISTINCT participant_id WHERE feedback_submitted = TRUE) / COUNT(DISTINCT participant_id WHERE completed_at IS NOT NULL)) * 100` | % | avg | weekly | M6 | campaign_type | Gate-I: campaign_feedback | weekly | analyst | `{"min_value": 0, "max_value": 100}` |
| `kpi_feedback_nps` | صافي نقاط الترويج | Net Promoter Score (promoters - detractors) | `(promoters_pct - detractors_pct)` | score (-100 to 100) | avg | monthly | Q4 | department, campaign_type | Gate-I: campaign_feedback | monthly | tenant_admin | `{"min_value": -100, "max_value": 100}` |

---

## 5) نوافذ الاتجاه والحدود

### 5.1) تعريف نوافذ الاتجاه

#### **W12 (Last 12 Weeks)**
- **الاستخدام**: اكتشاف الاتجاهات قصيرة المدى والتغيرات السريعة
- **نقطة المقارنة**: الأسبوع الحالي مقابل متوسط آخر 12 أسبوع
- **Baseline Calculation**: `AVG(kpi_value) WHERE week >= CURRENT_DATE - INTERVAL '12 weeks'`
- **متى نستخدمها**: 
  - KPIs ذات التقلبات العالية (Open Rate, Click Rate)
  - التتبع الأسبوعي للحملات النشطة
  - اكتشاف المشاكل الفورية (Bounce Rate spike)

#### **M6 (Last 6 Months)**
- **الاستخدام**: اتجاهات متوسطة المدى والتخطيط الفصلي
- **نقطة المقارنة**: الشهر الحالي مقابل متوسط آخر 6 أشهر
- **Baseline Calculation**: `AVG(kpi_value) WHERE month >= CURRENT_DATE - INTERVAL '6 months'`
- **متى نستخدمها**:
  - KPIs المرتبطة بالسلوك (Completion Rate, Engagement Score)
  - التخطيط الفصلي (Q1-Q4)
  - تقييم فعالية البرامج طويلة المدى

#### **Q4 (Last 4 Quarters)**
- **الاستخدام**: اتجاهات طويلة المدى والتقارير التنفيذية السنوية
- **نقطة المقارنة**: الربع الحالي مقابل متوسط آخر 4 أرباع
- **Baseline Calculation**: `AVG(kpi_value) WHERE quarter >= CURRENT_DATE - INTERVAL '12 months'`
- **متى نستخدمها**:
  - Impact Scores (Gate-J)
  - تقارير الإدارة التنفيذية
  - تقييم البرامج السنوية
  - Benchmarking عبر الأرباع

### 5.2) اختيار النافذة المناسبة لكل KPI

| KPI Category | Window Recommendation | Rationale |
|--------------|----------------------|-----------|
| **Delivery Metrics** (Open Rate, Bounce Rate) | W12 | تقلبات عالية، تحتاج مراقبة أسبوعية |
| **Engagement Metrics** (Completion Rate) | W12, M6 | W12 للتتبع الفوري، M6 للاتجاهات |
| **Impact Scores** | Q4 | تتغير ببطء، تحتاج منظور طويل المدى |
| **Action Plans** | M6, Q4 | دورات عمل طويلة (30-90 يوم) |
| **Feedback Scores** | W12, M6 | تعتمد على حجم العينة |

### 5.3) Control Thresholds (Anomaly Detection)

#### **قواعد الحدود الافتراضية**

**1. Threshold-based Detection (Rule-based v1)**
```
IF current_value deviates from baseline by > threshold THEN flag anomaly
```

**2. Threshold Types:**
| Threshold Type | الوصف | الصيغة | متى نستخدمها |
|----------------|-------|--------|---------------|
| **Absolute** | فرق مطلق عن Baseline | `ABS(current - baseline) > threshold` | KPIs بوحدات ثابتة (count) |
| **Percentage** | نسبة مئوية من Baseline | `ABS((current - baseline) / baseline * 100) > threshold` | KPIs نسبية (%, rate) |
| **StdDev** | انحراف معياري عن Baseline | `ABS(current - baseline) / stddev > threshold` | KPIs ذات توزيع طبيعي |

**3. Default Thresholds per Severity:**
| Severity | Percentage Threshold | StdDev Threshold | Action |
|----------|---------------------|------------------|--------|
| **Low** | 5-10% | 1-2σ | Log + Dashboard flag |
| **Medium** | 10-20% | 2-3σ | Alert to Analyst |
| **High** | > 20% | > 3σ | Alert to Tenant Admin + Dashboard highlight |

**4. Example Thresholds:**
```sql
-- Completion Rate (Percentage threshold)
IF completion_rate < (baseline * 0.80) THEN 'high' severity
IF completion_rate < (baseline * 0.90) THEN 'medium' severity
IF completion_rate < (baseline * 0.95) THEN 'low' severity

-- Bounce Rate (Absolute threshold)
IF bounce_rate > 5% THEN 'high' severity
IF bounce_rate > 3% THEN 'medium' severity
IF bounce_rate > 2% THEN 'low' severity

-- Impact Score (StdDev threshold)
IF ABS(impact_score - baseline) / stddev > 3 THEN 'high' severity
```

### 5.4) قواعد ضبط Thresholds (Tenant-specific)

**Tenant Admins يمكنهم تخصيص Thresholds لكل KPI:**

```sql
CREATE TABLE public.kpi_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  kpi_key TEXT NOT NULL,
  threshold_type TEXT NOT NULL, -- 'absolute', 'percentage', 'stddev'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high'
  threshold_value NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  UNIQUE(tenant_id, kpi_key, severity)
);
```

**Change Control for Thresholds:**
1. Tenant Admin يقترح threshold جديد
2. يتم حفظه في `kpi_thresholds` مع `is_active = FALSE`
3. Analyst يراجع التأثير المحتمل (backtest على بيانات تاريخية)
4. إذا approved → `is_active = TRUE`
5. يتم تطبيقه على Anomaly Detection من الفترة التالية

---

## 6) سياسات التغيير (Change Control)

### 6.1) إضافة KPI جديد

**Workflow:**
```
1. Request (Tenant Admin أو Analyst)
   ↓
2. Validation (Platform Admin)
   - Is KPI clearly defined?
   - Is data source available?
   - Is formula correct?
   ↓
3. Review (Solution Architect)
   - Multi-tenant impact?
   - Performance implications?
   - RBAC alignment?
   ↓
4. Approval (Product Owner)
   ↓
5. Implementation (Backend Team)
   - Add to kpi_catalog table
   - Create compute logic (View/Edge Function)
   - Add RLS policies
   - Add to APIs
   ↓
6. Testing (QA Team)
   - Unit tests for formula
   - Integration tests for data pipeline
   - Performance tests
   ↓
7. Documentation (Technical Writer)
   - Update KPI Catalog (this document)
   - Update API Reference
   ↓
8. Deployment (DevOps)
```

**Required Fields for New KPI:**
```json
{
  "kpi_key": "kpi_new_metric",
  "name_ar": "اسم المقياس الجديد",
  "name_en": "New Metric Name",
  "description": "Detailed business definition",
  "formula": "Pseudo-SQL or business logic",
  "unit": "%",
  "aggregation": "avg",
  "grain": "daily",
  "window": "W12",
  "source_gate": "Gate-X",
  "source_table": "table_or_view_name",
  "dimensions": ["department", "campaign_type"],
  "freshness_target": "daily by 02:00 Riyadh",
  "owner_role": "tenant_admin",
  "quality_checks": {
    "allow_nulls": false,
    "min_sample": 10,
    "min_value": 0,
    "max_value": 100
  }
}
```

### 6.2) تعديل KPI موجود

**Breaking vs Non-Breaking Changes:**

**Non-Breaking Changes** (لا تتطلب نسخة جديدة):
- تحديث الوصف (`description`)
- تحديث الملاحظات (`notes`)
- إضافة `quality_checks` جديدة (غير ملزمة)
- تحديث `freshness_target`

**Breaking Changes** (تتطلب نسخة جديدة):
- تغيير الصيغة (`formula`)
- تغيير الوحدة (`unit`)
- تغيير نوع التجميع (`aggregation`)
- تغيير المصدر (`source_table`)
- إضافة/حذف أبعاد (`dimensions`)

**Versioning Workflow (Breaking Changes):**
```sql
-- 1. Deactivate current version
UPDATE public.kpi_catalog
SET is_active = FALSE,
    effective_to = CURRENT_DATE - INTERVAL '1 day'
WHERE kpi_key = 'kpi_completion_rate'
  AND is_active = TRUE;

-- 2. Insert new version
INSERT INTO public.kpi_catalog (
  kpi_key,
  version,
  effective_from,
  name_ar,
  formula,
  -- ... other fields
)
VALUES (
  'kpi_completion_rate',
  2, -- version incremented
  CURRENT_DATE,
  'معدل الإكمال (v2)',
  'NEW_FORMULA_HERE',
  -- ... updated fields
);
```

**Backward Compatibility:**
- Historical data يظل محسوباً بـ Old Formula (version 1)
- New data يُحسب بـ New Formula (version 2)
- Dashboards تعرض كلا النسختين مع Note: "Formula changed on YYYY-MM-DD"

### 6.3) حذف KPI

**Soft Delete (Recommended):**
```sql
UPDATE public.kpi_catalog
SET is_active = FALSE,
    effective_to = CURRENT_DATE - INTERVAL '1 day',
    notes = CONCAT(notes, ' | DEPRECATED: Reason for deletion')
WHERE kpi_key = 'kpi_old_metric';
```

**Hard Delete** (Not Recommended):
- فقط إذا لم يتم استخدام KPI في الإنتاج
- يتطلب موافقة Platform Admin + Product Owner

---

## 7) أمثلة استعلامات (Read-only)

### 7.1) الحصول على قيمة KPI واحدة (Current Period)

```sql
-- Get current completion rate for tenant
SELECT
  kpi.kpi_key,
  kpi.name_ar,
  kpi.unit,
  mv.kpi_value,
  mv.period_date,
  mv.sample_count
FROM public.kpi_catalog kpi
JOIN public.fact_kpi_values_daily mv
  ON kpi.kpi_key = mv.kpi_key
  AND kpi.is_active = TRUE
WHERE kpi.kpi_key = 'kpi_completion_rate'
  AND mv.tenant_id = get_user_tenant_id(auth.uid())
  AND mv.period_date = CURRENT_DATE - INTERVAL '1 day'
LIMIT 1;
```

### 7.2) الحصول على سلسلة زمنية (W12)

```sql
-- Get weekly completion rate trend (last 12 weeks)
WITH weekly_agg AS (
  SELECT
    DATE_TRUNC('week', period_date) AS week_start,
    AVG(kpi_value) AS avg_value,
    SUM(sample_count) AS total_samples
  FROM public.fact_kpi_values_daily
  WHERE kpi_key = 'kpi_completion_rate'
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND period_date >= CURRENT_DATE - INTERVAL '12 weeks'
  GROUP BY DATE_TRUNC('week', period_date)
)
SELECT
  week_start,
  ROUND(avg_value, 2) AS completion_rate,
  total_samples,
  -- Calculate delta vs previous week
  ROUND(
    (avg_value - LAG(avg_value) OVER (ORDER BY week_start)) 
    / NULLIF(LAG(avg_value) OVER (ORDER BY week_start), 0) * 100,
    2
  ) AS delta_pct
FROM weekly_agg
ORDER BY week_start DESC;
```

### 7.3) مقارنة KPI عبر الأبعاد (Department)

```sql
-- Compare completion rate across departments
SELECT
  d.name_ar AS department,
  AVG(f.kpi_value) AS avg_completion_rate,
  COUNT(*) AS periods_count,
  STDDEV(f.kpi_value) AS stddev
FROM public.fact_kpi_values_daily f
JOIN public.dim_department d
  ON f.dimension_department_id = d.id
WHERE f.kpi_key = 'kpi_completion_rate'
  AND f.tenant_id = get_user_tenant_id(auth.uid())
  AND f.period_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.name_ar
ORDER BY avg_completion_rate DESC;
```

### 7.4) اكتشاف الشذوذات (Anomaly Detection)

```sql
-- Detect anomalies in completion rate (last 7 days)
WITH baseline AS (
  SELECT
    AVG(kpi_value) AS baseline_avg,
    STDDEV(kpi_value) AS baseline_stddev
  FROM public.fact_kpi_values_daily
  WHERE kpi_key = 'kpi_completion_rate'
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND period_date BETWEEN CURRENT_DATE - INTERVAL '30 days'
                       AND CURRENT_DATE - INTERVAL '8 days'
),
recent AS (
  SELECT
    period_date,
    kpi_value,
    sample_count
  FROM public.fact_kpi_values_daily
  WHERE kpi_key = 'kpi_completion_rate'
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND period_date >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT
  r.period_date,
  r.kpi_value AS current_value,
  b.baseline_avg,
  b.baseline_stddev,
  -- Delta
  ROUND(r.kpi_value - b.baseline_avg, 2) AS delta,
  ROUND((r.kpi_value - b.baseline_avg) / NULLIF(b.baseline_avg, 0) * 100, 2) AS delta_pct,
  -- Z-score (standard deviations from mean)
  ROUND((r.kpi_value - b.baseline_avg) / NULLIF(b.baseline_stddev, 0), 2) AS z_score,
  -- Anomaly flag
  CASE
    WHEN ABS((r.kpi_value - b.baseline_avg) / NULLIF(b.baseline_stddev, 0)) > 3 THEN 'high'
    WHEN ABS((r.kpi_value - b.baseline_avg) / NULLIF(b.baseline_stddev, 0)) > 2 THEN 'medium'
    WHEN ABS((r.kpi_value - b.baseline_avg) / NULLIF(b.baseline_stddev, 0)) > 1 THEN 'low'
    ELSE 'normal'
  END AS anomaly_severity
FROM recent r
CROSS JOIN baseline b
ORDER BY r.period_date DESC;
```

### 7.5) Top-5 KPIs Dashboard Query

```sql
-- Get top-5 performing campaigns by completion rate (last 30 days)
SELECT
  c.name AS campaign_name,
  AVG(f.kpi_value) AS avg_completion_rate,
  COUNT(DISTINCT f.period_date) AS days_tracked,
  SUM(f.sample_count) AS total_participants
FROM public.fact_kpi_values_daily f
JOIN public.awareness_campaigns c
  ON f.dimension_campaign_id = c.id
WHERE f.kpi_key = 'kpi_completion_rate'
  AND f.tenant_id = get_user_tenant_id(auth.uid())
  AND f.period_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, c.name
HAVING SUM(f.sample_count) >= 10 -- Minimum sample size
ORDER BY avg_completion_rate DESC
LIMIT 5;
```

### 7.6) Monthly Rollup (M6)

```sql
-- Get monthly rollup of multiple KPIs (last 6 months)
SELECT
  DATE_TRUNC('month', f.period_date) AS month,
  f.kpi_key,
  kpi.name_ar AS kpi_name,
  CASE kpi.aggregation
    WHEN 'avg' THEN AVG(f.kpi_value)
    WHEN 'sum' THEN SUM(f.kpi_value)
    WHEN 'count' THEN SUM(f.sample_count)
    ELSE AVG(f.kpi_value)
  END AS kpi_value,
  kpi.unit
FROM public.fact_kpi_values_daily f
JOIN public.kpi_catalog kpi
  ON f.kpi_key = kpi.kpi_key
  AND kpi.is_active = TRUE
WHERE f.tenant_id = get_user_tenant_id(auth.uid())
  AND f.period_date >= CURRENT_DATE - INTERVAL '6 months'
  AND f.kpi_key IN (
    'kpi_completion_rate',
    'kpi_engagement_score',
    'kpi_quiz_avg_score',
    'kpi_impact_avg_score'
  )
GROUP BY DATE_TRUNC('month', f.period_date), f.kpi_key, kpi.name_ar, kpi.aggregation, kpi.unit
ORDER BY month DESC, f.kpi_key;
```

---

## 8) التوقيع والاعتماد

### Approved By

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Solution Architect** | _____________________________ | _______________ | _______________ |
| **Product Owner** | _____________________________ | _______________ | _______________ |
| **Data Engineer Lead** | _____________________________ | _______________ | _______________ |
| **Platform Admin** | _____________________________ | _______________ | _______________ |

### Notes

```
Change Log:
- v1.0 (2025-01-15): Initial KPI Catalog with 30+ KPIs across 8 categories
- Covers Gate-I (Awareness), Gate-J (Impact), Gate-F (Reports), Gate-H (Action Plans)
- Includes dimension definitions, trend windows, and anomaly detection rules
- Established change control process for KPI versioning

Pending Items:
- [ ] Finalize Gate-H Action Plans KPIs (pending schema confirmation)
- [ ] Add ML-based anomaly detection (planned for v2)
- [ ] Cross-tenant benchmarking KPIs (planned for v3, requires legal review)
- [ ] Natural Language Query support (planned for v3)

Next Steps:
1. Implement kpi_catalog table schema (Gate-K Part 1)
2. Create fact_kpi_values_daily table + RLS (Gate-K Part 1)
3. Build dimension tables (dim_department, dim_campaign_type, etc.)
4. Develop KPI computation Edge Functions (Gate-K Part 2)
5. Build Analytics APIs (GET /api/analytics/kpis, etc.) (Gate-K Part 3)
6. Create UI Dashboards (Overview, Trends, RCA, etc.) (Gate-K Part 4)
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-15  
**Owner**: Romuz Awareness Team — Gate-K  
**Status**: Approved for Implementation  
**Classification**: Internal — Multi-Tenant SaaS Architecture

---

## ملاحق (Appendices)

### Appendix A: جدول Fact Table Schema

```sql
-- Fact table for storing daily KPI values
CREATE TABLE public.fact_kpi_values_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  kpi_key TEXT NOT NULL,
  period_date DATE NOT NULL,
  kpi_value NUMERIC NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  
  -- Dimension foreign keys (nullable for aggregate KPIs)
  dimension_department_id UUID,
  dimension_campaign_id UUID,
  dimension_location_id UUID,
  dimension_channel_id TEXT,
  dimension_user_role TEXT,
  
  -- Metadata
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_quality_score NUMERIC, -- 0-100, based on completeness/accuracy
  notes TEXT,
  
  -- Unique constraint
  UNIQUE(tenant_id, kpi_key, period_date, 
         COALESCE(dimension_department_id::TEXT, ''), 
         COALESCE(dimension_campaign_id::TEXT, ''),
         COALESCE(dimension_location_id::TEXT, ''),
         COALESCE(dimension_channel_id, ''),
         COALESCE(dimension_user_role, ''))
);

-- Indexes
CREATE INDEX idx_fact_kpi_tenant ON public.fact_kpi_values_daily(tenant_id);
CREATE INDEX idx_fact_kpi_key ON public.fact_kpi_values_daily(kpi_key);
CREATE INDEX idx_fact_kpi_date ON public.fact_kpi_values_daily(period_date DESC);
CREATE INDEX idx_fact_kpi_composite ON public.fact_kpi_values_daily(tenant_id, kpi_key, period_date);

-- RLS
ALTER TABLE public.fact_kpi_values_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KPI values in their tenant"
  ON public.fact_kpi_values_daily
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));
```

### Appendix B: Example API Response

```json
{
  "kpi": {
    "key": "kpi_completion_rate",
    "name": "معدل الإكمال",
    "description": "نسبة الموظفين الذين أكملوا الحملة",
    "unit": "%",
    "source": "Gate-I: mv_awareness_campaign_kpis"
  },
  "current_period": {
    "period": "2025-01-14",
    "value": 78.5,
    "sample_count": 1250,
    "data_quality_score": 95
  },
  "trend": {
    "window": "W12",
    "baseline": 75.2,
    "delta": 3.3,
    "delta_pct": 4.39,
    "direction": "up",
    "anomaly_flag": false,
    "anomaly_severity": "normal"
  },
  "dimensions": {
    "department": "IT",
    "campaign_type": "security_awareness"
  }
}
```

---

**End of Document**
