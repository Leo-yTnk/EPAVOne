// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, expect, it } from 'vitest';
let db;
const call = (categories = [], products = [], recipes = [], sections = [], recipeLinks = [], productLinks = []) =>
  db.query('select admin_add_public_catalog($1,$2,$3,$4,$5,$6) as result', [
    categories,
    products,
    recipes,
    sections,
    recipeLinks,
    productLinks
  ]);
const item = (name) => ({
  name,
  category: 'Bovinos',
  unit: 'pacote',
  price: null,
  image_url: 'https://swiftbr.vteximg.com.br/arquivos/test.jpg',
  swift_product_url: `https://www.swift.com.br/detail/${name.toLowerCase()}`,
  swift_sku: 'unverified'
});
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role authenticated; create role anon; create role service_role;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
    create function is_admin() returns boolean language sql stable as $$select current_setting('request.admin',true)='true'$$;
    create function unaccent(text) returns text language sql immutable as $$select translate($1,'áéíóúãõâêôç','aeiouaoaeoc')$$;
    create function slugify(text) returns text language sql immutable as $$select replace(lower(public.unaccent(btrim($1))),' ','-')$$;
    create type product_price_status as enum('STALE','CURRENT','MISSING_SOURCE');
    create table categories(id uuid primary key default gen_random_uuid(),scope text,owner_id uuid,type text,name text,slug text,active boolean,sort_order int,created_by uuid,updated_by uuid,updated_at timestamptz);
    create table products(id uuid primary key default gen_random_uuid(),scope text,owner_id uuid,name text,category_id uuid references categories,unit text,price numeric, image_url text, swift_product_url text,swift_sku text,price_source text,price_last_success_at timestamptz,price_status product_price_status,price_error text,active boolean,created_by uuid,updated_by uuid,updated_at timestamptz,version integer default 1);
    create table recipes(id uuid primary key default gen_random_uuid(),scope text,owner_id uuid,status text,name text,category_id uuid references categories,prep_time integer,servings integer,difficulty text,image_url text,featured boolean,instructions text[],extras text[],tips text[]);
    create table recipe_ingredients(id uuid primary key default gen_random_uuid(),recipe_id uuid references recipes,product_id uuid references products,quantity numeric,sort_order integer);
    create table recipe_categories(recipe_id uuid references recipes,category_id uuid references categories,sort_order integer);
    create table catalog_pages(id uuid primary key default gen_random_uuid(),key text unique);
    create table catalog_sections(id uuid primary key default gen_random_uuid(),page_id uuid references catalog_pages,name text,slug text,sort_order integer,active boolean,updated_at timestamptz,unique(page_id,slug));
    create table catalog_section_recipes(section_id uuid references catalog_sections,recipe_id uuid references recipes,sort_order integer,primary key(section_id,recipe_id));
    create table catalog_section_products(section_id uuid references catalog_sections,product_id uuid references products,sort_order integer,primary key(section_id,product_id));
    insert into catalog_pages(key) values('home'),('recipes'),('products');
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid(),is_admin() to authenticated;
    grant select on categories,products,recipes,recipe_ingredients,catalog_sections,catalog_section_products to authenticated;
  `);
  const legacy = readFileSync(new URL('../supabase/012_admin_import_and_home_order.sql', import.meta.url), 'utf8');
  await db.exec(legacy);
  await db.exec(readFileSync(new URL('../supabase/042_epavone_add_only_import.sql', import.meta.url), 'utf8'));
  // Price persistence is a fixture; 043's wrapper, transaction and review policies are real.
  await db.exec(
    `create function apply_swift_price_observation(uuid,jsonb) returns boolean language plpgsql as $$begin update public.products set price=($2->>'regular_price_cents')::numeric/100 where id=$1; return true; end$$;`
  );
  await db.exec(readFileSync(new URL('../supabase/043_epavone_swift_catalog_observations.sql', import.meta.url), 'utf8'));
  await db.exec(`alter table categories add column version integer default 1;
    alter table recipes add column version integer default 1;
    create function bump_import_version() returns trigger language plpgsql as $$begin new.version:=old.version+1; return new; end$$;
    create trigger bump_products before update on products for each row execute function bump_import_version();
    create trigger bump_categories before update on categories for each row execute function bump_import_version();
    create trigger bump_recipes before update on recipes for each row execute function bump_import_version();`);
  await db.exec(readFileSync(new URL('../supabase/045_reviewed_catalog_duplicates.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/047_catalog_import_performance.sql', import.meta.url), 'utf8'));
  await db.exec(`alter table catalog_pages add column sort_order integer default 0;
    create table product_categories(product_id uuid references products,category_id uuid references categories,sort_order integer,primary key(product_id,category_id));
    alter table recipe_categories add primary key(recipe_id,category_id);`);
  await db.exec(readFileSync(new URL('../supabase/048_catalog_backup.sql', import.meta.url), 'utf8'));
  await db.exec("set role authenticated; set request.uid='10000000-0000-0000-0000-000000000001'; set request.admin='true';");
}, 30000);
afterAll(async () => db?.close());
it('adds atomically, repeats without duplicates, and never records an unverified SKU', async () => {
  const result = await call([{ type: 'proteina', name: 'Bovinos' }], [item('Picanha')]);
  expect(result.rows[0].result.products.added).toBe(1);
  expect((await db.query('select swift_sku from products')).rows[0].swift_sku).toBeNull();
  const repeated = await call(
    [{ type: 'proteina', name: 'Bovinos' }],
    [{ ...item('Picanha'), swift_product_url: 'https://www.swift.com.br/picanha/p' }]
  );
  expect(repeated.rows[0].result.products.ignored).toBe(1);
  expect((await db.query('select count(*)::int as n from products')).rows[0].n).toBe(1);
});
it('preserves inactive products and vocabulary, including image, price and timestamp', async () => {
  await db.exec(
    "reset role; update products set active=false,price=99,updated_at='2026-01-01'; update categories set active=false,updated_at='2026-01-01'; set role authenticated;"
  );
  const before = (await db.query('select * from products')).rows;
  await call([{ type: 'proteina', name: 'Bovinos' }], [{ ...item('Picanha'), image_url: 'https://example.com/other.jpg', price: 1 }]);
  expect((await db.query('select * from products')).rows).toEqual(before);
  expect((await db.query('select active from categories')).rows[0].active).toBe(false);
  // A missing category is added; existing inactive vocabulary is reused without reactivation.
  await call([], [{ ...item('Fraldinha'), swift_sku: null }]);
  expect((await db.query("select active from categories where name='Bovinos'")).rows[0].active).toBe(false);
});
it('blocks conflicting names/URLs and rolls back entities on a later recipe failure', async () => {
  await expect(
    call([{ type: 'proteina', name: 'Rollback' }], [{ ...item('Picanha'), swift_product_url: 'https://www.swift.com.br/different' }])
  ).rejects.toThrow('swift_identity_conflict');
  await expect(
    call(
      [{ type: 'proteina', name: 'Rollback' }],
      [item('Costela')],
      [
        {
          name: 'Receita',
          category: 'Inexistente',
          prep_time: 1,
          servings: 1,
          difficulty: 'Fácil',
          instructions: ['Asse'],
          ingredients: [{ product: 'Costela', quantity: 1 }],
          sections: []
        }
      ]
    )
  ).rejects.toThrow('category_not_found');
  expect((await db.query("select * from categories where name='Rollback'")).rows).toHaveLength(0);
  expect((await db.query("select * from products where name='Costela'")).rows).toHaveLength(0);
});
it('rejects invalid section references and denies ordinary/anonymous access and the private core', async () => {
  await expect(call([], [], [], [], [], [{ page: 'products', section: 'Missing', product: 'Picanha', sort_order: 0 }])).rejects.toThrow(
    'section_not_found'
  );
  await expect(db.query('select admin_add_catalog_entities($1,$2,$3)', ['[]', '[]', '[]'])).rejects.toThrow('permission denied');
  await db.exec("set request.admin='false';");
  await expect(call()).rejects.toThrow('not_authorized');
  await db.exec('reset role; set role anon;');
  await expect(call()).rejects.toThrow('permission denied');
  await db.exec("reset role; set role authenticated; set request.admin='true';");
});
it('adds six entities, preserves link order on repetition and rejects injected modes', async () => {
  const sections = [{ page: 'products', name: 'Churrasco', sort_order: 0, active: true }];
  const links = [{ page: 'products', section: 'Churrasco', product: 'Picanha', sort_order: 1 }];
  await call([], [], [], sections, [], links);
  await call([], [], [], [{ ...sections[0], sort_order: 99, active: false }], [], [{ ...links[0], sort_order: 99 }]);
  expect((await db.query('select sort_order,active from catalog_sections')).rows[0]).toEqual({ sort_order: 0, active: true });
  expect((await db.query('select sort_order from catalog_section_products')).rows[0].sort_order).toBe(1);
  await expect(
    db.query('select admin_add_public_catalog($1,$2,$3,$4,$5,$6,$7)', ['{"products":"replace_all"}', [], [], [], [], [], []])
  ).rejects.toThrow();
});

it('records availability and requested CEP without claiming regional confirmation or editing content', async () => {
  const product = (await db.query("select * from products where name='Picanha'")).rows[0];
  const observation = {
    observed_name: 'Picanha Swift',
    observed_image_url: 'https://swiftbr.vteximg.com.br/arquivos/new.jpg',
    presentation: '1 kg',
    availability: 'unavailable',
    reference_zip_code: '04534011',
    checked_at: '2026-10-07T12:00:00Z',
    swift_product_url: product.swift_product_url,
    regular_price_cents: 12990
  };
  await db.exec('reset role;');
  await db.query('select apply_swift_catalog_observation($1,$2)', [product.id, observation]);
  await db.exec('set role authenticated;');
  const result = (await db.query('select * from swift_catalog_observations')).rows[0];
  expect(result.region_confirmed).toBe(false);
  expect(result.availability).toBe('unavailable');
  expect((await db.query('select name,image_url from products where id=$1', [product.id])).rows[0]).toEqual({
    name: product.name,
    image_url: product.image_url
  });
  await expect(db.query('select admin_accept_swift_metadata($1,$2,$3,true,true)', [product.id, result.checked_at, 99])).rejects.toThrow(
    'version_conflict'
  );
  await db.query('select admin_accept_swift_metadata($1,$2,$3,false,true)', [
    product.id,
    result.checked_at,
    (await db.query('select version from products where id=$1', [product.id])).rows[0].version
  ]);
  expect((await db.query('select name,image_url,active from products where id=$1', [product.id])).rows[0]).toEqual({
    name: product.name,
    image_url: observation.observed_image_url,
    active: false
  });
  await db.exec("set request.admin='false';");
  expect((await db.query('select * from swift_catalog_observations')).rows).toEqual([]);
  await expect(db.query('select admin_accept_swift_metadata($1,$2,$3,true,true)', [product.id, result.checked_at, 1])).rejects.toThrow(
    'not_authorized'
  );
  await expect(db.query('select apply_swift_catalog_observation($1,$2)', [product.id, observation])).rejects.toThrow('permission denied');
  await db.exec("reset role; set request.admin='true';");
  const before = (await db.query('select price from products where id=$1', [product.id])).rows[0];
  await expect(
    db.query('select apply_swift_catalog_observation($1,$2)', [
      product.id,
      { ...observation, reference_zip_code: 'bad', regular_price_cents: 999 }
    ])
  ).rejects.toThrow();
  expect((await db.query('select price from products where id=$1', [product.id])).rows[0]).toEqual(before);
  await db.exec('set role authenticated;');
});

const reviewed = (payload, choices) =>
  db.query('select admin_import_reviewed_catalog($1,$2) as result', [
    { categories: [], products: [], recipes: [], sections: [], recipeSections: [], productSections: [], ...payload },
    choices
  ]);
it('uses imported product content only for explicit choices, preserving identity, prices and inactive state', async () => {
  const before = (await db.query("select * from products where name='Picanha'")).rows[0];
  const row = { ...item('Picanha'), image_url: 'https://example.com/imported.jpg', unit: 'kg' };
  await reviewed({ products: [row] }, []);
  expect((await db.query('select * from products where id=$1', [before.id])).rows[0]).toEqual(before);
  const choice = { entity: 'products', index: 0, id: before.id, version: before.version };
  const result = await reviewed({ products: [row] }, [choice]);
  expect(result.rows[0].result.products).toMatchObject({ replaced: 1, ignored: 0 });
  expect((await db.query('select * from products where id=$1', [before.id])).rows[0]).toMatchObject({
    id: before.id,
    image_url: row.image_url,
    unit: 'kg',
    price: before.price,
    active: false,
    swift_product_url: before.swift_product_url,
    swift_sku: before.swift_sku
  });
  await expect(reviewed({ categories: [{ type: 'proteina', name: 'No rollback' }], products: [row] }, [choice])).rejects.toThrow(
    'version_conflict'
  );
  expect((await db.query("select * from categories where name='No rollback'")).rows).toHaveLength(0);
});
it('replaces recipe details and ingredients with the same ID and publication state, with rollback on invalid references', async () => {
  await db.exec(`reset role;
    insert into categories(scope,type,name,slug,active) values('site','receita','Familia','familia',true);
    insert into recipes(scope,status,name,category_id,prep_time,servings,difficulty,instructions)
      select 'site','published','Almoco',id,10,1,'Fácil',array['Original'] from categories where name='Familia';
    insert into recipe_ingredients(recipe_id,product_id,quantity,sort_order) select r.id,p.id,1,0 from recipes r,products p where r.name='Almoco' and p.name='Fraldinha';
    set role authenticated;`);
  const original = (await db.query("select * from recipes where name='Almoco'")).rows[0];
  const row = {
    name: 'Almoco',
    category: 'Familia',
    prep_time: 25,
    servings: 2,
    difficulty: 'Fácil',
    instructions: ['Importado'],
    ingredients: [{ product: 'Fraldinha', quantity: 2 }],
    sections: []
  };
  const choice = { entity: 'recipes', index: 0, id: original.id, version: original.version };
  await reviewed({ recipes: [row] }, [choice]);
  expect((await db.query('select * from recipes where id=$1', [original.id])).rows[0]).toMatchObject({
    id: original.id,
    status: 'published',
    prep_time: 25,
    instructions: ['Importado']
  });
  expect((await db.query('select quantity from recipe_ingredients where recipe_id=$1', [original.id])).rows[0].quantity).toBe('2');
  const updated = (await db.query('select version from recipes where id=$1', [original.id])).rows[0];
  await expect(
    reviewed({ products: [item('RollbackDuplicata')], recipes: [{ ...row, ingredients: [{ product: 'Missing', quantity: 1 }] }] }, [
      { ...choice, version: updated.version }
    ])
  ).rejects.toThrow('active_product_not_found');
  expect((await db.query("select * from products where name='RollbackDuplicata'")).rows).toHaveLength(0);
  expect((await db.query('select quantity from recipe_ingredients where recipe_id=$1', [original.id])).rows[0].quantity).toBe('2');
});
it('rejects mismatched duplicate IDs and non-admin replacement calls', async () => {
  await expect(
    reviewed({ products: [item('Picanha')] }, [{ entity: 'products', index: 0, id: '00000000-0000-0000-0000-000000000001', version: 1 }])
  ).rejects.toThrow('duplicate_identity_changed');
  await db.exec("set request.admin='false';");
  await expect(reviewed({}, [])).rejects.toThrow('not_authorized');
  await db.exec('reset role;set role anon;');
  await expect(reviewed({}, [])).rejects.toThrow('permission denied');
  await db.exec("reset role;set role authenticated;set request.admin='true';");
});
it('applies reviewed category and section content while preserving IDs and checks section timestamps', async () => {
  const category = (await db.query("select * from categories where slug='bovinos'")).rows[0];
  const section = (await db.query("select * from catalog_sections where slug='churrasco'")).rows[0];
  const payload = {
    categories: [{ type: 'proteina', name: 'BOVINOS' }],
    sections: [{ page: 'products', name: 'CHURRASCO', sort_order: 5, active: false }]
  };
  await reviewed(payload, [
    { entity: 'categories', index: 0, id: category.id, version: category.version },
    { entity: 'sections', index: 0, id: section.id, updated_at: section.updated_at }
  ]);
  expect((await db.query('select name,active from categories where id=$1', [category.id])).rows[0]).toEqual({
    name: 'BOVINOS',
    active: false
  });
  expect((await db.query('select name,sort_order,active from catalog_sections where id=$1', [section.id])).rows[0]).toEqual({
    name: 'CHURRASCO',
    sort_order: 5,
    active: false
  });
  await expect(
    reviewed({ sections: payload.sections }, [{ entity: 'sections', index: 0, id: section.id, updated_at: section.updated_at }])
  ).rejects.toThrow('version_conflict');
});

it('backs up inactive/public content and restores details, ingredients and sections atomically without deleting later items', async () => {
  // Use the real category/ingredient integrity triggers during backup recovery.
  await db.exec('reset role;');
  const schema = readFileSync(new URL('../supabase/004_catalog_schema.sql', import.meta.url), 'utf8');
  for (const name of [
    'validate_reference_scope',
    'enforce_products_category_reference',
    'enforce_recipes_category_reference',
    'enforce_recipe_ingredients_product_reference'
  ]) {
    await db.exec(schema.match(new RegExp('create or replace function public\\.' + name + '\\([\\s\\S]*?\\$\\$;'))[0]);
  }
  await db.exec(`create trigger backup_product_reference before insert or update of category_id on products for each row execute function enforce_products_category_reference();
    create trigger backup_recipe_reference before insert or update of category_id on recipes for each row execute function enforce_recipes_category_reference();
    create trigger backup_ingredient_reference before insert or update on recipe_ingredients for each row execute function enforce_recipe_ingredients_product_reference(); set role authenticated;`);
  const backup = (await db.query('select admin_export_catalog_backup() as b')).rows[0].b;
  expect(backup.format).toBe('epavone-catalog');
  expect(backup.data.products.some((p) => p.active === false)).toBe(true);
  const original = backup.data.recipes[0];
  await db.exec('reset role;');
  await db.query('update recipes set instructions=$1 where id=$2', [['Changed'], original.id]);
  await db.exec('set role authenticated;');
  await call([{ type: 'proteina', name: 'Later active' }], [{ ...item('Later'), category: 'Later active' }]);
  await db.query('select admin_restore_catalog_backup($1)', [backup]);
  expect((await db.query('select instructions from recipes where id=$1', [original.id])).rows[0].instructions).toEqual(
    original.instructions
  );
  expect((await db.query("select * from products where name='Later'")).rows).toHaveLength(1);
  expect((await db.query('select * from recipe_ingredients')).rows).toHaveLength(backup.data.recipe_ingredients.length);
  // A corrupt late relationship must roll back prior deletes/updates.
  const invalid = structuredClone(backup);
  invalid.data.catalog_sections[0].page_id = '11111111-1111-1111-1111-111111111111';
  await expect(db.query('select admin_restore_catalog_backup($1)', [invalid])).rejects.toThrow('backup_page_missing');
  expect((await db.query('select * from recipe_ingredients')).rows).toHaveLength(backup.data.recipe_ingredients.length);
  const lateFailure = structuredClone(backup);
  lateFailure.data.recipes[0].instructions = ['Must roll back'];
  lateFailure.data.catalog_section_products[0].sort_order = 'invalid integer';
  await expect(db.query('select admin_restore_catalog_backup($1)', [lateFailure])).rejects.toThrow();
  expect((await db.query('select instructions from recipes where id=$1', [original.id])).rows[0].instructions).toEqual(
    original.instructions
  );
  await db.exec('reset role;');
  await db.query('delete from recipe_ingredients where recipe_id=$1', [original.id]);
  await db.query('delete from recipe_categories where recipe_id=$1', [original.id]);
  await db.query('delete from catalog_section_recipes where recipe_id=$1', [original.id]);
  await db.query('delete from recipes where id=$1', [original.id]);
  await db.exec('set role authenticated;');
  await db.query('select admin_restore_catalog_backup($1)', [backup]);
  expect((await db.query('select instructions from recipes where id=$1', [original.id])).rows[0].instructions).toEqual(
    original.instructions
  );
});
it('denies backup to ordinary accounts and prevents restore from targeting personal rows or references', async () => {
  const backup = (await db.query('select admin_export_catalog_backup() as b')).rows[0].b;
  await db.exec("set request.admin='false';");
  await expect(db.query('select admin_export_catalog_backup()')).rejects.toThrow('not_authorized');
  await expect(db.query('select admin_restore_catalog_backup($1)', [backup])).rejects.toThrow('not_authorized');
  await db.exec("set request.admin='true';reset role;");
  const privateId = '11111111-1111-1111-1111-111111111111';
  await db.query("insert into categories(id,scope,owner_id,type,name) values($1,'personal',$1,'proteina','Private')", [privateId]);
  await db.exec('set role authenticated;');
  const current = (await db.query('select admin_export_catalog_backup() as b')).rows[0].b;
  expect(current.data.categories.some((c) => c.id === privateId)).toBe(false);
  const collision = structuredClone(backup);
  collision.data.categories[0].id = privateId;
  await expect(db.query('select admin_restore_catalog_backup($1)', [collision])).rejects.toThrow('backup_personal_id_conflict');
  const injected = structuredClone(backup);
  injected.data.categories[0].scope = 'personal';
  await expect(db.query('select admin_restore_catalog_backup($1)', [injected])).rejects.toThrow('invalid_backup_scope');
  const broken = structuredClone(backup);
  broken.data.recipe_ingredients[0].product_id = privateId;
  await expect(db.query('select admin_restore_catalog_backup($1)', [broken])).rejects.toThrow('backup_ingredient_reference_missing');
  await db.exec('reset role;set role anon;');
  await expect(db.query('select admin_export_catalog_backup()')).rejects.toThrow('permission denied');
  await db.exec("reset role;set role authenticated;set request.admin='true';");
});
it('keeps indexed import identities consistent and imports a realistic recipe batch', async () => {
  const product = (await db.query("select * from products where name='Later'")).rows[0];
  expect(product.import_name_key).toBe('later');
  expect(product.import_swift_key).toBe('/later');
  await db.exec('reset role;');
  await db.query("update products set name='LATER Renamed',import_name_key='spoof' where id=$1", [product.id]);
  expect((await db.query('select import_name_key from products where id=$1', [product.id])).rows[0].import_name_key).toBe('later renamed');
  await db.exec('set role authenticated;');
  const recipes = Array.from({ length: 100 }, (_, i) => ({
    name: `Batch ${i}`,
    category: 'Familia',
    prep_time: 20,
    servings: 2,
    difficulty: 'Fácil',
    instructions: ['Prepare'],
    ingredients: [{ product: 'Fraldinha', quantity: 1 }],
    sections: []
  }));
  const imported = await call([], [], recipes);
  expect(imported.rows[0].result.recipes.added).toBe(100);
  expect((await call([], [], recipes)).rows[0].result.recipes.ignored).toBe(100);
}, 30000);
