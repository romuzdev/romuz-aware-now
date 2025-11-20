# Gate-K — نماذج API للقراءة فقط (v1.0)

**المشروع:** Romuz Cybersecurity Culture Platform  
**الوحدة:** Gate-K — Continuous Improvement Analytics  
**النسخة:** v1.0  
**التاريخ:** 2025-11-11

---

## 1. نظرة عامة

توفر واجهات API في Gate-K إمكانية الوصول للقراءة فقط (Read-Only) إلى:
- **كتالوج KPI** (Catalog) — تعريفات وتكوينات المؤشرات
- **سلاسل البيانات** (Series) — قيم المؤشرات الزمنية التاريخية
- **الاتجاهات الشهرية** (Trends) — تجميعات وإحصائيات متقدمة
- **التوصيات** (Recommendations) — اقتراحات محسوبة بناءً على التحليل
- **الرؤى الفصلية** (Quarterly Insights) — ملخصات تنفيذية

---

## 2. خصائص عامة

### 2.1 المصادقة (Authentication)
- **نوع المصادقة:** JWT Bearer Token  
- **رأس الطلب:** `Authorization: Bearer <token>`  
- **المصدر:** Supabase Auth (`auth.uid()`)

### 2.2 نطاق الـ Tenant (Tenant Isolation)
- جميع الـ Endpoints تُطبق عزل تلقائي بناءً على `tenant_id`
- لا يمكن للمستخدمين الوصول إلى بيانات tenants أخرى
- يتم استخراج `tenant_id` من الـ JWT token تلقائياً

### 2.3 RBAC (التحكم بالصلاحيات)
| Role | Catalog | Series | Trends | Recommendations | Insights |
|------|---------|--------|--------|-----------------|----------|
| `platform_admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tenant_admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `analyst` | ✅ (Read) | ✅ (Read) | ✅ (Read) | ✅ (Read) | ❌ |
| `manager` | ✅ (Read) | ✅ (Read) | ✅ (Read) | ❌ | ❌ |
| `viewer` | ✅ (Read) | ❌ | ❌ | ❌ | ❌ |

### 2.4 ترقيم الصفحات (Pagination)
- **افتراضي:** `limit=50`, `offset=0`
- **الحد الأقصى:** `limit=500`
- **البنية:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 234,
    "has_more": true
  }
}
```

### 2.5 التنسيقات المدعومة
- **JSON** (افتراضي)
- **CSV** (عبر query param: `?format=csv`)

### 2.6 أكواد الأخطاء
| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request — معلمات غير صحيحة |
| `401` | Unauthorized — مصادقة مفقودة أو منتهية |
| `403` | Forbidden — صلاحيات غير كافية |
| `404` | Not Found — المورد غير موجود |
| `429` | Too Many Requests — تجاوز حد المعدل |
| `500` | Internal Server Error — خطأ في الخادم |

---

## 3. Endpoints التفصيلية

### 3.1 GET /api/v1/kpi/catalog

**الوصف:** استرجاع كتالوج المؤشرات (KPI Definitions)

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kpi_key` | `string` | ❌ | تصفية حسب مفتاح KPI محدد |
| `grain` | `enum` | ❌ | `daily`, `weekly`, `monthly`, `quarterly` |
| `is_active` | `boolean` | ❌ | `true` — نشط فقط (افتراضي) |
| `version` | `string` | ❌ | مثال: `v1.0`, `v2.0` |
| `limit` | `integer` | ❌ | الحد الأقصى للنتائج (افتراضي: 50) |
| `offset` | `integer` | ❌ | تخطي النتائج (افتراضي: 0) |

#### Response Schema (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid|null",
      "kpi_key": "string",
      "name_ar": "string",
      "name_en": "string|null",
      "description_ar": "string",
      "description_en": "string|null",
      "formula": "string",
      "unit": "string",
      "aggregation": "enum[sum,avg,count,max,min]",
      "grain": "enum[daily,weekly,monthly,quarterly]",
      "default_trend_window": "enum[W12,M6,Q4,none]",
      "dimensions": ["string"],
      "source_system": "string",
      "source_table": "string|null",
      "freshness_target": "string",
      "owner_role": "string",
      "version": "string",
      "is_active": "boolean",
      "effective_from": "date",
      "effective_to": "date|null",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 25,
    "has_more": false
  }
}
```

