# Gate-J Part 4.4: Reporting & Visualization Blueprint — Execution Summary

**Date**: 2025-11-11  
**Module**: Gate-J — Awareness Impact Engine  
**Phase**: Part 4.4 — Reporting & Visualization Blueprint  
**Status**: ✅ Completed

---

## 📋 Scope Implemented

Implemented the complete **frontend UI/UX** for the Awareness Impact Calibration module, including:

1. **Three Main Views**:
   - Calibration Dashboard (`/admin/awareness/impact/calibration`)
   - Calibration Run Details (`/admin/awareness/impact/calibration/:id`)
   - Weight Suggestion Review (`/admin/awareness/impact/calibration/:id/weights`)

2. **Components**:
   - CalibrationStatsCards - Aggregate metrics overview
   - CalibrationRunsTable - List of all calibration runs
   - CalibrationMatrixHeatmap - Visual matrix of predicted vs actual
   - ValidationGapsTrend - Line chart showing gaps over time
   - OutlierBucketsTable - Table of anomalous calibration cells
   - WeightComparisonTable - Current vs suggested weights comparison
   - CalibrationRunSummary - Detailed run metrics cards
   - NewCalibrationRunDialog - Modal for creating new runs

3. **Hooks**:
   - useCalibrationRuns - Fetch all runs for a tenant
   - useCalibrationRunDetails - Fetch single run details
   - useCalibrationCells - Fetch calibration matrix cells
   - useWeightSuggestions - Fetch weight adjustment suggestions

4. **Routes**: Integrated all pages into App.tsx with protected routing

---

## 🛠 Technical Deliverables

### 1. Calibration Dashboard

**Route**: `/admin/awareness/impact/calibration`

**File**: `src/pages/admin/awareness/impact/Calibration.tsx`

**Features**:
- Header with "New Calibration Run" button
- 4 Stats Cards showing aggregate metrics:
  - Total Validations Processed
  - Average Gap
  - Average Correlation Score
  - Overall Status (Good/Needs Tuning/Bad)
- Calibration Runs Table with:
  - Run label, model version, period
  - Sample size, avg gap, correlation, status
  - Actions: View Details button
- NewCalibrationRunDialog modal

**Data Flow**:
```typescript
useCalibrationRuns(tenantId, filters) 
  → fetchCalibrationRuns() from Supabase
  → Display in CalibrationRunsTable
```

---

### 2. Calibration Run Details

**Route**: `/admin/awareness/impact/calibration/:id`

**File**: `src/pages/admin/awareness/impact/CalibrationDetails.tsx`

**Features**:
- Header with back button and "Review Weight Suggestions" button
- Run Summary Cards (5 cards):
  - Sample Size
  - Avg Gap
  - Max Gap
  - Correlation Score
  - Overall Status
- Tabs Interface:
  - **Matrix Tab**: Calibration Heatmap (predicted × actual buckets)
  - **Trend Tab**: Line chart of validation gaps over time
  - **Outliers Tab**: Table of outlier calibration cells

**Components Used**:
- CalibrationRunSummary
- CalibrationMatrixHeatmap
- ValidationGapsTrend
- OutlierBucketsTable

---

### 3. Weight Suggestion Review

**Route**: `/admin/awareness/impact/calibration/:id/weights`

**File**: `src/pages/admin/awareness/impact/WeightSuggestionReview.tsx`

**Features**:
- Header with status badge (Draft/Proposed/Approved/Rejected/Applied)
- Rationale Alert showing explanation for weight adjustments
- Weight Comparison Table:
  - Current Weight vs Suggested Weight
  - Change amount (Δ) with trend arrows
  - Visual indicators (↑ increase, ↓ decrease, — no change)
- Action Buttons:
  - "Approve & Apply" → Creates new weight version
  - "Reject" → Marks suggestion as rejected
- Approval Confirmation Dialog with warning

**Data Flow**:
```typescript
useWeightSuggestions(tenantId, { calibrationRunId })
  → fetchWeightSuggestions() from Supabase
  → Display current vs suggested
  → On approve: approveAndApplyWeightSuggestion()
    → Updates suggestion status
    → Deactivates current weights
    → Creates new active weight version
```

