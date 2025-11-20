# Gate-K: JSON Schema — Quarterly Insights (v1.0)

**المشروع:** Romuz Awareness — Gate-K  
**الغرض:** تحديد بنية JSON المُرجعة للـ Frontend/Integrations عند توليد أو استعلام المبادرات الربع سنوية

---

## البنية الأساسية (Root Object)

```typescript
interface QuarterlyInsightsResponse {
  tenant_id: string;           // UUID
  year: number;                // SMALLINT (e.g., 2025)
  quarter: number;             // 1..4
  quarter_start: string;       // ISO Date (YYYY-MM-DD)
  kpis_summary: KpiSummaryMap;
  top_initiatives: Initiative[];
  generated_at: string;        // ISO DateTime (YYYY-MM-DDTHH:mm:ssZ)
}
```

---

## 1) kpis_summary

**النوع:** Object (Map)  
**البنية:**
```typescript
type KpiSummaryMap = {
  [kpi_key: string]: {
    q_avg: number;              // متوسط قيمة المؤشر خلال الربع
    q_delta_avg: number;        // متوسط التغير % عن الربع السابق
    status: 'ok' | 'warn' | 'alert';  // الحالة بناءً على الحدود
  }
}
```

**مثال:**
```json
{
  "campaign_completion_rate": {
    "q_avg": 78.5,
    "q_delta_avg": -5.2,
    "status": "warn"
  },
  "phishing_click_rate": {
    "q_avg": 12.3,
    "q_delta_avg": 8.7,
    "status": "alert"
  }
}
```

**قواعد التحقق:**
- `kpi_key`: string, non-empty, max 100 chars
- `q_avg`: number, finite
- `q_delta_avg`: number, finite
- `status`: enum ['ok', 'warn', 'alert']

---

## 2) top_initiatives

**النوع:** Array  
**البنية:**
```typescript
interface Initiative {
  rank: number;                   // ترتيب الأولوية (1 = الأعلى)
  kpi_key: string;                // المؤشر المرتبط
  dim_key: string;                // البُعد (department, channel, etc.)
  dim_value: string;              // قيمة البُعد (HR, Email, etc.)
  action_type_code: string;       // كود نوع الإجراء
  priority_score: number;         // درجة الأولوية المحسوبة
  title_ar?: string;              // العنوان (اختياري)
  body_ar?: string;               // الوصف (اختياري)
}
```

**مثال:**
```json
[
  {
    "rank": 1,
    "kpi_key": "phishing_click_rate",
    "dim_key": "department",
    "dim_value": "IT",
    "action_type_code": "targeted_training",
    "priority_score": 85.4,
    "title_ar": "تدريب مكثف لقسم تقنية المعلومات",
    "body_ar": "حملة تدريبية مُكثفة على التصيد الاحتيالي"
  }
]
```

**قواعد التحقق:**
- `rank`: integer, >= 1
- `kpi_key`, `dim_key`, `dim_value`, `action_type_code`: string, non-empty, max 100 chars
- `priority_score`: number, >= 0, finite
- `title_ar`, `body_ar`: string, max 500 chars (optional)

**الترتيب:** descending by `priority_score`

---

## 3) Metadata Fields

```typescript
{
  tenant_id: string;        // UUID format
  year: number;             // 2020..2100
  quarter: number;          // 1..4
  quarter_start: string;    // ISO Date: "YYYY-MM-DD"
  generated_at: string;     // ISO DateTime: "2025-01-15T14:30:00Z"
}
```

**قواعد التحقق:**
- `tenant_id`: UUID v4 format
- `year`: integer, 2020 <= year <= 2100
- `quarter`: integer, 1 <= quarter <= 4
- `quarter_start`: ISO Date format
- `generated_at`: ISO 8601 DateTime format

---

## مثال كامل

```json
{
  "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
  "year": 2025,
  "quarter": 1,
  "quarter_start": "2025-01-01",
  "kpis_summary": {
    "campaign_completion_rate": {
      "q_avg": 78.5,
      "q_delta_avg": -5.2,
      "status": "warn"
    },
    "phishing_click_rate": {
      "q_avg": 12.3,
      "q_delta_avg": 8.7,
      "status": "alert"
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
      "title_ar": "تدريب مكثف لقسم تقنية المعلومات",
      "body_ar": "حملة تدريبية مُكثفة على التصيد الاحتيالي"
    },
    {
      "rank": 2,
      "kpi_key": "campaign_completion_rate",
      "dim_key": "channel",
      "dim_value": "email",
      "action_type_code": "reminder_campaign",
      "priority_score": 72.1,
      "title_ar": "حملة تذكير عبر البريد",
      "body_ar": "زيادة معدل التذكير للموظفين المتأخرين"
    }
  ],
  "generated_at": "2025-01-15T14:30:00Z"
}
```

---

## ملاحظات التوافق العكسي

- **v1.0 Initial Release**: البنية الحالية
- **Future versions**: 
  - إضافة حقول جديدة اختيارية (backward-compatible)
  - تغييرات في القيم تتطلب versioning في الـ API endpoint
  - حذف حقول يتطلب إشعار مسبق + deprecation period

---

## Validation Schema (Zod Example)

```typescript
import { z } from 'zod';

export const QuarterlyInsightsSchema = z.object({
  tenant_id: z.string().uuid(),
  year: z.number().int().min(2020).max(2100),
  quarter: z.number().int().min(1).max(4),
  quarter_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kpis_summary: z.record(
    z.string().max(100),
    z.object({
      q_avg: z.number().finite(),
      q_delta_avg: z.number().finite(),
      status: z.enum(['ok', 'warn', 'alert'])
    })
  ),
  top_initiatives: z.array(
    z.object({
      rank: z.number().int().min(1),
      kpi_key: z.string().min(1).max(100),
      dim_key: z.string().min(1).max(100),
      dim_value: z.string().min(1).max(100),
      action_type_code: z.string().min(1).max(100),
      priority_score: z.number().min(0).finite(),
      title_ar: z.string().max(500).optional(),
      body_ar: z.string().max(500).optional()
    })
  ),
  generated_at: z.string().datetime()
});
```

---

**نهاية المستند**
