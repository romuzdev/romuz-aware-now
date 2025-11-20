# Gate-K — RCA API Read Models (v1.0)

**المشروع:** Romuz Awareness Platform  
**الوحدة:** Gate-K (KPI Trends, Anomalies & RCA)  
**الإصدار:** v1.0  
**التاريخ:** 2025-11-11  
**الحالة:** ✅ مُنفَّذ (Part 4.D)

---

## نظرة عامة

هذا المستند يُوثّق الـ **API endpoints** للوصول إلى بيانات Root Cause Analysis (RCA) والتوصيات المُولّدة من نظام Gate-K.

جميع الـ endpoints:
- **Tenant-scoped:** يتم عزل البيانات تلقائياً حسب الـ tenant
- **RBAC-aware:** تُطبّق صلاحيات الأدوار تلقائياً
- **PostgreSQL RPCs:** يتم الاستدعاء عبر Supabase RPC (not REST endpoints)

---

## 1) Get RCA Top Contributors

### 1.1 الوصف
استرجاع الأبعاد (dimensions) الأكثر مساهمة في الانحراف لـ KPI معين في شهر محدد.

### 1.2 RPC Function
```sql
get_rca_top_contributors(
  p_kpi_key TEXT,
  p_month DATE,
  p_trend_window kpi_trend_window DEFAULT NULL,
  p_dim_key TEXT DEFAULT NULL,
  p_top_n INTEGER DEFAULT 5
)
```

### 1.3 Parameters

| Parameter | Type | Required | Default | الوصف |
|-----------|------|----------|---------|-------|
| `p_kpi_key` | `TEXT` | ✅ Yes | - | مفتاح الـ KPI المطلوب (e.g., `'campaign_completion_rate'`) |
| `p_month` | `DATE` | ✅ Yes | - | الشهر المطلوب (e.g., `'2025-01-01'`) |
| `p_trend_window` | `kpi_trend_window` | ❌ No | `NULL` | النافذة الزمنية (`'m1'`, `'m3'`, `'m6'`, `'none'`) - `NULL` يعني جميع النوافذ |
| `p_dim_key` | `TEXT` | ❌ No | `NULL` | البُعد المحدد (e.g., `'department'`, `'channel'`) - `NULL` يعني جميع الأبعاد |
| `p_top_n` | `INTEGER` | ❌ No | `5` | عدد المُساهمين المطلوبين لكل بُعد |

### 1.4 Validation Rules

- `p_kpi_key`: يجب أن يكون غير فارغ
- `p_month`: يجب أن يكون تاريخ صحيح (first day of month)
- `p_trend_window`: يجب أن يكون أحد القيم: `'none'`, `'m1'`, `'m3'`, `'m6'`, `'m12'`, `'q1'`, `'q2'` أو `NULL`
- `p_dim_key`: يجب أن يكون أحد الأبعاد المدعومة أو `NULL`
- `p_top_n`: يجب أن يكون > 0 و ≤ 100

### 1.5 Response Schema (200 OK)

```typescript
interface RCATopContributor {
  tenant_id: string;              // UUID
  kpi_key: string;                // e.g., "campaign_completion_rate"
  month: string;                  // ISO date (e.g., "2025-01-01")
  trend_window: string;           // "m1" | "m3" | "m6" | "none"
  dim_key: string;                // "department" | "channel" | "campaign_type" ...
  dim_value: string;              // e.g., "Finance", "email"
  delta_pct: number;              // Percentage change (e.g., -15.5)
  contribution_score: number;     // Absolute contribution magnitude
  share_ratio: number;            // Share of this dimension value in total samples
  variance_from_overall_pct: number; // How much this value differs from overall avg
  contributor_rnk: number;        // Rank within this dimension (1 = strongest)
  rnk: number;                    // Alias for contributor_rnk (API compatibility)
}

type RCATopContributorsResponse = RCATopContributor[];
```

### 1.6 Usage Examples

