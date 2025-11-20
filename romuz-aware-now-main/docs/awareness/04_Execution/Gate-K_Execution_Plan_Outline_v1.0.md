# Gate-K — Continuous Improvement Analytics — Execution Plan Outline (v1.0)

## نظرة عامة

هذا المستند يحدد خطة التنفيذ التفصيلية لـ Gate-K (Continuous Improvement Analytics v1)، والذي يُمثل طبقة التحليلات المتقدمة والتحسين المستمر للمنصة. يتماشى Gate-K مع Gate-I (Awareness Campaign Insights)، Gate-J (Impact Scores)، Gate-F (Reports & Exports)، و Gate-H (Action Plans).

---

## 1) Data Contracts

### المصادر (Sources)
- **Gate-I**: Awareness Campaign Insights
  - Views: `awareness_campaign_kpis`, `awareness_daily_engagement`
  - Freshness: Real-time (via Realtime Subscriptions) + Materialized Views (refresh every 15 min)
  - Owner: Awareness Team
  - Fallback: Last known good data (with `stale_data` flag)

- **Gate-J**: Impact Scores & Validation
  - Tables: `awareness_impact_scores`, `awareness_impact_validation`
  - Freshness: Daily (computed via `compute-impact-scores` Edge Function)
  - Owner: Impact Team
  - Fallback: Previous period scores (with warning flag)

- **Gate-F**: Reports & Exports
  - Views: `report_kpi_daily`, `report_kpi_ctd`
  - Freshness: Daily (refreshed via `refresh-kpis` Edge Function)
  - Owner: Reports Team
  - Fallback: Cached reports (up to 24h old)

- **Gate-H**: Action Plans (if available)
  - Tables: `action_plans`, `action_plan_tasks`
  - Freshness: Real-time
  - Owner: Action Plans Team
  - Fallback: Empty state (no action plans linked)

### Freshness Targets
- **Real-time**: ≤ 5 seconds (for transactional data)
- **Near Real-time**: ≤ 15 minutes (for aggregated views)
- **Daily Batch**: ≤ 24 hours (for heavy computations)

### Ownership & Fallback Modes
- كل Data Contract يحدد: Schema, SLA, Owner, Fallback Mode, Contact Info
- Fallback Modes: Last Known Good Data, Empty State, Error State (with user notification)

---

## 2) KPI Catalog & Dimensions

### KPIs (Single Source of Truth)
إنشاء جدول `kpi_catalog` يحتوي على:
```sql
CREATE TABLE public.kpi_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  kpi_code TEXT NOT NULL UNIQUE, -- e.g., 'completion_rate', 'avg_impact_score'
  kpi_name_ar TEXT NOT NULL,
  kpi_name_en TEXT NOT NULL,
  formula TEXT, -- Human-readable formula
  unit TEXT, -- e.g., '%', 'score', 'count'
  source_gate TEXT, -- e.g., 'Gate-I', 'Gate-J'
  source_view TEXT, -- e.g., 'awareness_campaign_kpis'
  dimensions JSONB, -- e.g., ['campaign_id', 'org_unit_id', 'owner_id']
  grain TEXT, -- e.g., 'daily', 'monthly', 'quarterly'
  time_windows JSONB, -- e.g., ['WoW', 'MoM', 'QoQ']
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Dimensions (للتحليل متعدد الأبعاد)
- **Campaign**: campaign_id, campaign_name, owner_id
- **Org Unit**: org_unit_id, org_unit_name
- **Time**: date, week, month, quarter, year
- **Content**: content_type, module_id
- **User Segment**: role, department, location

### Grain (مستوى التفصيل)
- **Daily**: أدق مستوى تفصيل (لجميع KPIs)
- **Weekly**: تجميع أسبوعي (لـ Trend Analysis)
- **Monthly**: تجميع شهري (لـ MoM Comparisons)
- **Quarterly**: تجميع فصلي (لـ Executive Reports)

### Time Windows (نوافذ المقارنة)
- **WoW** (Week-over-Week): مقارنة الأسبوع الحالي بالأسبوع السابق
- **MoM** (Month-over-Month): مقارنة الشهر الحالي بالشهر السابق
- **QoQ** (Quarter-over-Quarter): مقارنة الربع الحالي بالربع السابق

### SSOT Policy (سياسة المصدر الوحيد)
- جميع التطبيقات (UI, Reports, APIs) تقرأ من `kpi_catalog`
- أي تغيير في KPI Definition يتطلب:
  - Version Increment
  - Change Log Entry
  - Approval من Product Owner
  - Backward Compatibility Check

---

## 3) Trends & Delta Computation

### Materialized Views Strategy
إنشاء Materialized Views لتسريع Trend Queries:

```sql
-- Weekly Trends
CREATE MATERIALIZED VIEW public.kpi_trends_weekly AS
SELECT 
  tenant_id,
  kpi_code,
  DATE_TRUNC('week', date) AS week_start,
  AVG(kpi_value) AS avg_value,
  COUNT(*) AS sample_count
