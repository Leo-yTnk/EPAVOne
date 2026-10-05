-- Execute no SQL Editor do projeto Yourcipe. Somente metadados; não lê usuários nem conteúdo.
-- Copie todas as linhas do resultado ou exporte como CSV.
with expected_tables(name) as (values
 ('profiles'),('categories'),('products'),('recipes'),('recipe_ingredients'),
 ('recipe_categories'),('product_categories'),('recipe_shares'),('recipe_access_grants'),
 ('change_requests'),('change_request_revisions'),('catalog_pages'),('catalog_sections'),
 ('catalog_section_recipes'),('catalog_section_products'),('products_with_price_freshness')),
expected_functions(name) as (values ('activate_recipe_sharing'),('admin_assign_catalog_section_item'),('admin_delete_all_products_and_recipes'),('admin_delete_inactive_catalog_items'),('admin_import_public_catalog'),('admin_import_public_recipes'),('admin_reorder_catalog_sections'),('admin_reorder_home_sections'),('admin_reorder_product_sections'),('admin_reorder_recipe_sections'),('cancel_change_request'),('check_recipe_publish_dependencies'),('create_recipe_copy'),('deactivate_recipe_sharing'),('delete_category_resolved'),('delete_product_resolved'),('delete_recipe'),('delete_recipe_action'),('find_similar_site_items'),('get_category_delete_impact'),('get_product_delete_impact'),('get_recipe_author_name'),('get_recipe_delete_impact'),('is_admin'),('list_creation_categories'),('list_public_product_sections'),('list_public_recipe_sections'),('redeem_recipe_share'),('regenerate_recipe_share_code'),('resubmit_category_request'),('resubmit_product_request'),('resubmit_recipe_request'),('return_change_request'),('review_change_request'),('revoke_recipe_access'),('save_creation_product'),('admin_save_creation_section'), ('admin_replace_creation_sections'), ('slugify'), ('save_creation_recipe'),('save_site_product_atomic'),('set_product_swift_source'),('submit_category_request'),('submit_product_request'),('submit_recipe_request')),
report as (
 select 'tabela'::text as tipo,e.name as objeto,jsonb_build_object('existe',c.oid is not null,'tipo',c.relkind,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity) as diagnostico
 from expected_tables e left join pg_namespace n on n.nspname='public' left join pg_class c on c.relnamespace=n.oid and c.relname=e.name
 union all
 select 'colunas',c.table_name,jsonb_agg(jsonb_build_object('nome',c.column_name,'tipo',c.data_type,'udt',c.udt_name,'nullable',c.is_nullable) order by c.ordinal_position)
 from information_schema.columns c join expected_tables e on e.name=c.table_name where c.table_schema='public' group by c.table_name
 union all
 select 'politicas',p.tablename,jsonb_agg(jsonb_build_object('nome',p.policyname,'roles',p.roles,'operacao',p.cmd,'using',p.qual,'check',p.with_check))
 from pg_policies p join expected_tables e on e.name=p.tablename where p.schemaname='public' group by p.tablename
 union all
 select 'permissoes',g.table_name,jsonb_agg(jsonb_build_object('role',g.grantee,'permissao',g.privilege_type))
 from information_schema.table_privileges g join expected_tables e on e.name=g.table_name where g.table_schema='public' and g.grantee in ('anon','authenticated','PUBLIC') group by g.table_name
 union all
 select 'funcao',e.name,jsonb_build_object('existe',p.oid is not null,'argumentos',pg_get_function_identity_arguments(p.oid),'retorno',pg_get_function_result(p.oid),'security_definer',p.prosecdef,'config',p.proconfig,
 'authenticated_execute',case when p.oid is not null and exists(select 1 from pg_roles where rolname='authenticated') then has_function_privilege('authenticated',p.oid,'EXECUTE') end,
 'anon_execute',case when p.oid is not null and exists(select 1 from pg_roles where rolname='anon') then has_function_privilege('anon',p.oid,'EXECUTE') end)
 from expected_functions e left join pg_namespace n on n.nspname='public' left join pg_proc p on p.pronamespace=n.oid and p.proname=e.name
 union all
 select 'trigger',c.relname,jsonb_agg(jsonb_build_object('nome',t.tgname,'definicao',pg_get_triggerdef(t.oid)))
 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace join expected_tables e on e.name=c.relname where n.nspname='public' and not t.tgisinternal group by c.relname
)
select tipo,objeto,diagnostico from report order by tipo,objeto;
