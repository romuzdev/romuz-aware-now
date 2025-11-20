# Gate-N — Admin Console & Control Center · Execution Plan (v1)

## 1. Header & Context

### Overview
Gate-N represents the **central control surface** for the Romuz Awareness Platform, providing system administrators and tenant administrators with comprehensive visibility and control over the entire application ecosystem. This gate serves as the unified dashboard for monitoring, configuration, and operational management.

### Purpose
Gate-N acts as the administrative nerve center, enabling:
- Real-time monitoring of system health and performance
- Tenant-level configuration and feature management
- RBAC visualization and audit trail inspection
- Operational control over scheduled jobs and background processes
- Centralized alert and failure management

### Integration Context
Gate-N is designed as an **admin-only** module that integrates with all previous gates:

| Gate | Integration Point | Purpose |
|------|------------------|---------|
| **Gate-A** | Tenants & Multi-tenancy | Tenant configuration, isolation enforcement |
| **Gate-B** | RBAC & Permissions | Role-permission matrix visualization |
| **Gate-C** | Policies Management | Policy lifecycle monitoring |
| **Gate-D** | Campaigns & Awareness | Campaign health and participant metrics |
| **Gate-E** | Observability & Alerts | Alert dashboard and failure monitoring |
| **Gate-F** | Reports & Analytics | Report generation status and schedules |
| **Gate-G** | Documents Hub | Document processing status |
| **Gate-H** | Action Plans | Action item tracking and SLA monitoring |
| **Gate-K** | KPI Insights | KPI health flags and anomaly detection |

### Access Control
Gate-N is **strictly restricted** to administrative roles:
- `tenant_admin`: Full control within their tenant boundary
- `system_admin`: Cross-tenant visibility and platform-wide controls
- `security_officer_view`: Read-only access for compliance and audit purposes (future)

All actions performed through Gate-N MUST be logged to the audit trail with full context (actor, action, timestamp, affected resources, outcome).

---

## 2. Roles & RBAC Assumptions

### Primary Roles
Gate-N enforces the following role hierarchy:

#### `system_admin` (Platform Level)
- **Scope**: Cross-tenant, platform-wide
- **Capabilities**:
  - View all tenants and their configurations
  - Monitor global system health (Supabase, Edge Functions, Cron jobs)
  - Access consolidated audit logs across all tenants
  - Manage platform-level feature flags
  - Trigger system-wide maintenance operations
- **Restrictions**:
  - Cannot directly modify tenant-specific data without impersonation
  - All actions are heavily audited

#### `tenant_admin` (Tenant Level)
- **Scope**: Single tenant boundary
- **Capabilities**:
  - View tenant-specific system dashboard
  - Configure tenant settings (SLAs, thresholds, limits)
  - View RBAC matrix for their tenant
  - Trigger tenant-specific jobs (reminders, reports)
  - Access tenant-scoped audit logs and alerts
- **Restrictions**:
  - Cannot see or affect other tenants
  - Cannot modify platform-level configurations

#### `security_officer_view` (Audit & Compliance — Future)
- **Scope**: Read-only, tenant-specific or cross-tenant (based on assignment)
- **Capabilities**:
  - View audit logs and compliance reports
  - Export security-relevant data
  - Monitor alert states and failure patterns
- **Restrictions**:
  - No write or execution permissions
  - Cannot trigger jobs or modify configurations

### RBAC Implementation Notes
1. **RLS Enforcement**: All queries in Gate-N must respect tenant isolation via RLS policies.
2. **Permission Checks**: Use existing `has_role()` and permission helper functions from Gate-B.
3. **Audit Logging**: Every admin action must generate an audit log entry with:
   - `actor_user_id`
   - `action_type` (view, configure, execute, approve)
   - `entity_type` (tenant, job, alert, config)
   - `entity_id`
   - `before_state` and `after_state` (JSON)
   - `outcome` (success, failure, partial)
   - `ip_address` and `user_agent` (for security)

4. **2-Step Confirmation**: Critical operations (e.g., tenant deletion, job force-stop, bulk actions) require explicit confirmation dialogs.

---

## 3. Functional Scope Breakdown (N1 → N6)

### N1 — System Dashboard

#### Purpose
Provides a high-level health overview of the entire platform, enabling administrators to quickly identify issues and assess system status.

#### Key Metrics
- **Database Health**:
  - Connection pool status
  - Active connections count
  - Replication lag (if applicable)
  - Slow query count (last 24h)
  
- **Edge Functions Status**:
  - Total deployed functions
  - Invocation count and error rate (last 1h, 24h)
  - Average response time
  - Failed invocations requiring attention

- **Cron Jobs & Schedulers**:
  - Next scheduled runs for critical jobs
  - Recent job completion status
  - Jobs in error state
  - Missed schedule count

- **Gate Health Summary**:
  - Per-gate status indicator (green/yellow/red)
  - Recent errors or warnings by gate
  - Resource usage per gate (DB queries, function calls)

#### Inputs
- Supabase system tables (`pg_stat_activity`, `pg_stat_database`)
- `refresh_log` table (materialized view refresh status)
- Edge function logs (via Supabase Analytics API or custom logging table)
- `cron.job_run_details` (if using pg_cron)
- Per-gate health check endpoints or status tables

#### Outputs (Admin View)
- Real-time dashboard with auto-refresh capability
- Color-coded status cards (green = healthy, yellow = warning, red = critical)
- Quick-action buttons (refresh views, restart failed jobs, view details)
- Time-series charts for key metrics (last 7 days)

#### Technical Notes
- Use incremental loading to avoid blocking on heavy queries
- Cache aggregated metrics with 1-5 minute TTL
- Provide drill-down capability to detailed logs

---

### N2 — Tenant Configuration

#### Purpose
Enable tenant administrators to configure tenant-specific settings that affect application behavior, limits, and feature availability.

#### Configuration Categories

##### SLA & Thresholds
- **Campaign Reminders**:
  - Days before deadline to send first reminder
  - Days before deadline to send final reminder
  - Max reminder count per participant
  
- **Report Generation**:
  - Auto-generation schedule (daily, weekly, monthly)
  - Report retention period (days)
  - Export format preferences (CSV, JSON, PDF)

