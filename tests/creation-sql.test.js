// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
let db;
const uid = '10000000-0000-0000-0000-000000000001';
const other = '10000000-0000-0000-0000-000000000002';
const category = '20000000-0000-0000-0000-000000000001';
const fields = {
  name: 'Receita teste',
  category_id: category,
  prep_time: 20,
  servings: 2,
  difficulty: 'Fácil',
  instructions: ['Preparar'],
  extras: [],
  tips: []
};
const save = (id, version, ingredients = [], overrides = {}) =>
  db.query('select public.save_creation_recipe($1,$2,$3,$4,$5,$6) as recipe', [
    id,
    'personal',
    version,
    { ...fields, ...overrides },
    ingredients,
    []
  ]);
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.user_id',true),'')::uuid $$;
    create function public.is_admin() returns boolean language sql stable as $$ select current_setting('request.admin',true)='true' $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid(), public.is_admin() to authenticated;
    create table categories(id uuid primary key);
    insert into categories values ('${category}');
    create table products(id uuid primary key default gen_random_uuid(),scope text not null,owner_id uuid,name text not null,category_id uuid references categories,unit text,price numeric check(price>=0),image_url text,active boolean,version integer default 1);
    create table recipes(id uuid primary key default gen_random_uuid(),scope text not null,owner_id uuid,status text,name text not null,category_id uuid references categories,prep_time integer,servings integer,difficulty text,image_url text,featured boolean,instructions text[],extras text[],tips text[],version integer default 1);
    create table recipe_ingredients(recipe_id uuid references recipes,product_id uuid references products,quantity numeric check(quantity>0),sort_order integer, primary key(recipe_id,product_id));
    create table recipe_categories(recipe_id uuid references recipes,category_id uuid references categories,sort_order integer,primary key(recipe_id,category_id));
    create table product_categories(product_id uuid references products,category_id uuid references categories,sort_order integer,primary key(product_id,category_id));
    create table catalog_pages(id uuid primary key default gen_random_uuid(),key text unique,name text);
    create table catalog_sections(id uuid primary key default gen_random_uuid(),page_id uuid references catalog_pages,name text,slug text,sort_order integer,active boolean,updated_at timestamptz,unique(page_id,slug));
    create table catalog_section_recipes(section_id uuid references catalog_sections,recipe_id uuid references recipes,sort_order integer,primary key(section_id,recipe_id));
    create table catalog_section_products(section_id uuid references catalog_sections,product_id uuid references products,sort_order integer,primary key(section_id,product_id));
    insert into catalog_pages(key,name) values('home','Home'),('recipes','Receitas'),('products','Produtos');
    create function public.slugify(text) returns text language sql immutable as $$ select lower(replace($1,' ','-')) $$;
    grant select on catalog_pages,catalog_sections,catalog_section_recipes,catalog_section_products to authenticated;
    create function public.bump_version() returns trigger language plpgsql as $$ begin new.version=old.version+1; return new; end $$;
    create trigger version before update on recipes for each row execute function bump_version();
    create trigger version before update on products for each row execute function bump_version();
    create function public.save_site_product_atomic(uuid,jsonb,uuid[]) returns products language plpgsql as $$ begin raise exception 'fixture: site writer intentionally unavailable'; end $$;
    grant select on categories to authenticated;
    grant select,insert,update,delete on recipes,products,recipe_ingredients,recipe_categories,product_categories to authenticated;
    alter table recipes enable row level security; alter table products enable row level security;
    create policy own on recipes to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid() and scope='personal');
    create policy admin on recipes to authenticated using(public.is_admin()) with check(public.is_admin());
    create policy own on products to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid() and scope='personal');
    create policy admin on products to authenticated using(public.is_admin()) with check(public.is_admin());
    alter table recipe_ingredients enable row level security;
    create policy own on recipe_ingredients to authenticated using(exists(select 1 from recipes r where r.id=recipe_id)) with check(exists(select 1 from recipes r where r.id=recipe_id));
    alter table recipe_categories enable row level security;
    create policy own on recipe_categories to authenticated using(exists(select 1 from recipes r where r.id=recipe_id)) with check(exists(select 1 from recipes r where r.id=recipe_id));
    alter table product_categories enable row level security;
    create policy own on product_categories to authenticated using(exists(select 1 from products p where p.id=product_id)) with check(exists(select 1 from products p where p.id=product_id));
  `);
  await db.exec(readFileSync(new URL('../supabase/038_epavone_creation_atomic.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/039_epavone_catalog_sections.sql', import.meta.url), 'utf8'));
  await db.exec(`set role authenticated; set request.user_id='${uid}'; set request.admin='false';`);
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe('Atomic creation SQL with RLS fixture', () => {
  it('creates under the authenticated owner and rejects an outdated version', async () => {
    const { rows } = await save(null, null);
    const item = rows[0].recipe;
    expect(item.owner_id).toBe(uid);
    expect(item.status).toBe('private');
    await save(item.id, item.version, [], { name: 'Atualizada' });
    await expect(save(item.id, item.version)).rejects.toThrow('version_conflict');
  });
  it('rolls back the recipe and preserves old ingredients when any replacement fails', async () => {
    const p = await db.query('select public.save_creation_product(null,$1,null,$2,$3) as product', [
      'personal',
      { name: 'Produto', category_id: category, unit: 'un', price: 10, active: true },
      []
    ]);
    const productId = p.rows[0].product.id;
    const { rows } = await save(null, null, [{ product_id: productId, quantity: 2 }]);
    const item = rows[0].recipe;
    await expect(save(item.id, item.version, [{ product_id: productId, quantity: -2 }], { name: 'Não deve persistir' })).rejects.toThrow();
    expect((await db.query('select name from recipes where id=$1', [item.id])).rows[0].name).toBe(fields.name);
    expect(Number((await db.query('select quantity from recipe_ingredients where recipe_id=$1', [item.id])).rows[0].quantity)).toBe(2);
  });
  it('rejects another owner and public writes by a normal user', async () => {
    const { rows } = await save(null, null);
    await db.exec(`set request.user_id='${other}';`);
    await expect(save(rows[0].recipe.id, 1)).rejects.toThrow('not_found_or_not_owned');
    expect((await db.query('select * from recipes where id=$1', [rows[0].recipe.id])).rows).toHaveLength(0);
    await expect(db.query('select save_creation_recipe(null,$1,null,$2,$3,$4)', ['site', fields, [], []])).rejects.toThrow('not_admin');
    await db.exec(`set request.user_id='${uid}';`);
  });
  it('denies anonymous execution and compiles the read-only diagnostic even when tables are missing', async () => {
    await db.exec('reset role; set role anon;');
    await expect(save(null, null)).rejects.toThrow('permission denied');
    await db.exec('reset role;');
    const report = await db.query(readFileSync(new URL('../supabase/diagnostic.sql', import.meta.url), 'utf8'));
    expect(report.rows.find((x) => x.tipo === 'funcao' && x.objeto === 'save_creation_recipe').diagnostico.existe).toBe(true);
    expect(report.rows.find((x) => x.tipo === 'tabela' && x.objeto === 'profiles').diagnostico.existe).toBe(false);
    await db.exec(`set role authenticated; set request.user_id='${uid}';`);
  });
  it('denies section administration to non-admin and anonymous users', async () => {
    await expect(db.query('select admin_save_creation_section(null,$1,$2,0,true)', ['home', 'Admin only'])).rejects.toThrow('not_admin');
    await db.exec('reset role; set role anon;');
    await expect(db.query('select admin_save_creation_section(null,$1,$2,0,true)', ['home', 'Admin only'])).rejects.toThrow(
      'permission denied'
    );
    await db.exec(`reset role; set role authenticated; set request.user_id='${uid}';`);
  });
  it('saves public recipe sections atomically and rolls back incompatible sections', async () => {
    await db.exec("set request.admin='true';");
    const home = (await db.query('select admin_save_creation_section(null,$1,$2,0,true) as section', ['home', 'Destaques'])).rows[0]
      .section;
    const product = (await db.query('select admin_save_creation_section(null,$1,$2,0,true) as section', ['products', 'Carnes'])).rows[0]
      .section;
    const recipe = (await db.query('select save_creation_recipe(null,$1,null,$2,$3,$4) as recipe', ['site', fields, [], [home.id]])).rows[0]
      .recipe;
    expect((await db.query('select * from catalog_section_recipes where recipe_id=$1', [recipe.id])).rows[0].section_id).toBe(home.id);
    await expect(
      db.query('select save_creation_recipe($1,$2,$3,$4,$5,$6)', [
        recipe.id,
        'site',
        recipe.version,
        { ...fields, name: 'Invalid replacement' },
        [],
        [product.id]
      ])
    ).rejects.toThrow('invalid_section_for_content');
    expect((await db.query('select name from recipes where id=$1', [recipe.id])).rows[0].name).toBe(fields.name);
    expect((await db.query('select * from catalog_section_recipes where recipe_id=$1', [recipe.id])).rows[0].section_id).toBe(home.id);
    await db.exec("set request.admin='false';");
  });
});
