import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import { usePlanner } from '../src/products/planner/hooks/usePlanner.js';
import { demoData } from '../src/products/planner/repositories/demoData.js';
import { createPlannerService } from '../src/products/planner/services/plannerService.js';
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
let resource;
function Harness({ service }) {
  resource = usePlanner(service);
  return <span>{resource.state?.value || 'loading'}</span>;
}
describe('Planner synchronization actions', () => {
  it('blocks overlapping reloads and writes and uses the most recent committed state', async () => {
    const read = deferred(),
      write = deferred();
    const service = { load: vi.fn(() => read.promise), update: vi.fn(() => write.promise) };
    render(<Harness service={service} />);
    await act(async () => {
      expect(await resource.act({ type: 'add' })).toBe(false);
      expect(await resource.reload()).toBe(false);
    });
    expect(service.load).toHaveBeenCalledOnce();
    await act(async () => read.resolve({ state: { value: 'first' } }));
    let save;
    act(() => {
      save = resource.act({ type: 'first' });
    });
    await act(async () => {
      expect(await resource.reload()).toBe(false);
      expect(await resource.act({ type: 'second' })).toBe(false);
    });
    await act(async () => {
      write.resolve({ state: { value: 'saved' } });
      await save;
    });
    service.update.mockResolvedValue({ state: { value: 'latest' } });
    await act(async () => {
      await resource.act({ type: 'third' });
    });
    expect(service.update.mock.calls[1][0]).toEqual({ value: 'saved' });
  });
  it('ignores late responses after switching the backing account service', async () => {
    const read = deferred();
    const first = { load: vi.fn(() => read.promise) };
    const second = { load: vi.fn().mockResolvedValue({ state: { value: 'account B' } }) };
    const view = render(<Harness service={first} />);
    view.rerender(<Harness service={second} />);
    await waitFor(() => expect(resource.state?.value).toBe('account B'));
    await act(async () => read.resolve({ state: { value: 'account A' } }));
    expect(resource.state.value).toBe('account B');
  });
  it('preserves loaded data and leaves retry available after a refresh failure', async () => {
    const service = {
      load: vi
        .fn()
        .mockResolvedValueOnce({ state: { value: 'preserved' } })
        .mockRejectedValueOnce(new Error('offline'))
    };
    render(<Harness service={service} />);
    await waitFor(() => expect(resource.state?.value).toBe('preserved'));
    await act(async () => {
      expect(await resource.reload()).toBe(false);
    });
    expect(resource.state.value).toBe('preserved');
    expect(resource.error).toBe('');
    expect(resource.saveError).toBe(true);
    expect(resource.notice).toContain('preservados');
  });
  it('rejects invalid moves and editing a deleted customer instead of recreating it', async () => {
    const state = demoData('2026-10-26');
    const save = vi.fn();
    const service = createPlannerService({ save });
    await expect(service.update(state, { type: 'move', customerId: 'demo-12', weekId: state.weeks[0].id, direction: 0 })).rejects.toThrow(
      'mover'
    );
    await expect(service.update(state, { type: 'customer', customer: { ...state.customers[0], id: 'deleted' } })).rejects.toThrow(
      'não está mais'
    );
    await expect(service.update(state, { type: 'goal', weekId: 'invalid', value: 5 })).rejects.toThrow('semana');
    expect(save).not.toHaveBeenCalled();
  });
});