- **Action Plans (Gate-H)**:
  - SLA days by priority (urgent: 7, high: 14, medium: 30, low: 60)
  - Overdue escalation rules
  - Auto-assignment logic

##### Feature Flags
Toggles to enable/disable specific gates or features per tenant:
- `enable_campaigns` (Gate-D)
- `enable_documents` (Gate-G)
- `enable_action_plans` (Gate-H)
- `enable_kpi_insights` (Gate-K)
- `enable_quarterly_reports` (Gate-K)
- `enable_ai_recommendations` (Gate-K)

##### Limits & Quotas
- Max active campaigns
- Max employees per tenant
- Max storage (MB) for documents
- Max API calls per hour (if rate limiting is implemented)

#### Inputs
- Current tenant configuration (from `tenant_settings` table)
- Platform-level defaults and constraints
- Tenant subscription tier (if applicable)

#### Outputs
- Configuration form with validation
- Save/Cancel actions
- Change preview (before vs. after)
- Audit log entry on save

#### Technical Notes
- Store in dedicated `tenant_settings` JSONB column or separate `tenant_configs` table
- Validate against platform constraints before save
- Propagate changes to affected services (may require cache invalidation or Edge Function notification)

---

### N3 — Roles & Permissions Viewer

#### Purpose
Provide a visual representation of the RBAC matrix, showing which roles have which permissions across the system. This is a **read-only diagnostic tool** for administrators to understand access control configuration.

#### Key Features
- **Matrix View**: Rows = Roles, Columns = Permissions, Cells = Granted/Denied
- **User Assignment View**: List users with their assigned roles per tenant
- **Permission Lineage**: Show where a permission is derived from (direct assignment vs. role inheritance)

#### Inputs
- `user_roles` table
- `roles` table (if exists) or hardcoded role definitions
- `permissions` table (if exists) or permission mappings from Gate-B
- `user_tenants` table (tenant membership)

#### Outputs
- Interactive matrix with filtering by role, permission, or user
- Export capability (CSV, JSON)
- Audit trail of recent role/permission changes

#### Technical Notes
- This is NOT an editor — changes to RBAC must go through dedicated admin flows (future)
- Use memoized queries to avoid performance issues on large tenant user bases
- Highlight anomalies (e.g., users with no roles, roles with no users)

---

### N4 — Operations & Scheduler Control

#### Purpose
Allow administrators to manually trigger background jobs, view scheduled tasks, and manage operational processes that normally run automatically.

#### Supported Operations

##### Job Execution
- **Materialized View Refresh**:
  - Refresh specific views (Gate-K, Gate-F)
  - Refresh all awareness views
  - Force full refresh (non-concurrent)

- **Reminder Dispatch**:
  - Send pending reminders for a specific campaign
  - Trigger overdue reminders for all campaigns

- **Report Generation**:
  - Generate on-demand reports (Gate-F)
  - Regenerate failed reports

- **KPI Analysis**:
  - Run RCA analysis for specific KPI and month
  - Generate recommendations (Gate-K)
  - Create quarterly insights

- **Action Plan Sync**:
  - Sync action items from recommendations
  - Update SLA status for all actions

##### Schedule Viewer
- List all cron jobs with:
  - Job name
  - Schedule (cron expression)
  - Last run time and status
  - Next scheduled run
  - Enabled/disabled state

##### Manual Overrides
- Pause/resume specific jobs
- Skip next scheduled run
- Force immediate execution (with confirmation)

#### Inputs
- `cron.job` table (pg_cron jobs)
- `refresh_log` table (MV refresh history)
- Custom job status tables (if implemented)
- Edge Function deployment info

#### Outputs
- Job list with status indicators
- Action buttons (Run Now, Pause, Resume)
- Execution logs and results
- Success/failure notifications

#### Technical Notes
- Use queue-based execution to avoid blocking UI
- Implement idempotency checks (prevent duplicate runs)
- Rate-limit manual triggers (e.g., max 5 runs per hour per job)
- Log all manual executions with actor and reason

---

### N5 — Activity & Audit Monitor

#### Purpose
Provide comprehensive visibility into administrative and user actions across the platform, enabling compliance tracking, security investigation, and operational debugging.

#### Key Features

##### Audit Log Viewer
- **Filters**:
  - Date range (last 24h, 7d, 30d, custom)
  - Actor (user ID, email, role)
  - Action type (create, update, delete, view, execute, approve)
  - Entity type (campaign, policy, document, action, config, job)
  - Outcome (success, failure, partial)
  - Tenant (for `system_admin` only)

- **Display Columns**:
  - Timestamp (with timezone)
  - Actor (user name + role)
  - Action description (human-readable)
  - Entity (type + ID + name)
  - Before/after state (expandable JSON diff)
  - Outcome + error message (if failure)
  - IP address + user agent

##### Activity Analytics
- Top actors by action count
- Most modified entities
- Failure rate trends
- Peak activity hours

##### Export & Compliance
- Export filtered logs to CSV/JSON
- Generate compliance reports (e.g., "all admin actions in Q4 2024")
- Archive old logs (retention policy enforcement)

#### Inputs
- `audit_log` table (unified audit trail)
- `users` table (actor details)
- `tenants` table (tenant names)
- Optional: IP geolocation service for location enrichment

#### Outputs
- Paginated audit log table with infinite scroll or pagination
- Detail modal for each log entry
- Export files (CSV, JSON, PDF report)

#### Technical Notes
- Partition `audit_log` by date for performance (monthly or quarterly partitions)
- Use indexed columns for common filters (timestamp, actor_user_id, entity_type)
- Implement role-based filtering (tenant_admin sees only their tenant)
- Redact sensitive fields (e.g., passwords, tokens) from before/after state

---

### N6 — Alerts & Failures Monitor

#### Purpose
Consolidate all system alerts, failures, and errors into a single monitoring surface, enabling administrators to quickly identify and respond to issues.

#### Alert Sources
- **Edge Function Failures**:
  - Function name, invocation ID, error message
  - Frequency and last occurrence
  - Impact (affected users, tenants)

- **Cron Job Failures**:
  - Job name, expected vs. actual run time
  - Error logs and retry attempts
  - Blocked dependencies

