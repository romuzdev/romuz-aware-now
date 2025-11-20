# Gate-H Reminders Edge Function

## Purpose
Daily cron job that sends automated reminders for Gate-H action items:
- **Due Soon**: Actions approaching their due date (within 3 days)
- **Overdue**: Actions past their due date and not closed
- **SLA Breach**: Actions that exceeded their SLA deadline without closure

## How It Works
1. Runs daily at 06:00 UTC (configurable)
2. Fetches all tenants with open Gate-H actions
3. For each tenant, identifies actions requiring reminders
4. Checks `gate_h.action_reminder_log` to avoid duplicate reminders
5. Inserts system comments in Arabic to `gate_h.action_updates`
6. Logs reminder in `gate_h.action_reminder_log` for idempotency

## Security
- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Manually respects tenant boundaries via `tenant_id`
- System comments created with fixed UUID: `00000000-0000-0000-0000-000000000000`

## Configuration
- `DUE_SOON_DAYS`: 3 days (configurable in code)
- `MAX_ACTIONS_PER_RUN`: 1000 actions per job execution (safeguard)

## Schedule
Configured via Supabase cron:
```sql
-- Runs daily at 06:00 UTC
SELECT cron.schedule(
  'gate-h-daily-reminders',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/gate-h-reminders',
    headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  );
  $$
);
```

## Response Format
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

## Local Testing
```bash
# Start local function
supabase functions serve gate-h-reminders

# Invoke manually
curl -i --location --request POST 'http://localhost:54321/functions/v1/gate-h-reminders' \
  --header 'Authorization: Bearer [ANON_KEY]'
```

## Monitoring
- Check function logs: `supabase functions logs gate-h-reminders`
- Review `gate_h.action_reminder_log` table for sent reminders
- Monitor error count in response payload

## Reminder Messages
All messages are in Arabic:
- **Due Soon**: "تنبيه آلي: هذا الإجراء يقترب من تاريخ الاستحقاق خلال الأيام القادمة."
- **Overdue**: "تنبيه آلي: هذا الإجراء تجاوز تاريخ الاستحقاق ولم يتم إغلاقه بعد."
- **SLA Breach**: "تنبيه آلي: تم تجاوز مهلة SLA المحددة لهذا الإجراء دون إغلاق."

## Dependencies
- Supabase JS Client v2
- Deno standard library (HTTP server)
- Environment: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Related Tables
- `gate_h.action_items` - Source of actions
- `gate_h.action_updates` - Target for reminder comments
- `gate_h.action_reminder_log` - Idempotency tracking
