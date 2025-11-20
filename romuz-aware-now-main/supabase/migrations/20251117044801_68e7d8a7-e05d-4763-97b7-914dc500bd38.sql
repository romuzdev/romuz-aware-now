-- =========================================================
-- Gate-M — RPC Functions (Lookup / Bulk / Import/Export / Views)
-- Part 3.B: SQL Helper Functions
-- =========================================================

-- Helper: Resolve catalog id by code with RLS-respecting visibility
create or replace function public.fn_md_catalog_id_by_code(p_code text)
returns uuid
language sql
security invoker
set search_path = public
as $$
  select c.id
  from public.ref_catalogs c
  where c.code = p_code
  limit 1;
$$;

-- Helper: Resolve term id in catalog by code
create or replace function public.fn_md_term_id_by_code(p_catalog_id uuid, p_code text)
returns uuid
language sql
security invoker
set search_path = public
as $$
  select t.id
  from public.ref_terms t
  where t.catalog_id = p_catalog_id
    and t.code = p_code
  limit 1;
$$;

-- =========================================
-- 1) Lookup: search terms within a catalog
-- =========================================
create or replace function public.fn_md_lookup_terms(
  p_catalog_id uuid,
  p_query text default null,
  p_limit int default 50,
  p_include_inactive boolean default false
)
returns table(
  id uuid,
  code text,
  label_ar text,
  label_en text,
  parent_id uuid,
  sort_order int,
  active boolean,
  attrs jsonb
)
language sql
security invoker
set search_path = public
as $$
  select
    t.id, t.code, t.label_ar, t.label_en, t.parent_id, t.sort_order, t.active, t.attrs
  from public.ref_terms t
  where t.catalog_id = p_catalog_id
    and (p_include_inactive or t.active = true)
    and (
      p_query is null
      or t.code ilike '%'||p_query||'%'
      or t.label_ar ilike '%'||p_query||'%'
      or t.label_en ilike '%'||p_query||'%'
    )
  order by t.sort_order asc, t.code asc
  limit greatest(p_limit, 1);
$$;

-- =========================================
-- 2) Bulk activate/deactivate terms
-- =========================================
create or replace function public.fn_md_bulk_set_active(
  p_term_ids uuid[],
  p_active boolean
)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count int := 0;
begin
  update public.ref_terms t
  set active = p_active,
      updated_at = now(),
      updated_by = app_current_user_id()
  where t.id = any(p_term_ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- =========================================
-- 3) Reorder siblings (explicit order)
-- =========================================
create or replace function public.fn_md_reorder_terms(
  p_term_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  i int := 0;
  v_id uuid;
begin
  foreach v_id in array p_term_ids loop
    update public.ref_terms
    set sort_order = i,
        updated_at = now(),
        updated_by = app_current_user_id()
    where id = v_id;
    i := i + 1;
  end loop;
end;
$$;

-- =========================================
-- 4) Import terms (rows JSON)
-- Expected row fields: code, label_ar, label_en, parent_code?, sort_order?, active?, attrs?
-- =========================================
create or replace function public.fn_md_import_terms_csv(
  p_catalog_id uuid,
  p_file_url text default null,
  p_rows jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row jsonb;
  v_code text;
  v_label_ar text;
  v_label_en text;
  v_parent_code text;
  v_parent_id uuid;
  v_sort int;
  v_active boolean;
  v_attrs jsonb;
  v_inserted int := 0;
  v_updated int := 0;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    return jsonb_build_object('status','ERROR','message','p_rows must be a JSON array');
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := coalesce(v_row->>'code', '');
    v_label_ar := coalesce(v_row->>'label_ar', '');
    v_label_en := coalesce(v_row->>'label_en', '');
    v_parent_code := nullif(v_row->>'parent_code','');
    v_sort := coalesce((v_row->>'sort_order')::int, 0);
    v_active := coalesce((v_row->>'active')::boolean, true);
    v_attrs := coalesce(v_row->'attrs', '{}'::jsonb);

    if v_code = '' or v_label_ar = '' or v_label_en = '' then
      continue;
    end if;

    if v_parent_code is not null then
      v_parent_id := public.fn_md_term_id_by_code(p_catalog_id, v_parent_code);
    else
      v_parent_id := null;
    end if;

    insert into public.ref_terms as t (
      id, catalog_id, parent_id, code, label_ar, label_en, sort_order, active, attrs, created_by, updated_by
    ) values (
      gen_random_uuid(), p_catalog_id, v_parent_id, v_code, v_label_ar, v_label_en, v_sort, v_active, v_attrs,
      app_current_user_id(), app_current_user_id()
    )
    on conflict (catalog_id, code) do update
      set parent_id = excluded.parent_id,
          label_ar = excluded.label_ar,
          label_en = excluded.label_en,
          sort_order = excluded.sort_order,
          active = excluded.active,
          attrs = excluded.attrs,
          updated_at = now(),
          updated_by = app_current_user_id();

    if found then
      v_updated := v_updated + 1;
    else
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'status','OK',
    'updated', v_updated,
    'inserted', v_inserted
  );
