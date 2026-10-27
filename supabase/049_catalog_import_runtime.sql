-- 049: follow-up to 047 after hosted imports still exceeded the API budget.
-- Depends on 047/048. No content backfill, no role/global timeout changes.
-- Keep the full six-sheet transaction, admin authorization and duplicate choices.
-- Sources: https://supabase.com/docs/guides/database/postgres/timeouts
-- https://postgrest.org/en/stable/references/transactions.html#hoisted-function-settings
create or replace function public.admin_add_public_catalog(
  p_categories jsonb, p_products jsonb, p_recipes jsonb,
  p_sections jsonb, p_recipe_section_links jsonb, p_product_section_links jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  p_modes constant jsonb := '{"categories":"add","products":"add","recipes":"add","sections":"add","recipeSections":"add","productSections":"add"}';
  v_aliases jsonb := '{}'; v_names text[];
  v_import_recipe_names jsonb; v_import_product_names jsonb; v_import_section_names jsonb;
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
  -- Build payload lookup sets once. Do not normalize/rescan every imported
  -- recipe for each section link (quadratic work on six-sheet workbooks).
  select coalesce(jsonb_object_agg(public.normalize_catalog_name(x->>'name'),true),'{}')
    into v_import_recipe_names from jsonb_array_elements(coalesce(p_recipes,'[]')) x;
  select coalesce(jsonb_object_agg(public.normalize_catalog_name(x->>'name'),true),'{}')
    into v_import_product_names from jsonb_array_elements(coalesce(p_products,'[]')) x;
  select coalesce(jsonb_object_agg(coalesce(x->>'page','')||'/'||coalesce(public.slugify(x->>'name'),''),true),'{}')
    into v_import_section_names from jsonb_array_elements(v_sections) x;
  -- Full preflight: page, composite section identity, entity reference and duplicate link checks.
  if exists(select 1 from jsonb_array_elements(v_sections) x where x->>'page' not in ('home','recipes','products') or btrim(coalesce(x->>'name',''))='' or (x->>'sort_order')::int<0) then raise exception 'invalid_section'; end if;
  if exists(select 1 from jsonb_array_elements(v_sections) x group by x->>'page',public.slugify(x->>'name') having count(*)>1) then raise exception 'duplicate_section_in_payload'; end if;
  for v_row in select * from jsonb_array_elements(v_recipe_links) loop
    if jsonb_typeof(v_row) <> 'object' then raise exception 'invalid_recipe_section_link'; end if;
    if nullif(btrim(v_row->>'recipe'),'') is null then raise exception 'recipe_reference_missing'; end if;
    if nullif(btrim(v_row->>'section'),'') is null or coalesce(jsonb_typeof(v_row->'sort_order'),'null') <> 'number' or (v_row->>'sort_order')::numeric <> trunc((v_row->>'sort_order')::numeric) or (v_row->>'sort_order')::numeric < 0 then raise exception 'invalid_recipe_section_link'; end if;
    if coalesce(v_row->>'page','') not in ('home','recipes') then raise exception 'invalid_recipe_section_page: %',v_row->>'page'; end if;
    if not exists(select 1 from public.catalog_sections s join public.catalog_pages p on p.id=s.page_id where p.key=v_row->>'page' and s.slug=public.slugify(v_row->>'section')) and not (v_import_section_names ? ((v_row->>'page')||'/'||public.slugify(v_row->>'section'))) then raise exception 'section_not_found: %/%',v_row->>'page',v_row->>'section'; end if;
    if not exists(select 1 from public.recipes r where r.scope='site' and r.owner_id is null and r.import_name_key=public.normalize_catalog_name(v_row->>'recipe')) and not (v_import_recipe_names ? public.normalize_catalog_name(v_row->>'recipe')) then raise exception 'recipe_not_found: %',v_row->>'recipe'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(v_recipe_links) x group by x->>'page',public.slugify(x->>'section'),public.normalize_catalog_name(x->>'recipe') having count(*)>1) then raise exception 'duplicate_recipe_section_link'; end if;
  for v_row in select * from jsonb_array_elements(v_product_links) loop
    if jsonb_typeof(v_row) <> 'object' then raise exception 'invalid_product_section_link'; end if;
    if nullif(btrim(v_row->>'product'),'') is null then raise exception 'product_reference_missing'; end if;
    if nullif(btrim(v_row->>'section'),'') is null or coalesce(jsonb_typeof(v_row->'sort_order'),'null') <> 'number' or (v_row->>'sort_order')::numeric <> trunc((v_row->>'sort_order')::numeric) or (v_row->>'sort_order')::numeric < 0 then raise exception 'invalid_product_section_link'; end if;
    if coalesce(v_row->>'page','')<>'products' then raise exception 'invalid_product_section_page: %',v_row->>'page'; end if;
    if not exists(select 1 from public.catalog_sections s join public.catalog_pages p on p.id=s.page_id where p.key='products' and s.slug=public.slugify(v_row->>'section')) and not (v_import_section_names ? ('products/'||public.slugify(v_row->>'section'))) then raise exception 'section_not_found: products/%',v_row->>'section'; end if;
    if not exists(select 1 from public.products q where q.scope='site' and q.owner_id is null and q.import_name_key=public.normalize_catalog_name(v_row->>'product')) and not (v_import_product_names ? public.normalize_catalog_name(v_row->>'product')) then raise exception 'product_not_found: %',v_row->>'product'; end if;
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
  -- Insert relationships as sets, retaining existing positions on repetition.
  -- LATERAL LIMIT 1 preserves the previous identity resolution behavior.
  -- Left joins deliberately allow missing targets to fail NOT NULL/FK checks.
  insert into public.catalog_section_recipes(section_id,recipe_id,sort_order)
    select section.id,recipe.id,(x->>'sort_order')::int
    from jsonb_array_elements(v_recipe_links) x
    left join public.catalog_pages page on page.key=x->>'page'
    left join public.catalog_sections section on section.page_id=page.id and section.slug=public.slugify(x->>'section')
    left join lateral (select r.id from public.recipes r where r.scope='site' and r.owner_id is null
      and r.import_name_key=public.normalize_catalog_name(x->>'recipe') limit 1) recipe on true
    on conflict(section_id,recipe_id) do nothing;
  get diagnostics ra=row_count;
  ri:=jsonb_array_length(v_recipe_links)-ra;
  insert into public.catalog_section_products(section_id,product_id,sort_order)
    select section.id,product.id,(x->>'sort_order')::int
    from jsonb_array_elements(v_product_links) x
    left join public.catalog_pages page on page.key='products'
    left join public.catalog_sections section on section.page_id=page.id and section.slug=public.slugify(x->>'section')
    left join lateral (select p.id from public.products p where p.scope='site' and p.owner_id is null
      and p.import_name_key=public.normalize_catalog_name(x->>'product') limit 1) product on true
    on conflict(section_id,product_id) do nothing;
  get diagnostics pa=row_count;
  pi:=jsonb_array_length(v_product_links)-pa;
  return v_core||jsonb_build_object('sections',jsonb_build_object('added',sa,'replaced',sr,'ignored',si,'removed',sd),'recipe_sections',jsonb_build_object('added',ra,'replaced',rr,'ignored',ri,'removed',rd),'product_sections',jsonb_build_object('added',pa,'replaced',pr,'ignored',pi,'removed',pd));
end $$;
-- PostgREST reads these function settings before executing the RPC statement.
-- SET LOCAL inside an already running function cannot extend that active timer.
-- 55 seconds stays below the documented 60-second Data API ceiling.
alter function public.admin_add_public_catalog(jsonb,jsonb,jsonb,jsonb,jsonb,jsonb)
  set statement_timeout='55s';
alter function public.admin_add_public_catalog(jsonb,jsonb,jsonb,jsonb,jsonb,jsonb)
  set lock_timeout='3s';
alter function public.admin_import_reviewed_catalog(jsonb,jsonb)
  set statement_timeout='55s';
alter function public.admin_import_reviewed_catalog(jsonb,jsonb)
  set lock_timeout='3s';
-- Reassert current entry-point permissions; internal writers stay unchanged.
revoke execute on function public.admin_add_public_catalog(jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.admin_add_public_catalog(jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) to authenticated;
notify pgrst,'reload schema';
notify pgrst,'reload config';
