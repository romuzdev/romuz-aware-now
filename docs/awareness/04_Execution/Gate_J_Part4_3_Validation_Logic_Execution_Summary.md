# Gate-J Part 4.3: Validation Logic & Scoring Rules — Execution Summary

**Date**: 2025-11-11  
**Module**: Gate-J — Awareness Impact Engine  
**Phase**: Part 4.3 — Validation Logic & Scoring Rules  
**Status**: ✅ Completed

---

## 📋 Scope Implemented

Implemented the complete **validation logic and scoring rules** for the calibration system, including:

1. **Service Layer Functions**:
   - `startCalibrationRun()` - Creates new calibration runs
   - `buildCalibrationFromValidations()` - Aggregates validation data into calibration cells
   - `generateWeightSuggestion()` - Analyzes patterns and generates weight adjustment recommendations
   - `approveAndApplyWeightSuggestion()` - Applies approved weight suggestions
   - `runCalibrationAnalysis()` - Orchestrates the full calibration workflow

2. **Edge Function**: `run-calibration`
   - Secure admin-only endpoint for triggering calibration runs
   - Full RBAC validation (admin/super_admin only)
   - Complete workflow orchestration (run creation → cell aggregation → suggestion generation)

3. **Classification & Scoring Logic**:
   - Predicted bucket classification (very_low_risk, low_risk, medium_risk, high_risk)
   - Actual bucket classification (very_good_behavior, good_behavior, average_behavior, poor_behavior, very_poor_behavior)
   - Gap direction determination (overestimate, underestimate, balanced)
   - Outlier detection (sample size < 3 OR avg_gap > 25)
   - Overall status determination (good, needs_tuning, bad)

4. **Weight Adjustment Heuristics**:
   - Overestimation pattern detection (low predicted risk + poor actual behavior)
   - Underestimation pattern detection (high predicted risk + good actual behavior)
   - Automatic weight adjustment with normalization and clamping
   - Rationale generation for transparency

5. **Unit Tests**: Comprehensive test coverage for classification functions and logic

---

## 🛠 Technical Deliverables

### 1. Updated Service Layer

**File**: `src/services/calibrationService.ts`

```typescript
// Key functions implemented:
- startCalibrationRun(params): CalibrationRun
- buildCalibrationFromValidations(tenantId, calibrationRunId): CalibrationCell[]
- generateWeightSuggestion(tenantId, calibrationRunId): WeightSuggestion
- approveAndApplyWeightSuggestion(suggestionId, approvedBy): void
- runCalibrationAnalysis(...): { calibrationRun, cells, suggestions }

// Helper functions (already present from Part 4.2):
- classifyPredictedBucket(score): string
- classifyActualBucket(score): string
- determineGapDirection(gap): string
```

**Key Logic**:
- Fetches validations with both `computed_impact_score` AND `actual_behavior_score` present
- Groups validations by (predicted_bucket × actual_bucket) matrix
- Calculates cell-level metrics: count, avg_predicted, avg_actual, avg_gap, gap_direction
- Marks outlier buckets (sample_size < 3 OR avg_gap > 25)
- Computes run-level aggregates: sample_size, avg/max/min_validation_gap, correlation_score
- Determines overall_status based on thresholds
- Analyzes patterns to generate weight adjustment suggestions
- Normalizes and clamps weights to [0.1, 0.5] with sum = 1.0

---

### 2. Edge Function

**File**: `supabase/functions/run-calibration/index.ts`

**Endpoint**: `POST /functions/v1/run-calibration`

**Request Body**:
```json
{
  "tenantId": "uuid",
  "modelVersion": 1,
  "periodStart": "2025-01-01", // optional
  "periodEnd": "2025-03-31",   // optional
  "runLabel": "Q1 2025 Calibration", // optional
  "description": "Quarterly calibration run" // optional
}
```

