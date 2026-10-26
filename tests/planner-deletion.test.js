import { describe, expect, it, vi } from 'vitest';
import { demoData } from '../src/products/planner/repositories/demoData.js';
import { createPlannerService } from '../src/products/planner/services/plannerService.js';
import { validateSnapshot } from '../src/products/planner/repositories/plannerRepository.js';
import { performance } from '../src/products/planner/models/planner.js';

describe('Customer deletion', () => {
  it('removes the profile, commitments and queues while preserving immutable outcomes and revenue', async () => {
    const state = demoData('2026-10-07');
    const customerId = state.customers[0].id;
    state.interactions.push({
      id: 'sale',
      customerId,
      date: '2026-10-07',
      weekId: state.weeks[0].id,
      outcome: 'bought',
      amountCents: 9500,
      units: 3
    });
    const save = vi.fn(async (state) => ({ state: validateSnapshot(state) }));
    const result = await createPlannerService({ save }).update(state, { type: 'deleteCustomer', customerId });
    expect(result.state.customers.some((item) => item.id === customerId)).toBe(false);
    expect(result.state.commitments.some((item) => item.customerId === customerId)).toBe(false);
    expect(result.state.weeks.every((week) => week.queue.every((item) => item.customerId !== customerId))).toBe(true);
    expect(result.state.interactions).toEqual(state.interactions);
    expect(result.state.removedCustomerIds).toEqual([customerId]);
    expect(performance(result.state, state.weeks[0]).revenue).toBe(performance(state, state.weeks[0]).revenue);
    expect(state.customers.some((item) => item.id === customerId)).toBe(true);
    await expect(createPlannerService({ save }).update(result.state, { type: 'deleteCustomer', customerId })).rejects.toThrow(
      'Cliente não encontrado'
    );
  });
  it('does not accept unknown historical customer references', () => {
    const state = demoData('2026-10-07');
    state.interactions.push({ customerId: 'missing', date: '2026-10-07', outcome: 'bought' });
    expect(() => validateSnapshot(state)).toThrow('Histórico');
    state.removedCustomerIds = [state.customers[0].id];
    expect(() => validateSnapshot(state)).toThrow('Referências');
  });
});
