# Gate-J Part 4.2 — Calibration Data Model Execution Summary

## 📋 Overview

**Module:** Gate-J — Awareness Impact Engine (v1)  
**Part:** 4.2 — Calibration Data Model  
**Status:** ✅ Complete  
**Date:** 2025-01-11

## 🎯 Objective

Design and implement database schema for storing:
- Calibration runs (aggregated validation metrics)
- Calibration matrices (predicted vs actual buckets)
- Weight adjustment recommendations

## 📊 Technical Deliverables

### 1. Table: `awareness_impact_calibration_runs`

**Purpose:** Store calibration run metadata and aggregated metrics

**Key Columns:**
- `id`, `tenant_id` (multi-tenant isolation)
- `model_version` (links to `awareness_impact_weights.version`)
- `period_start`, `period_end` (time window)
- `run_label`, `description` (human-readable identifiers)
- **Metrics:**
  - `sample_size` (number of validation records)
  - `avg_validation_gap`, `max_validation_gap`, `min_validation_gap`
  - `correlation_score` (simplified v1 metric)
- `overall_status` ('good', 'needs_tuning', 'bad', 'experimental')
- `created_by`, `created_at`, `updated_at`

**Indexes:**
- `(tenant_id, model_version)`
- `(tenant_id, created_at)`

**RLS Policies:**
- ✅ SELECT, INSERT, UPDATE, DELETE with tenant isolation
- ✅ All operations require `auth.uid()` authentication

**Triggers:**
- ✅ `updated_at` auto-update trigger

---

### 2. Table: `awareness_impact_calibration_cells`

**Purpose:** Store calibration matrix cells (predicted × actual buckets)

**Key Columns:**
- `id`, `calibration_run_id`, `tenant_id`
- **Predicted Dimension:**
  - `predicted_bucket` ('very_low_risk', 'low_risk', 'medium_risk', 'high_risk')
  - `predicted_score_min`, `predicted_score_max`
- **Actual Dimension:**
  - `actual_bucket` ('very_good_behavior', 'good_behavior', 'average_behavior', 'poor_behavior', 'very_poor_behavior')
  - `actual_score_min`, `actual_score_max`
- **Metrics Per Cell:**
  - `count_samples` (org-unit-period records in this cell)
  - `avg_predicted_score`, `avg_actual_score`
  - `avg_gap` (average predicted - actual)
  - `gap_direction` ('overestimate', 'underestimate', 'balanced')
- **Quality Flags:**
  - `is_outlier_bucket`, `notes`
- `created_at`, `updated_at`

**Indexes:**
- `(tenant_id, calibration_run_id)`
- `(tenant_id, predicted_bucket, actual_bucket)`

**RLS Policies:**
- ✅ SELECT, INSERT, UPDATE, DELETE with tenant isolation

**Triggers:**
- ✅ `updated_at` auto-update trigger

---

### 3. Table: `awareness_impact_weight_suggestions`

**Purpose:** Store AI-generated or manual weight adjustment recommendations

**Key Columns:**
- `id`, `tenant_id`, `calibration_run_id`
- **Version Tracking:**
  - `source_weight_version` (current weights used)
  - `suggested_weight_version` (proposed next version)
- **Suggested Weights (NUMERIC 0-1):**
  - `suggested_engagement_weight`
  - `suggested_completion_weight`
  - `suggested_feedback_quality_weight`
  - `suggested_compliance_linkage_weight`
- **Approval Workflow:**
  - `rationale` (explanation)
  - `status` ('draft', 'proposed', 'approved', 'rejected', 'applied')
  - `approved_by`, `approved_at`
- `created_at`, `updated_at`

**Indexes:**
- `(tenant_id, calibration_run_id)`
- `(tenant_id, status)`

**RLS Policies:**
- ✅ SELECT, INSERT, UPDATE, DELETE with tenant isolation

**Triggers:**
- ✅ `updated_at` auto-update trigger

---

## 🔄 Data Flow Architecture

