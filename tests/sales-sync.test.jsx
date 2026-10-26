import { act } from 'preact/test-utils';
import { render, waitFor } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';
import { useSales } from '../src/products/planner/sales/useSales.js';
let resource;
function Harness({ repository, start = '2026-10-01' }) {
  resource = useSales(true, start, '2026-10-26', repository);
  return null;
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
it('ignores pre-save reads and reloads the most recent date range after a save', async () => {
  const old = deferred(),
    write = deferred();
  const repository = {
    list: vi
      .fn()
      .mockImplementationOnce(() => old.promise)
      .mockResolvedValue([]),
    save: vi.fn(() => write.promise)
  };
  const view = render(<Harness repository={repository} />);
  let result;
  act(() => {
    result = resource.save({ id: 'sale' });
  });
  view.rerender(<Harness repository={repository} start="2026-10-10" />);
  await act(async () => {
    old.resolve([{ id: 'stale' }]);
  });
  expect(resource.rows).toEqual([]);
  await act(async () => {
    write.resolve({});
    await result;
  });
  expect(repository.list).toHaveBeenLastCalledWith('2026-10-10', '2026-10-26');
});
it('preserves the editor on write failure and releases the lock for a retry', async () => {
  const repository = {
    list: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({})
  };
  render(<Harness repository={repository} />);
  await waitFor(() => expect(resource.loading).toBe(false));
  await act(async () => expect(await resource.save({ id: 'sale' })).toBe(false));
  expect(resource.error).toBe('offline');
  await act(async () => expect(await resource.save({ id: 'sale' })).toBe(true));
  expect(repository.save).toHaveBeenCalledTimes(2);
});
