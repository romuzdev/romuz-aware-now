# Edge Functions Documentation
## Cyber Zone GRC — Romuz Awareness App

This document provides comprehensive documentation for all Supabase Edge Functions deployed in the Romuz Awareness application.

---

## Environment Variables

All Edge Functions automatically have access to the following environment variables via **Lovable Cloud**:

- `SUPABASE_URL` — The Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for server-side operations (bypasses RLS)
- `SUPABASE_ANON_KEY` — Anonymous key for client-side operations

**Note**: These variables are managed automatically by Lovable Cloud and do not require manual configuration.

---

## Deployed Edge Functions

### 1. compute-impact-scores
**Path**: `supabase/functions/compute-impact-scores/`

**Purpose**: Computes awareness impact scores for campaigns based on configured weights and formulas.

**Trigger**: Manual invocation or scheduled job

**Key Operations**:
- Fetches active campaigns and participant data
- Applies formula engine to calculate impact scores
- Updates `awareness_impact_scores` table
- Logs computation results for audit trail

**Security**: Uses service role key, respects tenant boundaries manually

**Related Documentation**: `supabase/functions/compute-impact-scores/README.md`

---

### 2. validate-impact-scores
**Path**: `supabase/functions/validate-impact-scores/`

**Purpose**: Validates computed impact scores against expected ranges and business rules.

**Trigger**: Post-computation validation, scheduled job

**Key Operations**:
- Checks score ranges and statistical anomalies
- Validates formula application correctness
- Generates validation reports
- Flags outliers for manual review

**Security**: Uses service role key, respects tenant boundaries manually

**Related Documentation**: `supabase/functions/validate-impact-scores/README.md`

---

### 3. run-calibration
**Path**: `supabase/functions/run-calibration/`

**Purpose**: Executes calibration runs to optimize impact score weights based on historical data.

**Trigger**: Manual invocation via Admin UI or scheduled

**Key Operations**:
- Creates new calibration run record
- Analyzes historical campaign performance
- Generates weight suggestions using ML algorithms
- Stores calibration results for review

**Security**: Uses service role key, respects tenant boundaries manually

**Related Documentation**: Gate-J documentation in `docs/awareness/04_Execution/`

---

### 4. refresh-kpis
**Path**: `supabase/functions/refresh-kpis/`

**Purpose**: Refreshes materialized views for KPI analytics and reporting.

**Trigger**: Scheduled (daily/hourly depending on load)

**Key Operations**:
- Refreshes `mv_awareness_campaign_kpis`
- Refreshes `mv_awareness_feedback_insights`
- Refreshes `mv_awareness_timeseries`
- Logs refresh duration and status

**Security**: Uses service role key

**Related Documentation**: Gate-I analytics documentation

---

### 5. gatek-refresh
**Path**: `supabase/functions/gatek-refresh/`

**Purpose**: Refreshes all Gate-K materialized views for KPI trends, anomalies, RCA, and recommendations.

**Trigger**: Scheduled (configurable, typically daily)

**Key Operations**:
- Calls `refresh_gate_k_views()` DB function
- Refreshes trend MVs (weekly, monthly, quarterly)
- Refreshes anomaly detection MVs
- Refreshes RCA contributor MVs
- Refreshes recommendation proposals MV
- Logs refresh status in `refresh_log` table

**Security**: Uses service role key

**Related Documentation**: Gate-K documentation in `docs/awareness/04_Execution/`

---

### 6. dispatch-alerts
**Path**: `supabase/functions/dispatch-alerts/`

**Purpose**: Sends observability alerts based on configured alert policies and channels.

**Trigger**: Scheduled (frequent, e.g., every 5-15 minutes) or event-driven

**Key Operations**:
- Evaluates alert policies against recent events
- Fetches alert templates and channel configurations
- Dispatches notifications via email, SMS, webhook, or Slack
- Logs alert delivery status

**Security**: Uses service role key, manages alert_channels secrets

**Related Documentation**: Gate-E observability documentation

---

### 7. detect-drift
**Path**: `supabase/functions/detect-drift/`

**Purpose**: Detects configuration drift in RBAC policies and system health.

**Trigger**: Scheduled (e.g., hourly or daily)

**Key Operations**:
- Compares current RBAC state against expected baseline
- Detects policy changes, role assignment anomalies
- Flags security misconfigurations
- Generates drift reports

**Security**: Uses service role key

**Related Documentation**: Gate-E health check documentation

---

### 8. export-report
**Path**: `supabase/functions/export-report/`

**Purpose**: Exports campaign reports in various formats (CSV, Excel, PDF).

**Trigger**: Manual invocation via Reports Dashboard

**Key Operations**:
- Fetches report data based on filters (campaign, date range)
- Formats data according to requested export type
- Generates downloadable file with signed URL
- Logs export activity for audit

**Security**: Uses service role key, respects tenant boundaries

**Related Documentation**: Reports Dashboard documentation

---

### 9. gate-e-closeout
**Path**: `supabase/functions/gate-e-closeout/`

**Purpose**: Performs automated closeout procedures for Gate-E observability phase.

**Trigger**: Manual invocation or scheduled

**Key Operations**:
- Archives completed alert events
- Generates closeout summary reports
- Cleans up stale alert channels
- Updates health check status

**Security**: Uses service role key

