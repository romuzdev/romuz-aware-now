# Gate-N — Health Check & Diagnostics · Execution Plan (v1)

**Project:** Cyber Zone GRC – Romuz Awareness App  
**Module:** Gate-N — Admin Console & Control Center  
**Version:** 1.0  
**Last Updated:** 2025-01-11

---

## 1. Purpose

Gate-N Health Check is an internal diagnostic tool designed to validate the operational status of core Gate-N components for the current tenant. It provides administrators and developers with a rapid mechanism to identify configuration issues, runtime errors, and RBAC misconfigurations.

**Key Capabilities:**
- Automated checks for database RPCs, Edge Functions, and RBAC policies
- Real-time health status reporting with severity levels
- Safe, read-only validation to prevent data corruption
- Tenant-isolated diagnostics for multi-tenant security

---

## 2. Scope

### In-Scope

**Core RPC Health Checks:**
- `fn_gate_n_get_status_snapshot` — Validates status retrieval and data structure
- `fn_gate_n_get_admin_settings` — Verifies settings access and RLS enforcement
- `fn_gate_n_list_system_jobs` — Ensures job visibility for the current tenant
- Optional lightweight checks for job runs and alerts tables

**Edge Function Health Checks:**
- `gate-n-status` — Endpoint reachability and response validation
- `gate-n-jobs` — Job listing endpoint validation
- `gate-n-settings` — Settings API health check

**RBAC Sanity Checks:**
- Current user role validation (tenant_admin / system_admin)
- Permission verification for Gate-N operations

**UI Integration:**
- Dedicated Health Check panel within Gate-N Console
- Manual trigger capability with visual status reporting

### Out-of-Scope

- Deep performance benchmarking and load testing
- Full coverage of Gate-F (Reports) and Gate-K (KPIs) logic
- Automated alerting and notifications (future enhancement)
- Historical health check logging and trend analysis

---

## 3. Health Check Model

### Single Check Structure

```typescript
interface HealthCheck {
  code: string;              // e.g., "rpc_status_snapshot"
  label: string;             // Human-readable name (English)
  status: "pass" | "warn" | "fail";
  severity: "low" | "medium" | "high";
  latency_ms: number;        // Execution time in milliseconds
  message?: string;          // Optional diagnostic message
  error_code?: string;       // Optional error code (e.g., "NO_JOBS_FOUND", "RPC_ERROR")
}
```

### Overall Result Structure

```typescript
interface HealthCheckResult {
  success: boolean;          // true if no "fail" checks at "high" severity
  checks: HealthCheck[];     // Array of individual check results
  started_at: string;        // ISO 8601 timestamp
  finished_at: string;       // ISO 8601 timestamp
  total_duration_ms: number; // Total execution time
  tenant_id: string;         // Current tenant context
}
```

### Status Determination Logic

- **Pass:** Check executed successfully with expected results
- **Warn:** Check passed but detected sub-optimal conditions (e.g., no jobs configured)
- **Fail:** Check failed due to error, misconfiguration, or permission denial

### Severity Levels

- **Low:** Informational issues that do not impact functionality
- **Medium:** Potential issues that may affect performance or user experience
- **High:** Critical failures that block core functionality

---

## 4. Planned Checks (v1)

### 4.1 RPC: Status Snapshot
**Code:** `rpc_status_snapshot`  
**Label:** "Status Snapshot RPC"  
**Input:** Current tenant_id (from JWT)  
**Expected Behavior:**
- RPC `fn_gate_n_get_status_snapshot` returns valid JSON
- Response includes `admin_settings` and `jobs` arrays
- No RLS denial errors

**Pass Criteria:**
- RPC returns data successfully
- Response structure is valid
- Latency < 2000ms

**Warn Criteria:**
- Latency between 2000-5000ms
- Empty jobs array (no jobs configured)

**Fail Criteria:**
- RPC throws error
- RLS/RBAC denial
- Response structure is invalid
- Latency > 5000ms

---

### 4.2 RPC: Admin Settings
**Code:** `rpc_admin_settings`  
**Label:** "Admin Settings RPC"  
**Input:** Current tenant_id  
**Expected Behavior:**
- RPC `fn_gate_n_get_admin_settings` returns settings or empty array
- RLS allows access for tenant_admin role

**Pass Criteria:**
- RPC returns successfully (even if empty)
- No permission errors

**Warn Criteria:**
- No settings configured (empty result)

**Fail Criteria:**
- RPC error
- RBAC denial

---

### 4.3 RPC: List System Jobs
**Code:** `rpc_list_jobs`  
**Label:** "System Jobs RPC"  
**Input:** Current tenant_id  
**Expected Behavior:**
- RPC `fn_gate_n_list_system_jobs` returns jobs visible to tenant
- At least one job is returned (global or tenant-specific)

**Pass Criteria:**
- RPC returns successfully
- At least one job is visible

**Warn Criteria:**
- RPC succeeds but returns 0 jobs

**Fail Criteria:**
- RPC error
- Permission denial