- **Data Anomalies** (from Gate-K):
  - KPI alerts (flags: warn, alert)
  - Anomaly detection results (z-score outliers)
  - Contribution analysis red flags

- **Observability Alerts** (from Gate-E):
  - Alert policies triggered
  - Channel delivery failures (email, SMS, webhook)
  - Alert state changes (firing, resolved, silenced)

- **System Resource Alerts**:
  - High DB connection usage
  - Slow query threshold exceeded
  - Storage quota approaching limit

#### Key Features

##### Alert Dashboard
- **Status Overview**:
  - Active alerts count by severity (critical, warning, info)
  - Recent resolutions
  - Silenced/snoozed alerts

- **Alert List**:
  - Sortable by severity, timestamp, affected gate
  - Filterable by alert type, source, status
  - Quick actions (acknowledge, resolve, mute, escalate)

##### Failure Details
- Expandable row with:
  - Full error stack trace
  - Related logs and context
  - Affected users or tenants
  - Suggested remediation (if available)

##### Actions & Workflows
- **Acknowledge**: Mark alert as seen (by actor, timestamp)
- **Resolve**: Mark issue as fixed (with resolution note)
- **Mute**: Suppress similar alerts for N hours/days
- **Re-run**: Trigger retry for failed job (if applicable)
- **Escalate**: Create action item in Gate-H or notify on-call

#### Inputs
- `alert_events` table (from Gate-E)
- Edge function error logs (Supabase Analytics or custom table)
- `refresh_log` table (MV refresh failures)
- `cron.job_run_details` (failed cron jobs)
- `mv_kpi_monthly_flags` (KPI alerts from Gate-K)

#### Outputs
- Real-time alert feed with auto-refresh
- Alert count badges on Gate-N navigation
- Email/Slack notifications for critical alerts (future integration)
- Downloadable failure reports

#### Technical Notes
- Use WebSocket or polling for real-time updates
- Implement alert deduplication (group similar alerts)
- Store alert state changes in audit log
- Provide mute/snooze expiry mechanism (auto-reactivate)

---

## 4. Non-Functional Requirements

### Security & RBAC
1. **Tenant Isolation**:
   - All queries MUST filter by `tenant_id` derived from authenticated user context
   - `system_admin` role can override tenant filter with explicit confirmation

2. **Action Authorization**:
   - Every operation (view, execute, configure) requires permission check via `has_role()` or `can()` helper
   - Failed authorization attempts are logged as security events

3. **Sensitive Operations**:
   - Operations with platform-wide impact require 2-step confirmation
   - Bulk actions (e.g., delete all failed jobs) require typing confirmation text

4. **Audit Trail**:
   - All actions in Gate-N must generate audit log entries
   - Include IP address, user agent, and session context
   - Retention: minimum 1 year for compliance

### Observability & Monitoring
1. **Self-Monitoring**:
   - Gate-N itself must report health status (can be queried by N1)
   - Track dashboard load times, query performance, error rates

2. **Signal Reuse**:
   - Leverage existing metrics from Gate-E (alerts), Gate-K (KPIs), and Supabase Analytics
   - Avoid creating duplicate monitoring infrastructure

3. **Alerting**:
   - Gate-N can trigger alerts if admin actions fail (e.g., job execution timeout)
   - Alert delivery via Gate-E channels

### UX & Localization
1. **Arabic-First UI**:
   - All labels, buttons, and messages in Arabic by default
   - Support English toggle for bilingual admins
   - RTL layout with proper text alignment

2. **Consistent Design**:
   - Follow Gate-H visual style (shadcn/ui components)
   - Use design system tokens (colors, spacing, typography)
   - Maintain responsive layout (desktop-first, mobile-adaptive)

3. **Low Cognitive Load**:
   - Group related actions and metrics
   - Use color coding (green/yellow/red) consistently
   - Provide contextual help and tooltips for complex features

4. **Accessibility**:
   - Keyboard navigation support
   - Screen reader compatibility (ARIA labels)
   - High contrast mode support

### Performance
1. **Incremental Loading**:
   - Load dashboard widgets asynchronously
   - Show loading skeletons while fetching data
   - Prioritize above-the-fold content

2. **Query Optimization**:
   - Use materialized views for expensive aggregations
   - Implement result caching with TTL (1-5 minutes)
   - Paginate large lists (audit logs, alerts)

3. **Resource Limits**:
   - Cap query result sizes (max 1000 rows per page)
   - Timeout long-running queries (> 30s)
   - Rate-limit API calls from UI (debounce user actions)

4. **Error Handling**:
   - Graceful degradation (show partial data if some queries fail)
   - Retry failed requests with exponential backoff
   - Display user-friendly error messages with recovery suggestions

---

## 5. Dependencies & Integration Points

### Existing Entities (from Previous Gates)

#### Core Multi-Tenancy (Gate-A)
- `tenants` table: Tenant metadata and status
- `user_tenants` table: User-tenant membership mapping
- `app_current_tenant_id()` function: Tenant context helper

#### RBAC (Gate-B)
- `user_roles` table: Role assignments
- `has_role()` function: Role check helper
- `app_has_role()` function: Current user role check

#### Audit & Logging (Gate-G / Cross-gate)
- `audit_log` table: Unified audit trail (if exists, else create in Part 2)
- Columns: `id`, `tenant_id`, `actor_user_id`, `action_type`, `entity_type`, `entity_id`, `before_state`, `after_state`, `outcome`, `error_message`, `ip_address`, `user_agent`, `created_at`

#### Observability (Gate-E)
- `alert_events` table: Alert history
- `alert_policies` table: Alert rule definitions
- `alert_channels` table: Notification channels

#### KPI & Analytics (Gate-K)
- `mv_kpi_monthly_flags` view: KPI alerts and anomalies
- `refresh_log` table: Materialized view refresh status
- `kpi_catalog` table: KPI definitions

#### Reports (Gate-F)
- `mv_report_kpis_daily` view: Daily report metrics
- Report generation functions (RPC)

#### Action Plans (Gate-H)
- `gate_h.action_items` table: Action plans
- `gate_h_list_actions()` RPC: Action retrieval

