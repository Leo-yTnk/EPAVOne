-- Apply after 046. Cache stable normalization without falsely marking unaccent immutable.
-- Keys are server-owned and recomputed even if a client supplies them.
create or replace function public.set_catalog_import_keys()
returns trigger language plpgsql set search_path='' as $$
begin
  new.import_name_key := public.normalize_catalog_name(new.name);
  if tg_table_name='products' then
    new.import_swift_key := public.swift_catalog_identity(new.swift_product_url);
  end if;
  return new;
end $$;
revoke all on function public.set_catalog_import_keys() from public,anon,authenticated;
alter table public.categories add column if not exists import_name_key text;
drop trigger if exists zz_catalog_import_keys on public.categories;
create trigger zz_catalog_import_keys before insert or update on public.categories
for each row execute function public.set_catalog_import_keys();
update public.categories set import_name_key=public.normalize_catalog_name(name) where scope='site' and owner_id is null;
create index if not exists categories_import_name_idx on public.categories(import_name_key) where scope='site' and owner_id is null;
alter table public.products add column if not exists import_name_key text;
alter table public.products add column if not exists import_swift_key text;
drop trigger if exists zz_catalog_import_keys on public.products;
create trigger zz_catalog_import_keys before insert or update on public.products
for each row execute function public.set_catalog_import_keys();
update public.products set import_name_key=public.normalize_catalog_name(name),import_swift_key=public.swift_catalog_identity(swift_product_url) where scope='site' and owner_id is null;
create index if not exists products_import_name_idx on public.products(import_name_key) where scope='site' and owner_id is null;
alter table public.recipes add column if not exists import_name_key text;
drop trigger if exists zz_catalog_import_keys on public.recipes;
create trigger zz_catalog_import_keys before insert or update on public.recipes
for each row execute function public.set_catalog_import_keys();
update public.recipes set import_name_key=public.normalize_catalog_name(name) where scope='site' and owner_id is null;
create index if not exists recipes_import_name_idx on public.recipes(import_name_key) where scope='site' and owner_id is null;
create index if not exists products_import_swift_idx on public.products(import_swift_key) where scope='site' and owner_id is null;
create index if not exists products_import_sku_idx on public.products(lower(swift_sku)) where scope='site' and owner_id is null;
create index if not exists categories_import_slug_idx on public.categories(type,slug) where scope='site' and owner_id is null;