**Response**:
```json
{
  "calibrationRunId": "uuid",
  "metrics": {
    "sampleSize": 120,
    "avgValidationGap": 12.5,
    "maxValidationGap": 35.2,
    "minValidationGap": 2.1,
    "correlationScore": 87.5,
    "overallStatus": "good"
  },
  "weightSuggestion": {
    "id": "uuid",
    "sourceVersion": 1,
    "suggestedVersion": 2,
    "weights": {
      "engagement": 0.25,
      "completion": 0.25,
      "feedbackQuality": 0.25,
      "complianceLinkage": 0.25
    },
    "rationale": "No significant bias detected. Weights are well-calibrated."
  }
}
```

**Security**:
- Requires valid JWT authorization header
- Validates user has `admin` or `super_admin` role
- Enforces tenant isolation via RLS policies
- Uses service role key for admin operations

**Workflow**:
1. Authenticate user and validate admin role
2. Create calibration run record
3. Fetch and filter validations (with both scores present)
4. Classify and group into calibration cells
5. Insert cells into database
6. Calculate run-level metrics
7. Update calibration run with metrics
8. Fetch current active weights
9. Analyze patterns and generate weight suggestion
10. Return complete result

---

### 3. Classification Thresholds

**Predicted Buckets** (from `impact_score`):
```
>= 85    → very_low_risk
[70, 85) → low_risk
[50, 70) → medium_risk
< 50     → high_risk
```

**Actual Buckets** (from `actual_behavior_score`):
```
>= 85    → very_good_behavior
[70, 85) → good_behavior
[50, 70) → average_behavior
[30, 50) → poor_behavior
< 30     → very_poor_behavior
```

**Gap Direction**:
```
|gap| <= 5     → balanced
gap > 5        → overestimate (predicted too high)
gap < -5       → underestimate (predicted too low)
```

**Outlier Detection**:
```
sample_size < 3 OR avg_gap > 25 → is_outlier_bucket = true
```

**Overall Status**:
```
avg_gap <= 10 AND correlation >= 75 → good
avg_gap <= 20                       → needs_tuning
avg_gap > 20 OR correlation < 60    → bad
```

---

### 4. Weight Adjustment Heuristics

**Overestimation Pattern** (predicted low risk, actual poor behavior):
- Increase `compliance_linkage_weight` by +0.05
- Decrease `engagement_weight` by -0.03
- Decrease `completion_weight` by -0.02
- Rationale: "Model too optimistic in low-risk segments with poor compliance"

**Underestimation Pattern** (predicted high risk, actual good behavior):
- Decrease `compliance_linkage_weight` by -0.03
- Increase `feedback_quality_weight` by +0.02
- Increase `engagement_weight` by +0.01
- Rationale: "Model too pessimistic in high-risk segments with good behavior"

**Normalization**:
- Sum all weights → divide each by sum → ensure total = 1.0
- Clamp each weight to [0.1, 0.5] range
- Re-normalize after clamping to maintain sum = 1.0

---

### 5. Unit Tests

**File**: `tests/unit/calibration.spec.ts`

**Coverage**:
- ✅ `classifyPredictedBucket()` - All bucket boundaries tested
- ✅ `classifyActualBucket()` - All bucket boundaries tested
- ✅ `determineGapDirection()` - Balanced, overestimate, underestimate cases
- ✅ Overall status determination logic
- ✅ Outlier detection rules
- ✅ Weight normalization and clamping

**Test Scenarios**:
1. Classification functions with boundary values
2. Overall status determination with various gap/correlation combinations
3. Outlier detection with sample size and gap thresholds
4. Weight normalization ensuring sum = 1.0
5. Weight clamping to valid range [0.1, 0.5]

---

## 🏗 Architecture Notes

### Data Flow

```
1. Admin triggers calibration run (via edge function or service layer)
   ↓
2. Create calibration_run record
   ↓
3. Fetch validations (where both scores are present)
   ↓
4. Classify each validation into (predicted_bucket × actual_bucket)
   ↓
5. Group and aggregate into calibration_cells
   ↓
6. Insert cells with metrics (count, avg_predicted, avg_actual, avg_gap, gap_direction)
   ↓
7. Calculate run-level aggregates (sample_size, avg_gap, correlation, status)
   ↓
8. Update calibration_run with metrics
   ↓
9. Fetch current active weights
   ↓
10. Analyze cells for overestimation/underestimation patterns
   ↓
11. Generate weight adjustment suggestion
   ↓
12. Return results to admin
```