FROM public.kpi_values
GROUP BY tenant_id, kpi_code, week_start;

-- Refresh Strategy: Daily at 2 AM
CREATE OR REPLACE FUNCTION refresh_kpi_trends()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.kpi_trends_weekly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.kpi_trends_monthly;
END;
$$ LANGUAGE plpgsql;
```

### Thresholds & Anomaly Flags (Rule-based v1)
إنشاء جدول `anomaly_thresholds` لتحديد العتبات (Thresholds):

```sql
CREATE TABLE public.anomaly_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  kpi_code TEXT NOT NULL,
  threshold_type TEXT NOT NULL, -- 'absolute', 'percentage', 'stddev'
  threshold_value NUMERIC NOT NULL,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Anomaly Detection Logic (v1)**:
1. حساب Baseline (Average من آخر 4 أسابيع)
2. حساب Delta: `(current_value - baseline) / baseline * 100`
3. مقارنة Delta بـ Threshold:
   - Delta > 20% → `high` severity anomaly
   - Delta > 10% → `medium` severity anomaly
   - Delta > 5% → `low` severity anomaly

**Output**: إضافة `is_anomaly` و `anomaly_severity` flags إلى KPI Values

---

## 4) RCA Engine (v1)

### Contributor Scoring
**الهدف**: تحديد Top-5 Contributors إلى التغيير في أي KPI.

**Algorithm (v1)**:
1. حساب Contribution Score لكل Dimension Value:
   ```
   Contribution Score = (Dimension Delta × Dimension Weight) / Total Delta
   ```
2. ترتيب Contributors حسب Contribution Score (تنازلياً)
3. اختيار Top-5

**Dimensions للتحليل**:
- Campaign
- Org Unit
- Owner
- Content Type
- User Segment

### Drill-down Dimensions
**API Endpoints**:
```typescript
// GET /api/analytics/rca/:kpi_code/drill-down
// Query Params: dimension, start_date, end_date, tenant_id
// Response: { contributors: [...], confidence_score: 0.85 }
```

**Confidence Score (v1)**:
- 100%: جميع Dimensions متوفرة + Data Quality High
- 80-99%: معظم Dimensions متوفرة + Data Quality Good
- 60-79%: بعض Dimensions مفقودة + Data Quality Fair
- < 60%: بيانات غير كافية (Low Confidence)

---

## 5) Recommendations (v1)

### Rule Templates
إنشاء جدول `recommendation_templates`:

