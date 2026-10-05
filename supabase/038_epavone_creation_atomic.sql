-- EPAVOne creation editor. Apply only after inspecting diagnostic.sql.
-- Additive: no catalog rows, users, policies or existing functions are replaced.
-- Invoker functions retain the existing RLS and integrity triggers.
begin;
create or replace function public.save_creation_recipe(
  p_id uuid, p_scope text, p_expected_version integer, p_fields jsonb,
  p_ingredients jsonb, p_sections uuid[]
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_recipe public.recipes%rowtype;
  v_id uuid;
  v_owner uuid := auth.uid();
  v_status text;
begin
  if v_owner is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_scope is null or p_scope not in ('personal','site') then raise exception 'invalid_scope'; end if;
  if p_scope = 'site' and not public.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  if jsonb_typeof(p_fields) is distinct from 'object' or jsonb_typeof(p_ingredients) is distinct from 'array' then raise exception 'invalid_payload'; end if;
  if length(btrim(coalesce(p_fields->>'name',''))) not between 1 and 120 then raise exception 'invalid_name'; end if;
  v_status := case when p_scope='personal' then 'private' else coalesce(p_fields->>'status','draft') end;
  if p_scope='site' and v_status not in ('draft','published','archived') then raise exception 'invalid_status'; end if;
  if p_id is not null then
    select * into v_recipe from public.recipes where id=p_id for update;
    if not found or v_recipe.scope is distinct from p_scope or (p_scope='personal' and v_recipe.owner_id is distinct from v_owner) then raise exception 'not_found_or_not_owned' using errcode='42501'; end if;
    if p_expected_version is null or v_recipe.version is distinct from p_expected_version then raise exception 'version_conflict: O item mudou. Reabra o editor antes de salvar.'; end if;
    update public.recipes set name=btrim(p_fields->>'name'),category_id=(p_fields->>'category_id')::uuid,
      prep_time=(p_fields->>'prep_time')::integer,servings=(p_fields->>'servings')::integer,
      difficulty=p_fields->>'difficulty',image_url=nullif(p_fields->>'image_url',''),
      featured=case when p_scope='site' then coalesce((p_fields->>'featured')::boolean,false) else featured end,
      status=v_status,
      instructions=array(select jsonb_array_elements_text(coalesce(p_fields->'instructions','[]'::jsonb))),
      extras=array(select jsonb_array_elements_text(coalesce(p_fields->'extras','[]'::jsonb))),
      tips=array(select jsonb_array_elements_text(coalesce(p_fields->'tips','[]'::jsonb)))
      where id=p_id returning id into v_id;
  else
    insert into public.recipes(scope,owner_id,status,name,category_id,prep_time,servings,difficulty,image_url,featured,instructions,extras,tips)
    values(p_scope,case when p_scope='personal' then v_owner else null end,case when v_status='archived' then 'draft' else v_status end,
      btrim(p_fields->>'name'),(p_fields->>'category_id')::uuid,(p_fields->>'prep_time')::integer,(p_fields->>'servings')::integer,
      p_fields->>'difficulty',nullif(p_fields->>'image_url',''),case when p_scope='site' then coalesce((p_fields->>'featured')::boolean,false) else false end,
      array(select jsonb_array_elements_text(coalesce(p_fields->'instructions','[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(p_fields->'extras','[]'::jsonb))),
      array(select jsonb_array_elements_text(coalesce(p_fields->'tips','[]'::jsonb)))) returning id into v_id;
    if v_status='archived' then update public.recipes set status=v_status where id=v_id; end if;
  end if;
  if v_id is null then raise exception 'write_not_allowed' using errcode='42501'; end if;
  delete from public.recipe_ingredients where recipe_id=v_id;
  insert into public.recipe_ingredients(recipe_id,product_id,quantity,sort_order)
    select v_id,(x.value->>'product_id')::uuid,(x.value->>'quantity')::numeric,(x.ordinality-1)::integer
    from jsonb_array_elements(p_ingredients) with ordinality x;
  delete from public.recipe_categories where recipe_id=v_id;
  insert into public.recipe_categories(recipe_id,category_id,sort_order)
    select v_id,x.id,(x.ordinality-1)::integer from unnest(coalesce(p_sections,'{}')) with ordinality x(id,ordinality);
  select * into v_recipe from public.recipes where id=v_id;
  return to_jsonb(v_recipe);
end $$;

create or replace function public.save_creation_product(
  p_id uuid, p_scope text, p_expected_version integer, p_fields jsonb, p_sections uuid[]
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_product public.products%rowtype; v_id uuid; v_owner uuid := auth.uid();
begin
  if v_owner is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if p_scope is null or p_scope not in ('personal','site') then raise exception 'invalid_scope'; end if;
  if p_scope='site' and not public.is_admin() then raise exception 'not_admin' using errcode='42501'; end if;
  if jsonb_typeof(p_fields) is distinct from 'object' then raise exception 'invalid_payload'; end if;
  if length(btrim(coalesce(p_fields->>'name',''))) not between 1 and 120 then raise exception 'invalid_name'; end if;
  if p_id is not null then
    select * into v_product from public.products where id=p_id for update;
    if not found or v_product.scope is distinct from p_scope or (p_scope='personal' and v_product.owner_id is distinct from v_owner) then raise exception 'not_found_or_not_owned' using errcode='42501'; end if;
    if p_expected_version is null or v_product.version is distinct from p_expected_version then raise exception 'version_conflict: O item mudou. Reabra o editor antes de salvar.'; end if;
  end if;
  if p_scope='site' then
    -- Reuse the existing Swift-aware atomic writer; it independently verifies admin.
    select * into v_product from public.save_site_product_atomic(p_id,p_fields,p_sections);
    return to_jsonb(v_product);
  end if;
  if p_id is null then
    insert into public.products(scope,owner_id,name,category_id,unit,price,image_url,active)
    values('personal',v_owner,btrim(p_fields->>'name'),(p_fields->>'category_id')::uuid,p_fields->>'unit',
      (p_fields->>'price')::numeric,nullif(p_fields->>'image_url',''),coalesce((p_fields->>'active')::boolean,true)) returning id into v_id;
  else
    update public.products set name=btrim(p_fields->>'name'),category_id=(p_fields->>'category_id')::uuid,
      unit=p_fields->>'unit',price=(p_fields->>'price')::numeric,image_url=nullif(p_fields->>'image_url',''),active=coalesce((p_fields->>'active')::boolean,true)
      where id=p_id returning id into v_id;
  end if;
  if v_id is null then raise exception 'write_not_allowed' using errcode='42501'; end if;
  delete from public.product_categories where product_id=v_id;
  insert into public.product_categories(product_id,category_id,sort_order)
    select v_id,x.id,(x.ordinality-1)::integer from unnest(coalesce(p_sections,'{}')) with ordinality x(id,ordinality);
  select * into v_product from public.products where id=v_id;
  return to_jsonb(v_product);
end $$;
revoke all on function public.save_creation_recipe(uuid,text,integer,jsonb,jsonb,uuid[]) from public,anon;
revoke all on function public.save_creation_product(uuid,text,integer,jsonb,uuid[]) from public,anon;
grant execute on function public.save_creation_recipe(uuid,text,integer,jsonb,jsonb,uuid[]) to authenticated;
grant execute on function public.save_creation_product(uuid,text,integer,jsonb,uuid[]) to authenticated;
commit;
