-- Apply after diagnostic.sql and 038. Additive, no data migration or policy replacement.
begin;
create or replace function public.admin_save_creation_section(
  p_id uuid, p_page_key text, p_name text, p_sort_order integer, p_active boolean
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_page uuid; v_section public.catalog_sections%rowtype; v_slug text;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'not_admin' using errcode='42501'; end if;
  if p_page_key is null or p_page_key not in ('home','recipes','products') then raise exception 'invalid_page'; end if;
  if p_name is null or length(btrim(p_name)) not between 1 and 120 or p_sort_order is null or p_sort_order<0 or p_active is null then raise exception 'invalid_section'; end if;
  select id into v_page from public.catalog_pages where key=p_page_key;
  if v_page is null then raise exception 'page_not_found'; end if;
  if p_id is null then
    v_slug:=public.slugify(p_name);
    if coalesce(v_slug,'')='' then raise exception 'invalid_section_slug'; end if;
    insert into public.catalog_sections(page_id,name,slug,sort_order,active)
      values(v_page,btrim(p_name),v_slug,p_sort_order,p_active) returning * into v_section;
  else
    select * into v_section from public.catalog_sections where id=p_id for update;
    if not found or v_section.page_id<>v_page then raise exception 'section_not_found'; end if;
    update public.catalog_sections set name=btrim(p_name),sort_order=p_sort_order,active=p_active,updated_at=now()
      where id=p_id returning * into v_section;
  end if;
  return to_jsonb(v_section);
end $$;

create or replace function public.admin_replace_creation_sections(p_type text,p_item_id uuid,p_sections uuid[])
returns void language plpgsql security definer set search_path='' as $$
declare v_scope text;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'not_admin' using errcode='42501'; end if;
  if p_type is null or p_type not in ('recipes','products') then raise exception 'invalid_content_type'; end if;
  if p_type='recipes' then select scope into v_scope from public.recipes where id=p_item_id for update;
  else select scope into v_scope from public.products where id=p_item_id for update; end if;
  if v_scope is distinct from 'site' then raise exception 'public_content_required'; end if;
  if exists(
    select 1 from unnest(coalesce(p_sections,'{}')) x(id)
    left join public.catalog_sections s on s.id=x.id left join public.catalog_pages p on p.id=s.page_id
    where s.id is null or (p_type='products' and p.key<>'products') or (p_type='recipes' and p.key not in ('home','recipes'))
  ) then raise exception 'invalid_section_for_content'; end if;
  if cardinality(coalesce(p_sections,'{}'))<>(select count(distinct id) from unnest(coalesce(p_sections,'{}')) x(id)) then raise exception 'duplicate_section'; end if;
  if p_type='recipes' then
    -- Preserve the position of an item in existing sections; append only new memberships.
    delete from public.catalog_section_recipes where recipe_id=p_item_id and not(section_id=any(coalesce(p_sections,'{}')));
    insert into public.catalog_section_recipes(section_id,recipe_id,sort_order)
      select x.id,p_item_id,coalesce((select max(sort_order)+1 from public.catalog_section_recipes where section_id=x.id),0)
      from unnest(coalesce(p_sections,'{}')) x(id) on conflict do nothing;
  else
    delete from public.catalog_section_products where product_id=p_item_id and not(section_id=any(coalesce(p_sections,'{}')));
    insert into public.catalog_section_products(section_id,product_id,sort_order)
      select x.id,p_item_id,coalesce((select max(sort_order)+1 from public.catalog_section_products where section_id=x.id),0)
      from unnest(coalesce(p_sections,'{}')) x(id) on conflict do nothing;
  end if;
end $$;
revoke all on function public.admin_save_creation_section(uuid,text,text,integer,boolean) from public,anon;
revoke all on function public.admin_replace_creation_sections(text,uuid,uuid[]) from public,anon;
grant execute on function public.admin_save_creation_section(uuid,text,text,integer,boolean) to authenticated;
grant execute on function public.admin_replace_creation_sections(text,uuid,uuid[]) to authenticated;
commit;