---

### 4.4 RBAC: Current User Role
**Code:** `rbac_current_user`  
**Label:** "Current User RBAC"  
**Input:** Current user_id from JWT  
**Expected Behavior:**
- User has at least one admin role (tenant_admin or system_admin)
- Query to `user_roles` table succeeds

**Pass Criteria:**
- User has required admin role

**Fail Criteria:**
- User has no admin role
- Query error

---

### 4.5 Edge Functions: Endpoint Reachability
**Code:** `edge_endpoints`  
**Label:** "Edge Functions Health"  
**Input:** None (declarative check)  
**Expected Behavior:**
- Assumes Edge Functions are reachable if deployed
- Optional: Simple ping to a health endpoint if available

**Pass Criteria:**
- Edge Functions are deployed and operational (assumed)

**Warn Criteria:**
- Unable to verify reachability (if ping endpoint unavailable)

**Fail Criteria:**
- Known deployment failure or error state

---

### 4.6 Database Connectivity
**Code:** `db_connectivity`  
**Label:** "Database Connection"  
**Input:** None  
**Expected Behavior:**
- Simple query to verify database connection (e.g., `SELECT 1`)

**Pass Criteria:**
- Query executes successfully
- Latency < 500ms

**Warn Criteria:**
- Latency between 500-1000ms

**Fail Criteria:**
- Query fails
- Latency > 1000ms

---

## 5. UX & UI Behavior

### Integration Point
Health Check will be accessible in Gate-N Console as:
- **Option A:** Dedicated tab labeled "الفحص الصحي" (Health Check)
- **Option B:** Card widget inside the Overview/Status tab

### UI Components

**Trigger Section:**
- "تشغيل الفحص" (Run Health Check) button
- Shows loading state during execution
- Displays last run timestamp

**Results Display:**
- Table/list view of all checks
- Each check row includes:
  - Status badge (✓ Pass / ⚠ Warn / ✗ Fail) with color coding
  - Check label
  - Latency (ms)
  - Optional message or error code
- Summary card showing overall health status
- Filter/sort options (by status, severity)

**Color Scheme:**
- **Pass:** Green (`success` variant)
- **Warn:** Yellow (`warning` variant)
- **Fail:** Red (`destructive` variant)

### Safety Guarantees
- All checks are **read-only**
- No state-changing operations (INSERT/UPDATE/DELETE)
- No impact on business data or user sessions
- Safe to run multiple times consecutively

---

## 6. Acceptance Checklist

- [ ] Health Check Edge Function returns structured JSON with `success` and `checks` arrays
- [ ] Each check has a unique `code` and human-readable `label`
- [ ] Health Check panel is accessible only to users with `tenant_admin` or `system_admin` role
- [ ] Failing checks are clearly visible in the UI with red badge and error message
- [ ] Running the health check does not modify any business data
- [ ] Total health check execution time is displayed
- [ ] Last run timestamp is persisted and displayed in the UI
- [ ] All planned v1 checks (RPC, RBAC, DB) are implemented and tested
- [ ] Edge Function includes proper CORS headers and authentication
- [ ] Audit log entry is created when health check is executed
- [ ] Health check works correctly in multi-tenant context (tenant isolation)
- [ ] Error messages are informative and actionable for administrators
- [ ] UI loading state is shown during health check execution
- [ ] Health check results are cached for 5 minutes to prevent excessive load

---

## 7. Future Extensions (Notes)

### Phase 2 Enhancements
- **Historical Tracking:** Store health check results in `gate_n_health_check_history` table
- **Trend Analysis:** Show health status trends over time (daily/weekly)
- **Automated Scheduling:** Run health checks on cron schedule (e.g., hourly)
- **Alerting:** Send notifications when critical checks fail
- **KPI Data Readiness:** Validate Gate-K KPI views and data freshness
- **Reports Generation:** Check Gate-F report generation capabilities
- **SLA Evaluation:** Verify compliance with defined SLAs

### Phase 3 Enhancements
- **Dependency Checks:** Validate job dependency integrity
- **Performance Benchmarking:** Measure RPC execution time trends
- **Storage Health:** Check Supabase storage bucket availability
- **Email Service Health:** Validate email notification system
- **Integration Tests:** Execute end-to-end workflow validations

---

## 8. Technical Notes

### Implementation Strategy
1. Create Edge Function `gate-n-health-check` with tenant context validation
2. Implement each check as a standalone async function
3. Execute all checks in parallel using `Promise.allSettled()`
4. Aggregate results and determine overall health status
5. Return standardized JSON response

### Performance Considerations
- All checks should complete within 10 seconds total
- Individual check timeout: 3 seconds
- Use connection pooling for database queries
- Cache health check results client-side for 5 minutes

### Security Requirements
- Require authentication (JWT validation)
- Enforce RBAC (admin roles only)
- Sanitize all error messages (no sensitive data exposure)
- Log health check execution in audit log
- Respect tenant isolation (no cross-tenant checks)

---

**End of Document**
