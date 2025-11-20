# Gate-F: Reports & Exports – QA Checklist v1.0

**Purpose**: Comprehensive quality assurance checklist for the Reports & Exports module (Gate-F) in Romuz Awareness App.

**Last Updated**: 2025-11-10  
**Status**: 🟢 Ready for QA

---

## Section 1: Functional Checks

### 1.1 RBAC Scenarios

Test that role-based permissions are correctly enforced across all user roles.

#### Test Case 1.1.1: Admin Access (Full Permissions)

**User**: `adminA` (role: admin)  
**Permissions**: `view_reports` ✅ | `export_reports` ✅

**Steps**:
1. Login as admin user
2. Navigate to `/admin/reports`
3. Verify dashboard loads successfully
4. Verify export buttons (CSV, JSON, XLSX) are **visible**
5. Verify filters are accessible (Date range, Campaign, Include test)
6. Verify table displays data
7. Verify KPI cards are visible

**Expected Result**: ✅ Full access granted. All features visible.

---

#### Test Case 1.1.2: Analyst Access (View + Export)

**User**: `analystA` (role: analyst)  
**Permissions**: `view_reports` ✅ | `export_reports` ✅

**Steps**:
1. Login as analyst user
2. Navigate to `/admin/reports`
3. Verify dashboard loads
4. Verify export buttons are **visible**
5. Click CSV export button
6. Verify export is triggered and toast notification appears

**Expected Result**: ✅ Same access as admin for reporting features.

---

#### Test Case 1.1.3: Employee Access (No Permissions)

**User**: `employeeB` (role: none)  
**Permissions**: `view_reports` ❌ | `export_reports` ❌

**Steps**:
1. Login as employee user
2. Attempt to navigate to `/admin/reports`
3. Verify one of the following:
   - 403 Forbidden page is displayed, OR
   - Redirect to `/admin` with "No permission" message, OR
   - Dashboard shows "🚫 You don't have permission to view reports"

**Expected Result**: ❌ Access denied. No sensitive data visible.

---

### 1.2 Filters Functionality

#### Test Case 1.2.1: Campaign Filter

**Steps**:
1. Login as admin
2. Navigate to Reports dashboard
3. Open Campaign dropdown filter
4. Select a specific campaign (e.g., "Real Campaign 1")
5. Verify table updates to show only rows for that campaign
6. Verify KPI cards reflect campaign-specific metrics

**Expected Result**: ✅ Only selected campaign data is displayed.

---

#### Test Case 1.2.2: Date Range Filter (Timezone-Aware)

**Timezone**: Asia/Riyadh (UTC+3)

**Steps**:
1. Set Start Date: `2024-01-01`
2. Set End Date: `2024-01-07`
3. Press Enter or click Apply button
4. Verify table shows only rows within the 7-day range
5. **Critical**: Verify dates displayed match Riyadh timezone (no off-by-one UTC errors)

**Expected Result**: ✅ Data filtered correctly. Dates in Riyadh timezone.

**Validation**:
- If today is 2024-01-05 in Riyadh, it should appear as 2024-01-05 in the table (not 2024-01-04 or 2024-01-06)

---

#### Test Case 1.2.3: Include Test Campaigns Toggle

**Steps**:
1. By default, "Include test campaigns" should be **OFF** (exclude test traffic)
2. Verify table shows only campaigns where `is_test = false`
3. Toggle "Include test campaigns" **ON**
4. Verify table now includes campaigns with `is_test = true`
5. Toggle back **OFF**
6. Verify test campaigns are excluded again

**Expected Result**: ✅ Filter correctly excludes/includes test traffic.

---

### 1.3 Export Functionality

#### Test Case 1.3.1: CSV Export (Sync Mode)

**Prerequisites**: Dataset < 250k rows

**Steps**:
1. Login as admin or analyst
2. Set filters (e.g., last 7 days, specific campaign)
3. Click **"Export CSV"** button
4. Verify toast notification: "Export request created successfully"
5. Wait ≤ 2 seconds
6. Verify export appears in Export History table
7. Verify Status = **"Completed"**
8. Verify Download link is present
9. Click download link
10. Verify CSV file downloads

**Expected Result**: ✅ CSV file downloaded within 2 seconds.

---