#### Campaigns (Gate-D)
- `awareness_campaigns` table: Campaign metadata
- `campaign_participants` table: Participant status

### New Entities (to be defined in Part 2)

#### System Configuration
- `tenant_settings` table or JSONB column:
  - `tenant_id`, `config_key`, `config_value`, `data_type`, `updated_at`, `updated_by`
  - Example keys: `reminder_sla_days`, `enable_campaigns`, `max_active_campaigns`

#### Job Management
- `system_jobs` table (if not using pg_cron directly):
  - `id`, `job_name`, `job_type`, `schedule_cron`, `enabled`, `last_run_at`, `last_status`, `next_run_at`, `config_json`, `created_at`, `updated_at`

- `job_execution_log` table:
  - `id`, `job_id`, `triggered_by`, `trigger_type` (scheduled/manual), `started_at`, `completed_at`, `status`, `output_json`, `error_message`

#### User Profiles (recently added)
- `user_profiles` table: Theme preference and other user settings

### External Dependencies
- **Supabase System Tables**:
  - `pg_stat_activity`: DB connection and query stats
  - `pg_stat_database`: DB-level metrics
  - `cron.job` and `cron.job_run_details` (if pg_cron is enabled)

- **Supabase Management API** (if accessible):
  - Edge function invocation logs
  - Storage usage metrics
  - Auth user counts

- **Edge Functions** (to be created in Part 3):
  - `gate-n-health-check`: Return platform health summary
  - `gate-n-job-runner`: Execute manual job triggers
  - `gate-n-alert-manager`: Manage alert states (acknowledge, resolve, mute)

---

## 6. Implementation Phasing (High-Level for Parts 2→6)

### Phase Mapping Overview
Gate-N will be implemented sequentially across 5 parts, each building on the previous:

| Phase | Focus | Deliverables | Validation |
|-------|-------|-------------|-----------|
| **Part 2** | Database & RLS | Schema, policies, helper functions | SQL queries return correct data with RLS enforcement |
| **Part 3** | Edge Functions | Backend logic for job execution, health checks | Functions return expected JSON responses |
| **Part 4** | Integration Layer | TypeScript API client for Gate-N | Service functions call Edge Functions correctly |
| **Part 5** | React UI | Dashboard, configuration, monitors | UI renders data, actions trigger backend |
| **Part 6** | Testing & Validation | Unit tests, integration tests, acceptance | All user stories pass, no security gaps |

---

### Part 2: Database Schema & RLS Policies

#### Step 2.1: Audit Log Table
**Goal**: Ensure a robust audit trail for all admin actions.

**Tasks**:
- Create or validate `audit_log` table structure:
  - Columns: `id`, `tenant_id`, `actor_user_id`, `action_type`, `entity_type`, `entity_id`, `before_state` (JSONB), `after_state` (JSONB), `outcome`, `error_message`, `ip_address`, `user_agent`, `created_at`
- Create RLS policies:
  - `tenant_admin` can view logs for their tenant
  - `system_admin` can view all logs
- Create helper function: `log_admin_action(p_action_type, p_entity_type, p_entity_id, ...)`

**Acceptance**:
- `tenant_admin` sees only their tenant's logs
- `system_admin` sees all logs
- Function successfully inserts log entries

---

#### Step 2.2: Tenant Settings Table
**Goal**: Store tenant-specific configuration.

**Tasks**:
- Create `tenant_settings` table:
  - Columns: `tenant_id`, `config_key`, `config_value`, `data_type`, `updated_at`, `updated_by`
  - Unique constraint on `(tenant_id, config_key)`
- Seed default settings for existing tenants
- Create RLS policies (tenant-scoped read/write)
- Create helper functions:
  - `get_tenant_setting(p_tenant_id, p_key)`: Returns config value
  - `set_tenant_setting(p_tenant_id, p_key, p_value)`: Updates config and logs change

**Acceptance**:
- Settings are isolated by tenant
- Updates generate audit log entries
- Default values are applied correctly

---

#### Step 2.3: System Jobs & Execution Log Tables
**Goal**: Track scheduled jobs and their execution history.

**Tasks**:
- Create `system_jobs` table (if not using pg_cron directly):
  - Columns: `id`, `job_name`, `job_type`, `schedule_cron`, `enabled`, `last_run_at`, `last_status`, `next_run_at`, `config_json`
- Create `job_execution_log` table:
  - Columns: `id`, `job_id`, `triggered_by`, `trigger_type`, `started_at`, `completed_at`, `status`, `output_json`, `error_message`
- Seed existing jobs (MV refreshes, reminder dispatches)
- Create RLS policies (admin-only access)

**Acceptance**:
- Jobs are listed with correct schedules
- Execution history is preserved
- Admin can query job status

---

#### Step 2.4: RLS Policies for Gate-N Entities
**Goal**: Enforce tenant isolation and role-based access.

**Tasks**:
- Apply RLS to all Gate-N tables (`tenant_settings`, `system_jobs`, `audit_log`)
- Create policies:
  - `system_admin` has full access (all tenants)
  - `tenant_admin` has tenant-scoped access
  - All other roles have no direct table access (must use RPC)
- Test with multiple tenants and roles

**Acceptance**:
- RLS blocks unauthorized access
- `tenant_admin` cannot see other tenants' data
- Audit logs capture RLS violations

---

### Part 3: Edge Functions & Backend Logic

#### Step 3.1: Health Check Function
**Goal**: Provide a unified health status endpoint.

**Tasks**:
- Create Edge Function: `gate-n-health-check`
- Implement logic:
  - Query Supabase system tables (`pg_stat_activity`, `pg_stat_database`)
  - Check last refresh timestamps from `refresh_log`
  - Query Edge Function error rates (if available via Supabase API)
  - Aggregate job statuses from `system_jobs`
- Return JSON:
  ```json
  {
    "status": "healthy" | "degraded" | "critical",
    "database": { "connections": 10, "status": "ok" },
    "edge_functions": { "error_rate": 0.02, "status": "ok" },
    "cron_jobs": { "failed_count": 2, "status": "warn" },
    "gates": {
      "gate_k": { "status": "ok", "last_refresh": "2024-11-10T10:00:00Z" }
    }
  }
  ```