#### Validation Rules
- `kpi_key`: alphanumeric + underscore, max 100 chars
- `version`: semver format (e.g., `v1.0`, `v2.1`)
- `limit`: 1-500
- `offset`: >= 0

#### RBAC
- **Allowed:** `platform_admin`, `tenant_admin`, `analyst`, `manager`, `viewer`

#### Error Examples
```json
// 400 Bad Request
{
  "error": "invalid_parameter",
  "message": "Invalid grain value. Must be one of: daily, weekly, monthly, quarterly"
}

// 401 Unauthorized
{
  "error": "unauthorized",
  "message": "Missing or invalid authentication token"
}

// 403 Forbidden
{
  "error": "forbidden",
  "message": "Insufficient permissions to access KPI catalog"
}
```

---

### 3.2 GET /api/v1/kpi/series

**الوصف:** استرجاع سلاسل البيانات الزمنية (Time Series)

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kpi_key` | `string` | ✅ | مفتاح KPI المطلوب |
| `from_date` | `date` | ❌ | تاريخ البداية (ISO 8601: `YYYY-MM-DD`) |
| `to_date` | `date` | ❌ | تاريخ النهاية (ISO 8601: `YYYY-MM-DD`) |
| `trend_window` | `enum` | ❌ | `W12`, `M6`, `Q4`, `none` |
| `dim_department` | `string` | ❌ | تصفية حسب القسم |
| `dim_campaign_type` | `string` | ❌ | تصفية حسب نوع الحملة |
| `dim_channel` | `string` | ❌ | تصفية حسب القناة |
| `dim_location` | `string` | ❌ | تصفية حسب الموقع |
| `dim_audience_segment` | `string` | ❌ | تصفية حسب الفئة المستهدفة |
| `limit` | `integer` | ❌ | الحد الأقصى (افتراضي: 500) |
| `offset` | `integer` | ❌ | تخطي النتائج (افتراضي: 0) |

#### Response Schema (200 OK)
```json
{
  "data": [
    {
      "id": "bigint",
      "tenant_id": "uuid",
      "kpi_key": "string",
      "ts": "date",
      "value": "numeric",
      "trend_window": "enum[W12,M6,Q4,none]",
      "dim_department": "string|null",
      "dim_campaign_type": "string|null",
      "dim_channel": "string|null",
      "dim_location": "string|null",
      "dim_audience_segment": "string|null",
      "dim_content_theme": "string|null",
      "dim_device_type": "string|null",
      "dim_user_role": "string|null",
      "sample_size": "integer|null",
      "is_anomaly": "boolean",
      "anomaly_severity": "enum[normal,moderate,severe]|null",
      "meta": "jsonb",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "limit": 500,
    "offset": 0,
    "total": 1250,
    "has_more": true
  }
}
```

#### Validation Rules
- `kpi_key`: required, max 100 chars
- `from_date`, `to_date`: ISO 8601 format (`YYYY-MM-DD`)
- Date range max: 2 years
- `limit`: 1-1000 (default: 500)

#### RBAC
- **Allowed:** `platform_admin`, `tenant_admin`, `analyst`, `manager`

#### Error Examples
```json
// 400 Bad Request
{
  "error": "invalid_date_range",
  "message": "from_date must be before to_date"
}

// 404 Not Found
{
  "error": "kpi_not_found",
  "message": "KPI with key 'invalid_key' does not exist"
}
```

---

### 3.3 GET /api/v1/kpi/trends/monthly

**الوصف:** استرجاع الاتجاهات الشهرية المُجمَّعة (Monthly Aggregates)

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kpi_key` | `string` | ❌ | تصفية حسب KPI محدد |
| `trend_window` | `enum` | ❌ | `W12`, `M6`, `Q4` |
| `from_month` | `date` | ❌ | شهر البداية (`YYYY-MM-01`) |
| `to_month` | `date` | ❌ | شهر النهاية (`YYYY-MM-01`) |
| `limit` | `integer` | ❌ | الحد الأقصى (افتراضي: 100) |
| `offset` | `integer` | ❌ | تخطي النتائج (افتراضي: 0) |

#### Response Schema (200 OK)
```json
{
  "data": [
    {
      "tenant_id": "uuid",
      "kpi_key": "string",
      "month": "date",
      "trend_window": "enum[W12,M6,Q4]",
      "sample_count": "bigint",
      "avg_value": "numeric",
      "stddev_value": "numeric",
      "min_value": "numeric",
      "max_value": "numeric",
      "p50_value": "numeric",
      "p95_value": "numeric",
      "delta_pct": "numeric",
      "anomaly_count": "bigint"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 48,
    "has_more": false
  }
}
```

#### Validation Rules
- `from_month`, `to_month`: First day of month (`YYYY-MM-01`)
- Date range max: 3 years
- `limit`: 1-500

#### RBAC
- **Allowed:** `platform_admin`, `tenant_admin`, `analyst`, `manager`

---

### 3.4 GET /api/v1/kpi/recommendations

**الوصف:** استرجاع التوصيات المحسوبة

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | `string` | ❌ | مثال: `Q1-2025`, `Q2-2025` |
| `severity` | `enum` | ❌ | `low`, `medium`, `high`, `critical` |
| `status` | `enum` | ❌ | `pending`, `in_progress`, `completed`, `dismissed` |
| `limit` | `integer` | ❌ | الحد الأقصى (افتراضي: 20) |
| `offset` | `integer` | ❌ | تخطي النتائج (افتراضي: 0) |

#### Response Schema (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "kpi_key": "string",
      "recommendation_type": "enum[action,alert,insight]",
      "title_ar": "string",
      "title_en": "string|null",
      "description_ar": "string",
      "description_en": "string|null",
      "severity": "enum[low,medium,high,critical]",
      "impact_score": "numeric",
      "effort_score": "numeric",
      "priority_rank": "integer",
      "trigger_condition": "string",
      "suggested_actions": ["string"],
      "linked_gate_h_action_type": "string|null",
      "status": "enum[pending,in_progress,completed,dismissed]",
      "created_at": "timestamp",
      "expires_at": "timestamp|null"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 12,
    "has_more": false
  }
}
```

#### Validation Rules
- `period`: Format `Q[1-4]-YYYY`
- `limit`: 1-100

#### RBAC
- **Allowed:** `platform_admin`, `tenant_admin`, `analyst`

---

### 3.5 GET /api/v1/insights/quarterly

**الوصول:** استرجاع الرؤى الفصلية التنفيذية

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | `integer` | ✅ | السنة (مثال: 2025) |
| `quarter` | `integer` | ✅ | الربع (1-4) |
| `format` | `enum` | ❌ | `json` (افتراضي), `markdown` |

#### Response Schema (200 OK - JSON)
```json
{
  "tenant_id": "uuid",
  "period": "Q1-2025",
  "generated_at": "timestamp",
  "executive_summary": {
    "overall_health_score": "numeric",
    "trend": "enum[improving,stable,declining]",
    "key_findings": ["string"],
    "critical_alerts": ["string"]
  },
  "top_kpis": [
    {
      "kpi_key": "string",
      "name_ar": "string",
      "current_value": "numeric",
      "previous_value": "numeric",
      "change_pct": "numeric",
      "status": "enum[on_track,at_risk,critical]"
    }
  ],
  "top_initiatives": [
    {
      "initiative_id": "uuid",
      "title_ar": "string",
      "impact_score": "numeric",
      "effort_score": "numeric",
      "roi_estimate": "numeric",
      "alignment_score": "numeric"
    }
  ],
  "risk_areas": [
    {
      "area": "string",
      "severity": "enum[low,medium,high,critical]",
      "affected_kpis": ["string"],
      "recommended_actions": ["string"]
    }
  ]
}
```

#### Response Schema (200 OK - Markdown)
```markdown
# Gate-K — تقرير الرؤى الفصلية
**الفترة:** Q1-2025  
**تاريخ التوليد:** 2025-04-01 14:30 UTC

