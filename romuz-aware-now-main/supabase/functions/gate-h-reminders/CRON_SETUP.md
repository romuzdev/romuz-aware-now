# Gate-H Reminders - Cron Setup Instructions

## Prerequisites
Enable required extensions in your Supabase project:
```sql
-- Run these in SQL Editor (one time only)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## Schedule the Daily Job

**Option 1: Using Supabase Dashboard**
1. Go to Database → Cron Jobs
2. Create new cron job with:
   - Name: `gate-h-daily-reminders`
   - Schedule: `0 6 * * *` (daily at 06:00 UTC)
   - SQL Command: (see below)

**Option 2: Using SQL Editor**
```sql
-- Schedule daily at 06:00 UTC
SELECT cron.schedule(
  'gate-h-daily-reminders',  -- Job name
  '0 6 * * *',               -- Cron schedule (daily at 06:00 UTC)
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/gate-h-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object(
      'scheduled', true,
      'timestamp', now()
    )
  ) AS request_id;
  $$
);
```

## Configuration Steps

### 1. Get Your Project Details
- **Project Ref**: From Supabase Dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- **Service Role Key**: Project Settings → API → `service_role` key (secret)

### 2. Replace Placeholders
In the SQL above, replace:
- `YOUR_PROJECT_REF` → Your actual project reference
- `YOUR_SERVICE_ROLE_KEY` → Your actual service role key

⚠️ **SECURITY WARNING**: Never commit the service role key to Git!

### 3. Verify Deployment
Check that the edge function is deployed:
```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs gate-h-reminders
```

## Cron Schedule Examples
```
'0 6 * * *'     # Daily at 06:00 UTC
'0 */6 * * *'   # Every 6 hours
'0 8 * * 1'     # Every Monday at 08:00 UTC
'0 0 1 * *'     # First day of every month at midnight
```

## Managing the Cron Job

### View scheduled jobs
```sql
SELECT * FROM cron.job;
```

### Check job run history
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'gate-h-daily-reminders')
ORDER BY start_time DESC 
LIMIT 10;
```

### Unschedule the job
```sql
SELECT cron.unschedule('gate-h-daily-reminders');
```

### Reschedule with different time
```sql
-- First unschedule
SELECT cron.unschedule('gate-h-daily-reminders');

-- Then schedule again with new time
SELECT cron.schedule(
  'gate-h-daily-reminders',
  '0 8 * * *',  -- Changed to 08:00 UTC
  $$ ... $$
);
```

## Manual Invocation (Testing)

### Using curl
```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/gate-h-reminders' \
  --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "manual": true
  }'
```

### Using Supabase Dashboard
1. Go to Edge Functions → gate-h-reminders
2. Click "Invoke"
3. Set auth to "Service Role"
4. Send request

## Monitoring

### Check function logs
```sql
-- Recent reminder logs
SELECT 
  tenant_id,
  kind,
  reminder_date,
  COUNT(*) as reminder_count
FROM gate_h.action_reminder_log
WHERE reminder_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY tenant_id, kind, reminder_date
ORDER BY reminder_date DESC, tenant_id;
```

### Check cron execution status
```sql
-- Last 10 job runs
SELECT 
  jr.runid,
  jr.job_pid,
  jr.status,
  jr.return_message,
  jr.start_time,
  jr.end_time,
  (jr.end_time - jr.start_time) as duration
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'gate-h-daily-reminders'
ORDER BY jr.start_time DESC
LIMIT 10;
```

## Troubleshooting

### Job not running?
1. Check extensions are enabled: `\dx` in SQL Editor
2. Verify job is scheduled: `SELECT * FROM cron.job;`
3. Check for errors: `SELECT * FROM cron.job_run_details WHERE status = 'failed';`

### Function errors?
1. Check function logs: `supabase functions logs gate-h-reminders`
2. Verify service role key is correct
3. Test manual invocation first
4. Check `gate_h.action_reminder_log` for duplicates

### No reminders sent?
1. Verify actions exist with due dates
2. Check action statuses (must not be 'closed')
3. Check if reminders already logged for today
4. Review function response payload for stats

## Notes
- The function uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Reminders are idempotent (won't send duplicates for same day)
- System comments use fixed UUID: `00000000-0000-0000-0000-000000000000`
- Maximum 1000 actions processed per tenant per run