**Acceptance**:
- Function returns 200 with valid JSON
- Status reflects actual system state
- Handles DB connection failures gracefully

---

#### Step 3.2: Job Runner Function
**Goal**: Enable manual execution of background jobs.

**Tasks**:
- Create Edge Function: `gate-n-job-runner`
- Accept parameters:
  - `job_type`: "refresh_views" | "send_reminders" | "generate_report" | "run_rca"
  - `job_config`: JSONB (e.g., `{ "campaign_id": "uuid", "kpi_key": "phishing_rate" }`)
  - `tenant_id`: Optional (for `system_admin` cross-tenant execution)
- Implement authorization:
  - Verify caller has `tenant_admin` or `system_admin` role
  - Log execution request to `job_execution_log`
- Call appropriate functions:
  - `refresh_gate_k_views()` for view refresh
  - Custom reminder dispatch function
  - `generate_recommendations()` for RCA
- Return execution result:
  ```json
  {
    "execution_id": "uuid",
    "status": "started" | "completed" | "failed",
    "message": "Job completed successfully",
    "output": { ... }
  }
  ```

**Acceptance**:
- Jobs execute correctly when triggered manually
- Unauthorized calls return 403
- Execution logs are created with correct metadata

---

#### Step 3.3: Alert Manager Function
**Goal**: Manage alert states (acknowledge, resolve, mute).

**Tasks**:
- Create Edge Function: `gate-n-alert-manager`
- Accept parameters:
  - `action`: "acknowledge" | "resolve" | "mute" | "escalate"
  - `alert_id`: UUID
  - `note`: Optional text (resolution note, mute reason)
  - `mute_duration_hours`: For mute action
- Implement logic:
  - Update `alert_events` table (add `acknowledged_by`, `resolved_by`, `muted_until`)
  - Create audit log entry
  - If escalate: create action item in Gate-H
- Return success/failure

**Acceptance**:
- Alert states update correctly
- Mute expiry is enforced (alerts reactivate after duration)
- Escalation creates valid action item

---

### Part 4: TypeScript Integration Layer

#### Step 4.1: Gate-N API Client
**Goal**: Create a typed interface for frontend to call Gate-N Edge Functions.

**Tasks**:
- Create `src/integrations/supabase/gate-n.ts`:
  - `getSystemHealth()`: Calls health check function
  - `runJob(jobType, config)`: Calls job runner
  - `manageAlert(alertId, action, note)`: Calls alert manager
  - `getTenantSettings(tenantId)`: Queries tenant_settings table
  - `updateTenantSetting(tenantId, key, value)`: Updates setting
  - `getAuditLogs(filters)`: Queries audit_log with pagination
  - `getJobHistory(jobId)`: Queries job_execution_log
- Use Zod schemas for type validation
- Handle errors gracefully (return `Result<T, Error>` pattern)

**Acceptance**:
- All functions return correctly typed data
- Network errors are caught and reported
- Tenant isolation is maintained in queries

---

#### Step 4.2: React Query Hooks
**Goal**: Provide React hooks for data fetching and mutations.

**Tasks**:
- Create `src/hooks/gate-n/`:
  - `useSystemHealth()`: Fetches health status with auto-refresh
  - `useTenantSettings()`: Fetches tenant settings
  - `useUpdateTenantSetting()`: Mutation for updating settings
  - `useAuditLogs(filters)`: Paginated query with filters
  - `useRunJob()`: Mutation for triggering jobs
  - `useAlertList(filters)`: Fetches alerts with filters
  - `useManageAlert()`: Mutation for alert actions
- Implement optimistic updates where appropriate
- Handle loading, error, and success states

**Acceptance**:
- Hooks integrate with React Query cache
- Optimistic updates rollback on failure
- Loading states are exposed to UI

---

### Part 5: React UI Components

#### Step 5.1: Gate-N Layout & Navigation
**Goal**: Create the shell for Gate-N with navigation.

**Tasks**:
- Add Gate-N route to `src/App.tsx`: `/admin/gate-n`
- Create `src/pages/admin/gate-n/` directory
- Create main layout: `GateNLayout.tsx`
  - Sidebar with N1-N6 navigation
  - Header with breadcrumbs and user context
- Add "Gate-N Admin" link to main AdminLayout navigation (visible only to admins)

**Acceptance**:
- Navigation renders correctly
- Routes are protected (admin-only)
- Active route is highlighted

---

#### Step 5.2: N1 — System Dashboard UI
**Goal**: Build the main dashboard with health widgets.

**Tasks**:
- Create `src/pages/admin/gate-n/Dashboard.tsx`
- Implement widgets:
  - **Database Health Card**: Connection count, status indicator
  - **Edge Functions Card**: Error rate chart, recent failures
  - **Cron Jobs Card**: Next runs, failed jobs list
  - **Gate Health Grid**: Status indicators for Gates A-K
- Use `useSystemHealth()` hook for data
- Add auto-refresh toggle (default: 30s interval)
- Implement loading skeletons

**Acceptance**:
- Dashboard loads within 2 seconds
- Widgets update on refresh
- Color coding is correct (green/yellow/red)

---

#### Step 5.3: N2 — Tenant Configuration UI
**Goal**: Build the settings management interface.

**Tasks**:
- Create `src/pages/admin/gate-n/Configuration.tsx`
- Implement sections:
  - **SLA Settings**: Input fields for reminder and report SLAs
  - **Feature Flags**: Toggle switches for gate enablement
  - **Limits**: Number inputs for quotas
- Use `useTenantSettings()` and `useUpdateTenantSetting()` hooks
- Add validation (min/max values, required fields)
- Show save confirmation dialog
- Display change preview (before → after)

**Acceptance**:
- Settings save correctly
- Validation prevents invalid values
- Changes are logged to audit trail

---

#### Step 5.4: N3 — Roles & Permissions Viewer UI
**Goal**: Display RBAC matrix.

**Tasks**:
- Create `src/pages/admin/gate-n/RBACMatrix.tsx`
- Implement views:
  - **Matrix View**: Table with roles as rows, permissions as columns
  - **User View**: List users with their roles