### Pattern Analysis Logic

**v1 Simple Heuristics**:
- Detects systematic bias in calibration cells
- Focuses on two key patterns:
  - **Overestimation**: Low predicted risk but poor actual behavior
  - **Underestimation**: High predicted risk but good actual behavior
- Excludes outlier buckets from pattern analysis
- Calculates weighted ratios based on sample sizes
- Applies adjustments when ratio > 20% threshold
- Normalizes to maintain valid weight distribution

**Future Enhancements** (out of scope for v1):
- Multi-variable regression analysis
- Granular weight adjustments per metric dimension
- A/B testing framework for weight suggestions
- Machine learning for pattern detection
- Historical trend analysis

---

## 🧪 Testing & Validation

### Manual Testing Checklist

✅ **Edge Function**:
- [x] Admin can trigger calibration run
- [x] Non-admin receives 403 Forbidden
- [x] Unauthenticated request receives 401
- [x] Missing required fields returns 400
- [x] Successful run returns complete metrics + suggestion

✅ **Service Layer**:
- [x] `startCalibrationRun()` creates run with correct metadata
- [x] `buildCalibrationFromValidations()` aggregates cells correctly
- [x] `generateWeightSuggestion()` produces valid normalized weights
- [x] `approveAndApplyWeightSuggestion()` creates new weight version

✅ **Classification**:
- [x] Predicted buckets align with risk levels from Part 3
- [x] Actual buckets align with behavior thresholds
- [x] Gap direction logic works correctly
- [x] Outlier detection flags edge cases

✅ **Unit Tests**:
- [x] All classification tests pass
- [x] Logic tests for status determination pass
- [x] Normalization tests validate sum = 1.0
- [x] Clamping tests ensure [0.1, 0.5] bounds

### Integration Test Scenarios (Recommended)

**Scenario 1: Well-Calibrated Model**
- Input: Validations where predicted ≈ actual (gap ≤ 10)
- Expected: `overall_status = 'good'`, minimal weight adjustments

**Scenario 2: Overestimation Bias**
- Input: Many (very_low_risk × poor_behavior) cells
- Expected: Suggestion to increase `compliance_linkage_weight`

**Scenario 3: Underestimation Bias**
- Input: Many (high_risk × very_good_behavior) cells
- Expected: Suggestion to decrease `compliance_linkage_weight`

**Scenario 4: Insufficient Data**
- Input: < 3 samples in most cells
- Expected: Most cells marked as outliers, conservative suggestions

---

## 📊 Observability & Logging

**Structured Logs Added**:
```javascript
// Calibration run creation
console.log('Calibration run created:', runId, { tenantId, modelVersion })

// Validation data fetching
console.log(`Found ${count} valid validation records`)

// Cell creation
console.log(`Creating ${count} calibration cells`)

// Metrics calculation
console.log('Calibration run metrics updated:', { sampleSize, avgGap, status })

// Weight suggestion
console.log('Weight suggestion created:', suggestionId, { sourceVersion, suggestedVersion })

// Approval
console.log('Weight suggestion applied:', { suggestionId, newVersion })
```

**Future Enhancement TODOs**:
- [ ] Add structured metrics to observability system
- [ ] Track calibration run durations
- [ ] Monitor weight adjustment frequency
- [ ] Alert on `bad` overall status
- [ ] Dashboard for calibration history

---

## 🔒 Security & Compliance

### Access Control

✅ **Edge Function**:
- Admin/super_admin role required
- JWT validation via `getUser()`
- Tenant isolation via RLS policies

✅ **Service Layer**:
- All functions respect tenant_id context
- Uses Supabase client with user context
- RLS policies enforce data isolation

### Audit Trail

✅ **Tracked Actions**:
- Calibration run creation (`created_by` field)
- Weight suggestion approval (`approved_by`, `approved_at`)
- Status changes (`status` field in suggestions)

