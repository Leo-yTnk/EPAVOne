// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
let db;
const a = '10000000-0000-0000-0000-000000000001',
  b = '10000000-0000-0000-0000-000000000002',
  id = '20000000-0000-0000-0000-000000000001';
const order = {
  source: 'manual',
  saleDate: '2026-10-26',
  customer: { name: 'João Silva' },
  shippingCents: 200,
  lines: [
    { name: 'Frango', code: '123', quantity: 3, unitPrice: 10, kit: true },
    { name: 'Pão', quantity: 1, unitPrice: 5, kit: false }
  ]
};
const save = (payload, revision = 0, saleId = id) =>
  db.query('select (save_epav_sale($1,$2,$3)).revision as revision', [saleId, revision, payload]);
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.user_id',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`
  );
  for (const file of ['013_sales_data.sql', '041_epavone_planner_workspace.sql', '046_epavone_sale_details.sql'])
    await db.exec(readFileSync(new URL('../supabase/' + file, import.meta.url), 'utf8'));
  await db.exec(`set role authenticated;set request.user_id='${a}'`);
}, 30000);
afterAll(async () => db?.close());
describe('detailed sales atomicity and ownership', () => {
  it('recomputes totals and distinct items on the server and retries safely', async () => {
    expect((await save({ ...order, customerKey: 'forged' })).rows[0].revision).toBe(1);
    expect((await db.query('select value,ipc from sales')).rows).toEqual([{ value: '37.00', ipc: 2 }]);
    expect((await db.query('select order_data from epav_sale_details')).rows[0].order_data.customerKey).toBe('name:joao silva');
    await save({ ...order, customerKey: 'forged' });
    expect((await db.query('select id from sales')).rows).toHaveLength(1);
  });
  it('edits totals and dates atomically and rejects stale editors', async () => {
    const edited = { ...order, saleDate: '2026-10-25', lines: [{ name: 'Frango', quantity: 2, unitPrice: 20, kit: true }] };
    expect((await save(edited, 1)).rows[0].revision).toBe(2);
    await expect(save(order, 1)).rejects.toThrow('conflict');
    expect((await db.query('select value,ipc,sale_date::text from sales')).rows).toEqual([
      { value: '42.00', ipc: 1, sale_date: '2026-10-25' }
    ]);
  });
  it('denies access from other users and anonymous callers', async () => {
    await db.exec(`set request.user_id='${b}'`);
    expect((await db.query('select * from epav_sale_details')).rows).toEqual([]);
    await expect(save(order, 2)).rejects.toThrow('Forbidden');
    await expect(db.query('select delete_epav_sale($1,2)', [id])).rejects.toThrow('Forbidden');
    await db.exec('set role anon');
    await expect(save(order, 0)).rejects.toThrow();
    await db.exec(`set role authenticated;set request.user_id='${a}'`);
  });
  it('rejects invalid kit, quantities and empty required fields without partial sales', async () => {
    for (const payload of [
      { ...order, customer: { name: '' } },
      { ...order, lines: [] },
      { ...order, lines: [{ name: 'Frango', quantity: 1, unitPrice: 10, kit: true }] },
      { ...order, lines: [{ name: 'Frango', quantity: -1, unitPrice: 10 }] }
    ])
      await expect(save(payload, 0, '20000000-0000-0000-0000-000000000002')).rejects.toThrow();
    expect((await db.query('select id from sales')).rows).toHaveLength(1);
  });
  it('deletes a record and its details and makes deletion retries safe', async () => {
    await expect(db.query('select delete_epav_sale($1,1)', [id])).rejects.toThrow('conflict');
    await db.query('select delete_epav_sale($1,2)', [id]);
    await db.query('select delete_epav_sale($1,2)', [id]);
    expect((await db.query('select * from sales')).rows).toHaveLength(0);
    expect((await db.query('select * from epav_sale_details')).rows).toHaveLength(0);
  });
});
