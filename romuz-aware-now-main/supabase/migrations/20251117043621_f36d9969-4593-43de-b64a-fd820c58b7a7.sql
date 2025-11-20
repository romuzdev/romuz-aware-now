-- =========================================================
-- Gate-M: Saved Views Database Functions
-- Part 1.1: Server-side functions for saved views management
-- =========================================================

-- ============================================================
-- fn_md_save_view: Save or update a saved view
-- ============================================================
create or replace function public.fn_md_save_view(
  p_entity_type text,
  p_view_name text,
  p_description_ar text,
  p_filters jsonb,
  p_sort_config jsonb,
  p_is_default boolean,
  p_is_shared boolean
)
returns table (
  id uuid,
  tenant_id uuid,
  entity_type text,
  view_name text,
  description_ar text,
  filters jsonb,
  sort_config jsonb,
  is_default boolean,
  is_shared boolean,
  owner_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_user_id uuid;
begin
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  if v_tenant_id is null then
    raise exception 'TENANT_REQUIRED';
  end if;
  
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  
  -- If setting as default, unset other defaults for this user & entity
  if p_is_default then
    update public.md_saved_views
    set is_default = false
    where tenant_id = v_tenant_id
      and owner_id = v_user_id
      and entity_type = p_entity_type
      and is_default = true;
  end if;
  
  -- Upsert view
  return query
  insert into public.md_saved_views (
    tenant_id,
    entity_type,
    view_name,
    description_ar,
    filters,
    sort_config,
    is_default,
    is_shared,
    owner_id
  )
  values (
    v_tenant_id,
    p_entity_type,
    p_view_name,
    p_description_ar,
    p_filters,
    p_sort_config,
    p_is_default,
    p_is_shared,
    v_user_id
  )
  on conflict (tenant_id, entity_type, view_name, owner_id)
  do update set
    description_ar = excluded.description_ar,
    filters = excluded.filters,
    sort_config = excluded.sort_config,
    is_default = excluded.is_default,
    is_shared = excluded.is_shared,
    updated_at = now()
  returning 
    md_saved_views.id,
    md_saved_views.tenant_id,
    md_saved_views.entity_type,
    md_saved_views.view_name,
    md_saved_views.description_ar,
    md_saved_views.filters,
    md_saved_views.sort_config,
    md_saved_views.is_default,
    md_saved_views.is_shared,
    md_saved_views.owner_id,
    md_saved_views.created_at,
    md_saved_views.updated_at;
end;
$$;

-- ============================================================
-- fn_md_list_views: List all saved views for current user
-- ============================================================
create or replace function public.fn_md_list_views(p_entity_type text)
returns table (
  id uuid,
  tenant_id uuid,
  entity_type text,
  view_name text,
  description_ar text,
  filters jsonb,
  sort_config jsonb,
  is_default boolean,
  is_shared boolean,
  owner_id uuid,
  is_owner boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_user_id uuid;
begin
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  if v_tenant_id is null then
    raise exception 'TENANT_REQUIRED';
  end if;
  
  return query
  select 
    v.id,
    v.tenant_id,
    v.entity_type,
    v.view_name,
    v.description_ar,
    v.filters,
    v.sort_config,
    v.is_default,
    v.is_shared,
    v.owner_id,
    (v.owner_id = v_user_id) as is_owner,
    v.created_at,
    v.updated_at
  from public.md_saved_views v
  where v.tenant_id = v_tenant_id
    and v.entity_type = p_entity_type
    and (v.owner_id = v_user_id or v.is_shared = true)
  order by v.is_default desc, v.view_name;
end;
$$;

-- ============================================================
-- fn_md_delete_view: Delete a saved view
-- ============================================================
create or replace function public.fn_md_delete_view(p_view_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_user_id uuid;
  v_deleted boolean := false;
begin
  v_user_id := app_current_user_id();
  v_tenant_id := app_current_tenant_id();
  
  if v_tenant_id is null then
    raise exception 'TENANT_REQUIRED';
  end if;
  
  delete from public.md_saved_views
  where id = p_view_id
    and tenant_id = v_tenant_id
    and owner_id = v_user_id
  returning true into v_deleted;
  
  return coalesce(v_deleted, false);
end;
$$;