### Data Validation

✅ **Input Validation**:
- Required fields checked (tenantId, modelVersion)
- Score thresholds validated
- Weight bounds enforced [0.1, 0.5]
- Normalization ensures sum = 1.0

---

## 📝 TODO / Tech Debt

### Immediate (Part 4.4)

- [ ] **UI for Calibration Management**:
  - Admin page to view calibration runs
  - View calibration matrix cells
  - Review and approve weight suggestions
  - Visualize trends and patterns

### Short-term

- [ ] **Period Filtering**:
  - Implement date range filtering in validation fetch
  - Filter by `period_year` and `period_month` ranges
  - Optimize query performance

- [ ] **Correlation Calculation**:
  - Replace pseudo-correlation with proper Pearson coefficient
  - Consider alternative metrics (Spearman, R²)
  - Add statistical significance testing

- [ ] **Enhanced Pattern Detection**:
  - Multi-dimensional analysis (not just overestimate/underestimate)
  - Segment-specific patterns (e.g., by department, campaign type)
  - Time-series trend analysis

### Long-term

- [ ] **Advanced Analytics**:
  - Regression models for weight optimization
  - A/B testing framework for weight suggestions
  - Machine learning for pattern detection
  - Historical baseline comparisons

- [ ] **Automation**:
  - Scheduled calibration runs (e.g., monthly)
  - Auto-apply suggestions above confidence threshold
  - Notification system for calibration alerts

- [ ] **Performance**:
  - Optimize validation data fetching (pagination, indexes)
  - Cache calibration results
  - Parallel processing for large datasets

---

## ✅ Acceptance Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| `startCalibrationRun()` creates run record | ✅ | Fully implemented |
| `buildCalibrationFromValidations()` aggregates cells | ✅ | Matrix aggregation working |
| Run-level metrics calculated correctly | ✅ | Sample size, gaps, correlation, status |
| `generateWeightSuggestion()` produces valid weights | ✅ | Normalized, clamped, with rationale |
| Edge function secured with RBAC | ✅ | Admin/super_admin only |
| Classification functions tested | ✅ | Unit tests pass |
| Overall status determination tested | ✅ | Logic validated |
| Weight normalization tested | ✅ | Sum = 1.0 guaranteed |
| Outlier detection implemented | ✅ | Sample size + gap thresholds |
| Logging added for observability | ✅ | Structured logs throughout |

---

## 🔎 Review Report

### Coverage

✅ **Implementation Completeness**: 100%
- All service layer functions implemented
- Edge function with full workflow orchestration
- Classification and scoring logic complete
- Unit tests for core functions
- Documentation complete

### Notes

- **Correlation Score**: Currently using simplified approximation (`100 - avg_gap`). Replace with proper Pearson correlation in future iteration.
- **Period Filtering**: Simplified in v1 (fetches all, filters in memory). Optimize with SQL date range filtering in next version.
- **Pattern Detection**: Basic heuristics implemented. Advanced ML-based detection out of scope for v1.
- **Weight Bounds**: Clamped to [0.1, 0.5] to prevent extreme adjustments. May need adjustment based on real-world usage.

### Warnings

⚠️ **No UI**: This part implements backend logic only. Admin UI for calibration management required in Part 4.4.

⚠️ **Performance**: Large validation datasets (>1000 records) may experience slower processing. Consider pagination/batching in production.

⚠️ **Validation Data Required**: Calibration requires validations with both `computed_impact_score` AND `actual_behavior_score`. Ensure validation pipeline (Part 4.1) is running regularly.

---

## 🎯 Next Steps

**Part 4.4 — Reporting & Visualization Blueprint**:
- Admin UI for viewing calibration runs
- Calibration matrix visualization (heatmap)
- Weight suggestion review interface
- Approval workflow for weight adjustments
- Historical calibration trends dashboard
- Metrics and KPIs for calibration effectiveness

---

**Prepared by**: Lovable AI  
**Review Status**: Ready for Part 4.4  
**Integration**: Gate-J — Awareness Impact Engine
