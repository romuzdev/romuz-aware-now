-- =========================================================
-- Gate-M — Master Data & Taxonomy Hub
-- Part 1: Database Schema + RLS + Triggers + Indexes
-- =========================================================

-- ======================
-- 0) Safety & Extensions
-- ======================
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ===============================================
-- 1) TABLES: ref_catalogs, ref_terms, ref_mappings
-- ===============================================

-- 1.1) Reference Catalogs (GLOBAL or TENANT)
create table if not exists public.ref_catalogs (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  label_ar    text not null,
  label_en    text not null,
  scope       text not null check (scope in ('GLOBAL','TENANT')),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  status      text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  version     int  not null default 1,
  meta        jsonb not null default '{}'::jsonb,
  created_by  uuid,
  updated_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint chk_ref_catalogs_scope_tenant
    check ( (scope = 'TENANT' and tenant_id is not null) or (scope = 'GLOBAL' and tenant_id is null) )
);

create unique index if not exists uq_ref_catalogs_global_code
  on public.ref_catalogs (code) where (scope = 'GLOBAL');

create unique index if not exists uq_ref_catalogs_tenant_code
  on public.ref_catalogs (tenant_id, code) where (scope = 'TENANT');

create index if not exists idx_ref_catalogs_tenant on public.ref_catalogs(tenant_id);
create index if not exists idx_ref_catalogs_status on public.ref_catalogs(status);
create index if not exists idx_ref_catalogs_created_at on public.ref_catalogs(created_at);

-- 1.2) Reference Terms (hierarchical terms inside catalogs)
create table if not exists public.ref_terms (
  id          uuid primary key default gen_random_uuid(),
  catalog_id  uuid not null references public.ref_catalogs(id) on delete cascade,
  parent_id   uuid references public.ref_terms(id) on delete set null,
  code        text not null,
  label_ar    text not null,
  label_en    text not null,
  sort_order  int  not null default 0,
  active      boolean not null default true,
  attrs       jsonb not null default '{}'::jsonb,
  created_by  uuid,
  updated_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists uq_ref_terms_catalog_code
  on public.ref_terms (catalog_id, code);

create index if not exists idx_ref_terms_catalog on public.ref_terms(catalog_id);
create index if not exists idx_ref_terms_parent on public.ref_terms(parent_id);
create index if not exists idx_ref_terms_active on public.ref_terms(active);
create index if not exists idx_ref_terms_sort on public.ref_terms(sort_order);

-- 1.3) Reference Mappings
create table if not exists public.ref_mappings (
  id             uuid primary key default gen_random_uuid(),
  catalog_id     uuid not null references public.ref_catalogs(id) on delete cascade,
  term_id        uuid references public.ref_terms(id) on delete cascade,
  source_system  text not null,
  src_code       text not null,
  target_code    text not null,
  notes          text,
  created_by     uuid,
  created_at     timestamptz not null default now()
);

create unique index if not exists uq_ref_mappings_cat_term_system_code
  on public.ref_mappings (catalog_id, term_id, source_system, src_code);

create index if not exists idx_ref_mappings_catalog on public.ref_mappings(catalog_id);
create index if not exists idx_ref_mappings_term on public.ref_mappings(term_id);
create index if not exists idx_ref_mappings_system on public.ref_mappings(source_system);

-- ======================================
-- 2) UPDATED_AT triggers
-- ======================================
create or replace function public.set_updated_by_column()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at := now();
  new.updated_by := app_current_user_id();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'tg_ref_catalogs_updated_at'
  ) then
    create trigger tg_ref_catalogs_updated_at
      before update on public.ref_catalogs
      for each row
      execute function public.update_updated_at_column();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'tg_ref_terms_updated_at'
  ) then
    create trigger tg_ref_terms_updated_at
      before update on public.ref_terms
      for each row
      execute function public.update_updated_at_column();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'tg_ref_catalogs_updated_by'
  ) then
    create trigger tg_ref_catalogs_updated_by
      before update on public.ref_catalogs
      for each row
      execute function public.set_updated_by_column();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'tg_ref_terms_updated_by'
  ) then
    create trigger tg_ref_terms_updated_by
      before update on public.ref_terms
      for each row
      execute function public.set_updated_by_column();
  end if;
end $$;

