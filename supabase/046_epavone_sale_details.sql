-- Apply once after 041. Small JSON per sale; never store workbook bytes.
begin;
create table public.epav_sale_details (
  sale_id uuid primary key references public.sales(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null default 1 check(revision > 0),
  order_data jsonb not null check(jsonb_typeof(order_data) = 'object' and octet_length(order_data::text) <= 65536)
);
create index if not exists sales_owner_date_idx on public.sales(owner_id,sale_date desc,id);
alter table public.epav_sale_details enable row level security;
create policy sale_details_read_own on public.epav_sale_details for select to authenticated using(owner_id = auth.uid());
revoke all on public.epav_sale_details from public, anon, authenticated;
grant select on public.epav_sale_details to authenticated;
create or replace function public.save_epav_sale(p_id uuid, p_revision integer, p_order jsonb)
returns public.epav_sale_details language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid(); existing public.sales; detail public.epav_sale_details;
  line jsonb; total numeric := 0; n integer; distinct_count integer; sale_day date; customer_ref text; canonical text;
begin
  if uid is null or p_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_revision is null or p_revision < 0 or jsonb_typeof(p_order) is distinct from 'object' or octet_length(p_order::text)>65536 then raise exception 'Invalid order'; end if;
  if coalesce(length(trim(p_order#>>'{customer,name}')),0) not between 1 and 300 then raise exception 'Customer required'; end if;
  sale_day := (p_order->>'saleDate')::date;
  if sale_day is null or sale_day > (now() at time zone 'America/Sao_Paulo')::date then raise exception 'Invalid sale date'; end if;
  if jsonb_typeof(p_order->'lines') is distinct from 'array' then raise exception 'Products required'; end if;
  n := jsonb_array_length(p_order->'lines'); if n < 1 or n > 200 then raise exception 'Invalid product count'; end if;
  for line in select value from jsonb_array_elements(p_order->'lines') loop
    if coalesce(length(trim(line->>'name')),0) not between 1 and 300
      or (line->>'quantity') is null or (line->>'quantity')::numeric <> trunc((line->>'quantity')::numeric)
      or (line->>'quantity')::numeric not between 1 and 9999
      or (line->>'unitPrice') is null or (line->>'unitPrice')::numeric <= 0 or (line->>'unitPrice')::numeric > 1000000
      or (line->>'unitPrice')::numeric::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid product'; end if;
    if coalesce((line->>'kit')::boolean,false) and (line->>'quantity')::integer < 2 then raise exception 'Kit requires two units'; end if;
    total := total + round((line->>'unitPrice')::numeric * (line->>'quantity')::numeric * 100);
  end loop;
  if coalesce((p_order->>'shippingCents')::numeric,0)<0 or coalesce((p_order->>'shippingCents')::numeric,0) <> trunc(coalesce((p_order->>'shippingCents')::numeric,0)) then raise exception 'Invalid shipping'; end if;
  total := total + coalesce((p_order->>'shippingCents')::numeric,0);
  if total <= 0 or total > 999999999999 then raise exception 'Invalid total'; end if;
  select count(distinct case when coalesce(trim(value->>'code'),'') <> '' then 'code:' || trim(value->>'code') else 'name:' || translate(lower(regexp_replace(trim(value->>'name'),'\s+',' ','g')),'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc') end) into distinct_count from jsonb_array_elements(p_order->'lines');
  if (select count(distinct translate(lower(regexp_replace(trim(value->>'name'),'\s+',' ','g')),'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc')) from jsonb_array_elements(p_order->'lines')) <> n then raise exception 'Duplicate product: combine quantities'; end if;
  customer_ref := trim(coalesce(p_order#>>'{customer,cpf}',''));
  canonical := translate(lower(regexp_replace(trim(p_order#>>'{customer,name}'),'\s+',' ','g')),'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc');
  p_order := jsonb_set(p_order,'{customerKey}',to_jsonb(case
    when length(regexp_replace(customer_ref,'\D','','g'))=11 then 'cpf:' || regexp_replace(customer_ref,'\D','','g')
    when customer_ref <> '' then 'ref:' || translate(lower(regexp_replace(customer_ref,'\s+',' ','g')),'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc')
    else 'name:' || canonical end));
  -- Both APIs serialize against the sale row identifier. A retry cannot create a second sale.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into existing from public.sales where id=p_id for update;
  if found and existing.owner_id is distinct from uid then raise exception 'Forbidden' using errcode='42501'; end if;
  select * into detail from public.epav_sale_details where sale_id=p_id for update;
  if detail.revision = p_revision + 1 and detail.order_data = p_order then return detail; end if;
  if coalesce(detail.revision,0) <> p_revision then raise exception 'Sale conflict' using errcode='40001'; end if;
  insert into public.sales as target(id,owner_id,sale_date,value,ipc) values(p_id,uid,sale_day,total/100,distinct_count)
    on conflict(id) do update set sale_date=excluded.sale_date,value=excluded.value,ipc=excluded.ipc where target.owner_id=uid;
  if not found then raise exception 'Forbidden' using errcode='42501'; end if;
  insert into public.epav_sale_details(sale_id,owner_id,revision,order_data) values(p_id,uid,p_revision+1,p_order)
    on conflict(sale_id) do update set revision=excluded.revision,order_data=excluded.order_data returning * into detail;
  return detail;
end;
$$;
create or replace function public.delete_epav_sale(p_id uuid,p_revision integer)
returns void language plpgsql security definer set search_path = '' as $$
declare existing public.sales; detail public.epav_sale_details;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into existing from public.sales where id=p_id for update;
  if not found then return; end if;
  if existing.owner_id is distinct from auth.uid() then raise exception 'Forbidden' using errcode='42501'; end if;
  select * into detail from public.epav_sale_details where sale_id=p_id;
  if p_revision is null or coalesce(detail.revision,0) <> p_revision then raise exception 'Sale conflict' using errcode='40001'; end if;
  delete from public.sales where id=p_id;
end;
$$;
revoke all on function public.save_epav_sale(uuid,integer,jsonb) from public,anon;
revoke all on function public.delete_epav_sale(uuid,integer) from public,anon;
grant execute on function public.save_epav_sale(uuid,integer,jsonb) to authenticated;
grant execute on function public.delete_epav_sale(uuid,integer) to authenticated;
commit;