```sql
CREATE TABLE public.recommendation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id), -- NULL = Platform-level
  template_code TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  trigger_condition JSONB, -- e.g., {"kpi": "completion_rate", "operator": "<", "value": 50}
  severity TEXT NOT NULL, -- 'info', 'warn', 'critical'
  impact TEXT NOT NULL, -- 'low', 'medium', 'high'
  effort TEXT NOT NULL, -- 'low', 'medium', 'high'
  action_type TEXT, -- Linked to Gate-H (e.g., 'increase_reminders', 'review_content')
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**مثال على Rule**:
```json
{
  "template_code": "LOW_COMPLETION_RATE",
  "title_en": "Low Completion Rate Detected",
  "trigger_condition": {
    "kpi": "completion_rate",
    "operator": "<",
    "value": 50,
    "time_window": "last_week"
  },
  "severity": "warn",
  "impact": "high",
  "effort": "medium",
  "action_type": "increase_reminders"
}
```

### Severity / Impact / Effort Mapping
- **Severity**: مدى خطورة المشكلة (info, warn, critical)
- **Impact**: تأثير التوصية على الـ KPI (low, medium, high)
- **Effort**: الجهد المطلوب لتنفيذ التوصية (low, medium, high)

### Link to Gate-H Action Types
- كل توصية يمكن ربطها بـ Action Plan في Gate-H
- عند قبول التوصية، يتم إنشاء Action Plan تلقائياً (optional)

---

## 6) Quarterly Insights Generator

### Executive Summary (Markdown + JSON Export)
**الهدف**: توليد تقرير فصلي تلقائياً للإدارة التنفيذية.

**Sections**:
1. **Overview**: ملخص الأداء الفصلي (Top-3 KPIs)
2. **Key Trends**: أهم الاتجاهات (WoW, MoM, QoQ)
3. **Root Causes**: أهم Contributors للتغييرات
4. **Recommendations**: Top-3 Recommended Initiatives

**Output Formats**:
- Markdown (for viewing in UI)
- JSON (for API consumption)
- PDF (via Gate-F Export API)

### Top-3 Initiatives Selection Logic
**Criteria**:
1. **Impact**: التأثير المتوقع على KPIs (high > medium > low)
2. **Effort**: الجهد المطلوب (low > medium > high)
3. **Alignment**: التماشي مع استراتيجية Tenant (via Tags/Goals)

**Scoring Formula**:
```
Initiative Score = (Impact Weight × Impact Value) + (Effort Weight × Effort Value) + (Alignment Weight × Alignment Value)
```

**Default Weights**:
- Impact: 50%
- Effort: 30%
- Alignment: 20%

---

## 7) APIs (Read-only v1)

### Endpoints

```typescript
// KPI Catalog
GET /api/analytics/kpis
GET /api/analytics/kpis/:kpi_code

// Trends
GET /api/analytics/trends/:kpi_code
  ?time_window=WoW|MoM|QoQ
  &start_date=2025-01-01
  &end_date=2025-03-31
  &tenant_id=xxx

// RCA
GET /api/analytics/rca/:kpi_code
  ?dimension=campaign|org_unit|owner
  &start_date=2025-01-01
  &end_date=2025-03-31
  &tenant_id=xxx

// Recommendations
GET /api/analytics/recommendations
  ?severity=info|warn|critical
  &tenant_id=xxx

// Quarterly Insights
GET /api/analytics/quarterly-insights
  ?quarter=2025-Q1
  &tenant_id=xxx
```

### RBAC Mapping
| Permission | Tenant Admin | Manager | Reader |
|------------|--------------|---------|--------|
| `analytics:view_kpis` | ✅ | ✅ | ✅ |
| `analytics:view_trends` | ✅ | ✅ | ✅ |
| `analytics:view_rca` | ✅ | ✅ | ❌ |
| `analytics:view_recommendations` | ✅ | ✅ | ❌ |
| `analytics:manage_templates` | ✅ | ❌ | ❌ |

### Pagination
- **Default Page Size**: 20
- **Max Page Size**: 100
- **Response Format**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

---

## 8) UI Dashboards

### Dashboard 1: Overview
**الهدف**: لوحة تحكم رئيسية تعرض أهم KPIs.

**Components**:
- KPI Cards (Top-5 KPIs with Delta and Anomaly Flags)
- Trend Chart (Last 12 Weeks)
- Quick Filters (Date Range, Campaign, Org Unit)

**Route**: `/admin/analytics/overview`

### Dashboard 2: Trends
**الهدف**: تحليل الاتجاهات التفصيلية لكل KPI.

**Components**:
- KPI Selector (Dropdown)
- Time Window Selector (WoW, MoM, QoQ)
- Trend Chart (with Anomaly Flags)
- Comparison Table (Current vs Previous Period)

**Route**: `/admin/analytics/trends`

### Dashboard 3: RCA
**الهدف**: تحليل الأسباب الجذرية للتغييرات.

**Components**:
- KPI Selector
- Dimension Selector (Campaign, Org Unit, Owner, etc.)
- Contributors Table (Top-5 with Contribution Score)
- Drill-down Chart

**Route**: `/admin/analytics/rca`

### Dashboard 4: Recommendations
**الهدف**: عرض التوصيات الآلية.

**Components**:
- Recommendations Table (with Severity, Impact, Effort)
- Filters (Severity, Status)
- Action Buttons (Accept, Dismiss, Create Action Plan)

**Route**: `/admin/analytics/recommendations`

### Dashboard 5: Quarterly
**الهدف**: عرض حزمة الرؤى الفصلية.

**Components**:
- Executive Summary (Markdown Viewer)
- Top-3 KPI Trends (Charts)
- Top-3 Initiatives (Cards)
- Export Button (PDF, JSON)

**Route**: `/admin/analytics/quarterly`

### Export Hooks (CSV/JSON via Gate-F)
- جميع الـ Dashboards تحتوي على Export Button
- Export يتم عبر Gate-F Reports Export API
- Supported Formats: CSV, JSON, XLSX, PDF

---

## 9) Observability & Tests

### Data Freshness Monitors
**الهدف**: التأكد من أن البيانات محدثة وفقاً لـ SLA.

**Implementation**:
- إضافة `refreshed_at` timestamp لكل View/Table
- إنشاء Monitoring Query:
```sql
SELECT 
  view_name,
  MAX(refreshed_at) AS last_refresh,
  NOW() - MAX(refreshed_at) AS staleness