### Conceptual Flow:
```
1. Validation Stage (Part 4.1)
   └─> awareness_impact_validations (per-org-unit comparisons)

2. Calibration Stage (Part 4.2 - Current)
   ├─> awareness_impact_calibration_runs (aggregate metrics)
   ├─> awareness_impact_calibration_cells (matrix buckets)
   └─> awareness_impact_weight_suggestions (recommendations)

3. Weight Update Stage (Future)
   └─> New rows in awareness_impact_weights (if approved)

4. Recomputation (Part 3)
   └─> Updated impact scores in awareness_impact_scores
```

### Relationships:
- `calibration_runs` ←← `calibration_cells` (one-to-many)
- `calibration_runs` ←← `weight_suggestions` (one-to-many)
- `weight_suggestions` → `awareness_impact_weights` (future link)

---

## 📐 Schema Compliance

### Multi-Tenancy:
✅ All tables include `tenant_id` with proper RLS policies

### Security:
✅ RLS enabled on all tables  
✅ Policies enforce tenant isolation via `get_user_tenant_id(auth.uid())`  
✅ Authentication required for all write operations

### Performance:
✅ Strategic indexes on frequently queried columns  
✅ Composite indexes for common filter patterns

### Data Integrity:
✅ CHECK constraints on enum-like fields  
✅ CHECK constraints on weight ranges (0-1)  
✅ NOT NULL constraints on critical fields

---

## 🔐 Security Notes

### Existing Security Warnings (Pre-Migration):
⚠️ 5 SECURITY DEFINER VIEW errors (from existing materialized views)  
⚠️ 3 MATERIALIZED VIEW IN API warnings (expected, documented)  
⚠️ 1 Leaked Password Protection warning (Supabase Auth setting)

**Impact:** None of these warnings are caused by Part 4.2 tables. All new tables use standard RLS policies without SECURITY DEFINER views.

### New Tables Security:
✅ No new security issues introduced  
✅ Standard RLS patterns applied  
✅ All policies audited and tested

---

## 📝 Documentation

### Added Comments:
- ✅ Table-level comments explaining purpose
- ✅ Column-level comments for complex fields
- ✅ Schema-level comment documenting full data flow
- ✅ Inline SQL comments for clarity

### Reference Documents:
- Migration: `supabase/migrations/[timestamp]_calibration_data_model.sql`
- This summary: `Gate_J_Part4_2_Calibration_Data_Model_Execution_Summary.md`

---

## ✅ Deliverables Checklist

- [x] Table `awareness_impact_calibration_runs` created
- [x] Table `awareness_impact_calibration_cells` created
- [x] Table `awareness_impact_weight_suggestions` created
- [x] All indexes created as specified
- [x] RLS policies enabled and tested
- [x] `updated_at` triggers configured
- [x] Documentation comments added
- [x] Data flow architecture documented
- [x] Multi-tenant isolation verified
- [x] No new security issues introduced

---

## 🚀 Next Steps

**Part 4.3 — Validation Logic & Scoring Rules**

Implement backend logic to:
1. Aggregate validation data into calibration cells
2. Compute bucket classifications (predicted & actual)
3. Calculate gap metrics and directions
4. Generate weight adjustment suggestions
5. Expose admin endpoints for manual calibration runs

---

## 🔎 Review Report

### Coverage:
✅ All requirements from Part 4.2 Prompt implemented  
✅ Schema fully multi-tenant  
✅ RLS policies comprehensive  
✅ Indexes optimized for expected queries

### Compliance:
✅ Follows project guidelines (multi-tenancy, security, RLS-first)  
✅ Consistent with existing Gate-J architecture  
✅ No breaking changes to existing tables  
✅ Ready for Part 4.3 logic implementation

### Quality:
✅ Clean SQL with proper formatting  
✅ Comprehensive documentation  
✅ Production-ready schema design  
✅ Extensible for future enhancements (e.g., ML-based suggestions)

---

**Status:** ✅ Part 4.2 Complete — Ready for Part 4.3 Implementation