end;
$$;

-- =========================================
-- 5) Export terms (tabular; client can format CSV)
-- =========================================
create or replace function public.fn_md_export_terms(
  p_catalog_id uuid,
  p_include_inactive boolean default false
)
returns table(
  code text,
  label_ar text,
  label_en text,
  parent_code text,
  sort_order int,
  active boolean,
  attrs jsonb
)
language sql
security invoker
set search_path = public
as $$
  select
    t.code,
    t.label_ar,
    t.label_en,
    (select t2.code from public.ref_terms t2 where t2.id = t.parent_id) as parent_code,
    t.sort_order,
    t.active,
    t.attrs
  from public.ref_terms t
  where t.catalog_id = p_catalog_id
    and (p_include_inactive or t.active = true)
  order by t.sort_order asc, t.code asc;
$$;

-- =========================================
-- 6) Toggle default saved view (per tenant + entity_type)
-- =========================================
create or replace function public.fn_md_set_default_view(p_view_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid;
  v_entity text;
begin
  select tenant_id, entity_type into v_tenant, v_entity
  from public.md_saved_views
  where id = p_view_id;

  if v_tenant is null then
    return false;
  end if;

  update public.md_saved_views
    set is_default = false, updated_at = now()
  where tenant_id = v_tenant
    and entity_type = v_entity;

  update public.md_saved_views
    set is_default = true, updated_at = now()
  where id = p_view_id;

  return true;
end;
$$;

-- =========================================
-- 7) Light version bump for catalogs
-- =========================================
create or replace function public.fn_md_bump_catalog_version(p_catalog_id uuid)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_new int;
begin
  update public.ref_catalogs
  set version = coalesce(version, 0) + 1,
      updated_at = now(),
      updated_by = app_current_user_id()
  where id = p_catalog_id
  returning version into v_new;

  return coalesce(v_new, 0);
end;
$$;

-- =========================================
-- 8) Mapping helpers: upsert by unique tuple
--    (catalog_id, term_id, source_system, src_code)
-- =========================================
create or replace function public.fn_md_upsert_mapping(
  p_catalog_id uuid,
  p_term_id uuid,
  p_source_system text,
  p_src_code text,
  p_target_code text,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.ref_mappings as m (
    id, catalog_id, term_id, source_system, src_code, target_code, notes, created_by
  ) values (
    gen_random_uuid(), p_catalog_id, p_term_id, p_source_system, p_src_code, p_target_code, p_notes, app_current_user_id()
  )
  on conflict (catalog_id, term_id, source_system, src_code)
  do update set target_code = excluded.target_code, notes = excluded.notes;

  select id into v_id
  from public.ref_mappings
  where catalog_id = p_catalog_id
    and ((term_id is null and p_term_id is null) or term_id = p_term_id)
    and source_system = p_source_system
    and src_code = p_src_code
  limit 1;

  return v_id;
end;
$$;