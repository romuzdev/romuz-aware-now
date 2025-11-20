-- Gate-P — Hotfix Migration: create any missing core tables
create extension if not exists pgcrypto;

-- 1) tenant_lifecycle_states
create table if not exists public.tenant_lifecycle_states (
  code        text primary key,
  label       text not null,
  description text,
  is_terminal boolean not null default false,
  sort_order  int not null default 100,
  created_at  timestamptz not null default now()
);
create index if not exists idx_tenant_lifecycle_states_sort on public.tenant_lifecycle_states(sort_order);
insert into public.tenant_lifecycle_states(code,label,description,is_terminal,sort_order)
select * from (values
  ('CREATED','Created','Tenant record created',false,10),
  ('PROVISIONING','Provisioning','Resources are being provisioned',false,20),
  ('ACTIVE','Active','Tenant is active',false,30),
  ('SUSPENDED','Suspended','Access restricted',false,40),
  ('READ_ONLY','Read-only','Read-only mode',false,50),
  ('DEPROVISIONING','Deprovisioning','Resources are being deprovisioned',false,60),
  ('ARCHIVED','Archived','Tenant archived',true,90)
) s(code,label,description,is_terminal,sort_order)
where not exists (select 1 from public.tenant_lifecycle_states t where t.code=s.code);

-- 2) tenant_automation_events
create table if not exists public.tenant_automation_events (
  code        text primary key,
  description text,
  created_at  timestamptz not null default now()
);
insert into public.tenant_automation_events(code,description)
select * from (values
  ('ON_TENANT_CREATED','Fires after tenant record is created'),
  ('ON_TENANT_ACTIVATED','Fires after tenant becomes ACTIVE'),
  ('ON_TENANT_SUSPENDED','Fires when tenant is SUSPENDED'),
  ('ON_TENANT_READ_ONLY','Fires when tenant becomes READ_ONLY'),
  ('ON_TENANT_ARCHIVED','Fires after deprovisioning ends -> ARCHIVED')
) s(code,description)
where not exists (select 1 from public.tenant_automation_events t where t.code=s.code);

-- 3) tenant_lifecycle_log  (كان الناقص في بيئتك)
create table if not exists public.tenant_lifecycle_log (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  from_state     text references public.tenant_lifecycle_states(code),
  to_state       text references public.tenant_lifecycle_states(code),
  reason         text,
  triggered_by   text,
  trigger_source text check (trigger_source in ('system','user','job','edge','integration')) default 'system',
  created_at     timestamptz not null default now()
);
create index if not exists idx_tll_tenant_created_at on public.tenant_lifecycle_log(tenant_id, created_at desc);
create index if not exists idx_tll_to_state on public.tenant_lifecycle_log(to_state);

-- 4) tenant_health_status
create table if not exists public.tenant_health_status (
  tenant_id       uuid primary key references public.tenants(id) on delete cascade,
  health_status   text not null check (health_status in ('HEALTHY','WARNING','CRITICAL')) default 'HEALTHY',
  drift_flag      text,
  details_json    jsonb,
  last_checked_at timestamptz,
  updated_at      timestamptz not null default now()
);
create index if not exists idx_ths_health on public.tenant_health_status(health_status);
create index if not exists idx_ths_last_checked on public.tenant_health_status(last_checked_at);

-- 5) tenant_automation_actions
create table if not exists public.tenant_automation_actions (
  id           uuid primary key default gen_random_uuid(),
  scope        text not null check (scope in ('global','tenant')) default 'global',
  tenant_id    uuid references public.tenants(id) on delete cascade,
  event_code   text not null references public.tenant_automation_events(code),
  action_type  text not null check (action_type in ('send_email','trigger_webhook','run_job')),
  config_json  jsonb,
  is_enabled   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_taa_scope_event on public.tenant_automation_actions(scope, event_code);
create index if not exists idx_taa_tenant_event on public.tenant_automation_actions(tenant_id, event_code);

-- 6) tenant_notifications_channels
create table if not exists public.tenant_notifications_channels (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references public.tenants(id) on delete cascade,
  channel_type text not null check (channel_type in ('email','slack','webhook')),
  config_json  jsonb not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_tnc_tenant_active on public.tenant_notifications_channels(tenant_id, is_active);

-- 7) tenant_deprovision_jobs
create table if not exists public.tenant_deprovision_jobs (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  step_code     text not null,
  status        text not null check (status in ('PENDING','RUNNING','DONE','FAILED')) default 'PENDING',
  started_at    timestamptz,
  completed_at  timestamptz,
  error_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  sort_order    int not null default 100
);
create index if not exists idx_tdj_tenant_status on public.tenant_deprovision_jobs(tenant_id, status, sort_order);

-- Optional helper view (safe to recreate)
create or replace view public.v_default_deprovision_steps as
select * from (values
  (10, 'stop_jobs'),
  (20, 'disable_channels'),
  (30, 'archive_data'),
  (40, 'lock_rbac')
) as steps(sort_order, step_code);

-- Comments (docs)
comment on table public.tenant_lifecycle_log is 'Gate-P: Audit log of tenant lifecycle transitions.';