#### TypeScript (Supabase Client)
```typescript
import { supabase } from '@/integrations/supabase/client';

// Get top 5 contributors for a specific KPI/month
const { data, error } = await supabase.rpc('get_rca_top_contributors', {
  p_kpi_key: 'campaign_completion_rate',
  p_month: '2025-01-01',
  p_trend_window: 'm1',
  p_dim_key: null, // All dimensions
  p_top_n: 5,
});

if (error) {
  console.error('Error fetching RCA contributors:', error);
} else {
  console.log('Top contributors:', data);
}
```

#### SQL (Direct)
```sql
-- Get top 3 departments contributing to completion rate drop
SELECT * FROM get_rca_top_contributors(
  'campaign_completion_rate',
  '2025-01-01'::DATE,
  'm1'::kpi_trend_window,
  'department',
  3
);
```

### 1.7 RBAC Notes

| Role | Access |
|------|--------|
| `tenant_admin` | ✅ Full access |
| `compliance_manager` | ✅ Full access |
| `analyst` | ✅ Read-only access |
| `standard_user` | ❌ No access |
| `viewer` | ❌ No access |

### 1.8 Error Responses

#### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "User must be authenticated"
}
```

#### 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions to access RCA data"
}
```

#### 400 Bad Request
```json
{
  "error": "INVALID_PARAMETERS",
  "message": "p_kpi_key cannot be empty"
}
```

#### 500 Internal Server Error
```json
{
  "error": "TENANT_REQUIRED",
  "message": "User not associated with any tenant"
}
```

---

## 2) Generate Recommendations

### 2.1 الوصف
توليد توصيات جديدة بناءً على بيانات RCA والانحرافات الشهرية للـ KPIs.

### 2.2 RPC Function
```sql
generate_recommendations(
  p_month DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 1000
)
```

### 2.3 Parameters

| Parameter | Type | Required | Default | الوصف |
|-----------|------|----------|---------|-------|
| `p_month` | `DATE` | ❌ No | `NULL` | الشهر المطلوب - `NULL` يعني جميع الأشهر المتاحة |
| `p_limit` | `INTEGER` | ❌ No | `1000` | الحد الأقصى لعدد التوصيات المُولّدة |

### 2.4 Validation Rules

- `p_month`: يجب أن يكون تاريخ صحيح (first day of month) أو `NULL`
- `p_limit`: يجب أن يكون > 0 و ≤ 5000

### 2.5 Response Schema (200 OK)

```typescript
interface GenerateRecommendationsResponse {
  count: number; // Number of recommendations successfully generated
}
```

### 2.6 Usage Examples

#### TypeScript (Supabase Client)
```typescript
import { supabase } from '@/integrations/supabase/client';

// Generate recommendations for January 2025
const { data, error } = await supabase.rpc('generate_recommendations', {
  p_month: '2025-01-01',
  p_limit: 500,
});

if (error) {
  console.error('Error generating recommendations:', error);
} else {
  console.log(`Generated ${data} recommendations`);
}
```

#### SQL (Direct)
```sql
-- Generate recommendations for current month
SELECT generate_recommendations(
  DATE_TRUNC('month', CURRENT_DATE)::DATE,
  1000
);
-- Returns: 42 (number of recommendations generated)
```

### 2.7 RBAC Notes

| Role | Access |
|------|--------|
| `tenant_admin` | ✅ Can generate |
| `compliance_manager` | ✅ Can generate |
| `analyst` | ❌ Read-only (cannot generate) |
| `standard_user` | ❌ No access |
| `viewer` | ❌ No access |

### 2.8 Error Responses

#### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "User must be authenticated"
}
```

#### 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions to generate recommendations"
}
```

#### 400 Bad Request
```json
{
  "error": "INVALID_PARAMETERS",
  "message": "p_limit must be between 1 and 5000"
}
```

#### 500 Internal Server Error
```json
{
  "error": "TENANT_REQUIRED",
  "message": "User not associated with any tenant"
}
```

