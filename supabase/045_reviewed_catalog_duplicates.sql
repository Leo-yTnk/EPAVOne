-- Apply after 044. Explicit, version-checked duplicate choices; no backfill.
-- The original add-only RPC remains unchanged and remains the default path.
create or replace function public.admin_import_reviewed_catalog(p_payload jsonb, p_choices jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  d jsonb; row_data jsonb; original jsonb; entity text; idx integer; target uuid; ids uuid[];
  cat uuid; product uuid; ingredient jsonb; ordinal integer; summary jsonb;
  aliases jsonb:='{}'; counts jsonb:='{}'; n integer;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'not_authorized' using errcode='42501'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or jsonb_typeof(p_choices) is distinct from 'array'
    or jsonb_array_length(p_choices)>5000 then raise exception 'invalid_import_choices'; end if;
  if exists(select 1 from jsonb_array_elements(p_choices) x group by x->>'entity',x->>'id' having count(*)>1)
    or exists(select 1 from jsonb_array_elements(p_choices) x group by x->>'entity',x->>'index' having count(*)>1)
    then raise exception 'duplicate_import_choice'; end if;
  lock table public.categories,public.products,public.recipes,public.recipe_ingredients,
    public.catalog_sections,public.catalog_section_recipes,public.catalog_section_products in share row exclusive mode;
  -- Revalidate every selected identity and version under the same transaction lock.
  for d in select * from jsonb_array_elements(p_choices) loop
    entity:=d->>'entity'; idx:=(d->>'index')::int; target:=(d->>'id')::uuid;
    if entity not in ('categories','products','recipes','sections') or idx<0
      or jsonb_typeof(p_payload->entity) is distinct from 'array' or idx>=jsonb_array_length(p_payload->entity)
      then raise exception 'invalid_import_choice'; end if;
    row_data:=p_payload->entity->idx; ids:='{}'; original:=null;
    if entity='products' then
      select array_agg(p.id) into ids from public.products p where p.scope='site' and p.owner_id is null and
        (public.normalize_catalog_name(p.name)=public.normalize_catalog_name(row_data->>'name')
        or (public.swift_catalog_identity(p.swift_product_url) is not null and public.swift_catalog_identity(p.swift_product_url)=public.swift_catalog_identity(row_data->>'swift_product_url'))
        or (nullif(row_data->>'swift_sku','') is not null and lower(p.swift_sku)=lower(row_data->>'swift_sku')));
      select to_jsonb(p) into original from public.products p where p.id=target and p.scope='site' and p.owner_id is null;
    elsif entity='recipes' then
      select array_agg(r.id) into ids from public.recipes r where r.scope='site' and r.owner_id is null
        and public.normalize_catalog_name(r.name)=public.normalize_catalog_name(row_data->>'name');
      select to_jsonb(r) into original from public.recipes r where r.id=target and r.scope='site' and r.owner_id is null;
    elsif entity='categories' then
      select array_agg(c.id) into ids from public.categories c where c.scope='site' and c.owner_id is null
        and c.type=row_data->>'type' and (c.slug=public.slugify(row_data->>'name') or public.normalize_catalog_name(c.name)=public.normalize_catalog_name(row_data->>'name'));
      select to_jsonb(c) into original from public.categories c where c.id=target and c.scope='site' and c.owner_id is null;
    else
      select array_agg(s.id) into ids from public.catalog_sections s join public.catalog_pages p on p.id=s.page_id
        where p.key=row_data->>'page' and s.slug=public.slugify(row_data->>'name');
      select to_jsonb(s) into original from public.catalog_sections s where s.id=target;
    end if;
    if coalesce(cardinality(ids),0)<>1 or ids[1]<>target or original is null then raise exception 'duplicate_identity_changed'; end if;
    if entity='sections' then
      if not (d ? 'updated_at') or (original->>'updated_at')::timestamptz is distinct from (d->>'updated_at')::timestamptz
        then raise exception 'version_conflict'; end if;
    elsif nullif(d->>'version','') is null or (original->>'version')::int is distinct from (d->>'version')::int then
      raise exception 'version_conflict';
    end if;
  end loop;
  -- Product aliases allow imported recipe ingredients to refer to an existing
  -- editorial name when the existing product is kept.
  for row_data in select * from jsonb_array_elements(coalesce(p_payload->'products','[]')) loop
    select array_agg(p.id) into ids from public.products p where p.scope='site' and p.owner_id is null and
      (public.normalize_catalog_name(p.name)=public.normalize_catalog_name(row_data->>'name')
      or (public.swift_catalog_identity(p.swift_product_url) is not null and public.swift_catalog_identity(p.swift_product_url)=public.swift_catalog_identity(row_data->>'swift_product_url'))
      or (nullif(row_data->>'swift_sku','') is not null and lower(p.swift_sku)=lower(row_data->>'swift_sku')));
    if cardinality(ids)=1 then aliases:=aliases||jsonb_build_object(public.normalize_catalog_name(row_data->>'name'),ids[1]); end if;
  end loop;
  -- Existing 042 validates the complete six-sheet payload and adds new items.
  -- Any replacement failure below rolls back these additions as well.
  summary:=public.admin_add_public_catalog(p_payload->'categories',p_payload->'products',p_payload->'recipes',
    p_payload->'sections',p_payload->'recipeSections',p_payload->'productSections');
  -- Process categories/products before recipes regardless of UI selection order.
  for d in select x from jsonb_array_elements(p_choices) x
    order by case x->>'entity' when 'categories' then 0 when 'products' then 1 when 'recipes' then 2 else 3 end loop
    entity:=d->>'entity'; row_data:=p_payload->entity->(d->>'index')::int; target:=(d->>'id')::uuid;
    if entity='categories' then
      update public.categories set name=btrim(row_data->>'name'),slug=public.slugify(row_data->>'name') where id=target;
    elsif entity='products' then
      select c.id into cat from public.categories c where c.scope='site' and c.owner_id is null and c.type='proteina'
        and (c.slug=public.slugify(row_data->>'category') or public.normalize_catalog_name(c.name)=public.normalize_catalog_name(row_data->>'category'));
      if cat is null then raise exception 'category_not_found'; end if;
      -- Price, verified SKU/source and active state are not spreadsheet-owned.
      update public.products set name=btrim(row_data->>'name'), category_id=cat,
        unit=row_data->>'unit',image_url=row_data->>'image_url' where id=target;
    elsif entity='recipes' then
      select c.id into cat from public.categories c where c.scope='site' and c.owner_id is null and c.type='receita' and c.active
        and (c.slug=public.slugify(row_data->>'category') or public.normalize_catalog_name(c.name)=public.normalize_catalog_name(row_data->>'category'));
      if cat is null then raise exception 'active_category_not_found'; end if;
      if jsonb_typeof(row_data->'ingredients') is distinct from 'array' or jsonb_array_length(row_data->'ingredients')=0
        or exists(select 1 from jsonb_array_elements(row_data->'ingredients') x group by public.normalize_catalog_name(x->>'product') having count(*)>1)
        then raise exception 'invalid_recipe_ingredients'; end if;
      update public.recipes set name=btrim(row_data->>'name'),category_id=cat,
        prep_time=(row_data->>'prep_time')::int,servings=(row_data->>'servings')::int,difficulty=row_data->>'difficulty',
        image_url=nullif(row_data->>'image_url',''),featured=coalesce((row_data->>'featured')::boolean,false),
        instructions=array(select jsonb_array_elements_text(row_data->'instructions')),
        extras=array(select jsonb_array_elements_text(coalesce(row_data->'extras','[]'))),
        tips=array(select jsonb_array_elements_text(coalesce(row_data->'tips','[]'))) where id=target;
      delete from public.recipe_ingredients where recipe_id=target;
      ordinal:=0;
      for ingredient in select * from jsonb_array_elements(row_data->'ingredients') loop
        product:=null;
        if jsonb_typeof(ingredient->'quantity') is distinct from 'number' or (ingredient->>'quantity')::numeric<=0 then raise exception 'invalid_ingredient_quantity'; end if;
        if aliases ? public.normalize_catalog_name(ingredient->>'product') then
          select p.id into product from public.products p where p.id=(aliases->>public.normalize_catalog_name(ingredient->>'product'))::uuid and p.scope='site' and p.owner_id is null and p.active;
        else
          select p.id into product from public.products p where p.scope='site' and p.owner_id is null and p.active and public.normalize_catalog_name(p.name)=public.normalize_catalog_name(ingredient->>'product');
        end if;
        if product is null then raise exception 'active_product_not_found'; end if;
        insert into public.recipe_ingredients(recipe_id,product_id,quantity,sort_order) values(target,product,(ingredient->>'quantity')::numeric,ordinal);
        ordinal:=ordinal+1;
      end loop;
    else
      update public.catalog_sections set name=btrim(row_data->>'name'),sort_order=(row_data->>'sort_order')::int,
        active=(row_data->>'active')::boolean,updated_at=now() where id=target;
    end if;
    n:=coalesce((counts->>entity)::int,0)+1; counts:=counts||jsonb_build_object(entity,n);
  end loop;
  for entity,n in select key,value::int from jsonb_each_text(counts) loop
    summary:=jsonb_set(summary,array[entity,'replaced'],to_jsonb(n));
    summary:=jsonb_set(summary,array[entity,'ignored'],to_jsonb(greatest(0,(summary->entity->>'ignored')::int-n)));
  end loop;
  return summary;
end $$;
revoke all on function public.admin_import_reviewed_catalog(jsonb,jsonb) from public,anon;
grant execute on function public.admin_import_reviewed_catalog(jsonb,jsonb) to authenticated;
