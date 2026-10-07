import { describe, expect, it, vi, afterEach } from 'vitest';
import { demoData } from '../src/products/planner/repositories/demoData.js';
import {
  compatible,
  daysSince,
  lastInteraction,
  performance,
  priority,
  recommendations,
  weekStart
} from '../src/products/planner/models/planner.js';
import { createPlannerService } from '../src/products/planner/services/plannerService.js';
import { createPlannerRepository } from '../src/products/planner/repositories/plannerRepository.js';
const NOW = '2026-10-07';
const state = () => demoData(NOW);
const repository = { save: async (value) => ({ state: value, volatile: false }) };
afterEach(() => vi.useRealTimers());
describe('Planner decisions', () => {
  it('uses Monday weeks, including Sunday and month boundaries', () => {
    expect(weekStart('2026-10-11')).toBe('2026-10-05');
    expect(weekStart('2026-11-01')).toBe('2026-10-26');
    expect(daysSince(null, NOW)).toBeNull();
    expect(daysSince('2026-10-10', NOW)).toBe(0);
  });
  it('hard excludes restricted categories even when preference overlaps', () => {
    const current = state();
    const customer = { ...current.customers[0], preferences: ['pescados', 'padaria'], restrictions: ['pescados'] };
    expect(
      compatible(
        customer,
        current.offers.find((offer) => offer.id === 'fish')
      )
    ).toBe(false);
    expect(recommendations(customer, current.offers).map((offer) => offer.id)).toEqual(['bread']);
  });
  it('never proposes unsupported offers for unknown preferences', () => {
    const current = state();
    expect(recommendations({ ...current.customers[0], preferences: [] }, current.offers)).toEqual([]);
  });
  it('explains all contributions and penalizes recent rejection and completion', () => {
    const current = state();
    const customer = current.customers[0];
    const before = priority(customer, current, NOW);
    current.interactions.push({ id: 'reject', customerId: customer.id, date: NOW, outcome: 'declined' });
    current.weeks[0].queue[0].outcome = 'declined';
    const result = priority(customer, current, NOW);
    expect(result.score).toBeLessThan(before.score);
    expect(result.factors.some((factor) => factor.points === -30)).toBe(true);
    expect(result.factors.some((factor) => factor.points === -40)).toBe(true);
    expect(result.score).toBe(
      Math.max(
        0,
        Math.min(
          100,
          result.factors.reduce((sum, item) => sum + item.points, 0)
        )
      )
    );
  });
  it('does not count unavailable as last contact or increase conversion denominator', () => {
    const current = state();
    const customer = current.customers[0];
    const last = lastInteraction(customer, current.interactions);
    current.interactions.push({ customerId: customer.id, date: NOW, weekId: current.weeks[0].id, outcome: 'unavailable' });
    expect(lastInteraction(customer, current.interactions)).toEqual(last);
    expect(performance(current, current.weeks[0])).toMatchObject({ attempts: 1, attended: 0, buyers: 0, conversion: 0 });
  });
  it('deduplicates contacts and buyers while counting measured purchases', () => {
    const current = state();
    const weekId = current.weeks[0].id;
    current.interactions.push(
      { customerId: 'demo-1', date: NOW, weekId, outcome: 'interested' },
      { customerId: 'demo-1', date: NOW, weekId, outcome: 'bought', amountCents: 10000, units: 4 },
      { customerId: 'demo-2', date: NOW, weekId, outcome: 'bought', amountCents: 20000, units: 8 },
      { customerId: 'demo-3', date: NOW, weekId, outcome: 'bought' }
    );
    expect(performance(current, current.weeks[0])).toMatchObject({
      attended: 3,
      buyers: 3,
      conversion: 100,
      revenue: 30000,
      ticket: 15000,
      ipc: 6,
      measured: 2,
      unmeasured: 1
    });
  });
});
describe('Planner commands', () => {
  const service = createPlannerService(repository);
  it('adds once, changes role, moves, removes and preserves input', async () => {
    const current = state();
    const original = structuredClone(current);
    const add = { type: 'add', customerId: 'demo-12', weekId: current.weeks[0].id };
    let result = (await service.update(current, add)).state;
    result = (await service.update(result, add)).state;
    expect(result.weeks[0].queue.filter((entry) => entry.customerId === 'demo-12')).toHaveLength(1);
    result = (await service.update(result, { ...add, type: 'role' })).state;
    expect(result.weeks[0].queue.at(-1).role).toBe('reserve');
    result = (await service.update(result, { ...add, type: 'move', direction: -1 })).state;
    expect(result.weeks[0].queue.at(-2).customerId).toBe('demo-12');
    result = (await service.update(result, { ...add, type: 'remove' })).state;
    expect(result.weeks[0].queue.some((entry) => entry.customerId === 'demo-12')).toBe(false);
    expect(current).toEqual(original);
  });
  it('creates an empty future week and rejects invalid goals', async () => {
    const result = await service.update(state(), { type: 'goal', weekId: '2026-10-12', value: 7 });
    expect(result.state.weeks.at(-1)).toEqual({ id: '2026-10-12', goal: 7, queue: [] });
    await expect(service.update(state(), { type: 'goal', value: 0 })).rejects.toThrow('meta');
  });
  it('validates conflicting preferences, names and frequency', async () => {
    for (const patch of [{ name: ' ' }, { frequencyDays: 0 }, { preferences: ['pescados'], restrictions: ['pescados'] }]) {
      await expect(service.update(state(), { type: 'customer', customer: { ...state().customers[0], ...patch } })).rejects.toThrow();
    }
  });
  it('registers a purchase exactly once, updates metrics and preserves completed queue history', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW + 'T15:00:00Z'));
    const command = { type: 'outcome', customerId: 'demo-1', weekId: '2026-10-05', outcome: 'bought', amountCents: 12000, units: 5 };
    const result = (await service.update(state(), command)).state;
    expect(performance(result, result.weeks[0])).toMatchObject({ buyers: 1, ticket: 12000, ipc: 5 });
    await expect(service.update(result, command)).rejects.toThrow('já foi registrado');
    await expect(service.update(result, { ...command, type: 'remove' })).rejects.toThrow('histórico');
  });
  it.each(['interested', 'later', 'declined', 'unavailable'])('records %s and creates follow-up only for later', async (outcome) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW + 'T15:00:00Z'));
    const result = (
      await service.update(state(), {
        type: 'outcome',
        customerId: 'demo-2',
        weekId: '2026-10-05',
        outcome,
        followUp: '2026-10-08',
        note: 'Retomar seleção'
      })
    ).state;
    expect(result.interactions.at(-1).outcome).toBe(outcome);
    expect(result.commitments.length).toBe(outcome === 'later' ? 2 : 1);
  });
  it('rejects invalid outcomes, purchase quantities, past followup and other weeks', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW + 'T15:00:00Z'));
    for (const patch of [
      { outcome: '' },
      { outcome: 'bought', amountCents: 0, units: 2 },
      { outcome: 'bought', amountCents: 1, units: 1.5 },
      { outcome: 'later', followUp: '2026-10-01' },
      { weekId: '2026-09-28', outcome: 'interested' }
    ]) {
      await expect(service.update(state(), { type: 'outcome', customerId: 'demo-1', weekId: '2026-10-05', ...patch })).rejects.toThrow();
    }
  });
  it('creates and resolves commitments without changing history', async () => {
    let result = (await service.update(state(), { type: 'commitment', customerId: 'demo-2', text: 'Confirmar escolha', due: NOW })).state;
    const id = result.commitments.at(-1).id;
    result = (await service.update(result, { type: 'resolve', customerId: 'demo-2', id })).state;
    expect(result.commitments.at(-1).done).toBe(true);
    expect(result.interactions).toEqual(state().interactions);
  });
});
describe('local repository', () => {
  it('roundtrips changes and preserves malformed data without overwriting', async () => {
    const storage = new Map();
    const adapter = { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) };
    const repo = createPlannerRepository(() => adapter);
    expect((await repo.load(NOW)).state.customers).toHaveLength(12);
    const updated = state();
    updated.customers[0].notes = 'Persistido';
    await repo.save(updated);
    expect((await repo.load(NOW)).state.customers[0].notes).toBe('Persistido');
    adapter.setItem('epavone-planner-demo-v1', '{bad');
    await expect(repo.load(NOW)).rejects.toThrow('ler o planejamento');
    expect(adapter.getItem('epavone-planner-demo-v1')).toBe('{bad');
  });
  it('retains unsaved session edits when writes fail but reads still work', async () => {
    let raw = JSON.stringify(state());
    const repo = createPlannerRepository(() => ({
      getItem: () => raw,
      setItem: () => {
        throw new Error('quota');
      }
    }));
    await repo.load(NOW);
    const changed = state();
    changed.customers[0].notes = 'Latest in memory';
    await repo.save(changed);
    expect((await repo.load(NOW)).state.customers[0].notes).toBe('Latest in memory');
    expect((await repo.load(NOW)).volatile).toBe(true);
    expect(JSON.parse(raw).customers[0].notes).toBe('');
  });
  it('handles denied storage with explicit volatile mode and session memory', async () => {
    const repo = createPlannerRepository(() => {
      throw new Error('denied');
    });
    expect((await repo.load(NOW)).volatile).toBe(true);
    const updated = state();
    updated.customers[0].notes = 'Session';
    expect((await repo.save(updated)).volatile).toBe(true);
    expect((await repo.load(NOW)).state.customers[0].notes).toBe('Session');
  });
});
