import { describe, expect, it, vi } from 'vitest';
import { createRemotePlannerRepository } from '../src/products/planner/repositories/remotePlannerRepository.js';
import { demoData } from '../src/products/planner/repositories/demoData.js';
function setup() {
  const snapshot = demoData('2026-10-07');
  let row = { state: snapshot, revision: 1 };
  let salesFail = false;
  let owner = 'account-a';
  const rpc = vi.fn(async (_name, args) => {
    if (args.p_expected_revision !== row.revision) return { error: { code: '40001' } };
    row = { state: args.p_state, revision: row.revision + 1 };
    return { data: row };
  });
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: owner } } }) },
    rpc,
    from: vi.fn((table) => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        maybeSingle: async () => ({ data: structuredClone(row) }),
        range: async () => (salesFail ? { error: { code: 'offline' } } : { data: [] })
      };
      if (table !== 'sales' && table !== 'epav_planner_workspaces') throw new Error('Unexpected table');
      return query;
    })
  };
  return {
    repository: createRemotePlannerRepository(client),
    snapshot,
    rpc,
    failSales: () => {
      salesFail = true;
    },
    switchAccount: () => {
      owner = 'account-b';
    },
    advanceRevision: () => {
      row = { ...row, revision: row.revision + 1 };
    }
  };
}
describe('Planner Supabase repository', () => {
  it('loads and saves the owned workspace with optimistic revision and without embedding sales', async () => {
    const { repository, rpc } = setup();
    const result = await repository.load('2026-10-07');
    expect(result).toMatchObject({ remote: true, volatile: false });
    result.state.customers[0].notes = 'Atualizado';
    const saved = await repository.save(result.state);
    expect(saved.state.customers[0].notes).toBe('Atualizado');
    expect(rpc).toHaveBeenCalledWith('save_epav_planner_workspace', {
      p_state: expect.not.objectContaining({ sales: expect.anything() }),
      p_expected_revision: 1
    });
  });
  it('keeps a committed change when refreshing sales fails and advances the revision', async () => {
    const { repository, failSales, rpc } = setup();
    const { state } = await repository.load('2026-10-07');
    failSales();
    state.customers[0].notes = 'Salvo';
    const saved = await repository.save(state);
    expect(saved.state).toEqual(state);
    expect(saved.syncWarning).toContain('alteração foi salva');
    await repository.save({ ...state, offers: [] });
    expect(rpc.mock.calls[1][1].p_expected_revision).toBe(2);
  });
  it('rejects saving after account changes and rejects stale conflicting edits', async () => {
    const first = setup();
    const { state } = await first.repository.load('2026-10-07');
    first.switchAccount();
    await expect(first.repository.save(state)).rejects.toThrow('A conta mudou');
    expect(first.rpc).not.toHaveBeenCalled();
    const second = setup();
    await second.repository.load('2026-10-07');
    second.advanceRevision();
    await expect(second.repository.save({ ...state, offers: [] })).rejects.toThrow('outra sessão');
  });
  it('loads the workspace even when the independent sales summary fails', async () => {
    const { repository, failSales, snapshot } = setup();
    failSales();
    const result = await repository.load('2026-10-07');
    expect(result.state.customers).toEqual(snapshot.customers);
    expect(result.syncWarning).toContain('histórico de vendas');
  });
});