#### 429 Too Many Requests
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Maximum recommendation generation attempts exceeded. Try again in 60 seconds."
}
```

---

## 3) Get Recommendations List

### 3.1 الوصف
استرجاع قائمة التوصيات المُولّدة مع إمكانية الفلترة حسب الشهر والـ KPI والحالة.

### 3.2 RPC Function
```sql
get_recommendations(
  p_month DATE DEFAULT NULL,
  p_kpi_key TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
```

### 3.3 Parameters

| Parameter | Type | Required | Default | الوصف |
|-----------|------|----------|---------|-------|
| `p_month` | `DATE` | ❌ No | `NULL` | الشهر المطلوب - `NULL` يعني جميع الأشهر |
| `p_kpi_key` | `TEXT` | ❌ No | `NULL` | مفتاح الـ KPI المطلوب - `NULL` يعني جميع الـ KPIs |
| `p_status` | `TEXT` | ❌ No | `NULL` | حالة التوصية - `NULL` يعني جميع الحالات |

### 3.4 Validation Rules

- `p_month`: يجب أن يكون تاريخ صحيح (first day of month) أو `NULL`
- `p_kpi_key`: يجب أن يكون غير فارغ أو `NULL`
- `p_status`: يجب أن يكون أحد القيم: `'pending'`, `'reviewed'`, `'implemented'`, `'dismissed'` أو `NULL`

### 3.5 Response Schema (200 OK)

```typescript
interface Recommendation {
  id: number;                     // Unique recommendation ID
  tenant_id: string;              // UUID
  kpi_key: string;                // e.g., "campaign_completion_rate"
  month: string;                  // ISO date (e.g., "2025-01-01")
  trend_window: string;           // "m1" | "m3" | "m6" | "none"
  dim_key: string;                // "department" | "channel" ...
  dim_value: string;              // e.g., "Finance"
  flag: string;                   // "ok" | "warn" | "alert" | "no_ref" | "insufficient_data"
  title_ar: string;               // Arabic title
  body_ar: string;                // Arabic body (may contain placeholders)
  action_type_code: string;       // Gate-H action type (e.g., "training_campaign")
  impact_level: string;           // "low" | "medium" | "high"
  effort_estimate: string;        // "S" | "M" | "L" | "XL"
  source_ref: {                   // JSON object with RCA metadata
    contributor_rnk: number;
    priority_rnk: number;
    delta_pct: number;
    contribution_score: number;
    share_ratio: number;
    variance_from_overall_pct: number;
  };
  status: string;                 // "pending" | "reviewed" | "implemented" | "dismissed"
  reviewed_by: string | null;    // UUID of reviewer (if reviewed)
  reviewed_at: string | null;    // ISO timestamp (if reviewed)
  notes: string | null;           // Additional notes
  created_at: string;             // ISO timestamp
  updated_at: string;             // ISO timestamp
}

type RecommendationsListResponse = Recommendation[];
```

### 3.6 Usage Examples

#### TypeScript (Supabase Client)
```typescript
import { supabase } from '@/integrations/supabase/client';

// Get all pending recommendations for January 2025
const { data, error } = await supabase.rpc('get_recommendations', {
  p_month: '2025-01-01',
  p_kpi_key: null,
  p_status: 'pending',
});

if (error) {
  console.error('Error fetching recommendations:', error);
} else {
  console.log('Pending recommendations:', data);
}
```

#### SQL (Direct)
```sql
-- Get all recommendations for a specific KPI (all months)
SELECT * FROM get_recommendations(
  NULL,
  'campaign_completion_rate',
  NULL
);
```

### 3.7 RBAC Notes

| Role | Access |
|------|--------|
| `tenant_admin` | ✅ Full access (all statuses) |
| `compliance_manager` | ✅ Full access (all statuses) |
| `analyst` | ✅ Read-only access (all statuses) |
| `standard_user` | ❌ No access |
| `viewer` | ❌ No access |

### 3.8 Error Responses

#### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "User must be authenticated"
}
```

#### 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions to access recommendations"
}
```

#### 400 Bad Request
```json
{
  "error": "INVALID_PARAMETERS",
  "message": "p_status must be one of: pending, reviewed, implemented, dismissed"
}
```

#### 500 Internal Server Error
```json
{
  "error": "TENANT_REQUIRED",
  "message": "User not associated with any tenant"
}
```

---

## 4) Common Patterns

### 4.1 Full Workflow Example

```typescript
import { supabase } from '@/integrations/supabase/client';