#### Test Case 1.3.2: JSON Export (Sync Mode)

**Steps**: Same as 1.3.1, but click **"Export JSON"** button

**Expected Result**: ✅ JSON file downloaded within 2 seconds.

---

#### Test Case 1.3.3: XLSX Export (Sync Mode)

**Steps**: Same as 1.3.1, but click **"Export XLSX"** button

**Expected Result**: ✅ XLSX file downloaded within 2 seconds.

---

#### Test Case 1.3.4: Async Export (Large Dataset)

**Prerequisites**: Dataset ≥ 250k rows (requires manual seed or production data)

**Steps**:
1. Set filters to select large dataset (e.g., all campaigns, 1 year date range)
2. Click **"Export CSV"** button
3. Verify toast notification: "Export queued for processing"
4. Verify export appears in Export History with Status = **"Processing"**
5. Verify Batch ID is present
6. Wait for background job to complete (poll every 10 seconds)
7. Verify Status changes to **"Completed"**
8. Verify Download link appears
9. Download and verify file

**Expected Result**: ✅ Async export completes successfully. Status transitions: pending → processing → completed.

---

### 1.4 Export History Management

#### Test Case 1.4.1: View Export History

**Steps**:
1. Navigate to Reports dashboard
2. Scroll to "Export History" section
3. Verify table displays columns:
   - Report Type
   - Format
   - Status
   - Created At
   - Completed At
   - Actions (Download, Delete)

**Expected Result**: ✅ Export history is visible with all columns.

---

#### Test Case 1.4.2: Delete Export

**Steps**:
1. Locate an export in history
2. Click **Delete** button (trash icon)
3. Confirm deletion in dialog (if present)
4. Verify toast: "Export deleted"
5. Verify export row is removed from table

**Expected Result**: ✅ Export deleted successfully.

---

## Section 2: Data Accuracy

### 2.1 Manual KPI Validation (±1% Tolerance)

**Purpose**: Verify exported data matches canonical source (`mv_campaign_kpis_daily`)

**Steps**:
1. Login to backend (Lovable Cloud → Database)
2. Run SQL query:
   ```sql
   SELECT * FROM mv_campaign_kpis_daily
   WHERE tenant_id = '<your-tenant-id>'
     AND campaign_id = '<specific-campaign-id>'
     AND date_r = '2024-01-05'
   ORDER BY date_r DESC
   LIMIT 1;
   ```
3. Record canonical values:
   - `deliveries`, `opens`, `clicks`, `bounces`, `reminders`
   - `open_rate`, `ctr`, `completion_rate`, `activation_rate`
4. Export CSV for the same campaign and date range
5. Open CSV file
6. Locate the row for `2024-01-05`
7. Compare values:

| Metric | Canonical (DB) | Exported (CSV) | Diff % | Status |
|--------|----------------|----------------|--------|--------|
| deliveries | 500 | 500 | 0% | ✅ |
| opens | 325 | 325 | 0% | ✅ |
| clicks | 113 | 113 | 0% | ✅ |
| open_rate | 0.6500 | 0.6500 | 0% | ✅ |
| ctr | 0.3477 | 0.3477 | 0% | ✅ |

**Acceptance Criteria**: All values within **±1%** tolerance.

---

### 2.2 CTD Aggregation Accuracy

**Purpose**: Verify Cumulative-To-Date (CTD) aggregates are correct.

**Steps**:
1. Query DB:
   ```sql
   SELECT * FROM vw_campaign_kpis_ctd
   WHERE tenant_id = '<your-tenant-id>'
     AND campaign_id = '<specific-campaign-id>';
   ```
2. Record CTD values:
   - `total_deliveries`, `total_opens`, `total_clicks`
   - `avg_open_rate`, `avg_ctr`
3. Export JSON for the same campaign
4. Manually aggregate exported daily rows:
   - Sum all `deliveries`, `opens`, `clicks`
   - Calculate average `open_rate`, `ctr`
5. Compare:

| Metric | DB CTD | JSON Aggregate | Diff % | Status |
|--------|--------|----------------|--------|--------|
| total_deliveries | 3500 | 3500 | 0% | ✅ |
| total_opens | 2275 | 2275 | 0% | ✅ |
| avg_open_rate | 0.650 | 0.650 | 0% | ✅ |