-- ============================================
-- 3) AUDIT triggers
-- ============================================
create or replace function public.fn_write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := app_current_user_id();
  v_entity text := TG_TABLE_NAME::text;
  v_diff jsonb;
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_log(entity_type, entity_id, action, actor, tenant_id, created_at, payload)
    values (v_entity, new.id, 'INSERT', v_actor, coalesce(new.tenant_id, app_current_tenant_id()), now(), to_jsonb(new));
    return new;
  elsif TG_OP = 'UPDATE' then
    v_diff := jsonb_strip_nulls(to_jsonb(new)) - 'updated_at' - 'updated_by'
           || jsonb_build_object('_old', jsonb_strip_nulls(to_jsonb(old)) - 'updated_at' - 'updated_by');
    insert into public.audit_log(entity_type, entity_id, action, actor, tenant_id, created_at, payload)
    values (v_entity, new.id, 'UPDATE', v_actor, coalesce(new.tenant_id, app_current_tenant_id()), now(), v_diff);
    return new;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_log(entity_type, entity_id, action, actor, tenant_id, created_at, payload)
    values (v_entity, old.id, 'DELETE', v_actor, coalesce(old.tenant_id, app_current_tenant_id()), now(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tg_ref_catalogs_audit') then
    create trigger tg_ref_catalogs_audit
      after insert or update or delete on public.ref_catalogs
      for each row execute function public.fn_write_audit_log();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'tg_ref_terms_audit') then
    create trigger tg_ref_terms_audit
      after insert or update or delete on public.ref_terms
      for each row execute function public.fn_write_audit_log();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'tg_ref_mappings_audit') then
    create trigger tg_ref_mappings_audit
      after insert or update or delete on public.ref_mappings
      for each row execute function public.fn_write_audit_log();
  end if;
end $$;

-- ==================================
-- 4) RLS enablement
-- ==================================
alter table public.ref_catalogs  enable row level security;
alter table public.ref_terms     enable row level security;
alter table public.ref_mappings  enable row level security;

-- ==================================
-- 5) RLS Policies — ref_catalogs
-- ==================================

create policy ref_catalogs_select_policy
on public.ref_catalogs
for select
using (
  is_platform_admin(auth.uid())
  OR (scope = 'GLOBAL' AND app_current_user_id() is not null)
  OR (scope = 'TENANT' AND tenant_id = app_current_tenant_id())
);

create policy ref_catalogs_insert_global_by_platform_admin
on public.ref_catalogs
for insert
with check (
  scope = 'GLOBAL'
  AND is_platform_admin(auth.uid())
);

create policy ref_catalogs_insert_tenant_by_tenant_admin
on public.ref_catalogs
for insert
with check (
  scope = 'TENANT'
  AND tenant_id = app_current_tenant_id()
  AND app_has_role('tenant_admin'::text)
);

create policy ref_catalogs_update_global_by_platform_admin
on public.ref_catalogs
for update
using (
  scope = 'GLOBAL' AND is_platform_admin(auth.uid())
)
with check (
  scope = 'GLOBAL' AND is_platform_admin(auth.uid())
);

create policy ref_catalogs_update_tenant_by_tenant_admin
on public.ref_catalogs
for update
using (
  scope = 'TENANT'
  AND tenant_id = app_current_tenant_id()
  AND app_has_role('tenant_admin'::text)
)
with check (
  scope = 'TENANT'
  AND tenant_id = app_current_tenant_id()
  AND app_has_role('tenant_admin'::text)
);

create policy ref_catalogs_delete_global_by_platform_admin
on public.ref_catalogs
for delete
using (
  scope = 'GLOBAL' AND is_platform_admin(auth.uid())
);

create policy ref_catalogs_delete_tenant_by_tenant_admin
on public.ref_catalogs
for delete
using (
  scope = 'TENANT'
  AND tenant_id = app_current_tenant_id()
  AND app_has_role('tenant_admin'::text)
);

-- ==================================
-- 6) RLS Policies — ref_terms
-- ==================================

create policy ref_terms_select_policy
on public.ref_terms
for select
using (
  exists (
    select 1 from public.ref_catalogs c
    where c.id = ref_terms.catalog_id
      and (
        is_platform_admin(auth.uid())
        OR (c.scope = 'GLOBAL' AND app_current_user_id() is not null)
        OR (c.scope = 'TENANT' AND c.tenant_id = app_current_tenant_id())
      )
  )
);

create policy ref_terms_insert_policy
on public.ref_terms
for insert
with check (
  exists (
    select 1 from public.ref_catalogs c
    where c.id = catalog_id
      and (
        (c.scope = 'TENANT' and c.tenant_id = app_current_tenant_id() and app_has_role('tenant_admin'::text))
        or (c.scope = 'GLOBAL' and is_platform_admin(auth.uid()))
      )
  )
);

create policy ref_terms_update_policy
on public.ref_terms
for update
using (
  exists (
    select 1 from public.ref_catalogs c
    where c.id = ref_terms.catalog_id
      and (
        (c.scope = 'TENANT' and c.tenant_id = app_current_tenant_id() and app_has_role('tenant_admin'::text))
        or (c.scope = 'GLOBAL' and is_platform_admin(auth.uid()))
      )
  )
)
with check (
  exists (
    select 1 from public.ref_catalogs c
    where c.id = catalog_id
      and (
        (c.scope = 'TENANT' and c.tenant_id = app_current_tenant_id() and app_has_role('tenant_admin'::text))
        or (c.scope = 'GLOBAL' and is_platform_admin(auth.uid()))
      )
  )
);

