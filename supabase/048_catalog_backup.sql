-- Public catalog backup, one consistent snapshot and atomic, non-destructive restore.
-- Personal libraries, profiles, credentials, Planner and remote image bytes are excluded.
create or replace function public.admin_export_catalog_backup()
returns jsonb language plpgsql security definer set search_path='' as $$
declare snapshot jsonb;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'not_authorized' using errcode='42501'; end if;
  -- All subqueries share the same statement snapshot, including relationships.
  select jsonb_build_object(
    'format','epavone-catalog','version',1,'created_at',now(),
    'data',jsonb_build_object(
      'categories',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.categories t where scope='site' and owner_id is null),
      'products',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.products t where scope='site' and owner_id is null),
      'recipes',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.recipes t where scope='site' and owner_id is null),
      'recipe_ingredients',(select coalesce(jsonb_agg(to_jsonb(t) order by recipe_id,sort_order),'[]') from public.recipe_ingredients t join public.recipes r on r.id=t.recipe_id where r.scope='site' and r.owner_id is null),
      'recipe_categories',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.recipe_categories t join public.recipes r on r.id=t.recipe_id where r.scope='site' and r.owner_id is null),
      'product_categories',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.product_categories t join public.products p on p.id=t.product_id where p.scope='site' and p.owner_id is null),
      'catalog_pages',(select coalesce(jsonb_agg(to_jsonb(t) order by sort_order,id),'[]') from public.catalog_pages t),
      'catalog_sections',(select coalesce(jsonb_agg(to_jsonb(t) order by sort_order,id),'[]') from public.catalog_sections t),
      'catalog_section_recipes',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.catalog_section_recipes t),
      'catalog_section_products',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.catalog_section_products t)
    )) into snapshot;
  return snapshot;
end $$;