**Acceptance Criteria**: All values within **±1%**.

---

## Section 3: Performance Benchmarks

### 3.1 Small Dataset (<10k rows)

**Setup**: Create/filter to show ~5k daily KPI rows

**Metrics**:
| Operation | Target (p50) | Target (p95) | Actual | Status |
|-----------|--------------|--------------|--------|--------|
| Dashboard Load | ≤ 300ms | ≤ 500ms | ___ ms | ⬜ |
| Apply Filter | ≤ 200ms | ≤ 400ms | ___ ms | ⬜ |
| CSV Export (Sync) | ≤ 1s | ≤ 2s | ___ ms | ⬜ |

**Steps to Measure**:
1. Open browser DevTools → Network tab
2. Navigate to `/admin/reports`
3. Record load time
4. Apply date filter
5. Record filter response time
6. Click CSV export
7. Record time until download link appears

---

### 3.2 Medium Dataset (~100k rows)

**Setup**: Date range covering 3-6 months for multiple campaigns

**Metrics**:
| Operation | Target (p50) | Target (p95) | Actual | Status |
|-----------|--------------|--------------|--------|--------|
| Dashboard Load | ≤ 500ms | ≤ 1s | ___ ms | ⬜ |
| Apply Filter | ≤ 300ms | ≤ 600ms | ___ ms | ⬜ |
| CSV Export (Sync) | ≤ 2s | ≤ 5s | ___ ms | ⬜ |

---

### 3.3 Large Dataset (~1M rows)

**Setup**: Full year data for all campaigns

**Metrics**:
| Operation | Target (p50) | Target (p95) | Actual | Status |
|-----------|--------------|--------------|--------|--------|
| Dashboard Load | ≤ 800ms | ≤ 1.2s | ___ ms | ⬜ |
| CSV Export (Async) | Mode: Async | Batch ID returned | ___ | ⬜ |
| Background Job | ≤ 5 min | ≤ 10 min | ___ min | ⬜ |

**Steps**:
1. Set filters to select ~1M rows
2. Click CSV export
3. Verify response is **async mode** with `batchId`
4. Monitor `report_exports` table for status changes
5. Record time from `created_at` to `completed_at`

---

## Section 4: Security & RLS

### 4.1 Tenant Isolation

**Purpose**: Verify tenants cannot access each other's data.

**Steps**:
1. Create two test tenants: **TenantA**, **TenantB**
2. Seed data for both tenants
3. Login as **UserA** (TenantA)
4. Navigate to Reports dashboard
5. Verify only TenantA campaigns and data are visible
6. Logout
7. Login as **UserB** (TenantB)
8. Navigate to Reports dashboard
9. Verify only TenantB data is visible
10. Verify TenantA data is **NOT visible**

**Expected Result**: ✅ Complete tenant isolation. No cross-tenant data leakage.

---

### 4.2 Export Isolation

**Steps**:
1. As **UserA**, trigger CSV export
2. Note the `export_id` from toast or history
3. Logout
4. Login as **UserB** (different tenant)
5. Navigate to Export History
6. Verify **UserA's export is NOT visible** in UserB's history

**Expected Result**: ✅ Exports are tenant-scoped. RLS enforced.

---

### 4.3 Audit Log Verification

**Steps**:
1. As admin, trigger an export
2. Navigate to `/admin/audit-log`
3. Filter by:
   - Entity Type: `report_export`
   - Action: `create`
4. Verify audit entry exists with:
   - `actor`: Current user ID
   - `entity_id`: Export ID
   - `payload`: Contains filters and report type
   - `created_at`: Recent timestamp

**Expected Result**: ✅ All export actions are logged.

---

### 4.4 RLS Policy Coverage

**Steps**:
1. Access backend (Lovable Cloud → Database)
2. Navigate to `report_exports` table
3. Click "Policies" tab
4. Verify RLS policies exist:
   - ✅ `Users can view their tenant exports` (SELECT)
   - ✅ `Users can create exports in their tenant` (INSERT)
   - ✅ `Users can delete their own exports` (DELETE)
5. Verify RLS is **enabled** on the table

**Expected Result**: ✅ RLS policies cover all operations.

---

## Section 5: File Format Compliance

### 5.1 CSV Format (RFC4180)