create policy ref_terms_delete_policy
on public.ref_terms
for delete
using (
  exists (
    select 1 from public.ref_catalogs c
    where c.id = ref_terms.catalog_id
      and (
        (c.scope = 'TENANT' and c.tenant_id = app_current_tenant_id() and app_has_role('tenant_admin'::text))
        or (c.scope = 'GLOBAL' and is_platform_admin(auth.uid()))
      )
  )
);

-- ==================================
-- 7) RLS Policies — ref_mappings
-- ==================================

create policy ref_mappings_select_policy
on public.ref_mappings
for select
using (
  exists (
    select 1 from public.ref_catalogs c
    where c.id = ref_mappings.catalog_id
      and (
        is_platform_admin(auth.uid())
        OR (c.scope = 'GLOBAL' AND app_current_user_id() is not null)
        OR (c.scope = 'TENANT' AND c.tenant_id = app_current_tenant_id())
      )
  )
);

create policy ref_mappings_insert_policy
on public.ref_mappings
for insert
with check (
  exists (
    select 1 from public.ref_catalogs c
    where c.id = catalog_id
      and (
        (c.scope = 'TENANT' and c.tenant_id = app_current_tenant_id() and app_has_role('tenant_admin'::text))
        or (c.scope = 'GLOBAL' and is_platform_admin(auth.uid()))
      )
  )
);

create policy ref_mappings_update_policy
on public.ref_mappings
for update
using (
  exists (
    select 1 from public.ref_catalogs c
    where c.id = ref_mappings.catalog_id
      and (
        (c.scope = 'TENANT' and c.tenant_id = app_current_tenant_id() and app_has_role('tenant_admin'::text))
        or (c.scope = 'GLOBAL' and is_platform_admin(auth.uid()))
      )
  )
)
with check (
  exists (
    select 1 from public.ref_catalogs c
    where c.id = catalog_id
      and (
        (c.scope = 'TENANT' and c.tenant_id = app_current_tenant_id() and app_has_role('tenant_admin'::text))
        or (c.scope = 'GLOBAL' and is_platform_admin(auth.uid()))
      )
  )
);

create policy ref_mappings_delete_policy
on public.ref_mappings
for delete
using (
  exists (
    select 1 from public.ref_catalogs c
    where c.id = ref_mappings.catalog_id
      and (
        (c.scope = 'TENANT' and c.tenant_id = app_current_tenant_id() and app_has_role('tenant_admin'::text))
        or (c.scope = 'GLOBAL' and is_platform_admin(auth.uid()))
      )
  )
);

-- =========================================================
-- 8) Saved Views
-- =========================================================
create table if not exists public.md_saved_views (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  entity_type   text not null check (entity_type in ('ref_catalogs','ref_terms','ref_mappings')),
  view_name     text not null,
  description_ar text,
  filters       jsonb not null default '{}'::jsonb,
  sort_config   jsonb not null default '{}'::jsonb,
  is_default    boolean not null default false,
  is_shared     boolean not null default false,
  owner_id      uuid not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint uq_md_saved_views_unique_name unique (tenant_id, entity_type, view_name, owner_id)
);

create index if not exists idx_md_saved_views_tenant on public.md_saved_views(tenant_id);
create index if not exists idx_md_saved_views_entity on public.md_saved_views(entity_type);

alter table public.md_saved_views enable row level security;

create policy md_saved_views_select_policy
on public.md_saved_views
for select
using (
  tenant_id = app_current_tenant_id()
  or is_platform_admin(auth.uid())
);

create policy md_saved_views_insert_policy
on public.md_saved_views
for insert
with check (
  tenant_id = app_current_tenant_id()
  and (owner_id = app_current_user_id() or app_has_role('tenant_admin'::text))
);

create policy md_saved_views_update_policy
on public.md_saved_views
for update
using (
  tenant_id = app_current_tenant_id()
  and (owner_id = app_current_user_id() or app_has_role('tenant_admin'::text) or is_platform_admin(auth.uid()))
)
with check (
  tenant_id = app_current_tenant_id()
  and (owner_id = app_current_user_id() or app_has_role('tenant_admin'::text) or is_platform_admin(auth.uid()))
);

create policy md_saved_views_delete_policy
on public.md_saved_views
for delete
using (
  tenant_id = app_current_tenant_id()
  and (owner_id = app_current_user_id() or app_has_role('tenant_admin'::text) or is_platform_admin(auth.uid()))
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'tg_md_saved_views_updated_at'
  ) then
    create trigger tg_md_saved_views_updated_at
      before update on public.md_saved_views
      for each row
      execute function public.update_updated_at_column();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'tg_md_saved_views_audit'
  ) then
    create trigger tg_md_saved_views_audit
      after insert or update or delete on public.md_saved_views
      for each row execute function public.fn_write_audit_log();
  end if;
end $$;