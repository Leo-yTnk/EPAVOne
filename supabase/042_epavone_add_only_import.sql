-- 042: additive import only. Apply once after diagnosing hosted state; no data backfill.
create or replace function public.swift_catalog_identity(p_url text)
returns text language sql immutable set search_path='' as $$
  select nullif(regexp_replace(regexp_replace(regexp_replace(regexp_replace(lower(btrim(p_url)),
    '^https://(www\.)?swift\.com\.br/', '/'), '[?#].*$', ''), '^/detail/', '/'),
    '/p/?$|/+$', '', 'g'), '');
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
      and (public.normalize_catalog_name(p.name)=public.normalize_catalog_name(v_item->>'name')
        or (public.swift_catalog_identity(p.swift_product_url) is not null and public.swift_catalog_identity(p.swift_product_url)=public.swift_catalog_identity(v_item->>'swift_product_url'))
        or (nullif(btrim(v_item->>'swift_sku'),'') is not null and lower(p.swift_sku)=lower(btrim(v_item->>'swift_sku'))))) > 1
      then raise exception 'ambiguous_product_identity: %',v_item->>'name'; end if;
    if exists(select 1 from public.products p where p.scope='site' and p.owner_id is null
      and public.normalize_catalog_name(p.name)=public.normalize_catalog_name(v_item->>'name')
      and ((p.swift_product_url is not null and nullif(v_item->>'swift_product_url','') is not null and public.swift_catalog_identity(p.swift_product_url) is distinct from public.swift_catalog_identity(v_item->>'swift_product_url'))
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
    if not exists (select 1 from public.products p where p.scope='site' and p.owner_id is null and public.normalize_catalog_name(p.name)=public.normalize_catalog_name(v_item->>'name')) and nullif(btrim(v_item->>'swift_product_url'), '') is null then raise exception 'swift_url_required: %', v_item->>'name'; end if;
    if exists (select 1 from public.products p where p.scope='site' and p.owner_id is null and public.normalize_catalog_name(p.name)<>public.normalize_catalog_name(v_item->>'name') and (public.swift_catalog_identity(p.swift_product_url)=public.swift_catalog_identity(v_item->>'swift_product_url') or (nullif(btrim(v_item->>'swift_sku'), '') is not null and lower(p.swift_sku)=lower(btrim(v_item->>'swift_sku'))))) then raise exception 'swift_identity_conflict: %', v_item->>'name'; end if;
    if not exists (select 1 from public.categories c where c.scope = 'site' and c.owner_id is null and c.type = 'proteina' and (c.slug = public.slugify(v_item->>'category') or public.normalize_catalog_name(c.name) = public.normalize_catalog_name(v_item->>'category')))
       and not exists (select 1 from jsonb_array_elements(coalesce(p_categories, '[]'::jsonb)) x where x->>'type' = 'proteina' and (public.slugify(x->>'name') = public.slugify(v_item->>'category') or public.normalize_catalog_name(x->>'name') = public.normalize_catalog_name(v_item->>'category'))) then raise exception 'category_not_found: %', v_item->>'category'; end if;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(p_categories, '[]'::jsonb)) loop
    select id into v_id from public.categories where scope = 'site' and owner_id is null and type = v_item->>'type' and (slug = public.slugify(v_item->>'name') or public.normalize_catalog_name(name) = public.normalize_catalog_name(v_item->>'name'))
      order by (slug = public.slugify(v_item->>'name')) desc
      limit 1;
    if v_id is not null and v_category_mode = 'add' then v_category_ignored := v_category_ignored + 1;
    else insert into public.categories(scope, owner_id, type, name, slug, active, created_by, updated_by) values ('site', null, v_item->>'type', btrim(v_item->>'name'), public.slugify(v_item->>'name'), true, auth.uid(), auth.uid()); v_category_added := v_category_added + 1; end if;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(p_products, '[]'::jsonb)) loop
    select id into v_category_id from public.categories where scope = 'site' and owner_id is null and type = 'proteina' and (slug = public.slugify(v_item->>'category') or public.normalize_catalog_name(name) = public.normalize_catalog_name(v_item->>'category')) order by (slug = public.slugify(v_item->>'category')) desc limit 1;
    if v_category_id is null then raise exception 'active_category_not_found: %', v_item->>'category'; end if;
    select id into v_id from public.products where scope = 'site' and owner_id is null and public.normalize_catalog_name(name) = public.normalize_catalog_name(v_item->>'name') limit 1;
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
      and public.normalize_catalog_name(r.name)=public.normalize_catalog_name(x->>'name'));
  v_recipe_result := jsonb_set(v_recipe_result,'{ignored}',to_jsonb(
    jsonb_array_length(coalesce(p_recipes,'[]'))-(v_recipe_result->>'added')::int));
  return jsonb_build_object(
    'categories', jsonb_build_object('added', v_category_added, 'replaced', v_category_replaced, 'ignored', v_category_ignored, 'removed', v_category_removed),
    'products', jsonb_build_object('added', v_product_added, 'replaced', v_product_replaced, 'ignored', v_product_ignored, 'removed', v_product_removed),
    'recipes', v_recipe_result);
