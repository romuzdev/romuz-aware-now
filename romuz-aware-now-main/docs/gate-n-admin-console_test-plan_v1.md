# Gate-N — Admin Console & Control Center · Test Plan (v1)

**Project:** Cyber Zone GRC – Romuz Awareness App  
**Module:** Gate-N — Admin Console & Control Center  
**Related Gates:** Gate-F (Reports & Exports), Gate-K (KPIs), Gate-E (Observability)

---

## 1. Context

Gate-N serves as the **central admin console** for a tenant, providing:
- Real-time system status and health monitoring
- Tenant-wide settings management (SLA, feature flags, limits)
- System jobs management (scheduling, triggering, monitoring)
- Integration points for reports (Gate-F) and KPIs (Gate-K)
- RBAC and activity monitoring

Gate-N is accessible only to users with the `admin` role within their tenant.

---

## 2. Test Objectives

- **Security & RBAC**: Ensure admin-only access is enforced at all layers (DB, Edge Functions, UI)
- **End-to-End Flows**: Validate status monitoring, settings CRUD, and job management work correctly
- **Integration**: Ensure Gate-N correctly surfaces links and data from Gate-F (Reports) and Gate-K (KPIs)
- **Error Handling**: Verify graceful degradation and clear error messages
- **Performance**: Ensure status/jobs endpoints respond within acceptable latency (<500ms)

---

## 3. Scope

### In-Scope
- **Database Layer**:
  - RPC functions: `fn_gate_n_get_admin_settings`, `fn_gate_n_upsert_admin_settings`, `fn_gate_n_list_system_jobs`, `fn_gate_n_trigger_job`, `fn_gate_n_get_status_snapshot`, `fn_gate_n_get_recent_job_runs`
  - Table access patterns: `admin_settings`, `system_jobs`, `system_job_runs`, `audit_log`
  
- **Edge Functions**:
  - `gate-n-status`: GET system status snapshot
  - `gate-n-jobs`: GET list of system jobs
  - `gate-n-trigger`: POST to trigger a job manually
  - `gate-n-settings`: GET/PUT admin settings

- **API Wrapper**:
  - TypeScript module: `src/lib/api/gateN.ts`
  - All exported functions and error handling

- **UI Layer**:
  - Gate-N Admin Console page: `/admin/gate-n`
  - All tabs: Overview (N1), Settings (N2), Jobs (N4), RBAC, Activity, Alerts
  - Integration with Gate-F/K links

### Out-of-Scope
- Detailed Gate-F report generation logic (covered in Gate-F test plan)
- Detailed Gate-K KPI computation logic (covered in Gate-K test plan)
- Gate-E observability features (logs, traces) — tested separately

---

## 4. Test Types

### 4.1 Database / RPC Tests
- Verify RPC functions execute correctly with proper auth context
- Test RBAC enforcement at function level
- Validate data consistency and transactions
- Test edge cases (missing tenant, invalid roles, NULL handling)

### 4.2 Edge Function Tests
- HTTP behavior (methods, headers, status codes)
- Authentication and authorization checks
- Payload validation (request/response schemas)
- Error handling and error response format
- CORS handling

### 4.3 API Wrapper Tests
- Correct endpoint URL construction
- HTTP method usage (GET/POST/PUT)
- Request payload serialization
- Response parsing and type safety
- Error mapping and propagation

### 4.4 UI Tests
- Component rendering (tabs, panels, cards)
- Loading states and skeletons
- Error states and retry mechanisms
- User interactions (button clicks, form submissions)
- Tab navigation and state persistence

### 4.5 Integration Tests
- End-to-end user flows (view status → trigger job → view results)
- Cross-module integration (Gate-N → Gate-F/K navigation)
- Audit log creation for critical actions

---

## 5. Environments & Test Data

### Required Test Environment
- **Tenant**: Seeded test tenant with UUID
- **Users**:
  - At least one user with `admin` role
  - At least one user with `user` role (for negative tests)
- **System Jobs**:
  - 3-5 system jobs configured for the tenant
  - Mix of enabled/disabled jobs
  - At least one global job (tenant_id = NULL)
- **Job Runs**:
  - Sample `system_job_runs` with various statuses (succeeded, failed, running)
  - Recent runs within last 24 hours
- **Admin Settings**:
  - Initial settings record for tenant
  - Sample SLA config, feature flags, limits

### Test Data Requirements
- Use fixtures/seeds that can be reset between test suites
- Mock external dependencies (email, notifications)
- Ensure deterministic job scheduling in tests

---

## 6. Test Cases Overview

### 6.1 RBAC & Security