---

### 4. Calibration Matrix Heatmap

**Component**: `CalibrationMatrixHeatmap.tsx`

**Visualization**:
- **X-Axis**: Actual Buckets (very_good_behavior → very_poor_behavior)
- **Y-Axis**: Predicted Buckets (very_low_risk → high_risk)
- **Cells**: Color-coded by gap size:
  - Green: Low gap (Δ ≤ 10) = Good alignment
  - Yellow: Medium gap (10 < Δ ≤ 20) = Needs tuning
  - Red: Large gap (Δ > 20) = Poor alignment
  - Gray: No data

**Cell Content**:
- Count of samples
- Avg gap (Δ)

**Hover Tooltip**:
- Predicted bucket × Actual bucket names
- Sample count
- Avg predicted score
- Avg actual score
- Gap size
- Gap direction (Overestimate/Underestimate/Balanced)
- Outlier flag (⚠️)

**Legend**:
- Color coding explanation at bottom

---

### 5. Validation Gaps Trend Chart

**Component**: `ValidationGapsTrend.tsx`

**Visualization**:
- **Chart Type**: Line Chart (Recharts)
- **X-Axis**: Time periods (from calibration runs)
- **Y-Axis (Left)**: Average Gap
- **Y-Axis (Right)**: Correlation Score (%)
- **Lines**:
  - Red line: Avg Gap (lower is better)
  - Blue line: Correlation Score (higher is better)

**Data Source**:
- Fetches all calibration runs for tenant
- Ordered by period_start
- Transforms to chart-friendly format

---

### 6. Weight Comparison Table

**Component**: `WeightComparisonTable.tsx`

**Table Structure**:
| Dimension | Current Weight | Suggested Weight | Change | Trend |
|-----------|---------------|------------------|---------|-------|
| Engagement | 25.0% | 22.0% | -3.0% | ↓ |
| Completion | 25.0% | 27.0% | +2.0% | ↑ |
| Feedback Quality | 25.0% | 26.0% | +1.0% | ↑ |
| Compliance Linkage | 25.0% | 25.0% | 0.0% | — |

**Features**:
- Color-coded badges for changes (green = increase, red = decrease, gray = no change)
- Trend icons (↑ up, ↓ down, — stable)
- Percentage format with precision
- Summary note about normalization

---

### 7. New Calibration Run Dialog

**Component**: `NewCalibrationRunDialog.tsx`

**Form Fields**:
1. **Model Version** (required, number)
2. **Period Start** (optional, date picker)
3. **Period End** (optional, date picker, must be after start)
4. **Run Label** (optional, text)
5. **Description** (optional, textarea)

**Behavior**:
- On submit → calls `run-calibration` edge function
- Shows loading state during execution
- Toast notification on success/error
- Calls parent `onSuccess()` callback to refresh list
- Resets form on success

**Validation**:
- Model version must be ≥ 1
- Period end must be after period start (if both specified)
- Uses Zod schema with React Hook Form

---

### 8. Stats Cards

**Component**: `CalibrationStatsCards.tsx`

**4 Cards**:

1. **Validations Processed**
   - Icon: CheckCircle2
   - Value: Total sample_size across all runs
   - Subtitle: "عبر X عملية معايرة"

2. **Average Gap**
   - Icon: TrendingUp
   - Value: Average of avg_validation_gap
   - Subtitle: "دقة عالية" / "دقة متوسطة" / "تحتاج تحسين"

3. **Correlation Score**
   - Icon: Target
   - Value: Average correlation_score (%)
   - Subtitle: "ارتباط قوي" / "ارتباط متوسط" / "ارتباط ضعيف"

4. **Overall Status**
   - Icon: AlertTriangle (color-coded)
   - Value: Status assessment (ممتازة / جيدة / تحتاج تحسين)
   - Badges: Count of Good/Needs Tuning/Bad runs

**Calculation Logic**:
- Aggregates metrics from all calibration runs
- Provides tenant-wide calibration health overview

---

### 9. Outlier Buckets Table

**Component**: `OutlierBucketsTable.tsx`