create or replace function public.admin_restore_catalog_backup(p_backup jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  d jsonb:=p_backup->'data'; rows_to_restore jsonb; tbl text; cols text; changes text; conflict_cols text;
  total integer:=0; n integer;
  tables constant text[]:=array['categories','products','recipes','catalog_pages','catalog_sections',
    'recipe_ingredients','recipe_categories','product_categories','catalog_section_recipes','catalog_section_products'];
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'not_authorized' using errcode='42501'; end if;
  if p_backup->>'format' is distinct from 'epavone-catalog' or p_backup->>'version' is distinct from '1'
    or jsonb_typeof(d) is distinct from 'object' or octet_length(p_backup::text)>52428800 then raise exception 'invalid_catalog_backup'; end if;
  foreach tbl in array tables loop
    if jsonb_typeof(d->tbl) is distinct from 'array' then raise exception 'invalid_backup_table: %',tbl; end if;
    if exists(select 1 from jsonb_array_elements(d->tbl) x where jsonb_typeof(x) is distinct from 'object') then raise exception 'invalid_backup_row'; end if;
    total:=total+jsonb_array_length(d->tbl);
  end loop;
  if total>100000 then raise exception 'backup_limit_exceeded'; end if;
  lock table public.categories,public.products,public.recipes,public.recipe_ingredients,public.recipe_categories,public.product_categories,
    public.catalog_pages,public.catalog_sections,public.catalog_section_recipes,public.catalog_section_products in share row exclusive mode;
  -- Reject scope/owner spoofing, ID collisions and references outside the public snapshot.
  foreach tbl in array array['categories','products','recipes'] loop
    if exists(select 1 from jsonb_array_elements(d->tbl) x where x->>'scope' is distinct from 'site' or x->>'owner_id' is not null or nullif(x->>'id','') is null)
      then raise exception 'invalid_backup_scope'; end if;
    execute format('select count(*) from public.%I t join jsonb_array_elements($1) x on t.id=(x->>''id'')::uuid where t.scope<>''site'' or t.owner_id is not null',tbl) into n using d->tbl;
    if n>0 then raise exception 'backup_personal_id_conflict'; end if;
  end loop;
  foreach tbl in array array['products','recipes'] loop
    if exists(select 1 from jsonb_array_elements(d->tbl) x where not exists(select 1 from jsonb_array_elements(d->'categories') c where c->>'id'=x->>'category_id')) then raise exception 'backup_category_missing'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(d->'recipe_ingredients') x where
    not exists(select 1 from jsonb_array_elements(d->'recipes') r where r->>'id'=x->>'recipe_id') or
    not exists(select 1 from jsonb_array_elements(d->'products') p where p->>'id'=x->>'product_id')) then raise exception 'backup_ingredient_reference_missing'; end if;
  foreach tbl in array array['recipe_categories','product_categories','catalog_section_recipes','catalog_section_products'] loop
    if exists(select 1 from jsonb_array_elements(d->tbl) x where
      (x ? 'recipe_id' and not exists(select 1 from jsonb_array_elements(d->'recipes') r where r->>'id'=x->>'recipe_id')) or
      (x ? 'product_id' and not exists(select 1 from jsonb_array_elements(d->'products') p where p->>'id'=x->>'product_id')) or
      (x ? 'category_id' and not exists(select 1 from jsonb_array_elements(d->'categories') c where c->>'id'=x->>'category_id')) or
      (x ? 'section_id' and not exists(select 1 from jsonb_array_elements(d->'catalog_sections') s where s->>'id'=x->>'section_id')))
      then raise exception 'backup_link_reference_missing'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(d->'catalog_sections') x where not exists(select 1 from jsonb_array_elements(d->'catalog_pages') p where p->>'id'=x->>'page_id')) then raise exception 'backup_page_missing'; end if;
  -- Never remove later catalog records or touch personal content. Rebuild associations for restored IDs.
  delete from public.recipe_ingredients where recipe_id in(select (x->>'id')::uuid from jsonb_array_elements(d->'recipes') x);
  delete from public.recipe_categories where recipe_id in(select (x->>'id')::uuid from jsonb_array_elements(d->'recipes') x);
  delete from public.product_categories where product_id in(select (x->>'id')::uuid from jsonb_array_elements(d->'products') x);
  delete from public.catalog_section_recipes where section_id in(select (x->>'id')::uuid from jsonb_array_elements(d->'catalog_sections') x);
  delete from public.catalog_section_products where section_id in(select (x->>'id')::uuid from jsonb_array_elements(d->'catalog_sections') x);
  -- Preserve the backed-up Swift observation together with its identity.
  perform set_config('app.swift_atomic_observation','on',true);
  foreach tbl in array tables loop
    -- SQL identifiers come exclusively from the fixed allowlist/schema, never file keys.
    select string_agg(format('%I',a.attname),',' order by a.attnum),
      string_agg(format('%1$I=excluded.%1$I',a.attname),',' order by a.attnum) filter(where a.attname not in ('id','owner_id','scope','created_at','created_by','version') and a.attname not like '%\_code' escape '\')
      into cols,changes from pg_catalog.pg_attribute a where a.attrelid=format('public.%I',tbl)::regclass
        and a.attnum>0 and not a.attisdropped and a.attgenerated='' and a.attidentity='';
    rows_to_restore:=d->tbl;
    -- Reference triggers require active targets. Temporarily activate only inside
    -- this transaction; restore the snapshot's flags after all references exist.
    if tbl in ('categories','products') then
      select coalesce(jsonb_agg(x||jsonb_build_object('active',true)),'[]') into rows_to_restore from jsonb_array_elements(d->tbl) x;
    end if;
    if tbl in ('recipe_ingredients','recipe_categories','product_categories','catalog_section_recipes','catalog_section_products') then
      execute format('insert into public.%1$I(%2$s) select %2$s from jsonb_populate_recordset(null::public.%1$I,$1)',tbl,cols) using rows_to_restore;
    else
      conflict_cols:='id';
      execute format('insert into public.%1$I(%2$s) select %2$s from jsonb_populate_recordset(null::public.%1$I,$1) on conflict(%3$s) do update set %4$s',tbl,cols,conflict_cols,changes) using rows_to_restore;
    end if;
  end loop;
  foreach tbl in array array['categories','products'] loop
    execute format('update public.%I t set active=(x->>''active'')::boolean from jsonb_array_elements($1) x where t.id=(x->>''id'')::uuid and t.active is distinct from (x->>''active'')::boolean',tbl) using d->tbl;
  end loop;
  return jsonb_build_object('restored',total);
end $$;
revoke all on function public.admin_export_catalog_backup(),public.admin_restore_catalog_backup(jsonb) from public,anon;
grant execute on function public.admin_export_catalog_backup(),public.admin_restore_catalog_backup(jsonb) to authenticated;
notify pgrst,'reload schema';
