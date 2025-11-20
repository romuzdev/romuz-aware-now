-- Gate-P — Tenant Lifecycle & Automation Engine
-- Part 1.2 — RLS + Policies + Roles Setup (Corrected for Romuz Architecture)

-- =========================================================
-- 1) Enable RLS for tenant-scoped tables
-- =========================================================
alter table public.tenant_lifecycle_log enable row level security;
alter table public.tenant_health_status enable row level security;
alter table public.tenant_automation_actions enable row level security;
alter table public.tenant_notifications_channels enable row level security;
alter table public.tenant_deprovision_jobs enable row level security;

-- =========================================================
-- 2) RLS Policies for tenant_lifecycle_log
-- =========================================================
drop policy if exists tenant_lifecycle_log_select on public.tenant_lifecycle_log;
create policy tenant_lifecycle_log_select
on public.tenant_lifecycle_log
for select
using (
  tenant_id = get_user_tenant_id(auth.uid())
);

drop policy if exists tenant_lifecycle_log_insert on public.tenant_lifecycle_log;
create policy tenant_lifecycle_log_insert
on public.tenant_lifecycle_log
for insert
with check (
  tenant_id = get_user_tenant_id(auth.uid())
  and auth.uid() is not null
);

-- =========================================================
-- 3) RLS Policies for tenant_health_status
-- =========================================================
drop policy if exists tenant_health_status_select on public.tenant_health_status;
create policy tenant_health_status_select
on public.tenant_health_status
for select
using (
  tenant_id = get_user_tenant_id(auth.uid())
);

drop policy if exists tenant_health_status_insert on public.tenant_health_status;
create policy tenant_health_status_insert
on public.tenant_health_status
for insert
with check (
  tenant_id = get_user_tenant_id(auth.uid())
  and has_role(auth.uid(), 'admin')
);

drop policy if exists tenant_health_status_update on public.tenant_health_status;
create policy tenant_health_status_update
on public.tenant_health_status
for update
using (
  tenant_id = get_user_tenant_id(auth.uid())
  and has_role(auth.uid(), 'admin')
)
with check (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- =========================================================
-- 4) RLS Policies for tenant_automation_actions
-- =========================================================
drop policy if exists tenant_automation_actions_select on public.tenant_automation_actions;
create policy tenant_automation_actions_select
on public.tenant_automation_actions
for select
using (
  tenant_id = get_user_tenant_id(auth.uid())
  or (tenant_id is null and scope = 'global')
);

drop policy if exists tenant_automation_actions_insert on public.tenant_automation_actions;
create policy tenant_automation_actions_insert
on public.tenant_automation_actions
for insert
with check (
  (tenant_id = get_user_tenant_id(auth.uid()) and scope = 'tenant' and has_role(auth.uid(), 'admin'))
  and auth.uid() is not null
);

drop policy if exists tenant_automation_actions_update on public.tenant_automation_actions;
create policy tenant_automation_actions_update
on public.tenant_automation_actions
for update
using (
  tenant_id = get_user_tenant_id(auth.uid())
  and has_role(auth.uid(), 'admin')
)
with check (
  tenant_id = get_user_tenant_id(auth.uid())
);

drop policy if exists tenant_automation_actions_delete on public.tenant_automation_actions;
create policy tenant_automation_actions_delete
on public.tenant_automation_actions
for delete
using (
  tenant_id = get_user_tenant_id(auth.uid())
  and has_role(auth.uid(), 'admin')
);

-- =========================================================
-- 5) RLS Policies for tenant_notifications_channels
-- =========================================================
drop policy if exists tenant_notifications_channels_select on public.tenant_notifications_channels;
create policy tenant_notifications_channels_select
on public.tenant_notifications_channels
for select
using (
  tenant_id = get_user_tenant_id(auth.uid())
  or (tenant_id is null)
);

drop policy if exists tenant_notifications_channels_insert on public.tenant_notifications_channels;
create policy tenant_notifications_channels_insert
on public.tenant_notifications_channels
for insert
with check (
  tenant_id = get_user_tenant_id(auth.uid())
  and has_role(auth.uid(), 'admin')
  and auth.uid() is not null
);

drop policy if exists tenant_notifications_channels_update on public.tenant_notifications_channels;
create policy tenant_notifications_channels_update
on public.tenant_notifications_channels
for update
using (
  tenant_id = get_user_tenant_id(auth.uid())
  and has_role(auth.uid(), 'admin')
)
with check (
  tenant_id = get_user_tenant_id(auth.uid())
);

drop policy if exists tenant_notifications_channels_delete on public.tenant_notifications_channels;
create policy tenant_notifications_channels_delete
on public.tenant_notifications_channels
for delete
using (
  tenant_id = get_user_tenant_id(auth.uid())
  and has_role(auth.uid(), 'admin')
);

-- =========================================================
-- 6) RLS Policies for tenant_deprovision_jobs
-- =========================================================
drop policy if exists tenant_deprovision_jobs_select on public.tenant_deprovision_jobs;
create policy tenant_deprovision_jobs_select
on public.tenant_deprovision_jobs
for select
using (
  tenant_id = get_user_tenant_id(auth.uid())
);

drop policy if exists tenant_deprovision_jobs_insert on public.tenant_deprovision_jobs;
create policy tenant_deprovision_jobs_insert
on public.tenant_deprovision_jobs
for insert
with check (
  tenant_id = get_user_tenant_id(auth.uid())
  and has_role(auth.uid(), 'admin')
  and auth.uid() is not null
);

drop policy if exists tenant_deprovision_jobs_update on public.tenant_deprovision_jobs;
create policy tenant_deprovision_jobs_update
on public.tenant_deprovision_jobs
for update
using (
  tenant_id = get_user_tenant_id(auth.uid())
  and has_role(auth.uid(), 'admin')
)
with check (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- =========================================================
-- 7) Reference tables (read-only for all authenticated users)
-- =========================================================

-- tenant_lifecycle_states
alter table public.tenant_lifecycle_states enable row level security;
drop policy if exists tenant_lifecycle_states_select on public.tenant_lifecycle_states;
create policy tenant_lifecycle_states_select
on public.tenant_lifecycle_states
for select
using (true);

-- tenant_automation_events
alter table public.tenant_automation_events enable row level security;
drop policy if exists tenant_automation_events_select on public.tenant_automation_events;
create policy tenant_automation_events_select
on public.tenant_automation_events
for select
using (true);

-- =========================================================
-- 8) Grant read access to global references
-- =========================================================
grant select on public.tenant_lifecycle_states to authenticated;
grant select on public.tenant_automation_events to authenticated;

-- =========================================================
-- Done: Part 1.2 — RLS + Policies + Roles Setup (Romuz-compliant)