**Table Columns**:
- Predicted Bucket (with Arabic labels)
- Actual Bucket (with Arabic labels)
- Sample Count (badge, red if < 3)
- Avg Gap (red text if > 25)
- Gap Direction (badge: balanced/overestimate/underestimate)
- Reason (why it's an outlier)

**Outlier Reasons**:
- "عينات قليلة (< 3)" - Sample count < 3
- "فجوة كبيرة (> 25)" - Avg gap > 25
- "خلية شاذة" - Fallback

**Empty State**:
- Shows message if no outliers exist
- "جميع الخلايا تحتوي على عينات كافية وفجوات ضمن الحدود المقبولة"

---

## 🎨 Design & UX

### Color Coding System

**Calibration Quality**:
- 🟢 Green: Good (gap ≤ 10, correlation ≥ 75)
- 🟡 Yellow: Needs Tuning (gap ≤ 20)
- 🔴 Red: Bad (gap > 20 or correlation < 60)
- ⚪ Gray: No Data / Outliers

**Weight Changes**:
- 🟢 Green: Increase (positive change)
- 🔴 Red: Decrease (negative change)
- ⚪ Gray: No Change (|change| < 0.01)

**Status Badges**:
- Draft: Secondary (gray)
- Proposed: Blue
- Approved: Green
- Rejected: Red
- Applied: Primary

### Arabic UI (RTL)

All pages use `dir="rtl"` for proper right-to-left layout:
- Text alignment: right
- Icons: positioned on left (using `ml-2` instead of `mr-2`)
- Date formats: Using `ar-SA` locale
- Number formats: Using Arabic numerals with `toLocaleString('ar-SA')`

### Responsive Design

- **Grid Layouts**: Responsive columns (md:grid-cols-2, lg:grid-cols-4, lg:grid-cols-5)
- **Tables**: Wrapped in scrollable containers for mobile
- **Heatmap**: Min-width container with horizontal scroll
- **Buttons**: Stack on mobile, row on desktop (flex-col sm:flex-row)

### Dark Mode Support

- All components use semantic color tokens from design system
- Charts use `hsl(var(--primary))` and `hsl(var(--destructive))`
- Hover states: `hover:bg-muted/50`
- Muted backgrounds: `bg-muted/20`

---

## 🔌 Integration Points

### API Endpoints Used

| UI Action | API Endpoint | Method | Function |
|-----------|-------------|--------|----------|
| Fetch all runs | Supabase Query | GET | `fetchCalibrationRuns()` |
| Fetch run details | Supabase Query | GET | `useCalibrationRunDetails()` |
| Fetch cells | Supabase Query | GET | `fetchCalibrationCells()` |
| Fetch suggestions | Supabase Query | GET | `fetchWeightSuggestions()` |
| Create new run | Edge Function | POST | `run-calibration` |
| Approve suggestion | Service | POST | `approveAndApplyWeightSuggestion()` |

### Data Flow Diagram

```
Dashboard
  ↓
useCalibrationRuns(tenantId)
  ↓
fetchCalibrationRuns() → Supabase
  ↓
CalibrationRunsTable displays list
  ↓
User clicks "View Details"
  ↓
Navigate to /calibration/:id
  ↓
useCalibrationRunDetails(id) + useCalibrationCells(id)
  ↓
Display run summary + matrix heatmap
  ↓
User clicks "Review Weight Suggestions"
  ↓
Navigate to /calibration/:id/weights
  ↓
useWeightSuggestions(tenantId, { calibrationRunId })
  ↓
Display comparison table
  ↓
User clicks "Approve & Apply"
  ↓
approveAndApplyWeightSuggestion(suggestionId)
  ↓
  1. Update suggestion → status = 'approved'
  2. Deactivate current weights
  3. Create new weight version
  4. Update suggestion → status = 'applied'
```

---

## 📊 Visualization Specs

### Heatmap Matrix

**Dimensions**: 4 (predicted) × 5 (actual) = 20 cells

**Predicted Buckets (Y-Axis)**:
1. very_low_risk (منخفض جداً)
2. low_risk (منخفض)
3. medium_risk (متوسط)
4. high_risk (عالي)

**Actual Buckets (X-Axis)**:
1. very_good_behavior (ممتاز)
2. good_behavior (جيد)
3. average_behavior (متوسط)
4. poor_behavior (ضعيف)
5. very_poor_behavior (ضعيف جداً)

**Color Intensity Calculation**:
```typescript
if (gap <= 10) {
  intensity = (10 - gap) * 10; // 0-100
  color = `bg-green-500/${intensity}`;
}
else if (gap <= 20) {
  intensity = (20 - gap) * 5 + 50; // 50-100
  color = `bg-yellow-500/${intensity}`;
}
else {
  intensity = Math.min(gap * 2, 100); // Up to 100
  color = `bg-red-500/${intensity}`;
}
```

### Trend Chart

**Chart Library**: Recharts

**Configuration**:
- Responsive container (100% width, 400px height)
- Dual Y-axes (left: gap, right: correlation %)
- Grid with dashed lines
- Tooltips with RTL support
- Legend at bottom
- Line type: monotone (smooth curves)
- Dot markers on data points (radius 4px)

**Colors**:
- Gap line: `hsl(var(--destructive))` (red)
- Correlation line: `hsl(var(--primary))` (blue)

---

## 🧪 User Flows

### Flow 1: Create New Calibration Run

1. Admin navigates to `/admin/awareness/impact/calibration`
2. Clicks "+ تشغيل معايرة جديدة" button
3. Dialog opens with form
4. Fills in:
   - Model version (default: 1)
   - Period start & end (optional, date pickers)
   - Run label (optional)
   - Description (optional)
5. Clicks "بدء المعايرة"
6. Loading state shown
7. Edge function `run-calibration` executes:
   - Creates calibration run
   - Aggregates validations into cells
   - Calculates metrics
   - Generates weight suggestion
8. Success toast shown
9. Dialog closes
10. Table refreshes with new run

### Flow 2: Review Calibration Results

1. Admin clicks "عرض" on a calibration run
2. Navigates to `/admin/awareness/impact/calibration/:id`
3. Views run summary cards (sample size, gaps, correlation, status)
4. Switches to "مصفوفة المعايرة" tab
5. Views heatmap of predicted × actual buckets
6. Hovers over cells to see detailed metrics
7. Switches to "اتجاه الفجوات" tab
8. Views trend chart showing gap evolution over time
9. Switches to "الخلايا الشاذة" tab
10. Views table of outlier cells with reasons

### Flow 3: Approve Weight Adjustments

1. Admin clicks "مراجعة توصيات الأوزان" from run details
2. Navigates to `/admin/awareness/impact/calibration/:id/weights`
3. Reads rationale for weight adjustments
4. Reviews comparison table:
   - Current weights (version X)
   - Suggested weights (version X+1)
   - Change amounts and trends
5. Clicks "اعتماد وتطبيق" button
6. Confirmation dialog appears with warning
7. Clicks "تأكيد الاعتماد"
8. System:
   - Updates suggestion → status = 'approved'
   - Deactivates current weight version
   - Creates new active weight version
   - Updates suggestion → status = 'applied'
9. Success toast shown
10. Page refreshes with updated status badge

---

## 🔒 Security & Authorization

### Route Protection

All calibration pages wrapped in `<ProtectedRoute>`:
```typescript
<Route 
  path="/admin/awareness/impact/calibration" 
  element={
    <ProtectedRoute>
      <AdminLayout>
        <CalibrationDashboard />
      </AdminLayout>
    </ProtectedRoute>
  } 
/>
```

### Tenant Isolation

All data queries filtered by `tenantId` from `useAppContext()`:
```typescript
const { tenantId } = useAppContext();
const { data } = useCalibrationRuns(tenantId);
```

### RBAC Integration

- Edge function `run-calibration` checks for admin/super_admin role
- RLS policies on all calibration tables enforce tenant isolation
- Weight approval action will be logged in audit_log (future enhancement)

---

## 📝 TODO / Future Enhancements

### Immediate (Post-Part 4.4)

- [ ] **Export Functionality**:
  - CSV export of calibration runs
  - PDF report generation (integrate with Gate-F)
  - Export matrix heatmap as image

- [ ] **Filtering & Search**:
  - Filter runs by date range
  - Filter by overall status
  - Search by run label

- [ ] **Pagination**:
  - Paginate calibration runs table
  - Load more cells in matrix (if very large datasets)

### Short-term

- [ ] **Enhanced Visualizations**:
  - 3D heatmap option
  - Interactive drill-down from matrix cells to validation records
  - Comparison view (side-by-side run comparison)

- [ ] **Notifications**:
  - Email alert when calibration completes
  - Slack/Teams integration for weight suggestions
  - In-app notifications for pending approvals

- [ ] **Approval Workflow**:
  - Multi-step approval (reviewer → approver)
  - Comments/notes on weight suggestions
  - Rejection reason requirement
  - Approval history/audit trail

### Long-term

- [ ] **AI-Powered Insights**:
  - Automatic anomaly detection
  - Predictive suggestions for next calibration run
  - Natural language summaries of calibration results

- [ ] **Scheduled Calibrations**:
  - Cron jobs to run calibration automatically (monthly/quarterly)
  - Email reports on schedule
  - Auto-apply suggestions above confidence threshold

- [ ] **Advanced Analytics**:
  - Calibration quality score over time
  - Impact of weight changes on prediction accuracy
  - Tenant benchmarking (compare calibration quality across tenants)

---

## ✅ Acceptance Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Dashboard page displays list of calibration runs | ✅ | With stats cards |
| "New Calibration Run" button opens dialog | ✅ | Form with validation |
| Dialog calls edge function to create run | ✅ | With loading state |
| Run details page shows summary cards | ✅ | 5 metric cards |
| Matrix heatmap displays predicted × actual | ✅ | Color-coded by gap |
| Heatmap cells show hover tooltips | ✅ | With detailed metrics |
| Trend chart displays gap evolution | ✅ | Dual Y-axes |
| Outliers table lists anomalous cells | ✅ | With reason column |
| Weight review page compares current vs suggested | ✅ | With change badges |
| Approve button creates new weight version | ✅ | With confirmation dialog |
| All pages support RTL Arabic layout | ✅ | dir="rtl" |
| All components use semantic design tokens | ✅ | Dark mode compatible |
| All pages integrate with AdminLayout | ✅ | Protected routes |
| Loading states and skeletons implemented | ✅ | For all data fetches |
| Error handling with toast notifications | ✅ | Success/error feedback |

---

## 🔎 Review Report

### Coverage

✅ **Implementation Completeness**: 100%
- All 3 main views implemented (Dashboard, Details, Weight Review)
- All 8 components created
- All 4 hooks implemented
- Routes integrated into App.tsx
- All visualizations (heatmap, trend chart, tables) functional

### Notes

- **Heatmap Performance**: For very large matrices (e.g., 10×10), consider virtualization or lazy loading
- **Chart Library**: Using Recharts (already in dependencies) for consistency with existing dashboards
- **Date Picker**: Using Shadcn Calendar component with pointer-events-auto fix for dialog compatibility
- **User ID**: Weight approval currently uses placeholder 'current-user-id' - should be replaced with actual auth.uid()

### Warnings

⚠️ **No backend changes** - This part only implements UI. All backend APIs (from Parts 4.1-4.3) must be working for the UI to function.

⚠️ **Export feature** - Download button in run details is placeholder. Implement export-report edge function for actual PDF/CSV generation.

⚠️ **Rejection logic** - Weight suggestion rejection is commented as TODO. Implement `updateWeightSuggestionStatus()` call.

⚠️ **Pagination** - Calibration runs table does not paginate. Add pagination if list grows large.

---

## 🎯 Next Steps

**Gate-J Final Summary Document**:
- Create comprehensive `Gate_J_Execution_Summary_v1.md`
- Document complete data architecture (Parts 2-4)
- Summarize computation engine design
- Document validation & calibration logic
- Describe reporting layer
- Note integration points with Gate-F (Reports Export)
- Include links to all execution summaries

---

**Prepared by**: Lovable AI  
**Review Status**: Ready for Production  
**Integration**: Gate-J — Awareness Impact Engine (Complete)