**Related Documentation**: `supabase/functions/gate-e-closeout/README.md`

---

### 10. gate-h-reminders ⭐ NEW
**Path**: `supabase/functions/gate-h-reminders/`

**Purpose**: Daily automated reminders for Gate-H Action Plans, including due soon, overdue, and SLA breach notifications.

**Schedule**: Daily at **06:00 UTC** (configurable via `cron.json`)

**Trigger**: Supabase `pg_cron` scheduled job (see `CRON_SETUP.md` for configuration)

**Key Responsibilities**:
1. **Due Soon Actions**: Identifies actions with `due_date` within the next **3 days** (configurable via `DUE_SOON_DAYS`)
2. **Overdue Actions**: Identifies actions past their `due_date` where `status != 'closed'`
3. **SLA-Breached Actions**: Identifies actions where `created_at + sla_days < now()` and `status != 'closed'`
4. **Idempotent Reminders**: Checks `gate_h.action_reminder_log` to ensure only one reminder per action/kind/day
5. **System Comments**: Inserts Arabic system comments into `gate_h.action_updates` for each reminder

**Reminder Messages (Arabic)**:
- **Due Soon**: `"تنبيه آلي: هذا الإجراء يقترب من تاريخ الاستحقاق خلال الأيام القادمة."`
- **Overdue**: `"تنبيه آلي: هذا الإجراء تجاوز تاريخ الاستحقاق ولم يتم إغلاقه بعد."`
- **SLA Breach**: `"تنبيه آلي: تم تجاوز مهلة SLA المحددة لهذا الإجراء دون إغلاق."`

**System User UUID**: All reminder comments are created with the special system user UUID:
```
00000000-0000-0000-0000-000000000000
```
This distinguishes automated reminders from human-originated updates in the audit trail.

**Configuration Constants**:
- `DUE_SOON_DAYS = 3` — Actions due within 3 days trigger "due soon" reminders
- `MAX_ACTIONS_PER_RUN = 1000` — Safeguard limit to prevent runaway jobs

**Multi-Tenant Processing**:
- Fetches all distinct tenants with open Gate-H actions
- Processes each tenant independently
- Manually respects tenant boundaries via `tenant_id` (service role bypasses RLS)
- Limits tenant batch size to 500 per run

**Database Tables Used**:
- **Input**: `gate_h.action_items` (read)
- **Output**: 
  - `gate_h.action_updates` (insert system comments)
  - `gate_h.action_reminder_log` (insert reminder log for idempotency)

**Response Payload**:
```json
{
  "ok": true,
  "tenantsProcessed": 5,
  "dueSoonCount": 12,
  "overdueCount": 8,
  "slaBreachCount": 3,
  "totalReminders": 23,
  "errors": [],
  "timestamp": "2025-11-11T06:00:00.000Z"
}
```

**Security**:
- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Manually respects tenant boundaries via explicit `tenant_id` filtering
- System comments prevent impersonation via fixed UUID

**Cron Setup**:
Requires manual configuration of `pg_cron` job in Supabase Dashboard. See detailed instructions in:
- `supabase/functions/gate-h-reminders/CRON_SETUP.md`

**Local Testing**:
```bash
# Start local function
supabase functions serve gate-h-reminders

# Invoke manually
curl -i --location --request POST 'http://localhost:54321/functions/v1/gate-h-reminders' \
  --header 'Authorization: Bearer [ANON_KEY]'
```

**Monitoring**:
- Check function logs: `supabase functions logs gate-h-reminders`
- Review `gate_h.action_reminder_log` table for sent reminders
- Monitor error count in response payload

**Related Documentation**:
- `supabase/functions/gate-h-reminders/README.md` — Function overview
- `supabase/functions/gate-h-reminders/CRON_SETUP.md` — Cron job setup instructions
- Gate-H documentation in `docs/awareness/04_Execution/`

---

## Deployment

All Edge Functions are automatically deployed when code is pushed to the repository. Lovable Cloud handles the deployment pipeline.

### Manual Deployment (if needed)
```bash
supabase functions deploy [function-name]
```

### Viewing Logs
```bash
supabase functions logs [function-name] --tail
```

---

## Best Practices

1. **Error Handling**: All functions should have comprehensive try-catch blocks and return meaningful error messages
2. **Logging**: Use structured logging with console.log/error for debugging
3. **Tenant Isolation**: Always filter by `tenant_id` when using service role key
4. **Idempotency**: Use tracking tables (like `action_reminder_log`) to prevent duplicate operations
5. **Performance**: Set reasonable limits (`MAX_ACTIONS_PER_RUN`) to prevent timeout
6. **Security**: Never expose service role key in client code or logs

---

## Related Documentation

- **Gate-H Action Plans**: `docs/awareness/04_Execution/19-M25-Action-Plans-Execution-Pack.md`
- **Gate-K Analytics**: `docs/awareness/04_Execution/Gate-K_*.md`
- **Gate-E Observability**: `docs/awareness/04_Execution/Gate_E_*.md`
- **Gate-I Reports**: `docs/awareness/04_Execution/Gate_I_*.md`
- **Gate-J Calibration**: `docs/awareness/04_Execution/Gate_J_*.md`

---

**Last Updated**: 2025-11-11  
**Maintained By**: Romuz Development Team
