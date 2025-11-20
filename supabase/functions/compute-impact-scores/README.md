# Compute Impact Scores Edge Function

**Gate-J: Awareness Impact Engine (v1)**

This Edge Function computes Awareness Impact Scores for organizational units based on engagement, completion, feedback, and compliance metrics from Gate-I analytics.

## Purpose

Calculate a normalized impact score (0-100) that measures the effectiveness of awareness campaigns per organizational unit and time period, using a configurable weighted formula.

## API Contract

### Endpoint
```
POST /functions/v1/compute-impact-scores
```

### Authentication
Requires valid JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Request Body

#### Compute Single Org Unit
```json
{
  "action": "compute_single",
  "tenantId": "uuid",
  "orgUnitId": "uuid",
  "periodYear": 2025,
  "periodMonth": 11
}
```

#### Recompute All Org Units (Batch)
```json
{
  "action": "recompute_tenant",
  "tenantId": "uuid",
  "periodYear": 2025,
  "periodMonth": 11
}
```

### Response

#### Success (compute_single)
```json
{
  "success": true,
  "result": {
    "success": true,
    "result": {
      "impact_score": 75.25,
      "risk_level": "low",
      "confidence_level": 90.00
    }
  }
}
```

#### Success (recompute_tenant)
```json
{
  "success": true,
  "result": {
    "total": 25,
    "processed": 25,
    "successful": 22,
    "skipped": 3,
    "failed": 0
  }
}
```

#### Error
```json
{
  "error": "Missing required parameters: tenantId, periodYear, periodMonth"
}
```

## Formula (v1)

### Step 1: Normalize Scores
```
engagement_norm   = clamp(engagement_score, 0, 100) / 100
completion_norm   = clamp(completion_score, 0, 100) / 100
feedback_norm     = clamp(feedback_quality_score, 0, 100) / 100
compliance_norm   = clamp(compliance_linkage_score, 0, 100) / 100
```

### Step 2: Weighted Sum
```
base_score = 
  engagement_norm * engagement_weight +
  completion_norm * completion_weight +
  feedback_norm * feedback_quality_weight +
  compliance_norm * compliance_linkage_weight
```

**Default Weights:** 0.25 each (sum = 1.0)

### Step 3: Impact Score
```
impact_score = round(base_score * 100, 2)
```

### Step 4: Risk Level
| Score Range | Risk Level | Interpretation |
|-------------|------------|----------------|
| < 40 | `high` | High risk, low impact |
| 40-69 | `medium` | Medium risk |
| 70-84 | `low` | Low risk |
| ≥ 85 | `very_low` | Very low risk, high impact |

### Step 5: Confidence Level
- Base: 90%
- Reduction: -10% per missing metric
- Floor: 50%
- Ceiling: 99%

## Data Sources

### Input Metrics (from Gate-I)
- **Table:** `mv_awareness_campaign_kpis`
- **Mapping:**
  - `started_rate` → `engagement_score`
  - `completion_rate` → `completion_score`
  - `avg_score` → `feedback_quality_score`
  - `null` → `compliance_linkage_score` (TODO)

### Weight Configuration (from Gate-J)
- **Table:** `awareness_impact_weights`
- **Filter:** `tenant_id = ? AND is_active = true`
- **Fallback:** Default weights (0.25 each)

### Output (to Gate-J)
- **Table:** `awareness_impact_scores`
- **Operation:** Upsert (on conflict update)

## Usage Examples

### From JavaScript/TypeScript
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('compute-impact-scores', {
  body: {
    action: 'compute_single',
    tenantId: 'your-tenant-id',
    orgUnitId: 'some-org-unit-id',
    periodYear: 2025,
    periodMonth: 11
  }
});

if (error) throw error;
console.log('Impact score computed:', data);
```

### From curl
```bash
curl -X POST 'https://varbgkrfwbgzmkkxpqjg.supabase.co/functions/v1/compute-impact-scores' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "recompute_tenant",
    "tenantId": "tenant-uuid",
    "periodYear": 2025,
    "periodMonth": 11
  }'
```

## Logging

The function logs the following events:
- Start of computation
- Input metrics fetched
- Weights loaded (or defaulted)
- Impact score computed
- Upsert success/failure
- Batch statistics (for recompute_tenant)

View logs in Supabase Dashboard → Edge Functions → compute-impact-scores → Logs

## Error Handling

- **No input data:** Logs warning, skips (no insert), returns `{ success: false, reason: 'no_data' }`
- **Database error:** Logs error, returns `{ success: false, reason: 'upsert_error' }`
- **Missing parameters:** Returns 400 error
- **Batch failures:** Continues processing, counts failures in stats

## Known Limitations

1. **Org Unit Placeholder:** Currently uses `campaign_id` as `org_unit_id` until organizational structure is defined
2. **Compliance Data:** `compliance_linkage_score` is always null (not yet integrated)
3. **No Pagination:** Batch recompute may timeout for large tenants (1000+ org units)
4. **No RBAC:** Function is authenticated but not role-restricted (TODO: add admin check)

## Future Enhancements

- [ ] Replace campaign_id with actual org_unit_id
- [ ] Integrate compliance data for linkage score
- [ ] Add RBAC check (admin/manager only)
- [ ] Implement pagination for batch recompute
- [ ] Add retry logic for transient failures
- [ ] Schedule monthly auto-recompute (cron job)

## Related Documentation

- [Gate-J Part 2: Schema](../../../docs/awareness/04_Execution/Gate_J_Part2_Schema_Execution_Summary.md)
- [Gate-J Part 3: Formula Engine](../../../docs/awareness/04_Execution/Gate_J_Part3_Formula_Engine_Execution_Summary.md)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