create or replace function public.admin_import_public_recipes(p_mode text, p_recipes jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text := coalesce(p_mode, 'add');
  v_recipe jsonb;
  v_idx integer := 0;
  v_name text;
  v_norm text;
  v_category_id uuid;
  v_recipe_id uuid;
  v_existing_id uuid;
  v_ing jsonb;
  v_sec jsonb;
  v_product_id uuid;
  v_section_id uuid;
  v_added integer := 0;
  v_replaced integer := 0;
  v_ignored integer := 0;
  v_removed integer := 0;
  v_seen text[] := '{}';
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if v_mode not in ('add', 'upsert', 'replace_all') then
    raise exception 'invalid_import_mode';
  end if;
  if jsonb_typeof(p_recipes) <> 'array' then
    raise exception 'invalid_recipes_payload';
  end if;

  -- Server-side full validation before any mutation.
  for v_recipe in select * from jsonb_array_elements(p_recipes) loop
    v_idx := v_idx + 1;
    v_name := btrim(coalesce(v_recipe->>'name', ''));
    v_norm := public.normalize_catalog_name(v_name);
    if v_name = '' then raise exception 'invalid_recipe_name at item %', v_idx; end if;
    if v_norm = any(v_seen) then raise exception 'duplicate_recipe_name_in_payload: %', v_name; end if;
    v_seen := array_append(v_seen, v_norm);

    select id into v_category_id from public.categories
      where scope = 'site' and owner_id is null and active and type = 'receita'
        and import_name_key = public.normalize_catalog_name(v_recipe->>'category')
      limit 1;
    if v_category_id is null then raise exception 'category_not_found: %', v_recipe->>'category'; end if;

    if jsonb_array_length(coalesce(v_recipe->'ingredients', '[]'::jsonb)) = 0 then
      raise exception 'ingredients_required: %', v_name;
    end if;
    for v_ing in select * from jsonb_array_elements(coalesce(v_recipe->'ingredients', '[]'::jsonb)) loop
      select id into v_product_id from public.products
        where scope = 'site' and owner_id is null and active
          and import_name_key = public.normalize_catalog_name(v_ing->>'product')
        limit 1;
      if v_product_id is null then raise exception 'product_not_found: %', v_ing->>'product'; end if;
      if coalesce((v_ing->>'quantity')::numeric, 0) <= 0 then raise exception 'invalid_ingredient_quantity: %', v_ing->>'product'; end if;
    end loop;

    for v_sec in select * from jsonb_array_elements(coalesce(v_recipe->'sections', '[]'::jsonb)) loop
      select id into v_section_id from public.categories
        where scope = 'site' and owner_id is null and active and type in ('secao_receita', 'secao_home')
          and (
            slug = public.slugify(v_sec#>>'{}')
            or import_name_key = public.normalize_catalog_name(v_sec#>>'{}')
            or import_name_key = public.normalize_catalog_name(
              case v_sec#>>'{}'
                when 'recomendado' then 'Recomendados'
                when 'pratico' then 'Práticos para o Dia a Dia'
                when 'ocasiao' then 'Ocasiões Especiais'
                when 'rapido' then 'Pronto em 30 Minutos'
                when 'churrasco' then 'Direto da Churrasqueira'
                when 'petisco' then 'Petiscos para Compartilhar'
                else v_sec#>>'{}'
              end
            )
          )
        limit 1;
      if v_section_id is null and (v_sec#>>'{}') <> 'destaque' then raise exception 'section_not_found: %', v_sec#>>'{}'; end if;
    end loop;
  end loop;

  if v_mode = 'replace_all' then
    delete from public.recipe_categories rc using public.recipes r where rc.recipe_id = r.id and r.scope = 'site';
    delete from public.recipe_ingredients ri using public.recipes r where ri.recipe_id = r.id and r.scope = 'site';
    delete from public.recipes where scope = 'site' and owner_id is null;
    get diagnostics v_removed = row_count;
  end if;

  for v_recipe in select * from jsonb_array_elements(p_recipes) loop
    v_name := btrim(v_recipe->>'name');
    select id into v_category_id from public.categories
      where scope = 'site' and owner_id is null and active and type = 'receita'
        and import_name_key = public.normalize_catalog_name(v_recipe->>'category') limit 1;
    select id into v_existing_id from public.recipes
      where scope = 'site' and owner_id is null and import_name_key = public.normalize_catalog_name(v_name) limit 1;

    if v_mode = 'add' and v_existing_id is not null then
      v_ignored := v_ignored + 1; continue;
    end if;
    if v_existing_id is not null then
      update public.recipes set
        status = 'published', name = v_name, category_id = v_category_id,
        prep_time = greatest(0, coalesce((v_recipe->>'prep_time')::integer, 0)),
        servings = greatest(0, coalesce((v_recipe->>'servings')::integer, 0)),
        difficulty = coalesce(nullif(v_recipe->>'difficulty', ''), 'Fácil'),
        image_url = nullif(v_recipe->>'image_url', ''), featured = coalesce((v_recipe->>'featured')::boolean, false),
        extras = coalesce(array(select jsonb_array_elements_text(coalesce(v_recipe->'extras','[]'::jsonb))), '{}'),
        instructions = coalesce(array(select jsonb_array_elements_text(coalesce(v_recipe->'instructions','[]'::jsonb))), '{}'),
        tips = coalesce(array(select jsonb_array_elements_text(coalesce(v_recipe->'tips','[]'::jsonb))), '{}')
      where id = v_existing_id returning id into v_recipe_id;
      delete from public.recipe_ingredients where recipe_id = v_recipe_id;
      delete from public.recipe_categories where recipe_id = v_recipe_id;
      v_replaced := v_replaced + 1;
    else
      insert into public.recipes(scope, owner_id, status, name, category_id, prep_time, servings, difficulty, image_url, featured, extras, instructions, tips)
      values ('site', null, 'published', v_name, v_category_id, greatest(0, coalesce((v_recipe->>'prep_time')::integer, 0)), greatest(0, coalesce((v_recipe->>'servings')::integer, 0)), coalesce(nullif(v_recipe->>'difficulty', ''), 'Fácil'), nullif(v_recipe->>'image_url', ''), coalesce((v_recipe->>'featured')::boolean, false), coalesce(array(select jsonb_array_elements_text(coalesce(v_recipe->'extras','[]'::jsonb))), '{}'), coalesce(array(select jsonb_array_elements_text(coalesce(v_recipe->'instructions','[]'::jsonb))), '{}'), coalesce(array(select jsonb_array_elements_text(coalesce(v_recipe->'tips','[]'::jsonb))), '{}'))
      returning id into v_recipe_id;
      v_added := v_added + 1;
    end if;

    v_idx := 0;
    for v_ing in select * from jsonb_array_elements(coalesce(v_recipe->'ingredients', '[]'::jsonb)) loop
      v_idx := v_idx + 1;
      select id into v_product_id from public.products where scope = 'site' and owner_id is null and active and import_name_key = public.normalize_catalog_name(v_ing->>'product') limit 1;
      insert into public.recipe_ingredients(recipe_id, product_id, quantity, sort_order) values (v_recipe_id, v_product_id, (v_ing->>'quantity')::numeric, v_idx);
    end loop;
    v_idx := 0;
    for v_sec in select * from jsonb_array_elements(coalesce(v_recipe->'sections', '[]'::jsonb)) loop
      select id into v_section_id from public.categories where scope = 'site' and owner_id is null and active and type in ('secao_receita', 'secao_home') and (
            slug = public.slugify(v_sec#>>'{}')
            or import_name_key = public.normalize_catalog_name(v_sec#>>'{}')
            or import_name_key = public.normalize_catalog_name(
              case v_sec#>>'{}'
                when 'recomendado' then 'Recomendados'
                when 'pratico' then 'Práticos para o Dia a Dia'
                when 'ocasiao' then 'Ocasiões Especiais'
                when 'rapido' then 'Pronto em 30 Minutos'
                when 'churrasco' then 'Direto da Churrasqueira'
                when 'petisco' then 'Petiscos para Compartilhar'
                else v_sec#>>'{}'
              end
            )
          ) limit 1;
      if v_section_id is not null then
        v_idx := v_idx + 1;
        insert into public.recipe_categories(recipe_id, category_id, sort_order) values (v_recipe_id, v_section_id, v_idx) on conflict do nothing;
      end if;
    end loop;
  end loop;

  return jsonb_build_object('added', v_added, 'replaced', v_replaced, 'ignored', v_ignored, 'removed', v_removed);
end;
$$;

create or replace function public.admin_add_catalog_entities(
  p_categories jsonb,
  p_products jsonb,
  p_recipes jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_category_mode text := 'add';
  v_product_mode text := 'add';
  v_recipe_mode text := 'add';
  v_item jsonb;
  v_id uuid;
  v_category_id uuid;
  v_category_added integer := 0; v_category_replaced integer := 0; v_category_ignored integer := 0; v_category_removed integer := 0;
  v_product_added integer := 0; v_product_replaced integer := 0; v_product_ignored integer := 0; v_product_removed integer := 0;
  v_recipe_result jsonb;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  if v_category_mode not in ('add', 'upsert', 'replace_all') or v_product_mode not in ('add', 'upsert', 'replace_all') or v_recipe_mode not in ('add', 'upsert', 'replace_all') then raise exception 'invalid_import_mode'; end if;
  if jsonb_typeof(coalesce(p_categories, '[]'::jsonb)) <> 'array' or jsonb_typeof(coalesce(p_products, '[]'::jsonb)) <> 'array' or jsonb_typeof(coalesce(p_recipes, '[]'::jsonb)) <> 'array' then raise exception 'invalid_import_payload'; end if;

  -- Reject ambiguous payloads before changing anything. These checks repeat
  -- browser validation because the client is not a security boundary.
  if exists (select 1 from jsonb_array_elements(coalesce(p_products, '[]'::jsonb)) x group by public.normalize_catalog_name(x->>'name') having count(*) > 1) then raise exception 'duplicate_product_name_in_payload'; end if;
  if exists (select 1 from jsonb_array_elements(coalesce(p_products, '[]'::jsonb)) x where nullif(btrim(x->>'swift_product_url'), '') is not null group by public.swift_catalog_identity(x->>'swift_product_url') having count(*) > 1) then raise exception 'duplicate_swift_url_in_payload'; end if;
  if exists (select 1 from jsonb_array_elements(coalesce(p_products, '[]'::jsonb)) x where nullif(btrim(x->>'swift_sku'), '') is not null group by lower(btrim(x->>'swift_sku')) having count(*) > 1) then raise exception 'duplicate_swift_sku_in_payload'; end if;

  -- Serialize all writers (including legacy/manual writes) before revalidating.
  lock table public.categories, public.products, public.recipes,
    public.catalog_sections, public.catalog_section_recipes, public.catalog_section_products
    in share row exclusive mode;
  for v_item in select * from jsonb_array_elements(coalesce(p_products,'[]')) loop
    if (select count(*) from public.products p where p.scope='site' and p.owner_id is null
      and (p.import_name_key=public.normalize_catalog_name(v_item->>'name')
        or (p.import_swift_key is not null and p.import_swift_key=public.swift_catalog_identity(v_item->>'swift_product_url'))
        or (nullif(btrim(v_item->>'swift_sku'),'') is not null and lower(p.swift_sku)=lower(btrim(v_item->>'swift_sku'))))) > 1
      then raise exception 'ambiguous_product_identity: %',v_item->>'name'; end if;
    if exists(select 1 from public.products p where p.scope='site' and p.owner_id is null
      and p.import_name_key=public.normalize_catalog_name(v_item->>'name')
      and ((p.swift_product_url is not null and nullif(v_item->>'swift_product_url','') is not null and p.import_swift_key is distinct from public.swift_catalog_identity(v_item->>'swift_product_url'))
        or (p.swift_sku is not null and nullif(v_item->>'swift_sku','') is not null and lower(p.swift_sku)<>lower(v_item->>'swift_sku'))))
      then raise exception 'swift_identity_conflict: %',v_item->>'name'; end if;
  end loop;
  for v_item in select * from jsonb_array_elements(coalesce(p_recipes,'[]')) loop
    if coalesce(v_item->>'difficulty','') not in ('Fácil','Médio','Difícil')
      or coalesce((v_item->>'prep_time')::numeric,-1)<0
      or (v_item->>'prep_time')::numeric<>trunc((v_item->>'prep_time')::numeric)
      or coalesce((v_item->>'servings')::numeric,0)<1
      or (v_item->>'servings')::numeric<>trunc((v_item->>'servings')::numeric)
      or jsonb_array_length(coalesce(v_item->'instructions','[]'))=0
      then raise exception 'invalid_recipe_fields: %',v_item->>'name'; end if;
  end loop;
  -- Validate category and product rows before changing anything. Recipe rows
  -- receive the same all-before-mutation validation in the recipe RPC below.
  for v_item in select * from jsonb_array_elements(coalesce(p_categories, '[]'::jsonb)) loop
    if btrim(coalesce(v_item->>'name', '')) = '' or coalesce(v_item->>'type', '') not in ('proteina', 'receita', 'secao') then raise exception 'invalid_category'; end if;
  end loop;
  for v_item in select * from jsonb_array_elements(coalesce(p_products, '[]'::jsonb)) loop
    if btrim(coalesce(v_item->>'name', '')) = '' or coalesce(v_item->>'unit', '') not in ('kg', 'un', 'pacote', 'caixa', 'pote') or (nullif(v_item->>'price', '') is not null and (v_item->>'price')::numeric < 0) or btrim(coalesce(v_item->>'image_url', '')) !~* '^https?://[^[:space:]]+$' then raise exception 'invalid_product: %', v_item->>'name'; end if;
    if nullif(btrim(v_item->>'swift_product_url'), '') is not null and btrim(v_item->>'swift_product_url') !~ '^https://www\.swift\.com\.br/[^?#]+$' then raise exception 'invalid_swift_product_url: %', v_item->>'name'; end if;
    if not exists (select 1 from public.products p where p.scope='site' and p.owner_id is null and p.import_name_key=public.normalize_catalog_name(v_item->>'name')) and nullif(btrim(v_item->>'swift_product_url'), '') is null then raise exception 'swift_url_required: %', v_item->>'name'; end if;
    if exists (select 1 from public.products p where p.scope='site' and p.owner_id is null and p.import_name_key<>public.normalize_catalog_name(v_item->>'name') and (p.import_swift_key=public.swift_catalog_identity(v_item->>'swift_product_url') or (nullif(btrim(v_item->>'swift_sku'), '') is not null and lower(p.swift_sku)=lower(btrim(v_item->>'swift_sku'))))) then raise exception 'swift_identity_conflict: %', v_item->>'name'; end if;
    if not exists (select 1 from public.categories c where c.scope = 'site' and c.owner_id is null and c.type = 'proteina' and (c.slug = public.slugify(v_item->>'category') or c.import_name_key = public.normalize_catalog_name(v_item->>'category')))
       and not exists (select 1 from jsonb_array_elements(coalesce(p_categories, '[]'::jsonb)) x where x->>'type' = 'proteina' and (public.slugify(x->>'name') = public.slugify(v_item->>'category') or public.normalize_catalog_name(x->>'name') = public.normalize_catalog_name(v_item->>'category'))) then raise exception 'category_not_found: %', v_item->>'category'; end if;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(p_categories, '[]'::jsonb)) loop
    select id into v_id from public.categories where scope = 'site' and owner_id is null and type = v_item->>'type' and (slug = public.slugify(v_item->>'name') or import_name_key = public.normalize_catalog_name(v_item->>'name'))
      order by (slug = public.slugify(v_item->>'name')) desc
      limit 1;
    if v_id is not null and v_category_mode = 'add' then v_category_ignored := v_category_ignored + 1;
    else insert into public.categories(scope, owner_id, type, name, slug, active, created_by, updated_by) values ('site', null, v_item->>'type', btrim(v_item->>'name'), public.slugify(v_item->>'name'), true, auth.uid(), auth.uid()); v_category_added := v_category_added + 1; end if;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(p_products, '[]'::jsonb)) loop
    select id into v_category_id from public.categories where scope = 'site' and owner_id is null and type = 'proteina' and (slug = public.slugify(v_item->>'category') or import_name_key = public.normalize_catalog_name(v_item->>'category')) order by (slug = public.slugify(v_item->>'category')) desc limit 1;
    if v_category_id is null then raise exception 'active_category_not_found: %', v_item->>'category'; end if;
    select id into v_id from public.products where scope = 'site' and owner_id is null and import_name_key = public.normalize_catalog_name(v_item->>'name') limit 1;
    if v_id is not null and v_product_mode = 'add' then v_product_ignored := v_product_ignored + 1;
    else insert into public.products(scope, owner_id, name, category_id, unit, price, image_url, swift_product_url, swift_sku, price_status, active, created_by, updated_by) values ('site', null, btrim(v_item->>'name'), v_category_id, v_item->>'unit', 0, btrim(v_item->>'image_url'), nullif(btrim(v_item->>'swift_product_url'), ''), null, 'STALE'::public.product_price_status, true, auth.uid(), auth.uid()); v_product_added := v_product_added + 1; end if;
  end loop;

  -- Native spreadsheet tags are application vocabulary. Restore their
  -- backing rows even when Categorias is omitted (or replace_all disabled
  -- them), then let the recipe importer resolve the stable native slugs.
  -- Normalized recipes have no legacy section tags. Never reactivate vocabulary.
  select public.admin_import_public_recipes('add',coalesce(jsonb_agg(x),'[]')) into v_recipe_result
    from jsonb_array_elements(coalesce(p_recipes,'[]')) x
    where not exists(select 1 from public.recipes r where r.scope='site' and r.owner_id is null
      and r.import_name_key=public.normalize_catalog_name(x->>'name'));
  v_recipe_result := jsonb_set(v_recipe_result,'{ignored}',to_jsonb(
    jsonb_array_length(coalesce(p_recipes,'[]'))-(v_recipe_result->>'added')::int));
  return jsonb_build_object(
    'categories', jsonb_build_object('added', v_category_added, 'replaced', v_category_replaced, 'ignored', v_category_ignored, 'removed', v_category_removed),
    'products', jsonb_build_object('added', v_product_added, 'replaced', v_product_replaced, 'ignored', v_product_ignored, 'removed', v_product_removed),
    'recipes', v_recipe_result);
end;
$$;

create or replace function public.admin_add_public_catalog(
  p_categories jsonb, p_products jsonb, p_recipes jsonb,
  p_sections jsonb, p_recipe_section_links jsonb, p_product_section_links jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  p_modes constant jsonb := '{"categories":"add","products":"add","recipes":"add","sections":"add","recipeSections":"add","productSections":"add"}';
  v_aliases jsonb := '{}'; v_names text[];
  v_row jsonb; v_core jsonb; v_page_id uuid; v_section_id uuid; v_item_id uuid;
  v_mode text; v_sections jsonb := coalesce(p_sections,'[]'::jsonb);
  v_recipe_links jsonb := coalesce(p_recipe_section_links,'[]'::jsonb);
  v_product_links jsonb := coalesce(p_product_section_links,'[]'::jsonb);
  sa int:=0; sr int:=0; si int:=0; sd int:=0; ra int:=0; rr int:=0; ri int:=0; rd int:=0; pa int:=0; pr int:=0; pi int:=0; pd int:=0;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'not_authorized' using errcode='42501'; end if;
  if jsonb_typeof(coalesce(p_categories,'[]'))<>'array' or jsonb_typeof(coalesce(p_products,'[]'))<>'array' or jsonb_typeof(coalesce(p_recipes,'[]'))<>'array' or jsonb_typeof(v_sections)<>'array' or jsonb_typeof(v_recipe_links)<>'array' or jsonb_typeof(v_product_links)<>'array' then raise exception 'invalid_import_payload'; end if;
  if exists(select 1 from jsonb_array_elements(coalesce(p_categories,'[]')) x where x->>'type' not in ('receita','proteina')) or exists(select 1 from jsonb_array_elements(coalesce(p_recipes,'[]')) x where coalesce(x->'sections','[]') <> '[]'::jsonb) then raise exception 'legacy_import_format_not_supported'; end if;
  foreach v_mode in array array[coalesce(p_modes->>'categories','add'),coalesce(p_modes->>'products','add'),coalesce(p_modes->>'recipes','add'),coalesce(p_modes->>'sections','add'),coalesce(p_modes->>'recipeSections','add'),coalesce(p_modes->>'productSections','add')] loop if v_mode not in ('add','upsert','replace_all') then raise exception 'invalid_import_mode: %',v_mode; end if; end loop;
  lock table public.categories, public.products, public.recipes, public.catalog_sections, public.catalog_section_recipes, public.catalog_section_products in share row exclusive mode;
  if jsonb_array_length(coalesce(p_categories,'[]'))+jsonb_array_length(coalesce(p_products,'[]'))+jsonb_array_length(coalesce(p_recipes,'[]'))+jsonb_array_length(v_sections)+jsonb_array_length(v_recipe_links)+jsonb_array_length(v_product_links)>5000 then raise exception 'import_limit_exceeded'; end if;
  -- Resolve a single stable URL/SKU match to its existing editorial name.
  -- Split identities remain conflicts; aliases never rewrite existing rows.
  for v_row in select * from jsonb_array_elements(coalesce(p_products,'[]')) loop
    select array_agg(p.name) into v_names from public.products p where p.scope='site' and p.owner_id is null
      and (p.import_name_key=public.normalize_catalog_name(v_row->>'name')
        or (p.import_swift_key is not null and p.import_swift_key=public.swift_catalog_identity(v_row->>'swift_product_url'))
        or (nullif(btrim(v_row->>'swift_sku'),'') is not null and lower(p.swift_sku)=lower(btrim(v_row->>'swift_sku'))));
    if cardinality(v_names)>1 then raise exception 'ambiguous_product_identity: %',v_row->>'name'; end if;
    if cardinality(v_names)=1 then v_aliases:=v_aliases||jsonb_build_object(public.normalize_catalog_name(v_row->>'name'),v_names[1]); end if;
  end loop;
  select coalesce(jsonb_agg(x||jsonb_build_object('name',coalesce(v_aliases->>public.normalize_catalog_name(x->>'name'),x->>'name'))),'[]') into p_products from jsonb_array_elements(coalesce(p_products,'[]')) x;
  select coalesce(jsonb_agg(x||jsonb_build_object('ingredients',coalesce((select jsonb_agg(i||jsonb_build_object('product',coalesce(v_aliases->>public.normalize_catalog_name(i->>'product'),i->>'product'))) from jsonb_array_elements(coalesce(x->'ingredients','[]')) i),'[]'::jsonb))),'[]') into p_recipes from jsonb_array_elements(coalesce(p_recipes,'[]')) x;
  select coalesce(jsonb_agg(x||jsonb_build_object('product',coalesce(v_aliases->>public.normalize_catalog_name(x->>'product'),x->>'product'))),'[]') into v_product_links from jsonb_array_elements(v_product_links) x;
  -- Full preflight: page, composite section identity, entity reference and duplicate link checks.
  if exists(select 1 from jsonb_array_elements(v_sections) x where x->>'page' not in ('home','recipes','products') or btrim(coalesce(x->>'name',''))='' or (x->>'sort_order')::int<0) then raise exception 'invalid_section'; end if;
  if exists(select 1 from jsonb_array_elements(v_sections) x group by x->>'page',public.slugify(x->>'name') having count(*)>1) then raise exception 'duplicate_section_in_payload'; end if;
  for v_row in select * from jsonb_array_elements(v_recipe_links) loop
    if jsonb_typeof(v_row) <> 'object' then raise exception 'invalid_recipe_section_link'; end if;
    if nullif(btrim(v_row->>'recipe'),'') is null then raise exception 'recipe_reference_missing'; end if;
    if nullif(btrim(v_row->>'section'),'') is null or coalesce(jsonb_typeof(v_row->'sort_order'),'null') <> 'number' or (v_row->>'sort_order')::numeric <> trunc((v_row->>'sort_order')::numeric) or (v_row->>'sort_order')::numeric < 0 then raise exception 'invalid_recipe_section_link'; end if;
    if coalesce(v_row->>'page','') not in ('home','recipes') then raise exception 'invalid_recipe_section_page: %',v_row->>'page'; end if;
    if not exists(select 1 from public.catalog_sections s join public.catalog_pages p on p.id=s.page_id where p.key=v_row->>'page' and s.slug=public.slugify(v_row->>'section')) and not exists(select 1 from jsonb_array_elements(v_sections) x where x->>'page'=v_row->>'page' and public.slugify(x->>'name')=public.slugify(v_row->>'section')) then raise exception 'section_not_found: %/%',v_row->>'page',v_row->>'section'; end if;
    if not exists(select 1 from public.recipes r where r.scope='site' and r.owner_id is null and r.import_name_key=public.normalize_catalog_name(v_row->>'recipe')) and not exists(select 1 from jsonb_array_elements(coalesce(p_recipes,'[]')) x where public.normalize_catalog_name(x->>'name')=public.normalize_catalog_name(v_row->>'recipe')) then raise exception 'recipe_not_found: %',v_row->>'recipe'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(v_recipe_links) x group by x->>'page',public.slugify(x->>'section'),public.normalize_catalog_name(x->>'recipe') having count(*)>1) then raise exception 'duplicate_recipe_section_link'; end if;
  for v_row in select * from jsonb_array_elements(v_product_links) loop
    if jsonb_typeof(v_row) <> 'object' then raise exception 'invalid_product_section_link'; end if;
    if nullif(btrim(v_row->>'product'),'') is null then raise exception 'product_reference_missing'; end if;
    if nullif(btrim(v_row->>'section'),'') is null or coalesce(jsonb_typeof(v_row->'sort_order'),'null') <> 'number' or (v_row->>'sort_order')::numeric <> trunc((v_row->>'sort_order')::numeric) or (v_row->>'sort_order')::numeric < 0 then raise exception 'invalid_product_section_link'; end if;
    if coalesce(v_row->>'page','')<>'products' then raise exception 'invalid_product_section_page: %',v_row->>'page'; end if;
    if not exists(select 1 from public.catalog_sections s join public.catalog_pages p on p.id=s.page_id where p.key='products' and s.slug=public.slugify(v_row->>'section')) and not exists(select 1 from jsonb_array_elements(v_sections) x where x->>'page'='products' and public.slugify(x->>'name')=public.slugify(v_row->>'section')) then raise exception 'section_not_found: products/%',v_row->>'section'; end if;
    if not exists(select 1 from public.products q where q.scope='site' and q.owner_id is null and public.normalize_catalog_name(q.name)=public.normalize_catalog_name(v_row->>'product')) and not exists(select 1 from jsonb_array_elements(coalesce(p_products,'[]')) x where public.normalize_catalog_name(x->>'name')=public.normalize_catalog_name(v_row->>'product')) then raise exception 'product_not_found: %',v_row->>'product'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(v_product_links) x group by public.slugify(x->>'section'),public.normalize_catalog_name(x->>'product') having count(*)>1) then raise exception 'duplicate_product_section_link'; end if;

  -- Reuse the proven Swift/taxonomy/recipe importer; section arrays are empty,
  -- so it creates no visual-position associations in legacy category tables.
  select public.admin_add_catalog_entities(p_categories,p_products,p_recipes) into v_core;

  for v_row in select * from jsonb_array_elements(v_sections) loop
    select id into v_page_id from public.catalog_pages where key=v_row->>'page';
    select id into v_section_id from public.catalog_sections where page_id=v_page_id and slug=public.slugify(v_row->>'name');
    if v_section_id is null then insert into public.catalog_sections(page_id,name,slug,sort_order,active) values(v_page_id,btrim(v_row->>'name'),public.slugify(v_row->>'name'),(v_row->>'sort_order')::int,(v_row->>'active')::boolean) returning id into v_section_id;sa:=sa+1;
    elsif coalesce(p_modes->>'sections','add')='add' then si:=si+1;
    end if;
  end loop;
  for v_row in select * from jsonb_array_elements(v_recipe_links) loop select s.id into v_section_id from public.catalog_sections s join public.catalog_pages p on p.id=s.page_id where p.key=v_row->>'page' and s.slug=public.slugify(v_row->>'section');select id into v_item_id from public.recipes where scope='site' and owner_id is null and import_name_key=public.normalize_catalog_name(v_row->>'recipe') limit 1;if exists(select 1 from public.catalog_section_recipes where section_id=v_section_id and recipe_id=v_item_id) then if coalesce(p_modes->>'recipeSections','add')='add' then ri:=ri+1;end if;else insert into public.catalog_section_recipes values(v_section_id,v_item_id,(v_row->>'sort_order')::int);ra:=ra+1;end if;end loop;
  for v_row in select * from jsonb_array_elements(v_product_links) loop select s.id into v_section_id from public.catalog_sections s join public.catalog_pages p on p.id=s.page_id where p.key='products' and s.slug=public.slugify(v_row->>'section');select id into v_item_id from public.products where scope='site' and owner_id is null and import_name_key=public.normalize_catalog_name(v_row->>'product') limit 1;if exists(select 1 from public.catalog_section_products where section_id=v_section_id and product_id=v_item_id) then if coalesce(p_modes->>'productSections','add')='add' then pi:=pi+1;end if;else insert into public.catalog_section_products values(v_section_id,v_item_id,(v_row->>'sort_order')::int);pa:=pa+1;end if;end loop;
  return v_core||jsonb_build_object('sections',jsonb_build_object('added',sa,'replaced',sr,'ignored',si,'removed',sd),'recipe_sections',jsonb_build_object('added',ra,'replaced',rr,'ignored',ri,'removed',rd),'product_sections',jsonb_build_object('added',pa,'replaced',pr,'ignored',pi,'removed',pd));
end $$;

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
        (p.import_name_key=public.normalize_catalog_name(row_data->>'name')
        or (p.import_swift_key is not null and p.import_swift_key=public.swift_catalog_identity(row_data->>'swift_product_url'))
        or (nullif(row_data->>'swift_sku','') is not null and lower(p.swift_sku)=lower(row_data->>'swift_sku')));
      select to_jsonb(p) into original from public.products p where p.id=target and p.scope='site' and p.owner_id is null;
    elsif entity='recipes' then
      select array_agg(r.id) into ids from public.recipes r where r.scope='site' and r.owner_id is null
        and r.import_name_key=public.normalize_catalog_name(row_data->>'name');
      select to_jsonb(r) into original from public.recipes r where r.id=target and r.scope='site' and r.owner_id is null;
    elsif entity='categories' then
      select array_agg(c.id) into ids from public.categories c where c.scope='site' and c.owner_id is null
        and c.type=row_data->>'type' and (c.slug=public.slugify(row_data->>'name') or c.import_name_key=public.normalize_catalog_name(row_data->>'name'));
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
      (p.import_name_key=public.normalize_catalog_name(row_data->>'name')
      or (p.import_swift_key is not null and p.import_swift_key=public.swift_catalog_identity(row_data->>'swift_product_url'))
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
        and (c.slug=public.slugify(row_data->>'category') or c.import_name_key=public.normalize_catalog_name(row_data->>'category'));
      if cat is null then raise exception 'category_not_found'; end if;
      -- Price, verified SKU/source and active state are not spreadsheet-owned.
      update public.products set name=btrim(row_data->>'name'), category_id=cat,
        unit=row_data->>'unit',image_url=row_data->>'image_url' where id=target;
    elsif entity='recipes' then
      select c.id into cat from public.categories c where c.scope='site' and c.owner_id is null and c.type='receita' and c.active
        and (c.slug=public.slugify(row_data->>'category') or c.import_name_key=public.normalize_catalog_name(row_data->>'category'));
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
          select p.id into product from public.products p where p.scope='site' and p.owner_id is null and p.active and p.import_name_key=public.normalize_catalog_name(ingredient->>'product');
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

analyze public.categories; analyze public.products; analyze public.recipes;
notify pgrst, 'reload schema';