- [ ] Non-admin user cannot access any Gate-N Edge Function (403)
- [ ] Admin user can access all Gate-N Edge Functions (200)
- [ ] Missing Authorization header returns 401
- [ ] Invalid/expired JWT returns 401
- [ ] RPC functions enforce tenant isolation (cannot see other tenant's data)
- [ ] Service role key bypasses RLS correctly in Edge Functions
- [ ] Audit log entries created for all critical actions (view settings, update settings, trigger job)

### 6.2 Status & KPIs (N1 - Overview Tab)

- [ ] Status panel loads successfully with real data
- [ ] Jobs summary shows correct counts (total, enabled, runs in 24h)
- [ ] Admin settings summary shows last updated timestamp
- [ ] Loading state displays skeleton/spinner
- [ ] Error state displays error message with retry button
- [ ] Retry button refetches data correctly
- [ ] Status refreshes automatically (if polling enabled)
- [ ] KPI links navigate to Gate-K correctly
- [ ] Report links navigate to Gate-F correctly

### 6.3 Tenant Settings (N2 - Settings Tab)

- [ ] Settings form loads current values from database
- [ ] Empty settings (new tenant) shows default/empty form
- [ ] All settings fields are editable by admin
- [ ] Save button triggers PUT request with correct payload
- [ ] Success toast/message shown after save
- [ ] Form validation prevents invalid inputs (e.g., negative SLA hours)
- [ ] Settings changes reflected immediately in UI
- [ ] Audit log entry created for settings update
- [ ] Concurrent edits handled gracefully (optimistic locking or last-write-wins)

### 6.4 Operations & Jobs (N4 - Jobs Tab)

- [ ] Jobs table loads all visible jobs for tenant
- [ ] Global jobs (tenant_id = NULL) included in list
- [ ] Job columns display correctly (name, key, type, schedule, enabled, last run)
- [ ] "Run now" button appears only for enabled jobs
- [ ] Clicking "Run now" triggers job successfully
- [ ] Success/error message shown after trigger attempt
- [ ] Job runs table shows recent executions
- [ ] Job run details include status, duration, error messages
- [ ] Disabled jobs cannot be triggered (button disabled or API rejects)
- [ ] Pagination works if many jobs exist

### 6.5 Integration with Gate-F / Gate-K

- [ ] Overview tab contains "Reports & KPIs" card
- [ ] "Open Reports (Gate-F)" button navigates to `/admin/reports`
- [ ] "Open KPIs (Gate-K)" button navigates to `/admin/kpis`
- [ ] KPI snippet values display if available in status JSON
- [ ] Missing KPI/report data handled gracefully (no crashes)
- [ ] Back navigation from Gate-F/K to Gate-N works correctly

### 6.6 Edge Cases & Error Handling

- [ ] Network errors handled gracefully (retry mechanism, error message)
- [ ] Empty job list displayed correctly
- [ ] Empty job runs displayed correctly
- [ ] Large payloads (settings with many flags) handled correctly
- [ ] Special characters in settings values (JSON escaping)
- [ ] Timezone handling for timestamps (consistent display)
- [ ] Concurrent job triggers (multiple admins) don't cause race conditions

---

## 7. Exit Criteria

Gate-N is considered **ready for release** when:

1. ✅ All high-priority test cases pass (RBAC, Status, Settings, Jobs)
2. ✅ No known critical defects in admin flows
3. ✅ Edge Function response times < 500ms (p95)
4. ✅ UI tests cover core user journeys (status view, settings edit, job trigger)
5. ✅ Integration with Gate-F/K verified (navigation works)
6. ✅ Security audit confirms proper RLS and role enforcement
7. ✅ Documentation complete (API docs, user guide)

---

## 8. Test Execution Plan

### Phase 1: Unit Tests
- Run DB/RPC tests
- Run Edge Function tests
- Run API wrapper tests
- Target: 80%+ code coverage

### Phase 2: Integration Tests
- Run UI component tests
- Run end-to-end flow tests
- Validate cross-module integration

### Phase 3: Manual Testing
- Exploratory testing by QA team
- Usability testing with sample admins
- Performance testing (load, stress)

### Phase 4: Pre-Release
- Security review
- Accessibility audit
- Documentation review
- Deployment rehearsal

---

## 9. Known Limitations

- Test environment uses mock notification channels (no real emails sent)
- Job execution is simulated (actual job logic tested separately)
- Performance tests limited to single-tenant load
- Browser compatibility tested on Chrome/Firefox/Safari only

---

## 10. References

- Gate-N Implementation Prompt: `docs/awareness/gate-n-admin-console_implementation-prompt_v2.md`
- Architecture Documentation: `docs/awareness/01_Architecture/`
- Related Test Plans: Gate-F Test Plan, Gate-K Test Plan

---

**Version:** v1  
**Last Updated:** 2025-11-11  
**Owner:** QA Team / Dev Team
