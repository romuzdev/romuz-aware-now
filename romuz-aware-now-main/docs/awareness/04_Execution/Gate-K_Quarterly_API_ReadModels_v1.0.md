# Gate-K: API Endpoints — Quarterly Insights (v1.0)

**المشروع:** Romuz Awareness — Gate-K  
**الغرض:** توثيق الـ API Endpoints للوصول إلى المبادرات الربع سنوية (Read/Generate)

---

## Overview

| Endpoint | Method | الغرض | RBAC |
|----------|--------|-------|------|
| `/insights/quarterly/generate` | POST | توليد insights للربع | analyst, tenant_admin |
| `/insights/quarterly` | GET | قراءة insights | analyst, tenant_admin, viewer (read-only) |

**Base Path:** `/api/gate-k` (أو حسب الـ routing المُعتمد)  
**Authentication:** Required (JWT Bearer token)  
**Content-Type:** `application/json`

---

## 1) POST /insights/quarterly/generate

### الغرض
توليد أو تحديث quarterly insights snapshot للربع المحدد (idempotent operation).

### Request Body

```typescript
interface GenerateQuarterlyInsightsRequest {
  year: number;       // السنة (2020..2100)
  quarter: number;    // الربع (1..4)
  limit?: number;     // عدد المبادرات المُقترحة (default: 100)
}
```

**مثال:**
```json
{
  "year": 2025,
  "quarter": 1,
  "limit": 50
}
```

### Validation Rules

- `year`: integer, required, 2020 <= year <= 2100
- `quarter`: integer, required, 1 <= quarter <= 4
- `limit`: integer, optional, 1 <= limit <= 1000, default = 100

### Response (200 OK)

```typescript
interface GenerateQuarterlyInsightsResponse {
  year: number;
  quarter: number;
  created: boolean;            // true = new, false = updated existing
  initiatives_count: number;   // عدد المبادرات المُولدة
  kpis_count: number;         // عدد الـ KPIs في الملخص
}
```

**مثال:**
```json
{
  "year": 2025,
  "quarter": 1,
  "created": true,
  "initiatives_count": 47,
  "kpis_count": 12
}
```

### SQL RPC Called
```sql
SELECT * FROM public.generate_quarterly_insights(p_year, p_quarter, p_limit);
```

### Error Responses

| Status | Code | الوصف |
|--------|------|-------|
| 400 | INVALID_INPUT | معاملات غير صحيحة (year/quarter خارج النطاق) |
| 401 | UNAUTHORIZED | Missing or invalid JWT token |
| 403 | FORBIDDEN | User lacks required role (analyst, tenant_admin) |
| 404 | NO_DATA | لا توجد بيانات كافية لتوليد insights |
| 429 | RATE_LIMIT | Too many requests |
| 500 | INTERNAL_ERROR | خطأ في الخادم |

**مثال Error Response:**
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Quarter must be between 1 and 4",
    "details": {
      "field": "quarter",
      "value": 5
    }
  }
}
```

### RBAC Rules

| Role | Generate | Notes |
|------|----------|-------|
| `viewer` | ❌ | قراءة فقط |
| `analyst` | ✅ | يمكنه التوليد |
| `tenant_admin` | ✅ | صلاحيات كاملة |
| `platform_admin` | ✅ | (عبر جميع الـ tenants) |

---

## 2) GET /insights/quarterly

### الغرض
قراءة quarterly insights snapshot (واحد أو متعدد).

### Query Parameters

```typescript
interface GetQuarterlyInsightsQuery {
  year?: number;      // تصفية حسب السنة (optional)
  quarter?: number;   // تصفية حسب الربع (optional)
}
```

**أمثلة:**
- `/insights/quarterly?year=2025&quarter=1` → ربع واحد محدد
- `/insights/quarterly?year=2025` → جميع أرباع 2025
- `/insights/quarterly` → جميع الـ insights المتاحة (حسب الـ tenant)

### Response (200 OK)

```typescript
interface GetQuarterlyInsightsResponse {
  data: QuarterlyInsight[];  // Array (قد يكون فارغ)
  count: number;             // عدد النتائج
}

interface QuarterlyInsight {
  id: string;                // UUID
  tenant_id: string;         // UUID
  year: number;
  quarter: number;
  quarter_start: string;     // ISO Date
  kpis_summary: KpiSummaryMap;
  top_initiatives: Initiative[];
  generated_at: string;      // ISO DateTime
  created_at: string;        // ISO DateTime
  updated_at: string;        // ISO DateTime
  created_by: string | null; // UUID
}
```

**مثال:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
      "year": 2025,
      "quarter": 1,
      "quarter_start": "2025-01-01",
      "kpis_summary": {
        "campaign_completion_rate": {
          "q_avg": 78.5,
          "q_delta_avg": -5.2,
          "status": "warn"
        }
      },
      "top_initiatives": [
        {
          "rank": 1,
          "kpi_key": "phishing_click_rate",
          "dim_key": "department",
          "dim_value": "IT",
          "action_type_code": "targeted_training",
          "priority_score": 85.4,
          "title_ar": "تدريب مكثف لقسم تقنية المعلومات"
        }
      ],
      "generated_at": "2025-01-15T14:30:00Z",
      "created_at": "2025-01-15T14:30:00Z",
      "updated_at": "2025-01-15T14:30:00Z",
      "created_by": "user-uuid-here"
    }
  ],
  "count": 1
}
```

### SQL RPC Called
```sql
SELECT * FROM public.get_quarterly_insights(p_year, p_quarter);
```

### Pagination
**N/A** — Quarterly snapshots are limited (max 4 per year), no pagination needed.

### Error Responses

| Status | Code | الوصف |
|--------|------|-------|
| 400 | INVALID_INPUT | معاملات غير صحيحة |
| 401 | UNAUTHORIZED | Missing or invalid JWT token |
| 403 | FORBIDDEN | User lacks tenant access |
| 404 | NOT_FOUND | No insights found for given parameters |
| 429 | RATE_LIMIT | Too many requests |
| 500 | INTERNAL_ERROR | خطأ في الخادم |

### RBAC Rules

| Role | Read | Notes |
|------|------|-------|
| `viewer` | ✅ | قراءة فقط |
| `analyst` | ✅ | قراءة كاملة |
| `tenant_admin` | ✅ | قراءة كاملة |
| `platform_admin` | ✅ | (عبر جميع الـ tenants) |

---

## Security Notes

1. **Tenant Isolation**: جميع الـ RPCs تطبق `app_current_tenant_id()` للعزل التام
2. **RLS Policies**: مُفعّلة على `quarterly_insights` table
3. **Input Validation**: جميع المعاملات تُفحص قبل إرسالها للـ database
4. **Rate Limiting**: يُنصح بتطبيق rate limits (e.g., 100 req/min per user)
5. **Audit Logging**: يجب تسجيل جميع عمليات Generate في `audit_log`

---

## Client Integration Example

```typescript
import { supabase } from '@/integrations/supabase/client';

// Generate insights
async function generateQuarterlyInsights(year: number, quarter: number) {
  const { data, error } = await supabase.rpc('generate_quarterly_insights', {
    p_year: year,
    p_quarter: quarter,
    p_limit: 100
  });
  
  if (error) throw error;
  return data;
}

// Get insights
async function getQuarterlyInsights(year?: number, quarter?: number) {
  const { data, error } = await supabase.rpc('get_quarterly_insights', {
    p_year: year || null,
    p_quarter: quarter || null
  });
  
  if (error) throw error;
  return data;
}
```

---

**نهاية المستند**