- Add filters: role, permission, user search
- Add export button (CSV, JSON)
- Use existing RBAC helper functions

**Acceptance**:
- Matrix displays correct role-permission mappings
- Filters work correctly
- Export generates valid files

---

#### Step 5.5: N4 — Operations & Scheduler UI
**Goal**: Build the job execution and scheduling interface.

**Tasks**:
- Create `src/pages/admin/gate-n/Operations.tsx`
- Implement sections:
  - **Manual Execution**: Buttons for common jobs (refresh views, send reminders)
  - **Job Schedule**: Table of cron jobs with next run times
  - **Recent Executions**: Log of recent manual and scheduled runs
- Use `useRunJob()` mutation for triggers
- Add confirmation dialogs for manual runs
- Show execution progress and results

**Acceptance**:
- Jobs execute when triggered
- Schedule displays correct next run times
- Execution logs are visible

---

#### Step 5.6: N5 — Audit Monitor UI
**Goal**: Build the audit log viewer.

**Tasks**:
- Create `src/pages/admin/gate-n/AuditLog.tsx`
- Implement features:
  - **Filters**: Date range, actor, action type, entity type, outcome
  - **Log Table**: Paginated list with expandable rows
  - **Detail Modal**: Full before/after state with JSON diff
  - **Export**: CSV/JSON export of filtered logs
- Use `useAuditLogs()` hook with pagination
- Implement infinite scroll or pagination

**Acceptance**:
- Logs load with correct filters applied
- Pagination works smoothly
- Export includes all filtered results (not just current page)

---

#### Step 5.7: N6 — Alerts & Failures Monitor UI
**Goal**: Build the alert dashboard.

**Tasks**:
- Create `src/pages/admin/gate-n/Alerts.tsx`
- Implement sections:
  - **Alert Overview**: Count by severity, recent resolutions
  - **Active Alerts**: Table with quick actions (acknowledge, resolve, mute)
  - **Failure Details**: Expandable rows with stack traces and logs
- Use `useAlertList()` and `useManageAlert()` hooks
- Add real-time updates (polling or WebSocket)
- Implement action confirmations

**Acceptance**:
- Alerts display correctly by severity
- Actions (acknowledge, resolve, mute) work
- Real-time updates reflect changes

---

### Part 6: Testing & Validation

#### Step 6.1: Unit Tests
**Goal**: Test individual components and functions.

**Tasks**:
- Write tests for:
  - Integration layer functions (`gate-n.ts`)
  - React hooks (mock Supabase client)
  - UI components (render tests, interaction tests)
- Use Vitest and React Testing Library
- Aim for >80% code coverage

**Acceptance**:
- All tests pass
- Coverage meets threshold
- No flaky tests

---

#### Step 6.2: Integration Tests
**Goal**: Test end-to-end flows with real database.

**Tasks**:
- Create test scenarios:
  - Admin views dashboard and sees correct health status
  - Admin updates tenant setting and change is persisted
  - Admin triggers manual job and execution completes
  - Admin acknowledges alert and state updates
- Use Supabase test instance with seeded data
- Validate RLS enforcement (test with different roles)

**Acceptance**:
- All user stories pass
- RLS correctly isolates tenants
- Audit logs are generated for all actions

---

#### Step 6.3: Security Review
**Goal**: Validate security posture of Gate-N.

**Tasks**:
- Run Supabase linter on all new tables and policies
- Test privilege escalation scenarios:
  - `tenant_admin` cannot access other tenants
  - Non-admin cannot access Gate-N routes
  - Manual job execution requires correct role
- Review audit log coverage (ensure all actions are logged)
- Test 2-step confirmation for critical operations

**Acceptance**:
- No RLS bypass vulnerabilities
- All admin actions are logged
- Unauthorized access attempts are blocked

---

#### Step 6.4: Performance Validation
**Goal**: Ensure Gate-N meets performance requirements.

**Tasks**:
- Measure dashboard load times (target: <2s for initial load)
- Test with large datasets:
  - 10,000+ audit log entries
  - 100+ active alerts
  - 50+ cron jobs
- Optimize slow queries (add indexes if needed)
- Implement caching for expensive aggregations

**Acceptance**:
- Dashboard loads within target time
- Pagination handles large datasets smoothly
- No N+1 query issues

---

#### Step 6.5: User Acceptance Testing (UAT)
**Goal**: Validate with real admin users.

**Tasks**:
- Conduct UAT sessions with:
  - `tenant_admin` persona
  - `system_admin` persona
- Collect feedback on:
  - Ease of use
  - Missing features
  - UI/UX improvements
- Document issues and prioritize fixes

**Acceptance**:
- Admins can complete key tasks without assistance
- No critical usability issues
- Feedback is documented for future iterations

---

## 7. Gate-N Acceptance Checklist (v1)

This section provides a comprehensive, testable checklist for validating the complete implementation of Gate-N. Each item is binary (pass/fail) and can be directly converted into QA test cases.

---

### N1 — System Dashboard

**Functional Requirements:**
- [ ] N1 dashboard loads within 3 seconds for a tenant with 10,000 users and 500 active jobs
- [ ] Dashboard displays all mandatory widgets: Database Health, Edge Functions Status, Cron Jobs Status, and Gate Health Summary
- [ ] Database Health widget shows: active connections count, connection pool status, and replication lag (if applicable)
- [ ] Edge Functions widget displays: total deployed functions, error rate (last 1h and 24h), average response time, and failed invocations count
- [ ] Cron Jobs widget shows: next scheduled run times for all critical jobs, recent completion status, jobs in error state, and missed schedule count
- [ ] Gate Health Summary displays status indicators (green/yellow/red) for Gates A through K
- [ ] Auto-refresh functionality works correctly with configurable intervals (30s, 1min, 5min)

**Performance & UX:**
- [ ] Loading skeletons display during data fetch (no blank screen)
- [ ] Dashboard supports manual refresh via button click
- [ ] Color coding is consistent: green = healthy, yellow = warning, red = critical
- [ ] Drill-down capability works from each widget to detailed logs
- [ ] Dashboard handles API failures gracefully with error messages and retry options

---

### N2 — Tenant Configuration

