// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
let db;
const a = '10000000-0000-0000-0000-000000000001',
  b = '10000000-0000-0000-0000-000000000002';
const saleId = '20000000-0000-0000-0000-000000000001';
const state = { version: 1, customers: [], interactions: [], commitments: [], offers: [], weeks: [] };
const save = (snapshot, revision) =>
  db.query('select (public.save_epav_planner_workspace($1,$2)).revision as revision', [snapshot, revision]);
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key); insert into auth.users values ('${a}'),('${b}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.user_id',true),'')::uuid $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
    create table sales(id uuid primary key, owner_id uuid references auth.users, sale_date date, value numeric(12,2) check(value>0), ipc integer check(ipc>=0));
    alter table sales enable row level security;
    create policy own on sales to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
    grant select on sales to authenticated;`);
  await db.exec(readFileSync(new URL('../supabase/041_epavone_planner_workspace.sql', import.meta.url), 'utf8'));
  await db.exec(`set role authenticated; set request.user_id='${a}'`);
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe('Planner workspace and confirmed sales atomicity', () => {
  it('saves empty workspace without creating a sale', async () => {
    expect((await save(state, 0)).rows[0].revision).toBe(1);
    expect((await db.query('select * from sales')).rows).toEqual([]);
  });
  it('records an explicitly confirmed sale once and rejects stale conflicting edits', async () => {
    const confirmed = { ...state, interactions: [{ id: saleId, date: '2026-10-07', outcome: 'bought', amountCents: 12550, units: 5 }] };
    expect((await save(confirmed, 1)).rows[0].revision).toBe(2);
    expect((await db.query('select * from sales')).rows).toMatchObject([{ id: saleId, owner_id: a, value: '125.50', ipc: 5 }]);
    expect((await save(confirmed, 1)).rows[0].revision).toBe(2);
    expect((await db.query('select * from sales')).rows).toHaveLength(1);
    await expect(save(state, 1)).rejects.toThrow('conflict');
    await expect(save(state, 2)).rejects.toThrow('preserved');
  });
  it('rolls back invalid sale and preserves revision', async () => {
    const old = (await db.query('select state from epav_planner_workspaces')).rows[0].state;
    await expect(
      save(
        {
          ...old,
          interactions: [
            ...old.interactions,
            { id: '20000000-0000-0000-0000-000000000002', date: '2026-10-07', outcome: 'bought', amountCents: 0, units: 1 }
          ]
        },
        2
      )
    ).rejects.toThrow('Invalid');
    expect((await db.query('select revision from epav_planner_workspaces')).rows[0].revision).toBe(2);
    expect((await db.query('select * from sales')).rows).toHaveLength(1);
  });
  it('isolates accounts, blocks direct writes, and rejects collision with another owners sale', async () => {
    await db.exec(`set request.user_id='${b}'`);
    expect((await db.query('select * from epav_planner_workspaces')).rows).toEqual([]);
    expect((await db.query('select * from sales')).rows).toEqual([]);
    await expect(db.query('insert into epav_planner_workspaces(state) values($1)', [state])).rejects.toThrow('permission');
    await expect(
      save({ ...state, interactions: [{ id: saleId, date: '2026-10-07', outcome: 'bought', amountCents: 12550, units: 5 }] }, 0)
    ).rejects.toThrow('conflict');
    expect((await db.query('select * from epav_planner_workspaces')).rows).toEqual([]);
    await db.exec("set request.user_id=''");
    await expect(save(state, 0)).rejects.toThrow('Authentication');
    await db.exec('set role anon');
    await expect(save(state, 0)).rejects.toThrow('permission');
  });
});