end;
$$;
revoke execute on function public.admin_add_catalog_entities(jsonb, jsonb, jsonb) from public, anon;
revoke execute on function public.admin_add_catalog_entities(jsonb, jsonb, jsonb) from authenticated;


-- Six-sheet contract reused with server-owned, fixed add modes.
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
      and (public.normalize_catalog_name(p.name)=public.normalize_catalog_name(v_row->>'name')
        or (public.swift_catalog_identity(p.swift_product_url) is not null and public.swift_catalog_identity(p.swift_product_url)=public.swift_catalog_identity(v_row->>'swift_product_url'))
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
    if not exists(select 1 from public.recipes r where r.scope='site' and r.owner_id is null and public.normalize_catalog_name(r.name)=public.normalize_catalog_name(v_row->>'recipe')) and not exists(select 1 from jsonb_array_elements(coalesce(p_recipes,'[]')) x where public.normalize_catalog_name(x->>'name')=public.normalize_catalog_name(v_row->>'recipe')) then raise exception 'recipe_not_found: %',v_row->>'recipe'; end if;
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
  for v_row in select * from jsonb_array_elements(v_recipe_links) loop select s.id into v_section_id from public.catalog_sections s join public.catalog_pages p on p.id=s.page_id where p.key=v_row->>'page' and s.slug=public.slugify(v_row->>'section');select id into v_item_id from public.recipes where scope='site' and owner_id is null and public.normalize_catalog_name(name)=public.normalize_catalog_name(v_row->>'recipe') limit 1;if exists(select 1 from public.catalog_section_recipes where section_id=v_section_id and recipe_id=v_item_id) then if coalesce(p_modes->>'recipeSections','add')='add' then ri:=ri+1;end if;else insert into public.catalog_section_recipes values(v_section_id,v_item_id,(v_row->>'sort_order')::int);ra:=ra+1;end if;end loop;
  for v_row in select * from jsonb_array_elements(v_product_links) loop select s.id into v_section_id from public.catalog_sections s join public.catalog_pages p on p.id=s.page_id where p.key='products' and s.slug=public.slugify(v_row->>'section');select id into v_item_id from public.products where scope='site' and owner_id is null and public.normalize_catalog_name(name)=public.normalize_catalog_name(v_row->>'product') limit 1;if exists(select 1 from public.catalog_section_products where section_id=v_section_id and product_id=v_item_id) then if coalesce(p_modes->>'productSections','add')='add' then pi:=pi+1;end if;else insert into public.catalog_section_products values(v_section_id,v_item_id,(v_row->>'sort_order')::int);pa:=pa+1;end if;end loop;
  return v_core||jsonb_build_object('sections',jsonb_build_object('added',sa,'replaced',sr,'ignored',si,'removed',sd),'recipe_sections',jsonb_build_object('added',ra,'replaced',rr,'ignored',ri,'removed',rd),'product_sections',jsonb_build_object('added',pa,'replaced',pr,'ignored',pi,'removed',pd));
end $$;
revoke execute on function public.admin_add_public_catalog(jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.admin_add_public_catalog(jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) to authenticated;