## الملخص التنفيذي
...

## أهم المؤشرات (Top KPIs)
...

## أفضل 3 مبادرات موصى بها
...
```

#### Validation Rules
- `year`: 2020-2099
- `quarter`: 1-4

#### RBAC
- **Allowed:** `platform_admin`, `tenant_admin`

---

## 4. Rate Limits (حدود المعدل)

| Role | Requests/Minute | Requests/Hour | Burst |
|------|-----------------|---------------|-------|
| `platform_admin` | 1000 | 50,000 | 100 |
| `tenant_admin` | 500 | 20,000 | 50 |
| `analyst` | 300 | 10,000 | 30 |
| `manager` | 100 | 3,000 | 20 |
| `viewer` | 50 | 1,000 | 10 |

عند تجاوز الحد:
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Retry after 60 seconds.",
  "retry_after": 60,
  "limit": 300,
  "remaining": 0
}
```

Headers:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699999999
```

---

## 5. Webhooks (اختياري - v1.1+)

للإشعارات الفورية عند:
- إنشاء توصية جديدة (`recommendation.created`)
- اكتشاف شذوذ حرج (`anomaly.detected`)
- تحديث رؤى فصلية (`insights.quarterly.updated`)

مثال Webhook Payload:
```json
{
  "event": "recommendation.created",
  "tenant_id": "uuid",
  "data": {
    "recommendation_id": "uuid",
    "kpi_key": "string",
    "severity": "high"
  },
  "timestamp": "2025-11-11T12:00:00Z"
}
```

---

## 6. Data Freshness (نضارة البيانات)

| Source | Update Frequency | Max Latency |
|--------|------------------|-------------|
| `Gate-I` (Campaigns) | Near Real-Time | < 5 min |
| `Gate-J` (Impact) | Daily 02:00 UTC | < 24h |
| `Gate-F` (Reports) | Daily 02:00 UTC | < 24h |
| `Gate-H` (Actions) | Daily 03:00 UTC | < 24h |
| `Materialized Views` | Hourly | < 60 min |

---

## 7. Versioning (إدارة الإصدارات)

- **Current Version:** `v1.0`
- **API Base URL:** `https://api.romuz.com/v1/`
- **Breaking Changes:** سيتم تقديم إصدار جديد (`v2.0`)
- **Non-Breaking Changes:** سيتم إضافتها إلى `v1.x`
- **Deprecation Notice:** 6 أشهر قبل إزالة endpoint

