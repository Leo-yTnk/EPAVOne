import { act } from 'preact/test-utils';
import { render } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';
import { useWriterExport } from '../src/products/writer/services/useWriterExport.js';
import { exportOrder, downloadExport } from '../src/products/writer/services/exportService.js';
vi.mock('../src/products/writer/services/exportService.js', () => ({ exportOrder: vi.fn(), downloadExport: vi.fn() }));
let flow;
const template = {
  filename: 'file.xlsx',
  period: {},
  clients: [{ name: 'Maria', room: 'A' }],
  students: [],
  stores: [],
  products: [{ name: 'Frango', price: 10 }]
};
const order = { client: 'Maria', room: 'A', lines: [{ name: 'Frango', quantity: 2 }], phone: '11' };
function Harness() {
  flow = useWriterExport({ template, order, handoff: { exported: vi.fn() }, setBusy: vi.fn(), setSuccess: vi.fn() });
  return null;
}
it('exposes sale registration only after a successful download and reuses the identity on retries', async () => {
  exportOrder.mockResolvedValue({ filename: 'order.xlsx', bytes: new Uint8Array(), count: 1 });
  render(<Harness />);
  expect(flow.draft).toBeNull();
  await act(async () => {
    await flow.download();
  });
  const id = flow.draft.id;
  expect(downloadExport).toHaveBeenCalled();
  expect(flow.draft.customer.name).toBe('Maria');
  await act(async () => {
    await flow.download();
  });
  expect(flow.draft.id).toBe(id);
  act(() => flow.clear());
  expect(flow.draft).toBeNull();
  act(() => flow.reset());
  await act(async () => {
    await flow.download();
  });
  expect(flow.draft.id).not.toBe(id);
});
