// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
let db;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create table public.catalog_test(id integer primary key);
    insert into public.catalog_test values(1);
    alter table public.catalog_test enable row level security;
    create policy visible on public.catalog_test to anon, authenticated using(id=1);
    create view public.products_with_price_freshness as select * from public.catalog_test;
    grant select on public.products_with_price_freshness to anon, authenticated;
    grant all on public.catalog_test to anon, authenticated, service_role;
    grant truncate on public.catalog_test to public;
    alter default privileges in schema public grant all on tables to anon, authenticated;
  `);
  await db.exec(readFileSync(new URL('../supabase/040_epavone_table_privileges.sql', import.meta.url), 'utf8'));
  // Reapplying the permission-only migration is safe.
  await db.exec(readFileSync(new URL('../supabase/040_epavone_table_privileges.sql', import.meta.url), 'utf8'));
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe('Table-wide privilege hardening', () => {
  it('denies truncate to frontend roles while preserving rows, CRUD and service access', async () => {
    for (const role of ['anon', 'authenticated']) {
      for (const privilege of ['TRUNCATE', 'REFERENCES', 'TRIGGER']) {
        expect(
          (await db.query('select has_table_privilege($1, $2, $3) as allowed', [role, 'public.catalog_test', privilege])).rows[0].allowed
        ).toBe(false);
      }
      for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
        expect(
          (await db.query('select has_table_privilege($1, $2, $3) as allowed', [role, 'public.catalog_test', privilege])).rows[0].allowed
        ).toBe(true);
      }
      await db.exec(`set role ${role};`);
      await expect(db.exec('truncate public.catalog_test')).rejects.toThrow('permission denied');
      expect((await db.query('select * from public.products_with_price_freshness')).rows).toEqual([{ id: 1 }]);
      await db.exec('reset role;');
    }
    expect((await db.query('select * from public.catalog_test')).rows).toEqual([{ id: 1 }]);
    expect(
      (await db.query("select has_table_privilege('service_role', 'public.catalog_test', 'TRUNCATE') as allowed")).rows[0].allowed
    ).toBe(true);
  });
  it('makes the price view honor the calling role row policies', async () => {
    await db.exec('insert into public.catalog_test values(2); set role anon;');
    expect((await db.query('select * from public.products_with_price_freshness')).rows).toEqual([{ id: 1 }]);
    await db.exec('reset role;');
    expect((await db.query('select * from public.catalog_test order by id')).rows).toEqual([{ id: 1 }, { id: 2 }]);
  });
  it('removes dangerous default grants on future tables without stripping CRUD', async () => {
    await db.exec('create table public.future_catalog_test(id integer);');
    for (const role of ['anon', 'authenticated']) {
      expect(
        (await db.query('select has_table_privilege($1, $2, $3) as allowed', [role, 'public.future_catalog_test', 'TRUNCATE'])).rows[0]
          .allowed
      ).toBe(false);
      expect(
        (await db.query('select has_table_privilege($1, $2, $3) as allowed', [role, 'public.future_catalog_test', 'SELECT'])).rows[0]
          .allowed
      ).toBe(true);
    }
  });
});