**Functional Requirements:**
- [ ] Configuration page displays all tenant settings grouped into sections: SLA Settings, Feature Flags, and Limits & Quotas
- [ ] SLA Settings allow input for: reminder SLA days, report generation schedule, action plan SLA by priority
- [ ] Feature Flags section displays toggles for: enable_campaigns, enable_documents, enable_action_plans, enable_kpi_insights, enable_quarterly_reports, enable_ai_recommendations
- [ ] Limits section accepts numeric inputs for: max active campaigns, max employees, max storage MB, max API calls per hour
- [ ] Save action validates all inputs against platform constraints before submission
- [ ] Change preview modal displays before/after comparison for all modified settings
- [ ] Configuration changes are persisted to `tenant_settings` table with `updated_by` and `updated_at` fields

**Security & Audit:**
- [ ] Only `tenant_admin` role can modify tenant configurations
- [ ] Every configuration save generates an audit log entry with before_state and after_state
- [ ] Invalid values are rejected with clear error messages (e.g., negative numbers, values exceeding platform limits)
- [ ] Unsaved changes trigger a confirmation dialog when user navigates away
- [ ] Configuration changes propagate to affected services within 5 seconds

---

### N3 — Roles & Permissions Viewer

**Functional Requirements:**
- [ ] Matrix View displays all roles as rows and all permissions as columns
- [ ] Matrix cells clearly indicate granted (✓) vs. denied (✗) permissions
- [ ] User Assignment View lists all users with their assigned roles per tenant
- [ ] Filter by role works and displays only users with selected role
- [ ] Filter by permission works and displays only roles granting that permission
- [ ] User search by email or name returns correct results within 1 second
- [ ] Export to CSV generates valid file with complete role-permission matrix

**Data Accuracy:**
- [ ] Matrix reflects current state from `user_roles` table
- [ ] Permission lineage shows if permission is direct or inherited
- [ ] Anomalies are highlighted: users with no roles, roles with no users
- [ ] Read-only status is enforced (no edit capability exists in UI)
- [ ] Matrix handles 1000+ users without performance degradation

---

### N4 — Operations & Scheduler Control

**Functional Requirements:**
- [ ] Manual Execution section displays buttons for: Refresh Views, Send Reminders, Generate Reports, Run RCA, Generate Quarterly Insights
- [ ] Each manual job trigger displays a confirmation dialog before execution
- [ ] Job Schedule table lists all cron jobs with: name, schedule expression, last run time, next run time, status
- [ ] Recent Executions table shows last 50 executions with: job name, trigger type (manual/scheduled), status, duration, actor
- [ ] "Run Now" button for each job triggers execution and displays real-time status updates
- [ ] Pause/Resume buttons update job enabled state in `system_jobs` table
- [ ] Failed jobs display detailed error messages and stack traces

**Security & Validation:**
- [ ] Only `tenant_admin` and `system_admin` roles can trigger manual jobs
- [ ] Rate limiting prevents more than 5 manual runs per job per hour
- [ ] Idempotency checks prevent duplicate concurrent executions of same job
- [ ] All manual executions are logged to `job_execution_log` with actor_user_id and trigger_type='manual'
- [ ] Job execution results (success/failure) are displayed within 3 seconds of completion

---

### N5 — Activity & Audit Monitor

**Functional Requirements:**
- [ ] Audit Log table displays columns: Timestamp, Actor, Action Description, Entity (type + ID), Outcome, IP Address
- [ ] Date range filter works for: Last 24h, Last 7d, Last 30d, Custom range
- [ ] Actor filter allows search by user email or ID
- [ ] Action type filter includes: create, update, delete, view, execute, approve
- [ ] Entity type filter includes: campaign, policy, document, action, config, job, alert
- [ ] Outcome filter includes: success, failure, partial
- [ ] Pagination displays 50 logs per page with smooth infinite scroll or page navigation