---

## 8. Examples (أمثلة)

### مثال 1: استرجاع كتالوج KPI
```bash
curl -X GET \
  "https://api.romuz.com/v1/kpi/catalog?grain=weekly&is_active=true&limit=10" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### مثال 2: استرجاع سلسلة بيانات محددة
```bash
curl -X GET \
  "https://api.romuz.com/v1/kpi/series?kpi_key=kpi_completion_rate&from_date=2025-01-01&to_date=2025-03-31&dim_department=HR" \
  -H "Authorization: Bearer <token>"
```

### مثال 3: استرجاع اتجاهات شهرية
```bash
curl -X GET \
  "https://api.romuz.com/v1/kpi/trends/monthly?kpi_key=kpi_engagement_rate&trend_window=M6&from_month=2025-01-01&to_month=2025-06-01" \
  -H "Authorization: Bearer <token>"
```

### مثال 4: استرجاع توصيات حرجة
```bash
curl -X GET \
  "https://api.romuz.com/v1/kpi/recommendations?period=Q1-2025&severity=high&status=pending&limit=5" \
  -H "Authorization: Bearer <token>"
```

### مثال 5: تحميل رؤى فصلية بصيغة Markdown
```bash
curl -X GET \
  "https://api.romuz.com/v1/insights/quarterly?year=2025&quarter=1&format=markdown" \
  -H "Authorization: Bearer <token>" \
  -o insights_Q1_2025.md
```

---

## 9. Support & Contact

- **Documentation:** https://docs.romuz.com/gate-k/api
- **Status Page:** https://status.romuz.com
- **Support Email:** support@romuz.com
- **SLA:** 99.9% uptime

---

## 10. Change Log

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2025-11-11 | Initial release |

---

**توقيع:**  
- **Lead Developer:** [Name]  
- **Solution Architect:** [Name]  
- **Date:** 2025-11-11