async function analyzeAndRecommend(kpiKey: string, month: string) {
  // Step 1: Get RCA top contributors
  const { data: contributors, error: rcaError } = await supabase.rpc(
    'get_rca_top_contributors',
    {
      p_kpi_key: kpiKey,
      p_month: month,
      p_trend_window: 'm1',
      p_dim_key: null,
      p_top_n: 5,
    }
  );

  if (rcaError) throw rcaError;

  console.log('Top contributors:', contributors);

  // Step 2: Generate recommendations
  const { data: count, error: genError } = await supabase.rpc(
    'generate_recommendations',
    {
      p_month: month,
      p_limit: 500,
    }
  );

  if (genError) throw genError;

  console.log(`Generated ${count} recommendations`);

  // Step 3: Fetch generated recommendations
  const { data: recommendations, error: listError } = await supabase.rpc(
    'get_recommendations',
    {
      p_month: month,
      p_kpi_key: kpiKey,
      p_status: 'pending',
    }
  );

  if (listError) throw listError;

  return {
    contributors,
    recommendations,
  };
}

// Usage
analyzeAndRecommend('campaign_completion_rate', '2025-01-01')
  .then(result => console.log('Analysis complete:', result))
  .catch(err => console.error('Analysis failed:', err));
```

### 4.2 Pagination Pattern

لم يتم تطبيق pagination داخل الـ RPCs (v1.0). للحصول على pagination:

```typescript
// Client-side pagination
const PAGE_SIZE = 20;

async function getRecommendationsPaginated(
  month: string,
  page: number = 1
) {
  const { data: allRecommendations, error } = await supabase.rpc(
    'get_recommendations',
    { p_month: month, p_kpi_key: null, p_status: 'pending' }
  );

  if (error) throw error;

  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  
  return {
    data: allRecommendations.slice(startIndex, endIndex),
    total: allRecommendations.length,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(allRecommendations.length / PAGE_SIZE),
  };
}
```

### 4.3 Error Handling Pattern

```typescript
import { supabase } from '@/integrations/supabase/client';

async function safeRPCCall<T>(
  functionName: string,
  params: Record<string, any>
): Promise<T> {
  try {
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      // Map Supabase errors to application errors
      if (error.message.includes('TENANT_REQUIRED')) {
        throw new Error('User session expired. Please login again.');
      }
      if (error.message.includes('FORBIDDEN')) {
        throw new Error('You do not have permission to perform this action.');
      }
      throw error;
    }

    return data as T;
  } catch (err) {
    console.error(`RPC call failed: ${functionName}`, err);
    throw err;
  }
}

// Usage
const contributors = await safeRPCCall('get_rca_top_contributors', {
  p_kpi_key: 'campaign_completion_rate',
  p_month: '2025-01-01',
});
```

---

## 5) Rate Limiting (Future)

**Status:** ⏳ Not implemented in v1.0

**Planned for v1.1:**
- `generate_recommendations()`: Max 10 calls per minute per tenant
- `get_rca_top_contributors()`: Max 60 calls per minute per tenant
- `get_recommendations()`: Max 100 calls per minute per tenant

---

## 6) Versioning

**Current Version:** v1.0

**Breaking Changes Policy:**
- Major version bump (v2.0) for breaking schema changes
- Minor version bump (v1.1) for new optional fields or features
- Patch version bump (v1.0.1) for bug fixes

---

## 7) Sign-off

| المراجع | الدور | التاريخ | التوقيع |
|---------|------|---------|---------|
| [اسم المراجع] | Solution Architect | 2025-11-11 | ✅ |
| [اسم المراجع] | Backend Lead | 2025-11-11 | ⏳ |
| [اسم المراجع] | Frontend Lead | 2025-11-11 | ⏳ |

---

**End of Document**