**Data Visibility & Export:**
- [ ] `tenant_admin` sees only logs for their tenant
- [ ] `system_admin` sees logs across all tenants with tenant filter option
- [ ] Expandable row reveals full before_state and after_state as formatted JSON diff
- [ ] Export to CSV includes all filtered results (not just current page)
- [ ] Export respects role-based visibility (tenant_admin cannot export other tenants' logs)
- [ ] Activity Analytics section displays: top 10 actors, most modified entities, failure rate trend chart

**Performance:**
- [ ] Initial load returns results within 2 seconds for tenants with 10,000+ log entries
- [ ] Filters apply within 1 second without page reload
- [ ] Sensitive fields (passwords, tokens, API keys) are redacted from before/after state display

---

### N6 — Alerts & Failures Monitor

**Functional Requirements:**
- [ ] Alert Dashboard displays count cards: Active Alerts (by severity), Recent Resolutions (last 24h), Silenced Alerts
- [ ] Alert List table shows: Alert ID, Severity, Source, Entity, Timestamp, Status, Quick Actions
- [ ] Quick Actions include: Acknowledge, Resolve, Mute, Escalate
- [ ] Severity filter includes: critical, warning, info
- [ ] Source filter includes: edge_functions, cron_jobs, kpi_anomalies, observability_policies, system_resources
- [ ] Status filter includes: active, acknowledged, resolved, muted
- [ ] Expandable alert row displays: full error stack trace, related logs, affected users/tenants, suggested remediation

**Alert Actions & Workflows:**
- [ ] Acknowledge action marks alert as seen by current user with timestamp
- [ ] Resolve action requires resolution note (min 10 chars) and closes alert
- [ ] Mute action requires duration in hours (1-168) and mute reason
- [ ] Muted alerts automatically reactivate after expiry duration
- [ ] Escalate action creates action item in Gate-H with correct priority and assignee
- [ ] All alert actions generate audit log entries
- [ ] Real-time updates refresh alert list every 30 seconds or via WebSocket

**Integration & Data Sources:**
- [ ] Alert sources correctly aggregate from: `alert_events`, Edge Function logs, `refresh_log`, `mv_kpi_monthly_flags`
- [ ] KPI anomalies (z-score > 2.0) appear as alerts with severity='warning'
- [ ] Failed cron jobs (status='failed') appear as alerts with severity='critical'
- [ ] Alert deduplication groups similar alerts within 1-hour window

---

### RBAC & Security

**Role-Based Access Control:**
- [ ] Only `tenant_admin` and `system_admin` roles can access any Gate-N routes
- [ ] `tenant_admin` can only view/modify data for their assigned tenant
- [ ] `system_admin` can view data across all tenants but requires explicit confirmation for cross-tenant actions
- [ ] Users without admin roles receive 403 Forbidden when attempting to access Gate-N URLs
- [ ] All Gate-N API endpoints validate user role via `has_role()` or `app_has_role()` before processing requests

**Data Isolation & RLS:**
- [ ] All queries to `tenant_settings`, `audit_log`, `job_execution_log` enforce tenant_id filter via RLS
- [ ] RLS policies prevent `tenant_admin` from querying other tenants' data even with direct SQL
- [ ] `system_admin` role bypasses tenant filter only when explicitly granted via policy
- [ ] Failed authorization attempts are logged to `audit_log` with outcome='failure' and action_type='unauthorized_access'
- [ ] Sensitive operations (bulk delete, cross-tenant config changes) require 2-step confirmation with typed confirmation text

**Audit & Compliance:**
- [ ] Every state-changing action in Gate-N writes a record to `audit_log` with: actor_user_id, tenant_id, action_type, entity_type, entity_id, before_state, after_state, outcome, timestamp
- [ ] Audit log entries include IP address and user agent for security investigation
- [ ] Read-only actions (view dashboard, list logs) optionally log with action_type='view' (configurable)
- [ ] Audit log retention is enforced (minimum 1 year, configurable up to 7 years)
- [ ] Audit logs are immutable (no UPDATE or DELETE policies exist)

---

### Observability & Logs

**System Monitoring:**
- [ ] Gate-N health status is queryable via dedicated health check endpoint
- [ ] Health check response includes: database status, edge functions status, cron jobs status, RLS enforcement status
- [ ] Failed health checks trigger alerts via Gate-E alert policies
- [ ] All Edge Functions in Gate-N log execution time, status, and errors to structured log table
- [ ] Slow queries (>5 seconds) are logged with query text and execution plan

**Error Handling & Recovery:**
- [ ] API errors return structured JSON with: error_code, message, details, timestamp
- [ ] Client-side errors are caught by Error Boundary and logged to backend
- [ ] Failed mutations automatically retry with exponential backoff (max 3 retries)
- [ ] Partial failures (e.g., 5 out of 10 jobs succeeded) are logged with detailed breakdown
- [ ] Critical failures (database connection loss, auth service down) display user-friendly error page with recovery instructions

---

### UX & Localization

**Arabic-First UI:**
- [ ] All labels, buttons, error messages, and tooltips are in Arabic by default
- [ ] RTL (right-to-left) layout is applied correctly with proper text alignment
- [ ] English toggle option exists in user profile settings for bilingual admins
- [ ] Date/time displays use Arabic locale (Riyadh timezone) with Gregorian calendar
- [ ] Number formatting uses Arabic numerals when Arabic locale is active

**Responsive Design & Accessibility:**
- [ ] All Gate-N pages are responsive and usable on tablet devices (1024px width)
- [ ] Keyboard navigation works for all interactive elements (Tab, Enter, Escape)
- [ ] Screen reader compatibility: all images have alt text, form inputs have labels, ARIA landmarks exist
- [ ] High contrast mode support: all text meets WCAG AA contrast ratio (4.5:1 minimum)
- [ ] Loading states use skeleton screens (not spinners) for better perceived performance

**Consistency & Usability:**
- [ ] Design system tokens are used consistently (no hardcoded colors, spacing, or typography)
- [ ] Color coding is consistent across all widgets: green=healthy, yellow=warning, red=critical
- [ ] Confirmation dialogs use consistent language: "Are you sure?" with "Yes, [Action]" and "Cancel" buttons
- [ ] Empty states provide clear guidance: "No data yet. Click [Action] to get started."
- [ ] Tooltips appear on hover for complex fields with 500ms delay

---

## 8. Appendix: Technical Considerations

### Scalability
- **Multi-Region Support**: Gate-N should work seamlessly if Supabase is deployed across multiple regions (use read replicas for dashboards).
- **Tenant Growth**: Design queries to handle 1000+ tenants and 100,000+ users.
- **Audit Log Growth**: Implement partitioning or archival strategy for logs older than 1 year.

### Extensibility
- **Plugin Architecture**: Consider allowing custom widgets or integrations (future).
- **API-First**: All Gate-N functionality should be accessible via API (Edge Functions) for automation or third-party integrations.

### Compliance & Privacy
- **Data Retention**: Enforce configurable retention policies (GDPR, PDPL).
- **PII Handling**: Redact or encrypt sensitive fields in audit logs.
- **Export Controls**: Limit who can export large datasets (require `security_officer_view` role).

### Documentation
- **Admin User Guide**: Create user-facing documentation for each N1-N6 feature.
- **Developer Guide**: Document API endpoints, data models, and extension points.
- **Runbook**: Provide troubleshooting guide for common issues (DB connection failures, job stuck in running state, etc.).

---

## 9. Open Questions & Future Work

### Open Questions (to be resolved in Part 2+)
1. Should `system_admin` have the ability to impersonate `tenant_admin` for debugging?
2. What is the retention policy for `job_execution_log` (30 days, 90 days, indefinite)?
3. Should Gate-N support scheduled reports (e.g., weekly health summary email)?
4. How to handle multi-tenant admin (user who is admin in multiple tenants)?

### Future Enhancements (post-MVP)
1. **AI-Powered Insights**: Use LLM to analyze logs and suggest optimizations.
2. **Predictive Alerts**: Forecast potential issues based on trends.
3. **Customizable Dashboards**: Allow admins to configure widget layout and metrics.
4. **Mobile App**: Admin dashboard accessible via mobile device.
5. **Audit Log Analytics**: Advanced search, pattern detection, anomaly identification.

---

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| v1.0 | 2024-11-11 | Senior Systems Analyst | Initial execution plan created |
| v1.1 | 2024-11-11 | Senior Systems Analyst | Added comprehensive Acceptance Checklist (Section 7) with 60+ testable items |

---

**End of Document**