**Test**: Download a CSV export and verify format compliance.

**Checklist**:
- [ ] **UTF-8 Encoding**: Open in text editor, verify Arabic text displays correctly (not corrupted: `اسم الحملة`, `التاريخ`)
- [ ] **Bilingual Headers**: First line contains headers like:
  ```
  campaign_name / اسم الحملة,date / التاريخ,deliveries / الرسائل المرسلة,opens / الفتحات
  ```
- [ ] **CRLF Line Endings**: Open in hex editor, verify lines end with `0D 0A` (not just `0A`)
- [ ] **Comma Delimiter**: Fields separated by `,`
- [ ] **Proper Quoting**: Fields containing commas or quotes are wrapped in double quotes `""`
  - Example: `"Campaign Name, Q1 2025"` (comma in field)
  - Example: `"User said ""yes"""` (quote in field → escaped as `""`)
- [ ] **No Empty Values**: All numeric fields have values (0 if no data, not empty string)

**Tools**:
- Text Editor: VS Code, Sublime Text
- Hex Editor: HxD, Hex Fiend (to verify CRLF)
- CSV Validator: [csvlint.io](https://csvlint.io/)

---

### 5.2 JSON Format

**Test**: Download a JSON export and verify structure.

**Checklist**:
- [ ] **Valid JSON**: Parse in JSON validator (jsonlint.com)
- [ ] **Array Structure**: Top-level is an array `[{...}, {...}]`
- [ ] **Required Fields**: Each object contains:
  - `tenant_id`, `campaign_id`, `campaign_name`, `date`
  - `deliveries`, `opens`, `clicks`, `bounces`, `complaints`, `reminders`
  - `open_rate`, `ctr`, `completion_rate`, `activation_rate`
- [ ] **Data Types**:
  - IDs: strings (UUID format)
  - Metrics: numbers (integers or floats)
  - Dates: strings (YYYY-MM-DD format)
- [ ] **UTF-8 Encoding**: Arabic campaign names display correctly in JSON viewers

---

### 5.3 XLSX Format (Optional)

**Test**: Download an XLSX export and verify.

**Checklist**:
- [ ] Opens in Excel or LibreOffice without errors
- [ ] Headers are bilingual
- [ ] Numeric columns are formatted as numbers (not text)
- [ ] Date columns are formatted as dates
- [ ] Arabic text displays correctly

---

## Section 6: Audit & Lineage Metadata

### 6.1 report_exports Table Fields

For **every export**, verify the following fields are populated in the `report_exports` table:

**Query**:
```sql
SELECT * FROM report_exports
WHERE id = '<export_id>';
```

**Required Fields**:
- [ ] `id`: UUID (primary key)
- [ ] `tenant_id`: UUID (matches current user's tenant)
- [ ] `user_id`: UUID (matches current user)
- [ ] `report_type`: One of: `performance`, `deliverability`, `engagement`
- [ ] `file_format`: One of: `csv`, `json`, `xlsx`
- [ ] `status`: `completed` (for sync) or `processing` → `completed` (for async)
- [ ] `batch_id`: NULL (sync) or UUID (async)
- [ ] `total_rows`: Integer > 0
- [ ] `source_views`: JSONB containing:
  - `view`: `mv_report_kpis_daily`
  - `filters`: `{ startDate, endDate, campaign, excludeTest }`
- [ ] `storage_url`: String (download link or data URI)
- [ ] `created_at`: Timestamp (not null)
- [ ] `completed_at`: Timestamp (not null for completed exports)
- [ ] `refresh_at`: Timestamp (not null)
- [ ] `error_message`: NULL (for successful exports)

**Validation Rules**:
- `completed_at >= created_at` ✅
- `refresh_at` is within ±10 seconds of `created_at` ✅
- `source_views.view` contains `mv_report_kpis_daily` or `vw_report_kpis_ctd` ✅

---

### 6.2 Batch ID for Async Exports

**Test**: Trigger async export (>250k rows)

**Verify**:
- [ ] Response includes `batchId` field (UUID)
- [ ] `report_exports` row has matching `batch_id`
- [ ] Batch ID can be used to query export status
- [ ] Background job uses batch_id for processing

---

## Section 7: Edge Cases & Error Handling

### 7.1 Empty Dataset

**Steps**:
1. Set filters that return 0 rows (e.g., future date range with no data)
2. Trigger CSV export
3. Verify:
   - [ ] Export completes without error
   - [ ] CSV contains only headers (no data rows)
   - [ ] Toast shows "Export created" (not "No data" error)

---

### 7.2 Invalid Filters

**Steps**:
1. Set End Date < Start Date
2. Attempt to apply filter or export
3. Verify:
   - [ ] Validation error is displayed
   - [ ] Export is **not triggered**

---

### 7.3 Concurrent Exports

**Steps**:
1. Trigger 3 exports simultaneously (CSV, JSON, XLSX)
2. Verify:
   - [ ] All 3 exports are created
   - [ ] Each has unique `export_id`
   - [ ] All complete successfully (no conflicts)

---

### 7.4 Network Failure During Export

**Steps**:
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Trigger CSV export
4. Verify:
   - [ ] Error toast is displayed
   - [ ] Export status = `failed` (if row created)
   - [ ] User can retry

---

## Section 8: Regression Tests

### 8.1 Previous Gate Features Still Work

After implementing Gate-F, verify these features from previous gates are **not broken**:

**Campaigns (Gate-D)**:
- [ ] Create, edit, archive campaigns
- [ ] Bulk actions work
- [ ] Saved views work

**Participants (Part 10)**:
- [ ] Import CSV
- [ ] Bulk status updates
- [ ] Engagement tracking

**Observability (Gate-E)**:
- [ ] Alert policies trigger
- [ ] KPIs refresh correctly

---

## Section 9: Localization & UX

### 9.1 Bilingual Support

**Test**: Switch language (if i18n is implemented)

**Verify**:
- [ ] UI labels switch between English and Arabic
- [ ] Export headers remain bilingual (both languages always present)
- [ ] Toast notifications display in correct language

---

### 9.2 Responsive Design

**Test on Devices**:
- [ ] **Desktop** (1920x1080): Full layout visible
- [ ] **Tablet** (768x1024): Filters collapse or stack
- [ ] **Mobile** (375x667): Table scrolls horizontally, export buttons accessible

---

## Section 10: Sign-Off Checklist

Before marking Gate-F as **"Production Ready"**, all items below must be ✅:

### Functional
- [ ] All RBAC scenarios pass (admin, analyst, employee)
- [ ] All filter types work correctly (campaign, date, test toggle)
- [ ] CSV/JSON/XLSX exports generate valid files
- [ ] Async mode activates for >250k rows
- [ ] Export history displays correctly
- [ ] Delete export works

### Performance
- [ ] Dashboard loads < 1.2s (p95)
- [ ] Sync exports complete < 2s
- [ ] No UI freezes or timeouts

### Security
- [ ] Tenant isolation verified (no cross-tenant data)
- [ ] RLS policies enforced
- [ ] Audit log entries created

### Data Accuracy
- [ ] Manual KPI validation passes (±1%)
- [ ] CTD aggregates are correct

### Format Compliance
- [ ] CSV is RFC4180-compliant with bilingual headers
- [ ] JSON is valid and parseable
- [ ] UTF-8 encoding works for Arabic text

---

## Appendix: Test Data Seeds

### Recommended Seed Data for QA

```sql
-- Create test tenant
INSERT INTO tenants (name, domain, is_active)
VALUES ('QA Test Tenant', 'qa-test.romuz.sa', true);

-- Create test campaigns (3 real + 1 test)
INSERT INTO awareness_campaigns (tenant_id, name, status, start_date, end_date, is_test)
VALUES 
  ('<tenant-id>', 'Real Campaign 1', 'active', '2024-01-01', '2024-12-31', false),
  ('<tenant-id>', 'Real Campaign 2', 'active', '2024-01-01', '2024-12-31', false),
  ('<tenant-id>', 'Test Campaign 1', 'active', '2024-01-01', '2024-12-31', true);

-- Seed participants and notifications (use fixtures/reports_seed.ts)
```

Run:
```bash
npm run test:seed-reports
```

---

## Contact

**QA Lead**: [Name]  
**Slack**: #romuz-qa  
**Jira Epic**: ROMUZ-GateF

---

**Version History**:
- v1.0 (2025-11-10): Initial release covering all Gate-F acceptance criteria
