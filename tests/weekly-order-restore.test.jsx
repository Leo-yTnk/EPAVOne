import { render, waitFor } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import { useWeeklyOrderRestore } from '../src/app/useWeeklyOrderRestore.js';
import { weeklyOrder } from '../src/shared/services/weeklyOrder.js';
import { sessionTemplate } from '../src/products/writer/services/sessionTemplate.js';
import { importTemplate } from '../src/products/writer/services/templateService.js';
vi.mock('../src/products/writer/services/sessionTemplate.js', () => ({
  sessionTemplate: { load: vi.fn() },
  restoreTemplateFile: (value) => value
}));
vi.mock('../src/products/writer/services/templateService.js', () => ({ importTemplate: vi.fn() }));
function Harness({ product = 'insights' }) {
  useWeeklyOrderRestore(product);
  return null;
}
const template = {
  filename: 'week.xlsx',
  period: { start: '2026-10-26', end: '2026-10-31' },
  products: [{ name: 'Produto', code: '123', price: 10 }],
  clients: [{ cpf: 'private' }]
};
afterEach(() => {
  weeklyOrder.attach(null);
  vi.clearAllMocks();
});
it('restores the public product projection when starting outside Writer', async () => {
  sessionTemplate.load.mockResolvedValue({ name: 'week.xlsx' });
  importTemplate.mockResolvedValue(template);
  render(<Harness />);
  await waitFor(() => expect(weeklyOrder.get().template?.filename).toBe('week.xlsx'));
  expect(weeklyOrder.get().template.clients).toBeUndefined();
});
it('does not resurrect an older attachment after removal during restoration', async () => {
  let resolve;
  sessionTemplate.load.mockResolvedValue({ name: 'old.xlsx' });
  importTemplate.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      })
  );
  render(<Harness />);
  await waitFor(() => expect(resolve).toBeTruthy());
  act(() => weeklyOrder.attach(null));
  await act(async () => resolve(template));
  expect(weeklyOrder.get().template).toBeNull();
});