FROM public.kpi_views_metadata
GROUP BY view_name
HAVING NOW() - MAX(refreshed_at) > INTERVAL '30 minutes';
```
- إرسال Alert عند تجاوز SLA (via Gate-E Observability)

### Data Quality Checks
**Checks**:
1. **Completeness**: No missing required fields
2. **Consistency**: Cross-gate data alignment (e.g., Gate-I vs Gate-F)
3. **Accuracy**: Spot-check against source data
4. **Timeliness**: Data refreshed within SLA

**Implementation**:
- إنشاء Edge Function `data-quality-check` يعمل Daily
- Logs DQ Issues في `data_quality_log` Table
- Sends Alerts for Critical Issues

### Unit/Integration Tests
**Coverage Targets**:
- Unit Tests: ≥ 70% (for Business Logic)
- Integration Tests: ≥ 80% (for APIs)

**Test Suites**:
- `/tests/unit/analytics/` (KPI Computations, RCA Logic, Recommendation Rules)
- `/tests/integration/analytics/` (API Endpoints, Data Contracts, RLS)

---

## 10) Packaging & Handover

### Contents of `Gate-K_Full_Package_v1.0_AR.zip`

```
Gate-K_Full_Package_v1.0_AR/
├── 01_Documentation/
│   ├── Gate-K_Acceptance_Checklist_v1.0.md
│   ├── Gate-K_Execution_Plan_Outline_v1.0.md
│   ├── Gate-K_Architecture_Overview.md
│   ├── Gate-K_Data_Contracts.md
│   ├── Gate-K_KPI_Catalog.md
│   ├── Gate-K_RCA_Algorithm.md
│   ├── Gate-K_Recommendation_Rules.md
│   └── Gate-K_API_Reference.md
├── 02_Database/
│   ├── schema_kpi_catalog.sql
│   ├── schema_anomaly_thresholds.sql
│   ├── schema_recommendation_templates.sql
│   ├── views_kpi_trends.sql
│   ├── rls_policies.sql
│   └── seed_data.sql
├── 03_Edge_Functions/
│   ├── compute-kpi-trends/
│   ├── detect-anomalies/
│   ├── generate-recommendations/
│   ├── generate-quarterly-insights/
│   └── data-quality-check/
├── 04_Frontend/
│   ├── pages/admin/analytics/
│   ├── components/analytics/
│   ├── hooks/analytics/
│   └── types/analytics.ts
├── 05_Tests/
│   ├── unit/analytics/
│   ├── integration/analytics/
│   └── e2e/analytics/
├── 06_Deployment/
│   ├── deployment_checklist.md
│   ├── migration_scripts.sql
│   └── ci_cd_config.yml
└── README.md
```

### Versioning & Sign-off Workflow
1. **Draft** (v0.x): Initial development
2. **Review** (v0.9): Internal review by Team
3. **Approval** (v1.0): Sign-off by Solution Architect & Product Owner
4. **Release** (v1.0): Deployment to Production

**Sign-off Checklist**:
- [ ] All Acceptance Criteria Met
- [ ] All Tests Passed (Unit + Integration + E2E)
- [ ] Documentation Complete
- [ ] Security Review Passed
- [ ] Performance Benchmarking Passed
- [ ] Solution Architect Approval
- [ ] Product Owner Approval

---

## Timeline

### Phase 1: Data Foundation (Week 1-2)
- Data Contracts Documentation
- KPI Catalog Schema
- Materialized Views for Trends
- **Deliverable**: Working KPI Catalog + Trend Views

### Phase 2: Analytics Engine (Week 3-4)
- Anomaly Detection Rules
- RCA Algorithm Implementation
- Recommendation Engine (v1)
- **Deliverable**: Working Analytics APIs

### Phase 3: Quarterly Insights (Week 5)
- Quarterly Insights Generator (Edge Function)
- Scheduled Job Setup
- PDF/JSON Export Integration
- **Deliverable**: Automated Quarterly Reports

### Phase 4: UI Dashboards (Week 6-7)
- Overview Dashboard
- Trends Dashboard
- RCA Dashboard
- Recommendations Dashboard
- Quarterly Dashboard
- **Deliverable**: Complete UI Suite

### Phase 5: Testing & Observability (Week 8)
- Unit Tests (≥ 70% coverage)
- Integration Tests (≥ 80% coverage)
- Data Quality Checks
- Performance Benchmarking
- **Deliverable**: Production-ready System

### Phase 6: Documentation & Handover (Week 9)
- Technical Documentation
- User Guide (AR/EN)
- Deployment Guide
- `Gate-K_Full_Package_v1.0_AR.zip`
- **Deliverable**: Complete Package + Sign-off

**Total Duration**: 9 Weeks

---

## Risks & Mitigations

| # | Risk | Impact | Probability | Mitigation |
|---|------|--------|-------------|------------|
| 1 | **Data Source Unavailability**: Gate-I/J/F data not available during development | High | Medium | Use Mock Data + Fallback Modes + Early Integration Tests |
| 2 | **Performance Issues**: KPI Queries too slow (> 2s) | High | Medium | Use Materialized Views + Indexes + Caching Strategy |
| 3 | **RCA Algorithm Accuracy**: RCA v1 produces low-confidence results | Medium | Medium | Calibration with Real Data + Confidence Score Threshold |
| 4 | **Recommendation Relevance**: Rule-based recommendations not relevant | Medium | High | Tenant-specific Template Customization + Feedback Loop |
| 5 | **Scope Creep**: Additional KPIs/Dimensions requested mid-development | Medium | High | Strict Change Control + Version 2.0 Backlog |

---

## Dependencies

### Gate-I (Awareness Campaign Insights)
- **Dependency**: `awareness_campaign_kpis` View must be stable and performant
- **Impact**: Gate-K KPI Catalog relies on Gate-I data
- **Mitigation**: Early integration testing + Fallback to cached data

### Gate-J (Impact Scores)
- **Dependency**: `awareness_impact_scores` Table must include all required fields
- **Impact**: RCA and Quarterly Insights depend on Impact Scores
- **Mitigation**: Data Contract validation + Mock data for testing

### Gate-F (Reports & Exports)
- **Dependency**: Gate-F Export API must support CSV/JSON/PDF
- **Impact**: Dashboard Export functionality depends on Gate-F
- **Mitigation**: Use Gate-F API contract + Fallback to basic CSV export

### Gate-H (Action Plans) - Optional
- **Dependency**: `action_plans` Table schema (if available)
- **Impact**: Recommendations can link to Action Plans
- **Mitigation**: Graceful degradation if Gate-H not available

---

## Out-of-Scope (for v1)

### Excluded from v1 (Planned for v2+)
1. **Machine Learning Models**: ML-based Anomaly Detection (v2)
2. **Predictive Analytics**: Forecasting future KPIs (v2)
3. **Advanced RCA**: Multi-dimensional regression analysis (v2)
4. **Custom Dashboards**: User-created dashboards (v2)
5. **Real-time Alerts**: Push notifications for anomalies (Gate-E integration in v2)
6. **Benchmark Comparisons**: Cross-tenant benchmarking (v3, requires legal review)
7. **Natural Language Queries**: "Ask AI" feature for KPIs (v3)

### Technical Debt (To Address Post-v1)
- Migrate from Rule-based to ML-based Recommendations
- Optimize Materialized Views refresh strategy
- Add more granular RBAC for KPI access
- Implement KPI versioning UI (currently Admin-only)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-15  
**Owner**: Romuz Awareness Team  
**Status**: Draft
