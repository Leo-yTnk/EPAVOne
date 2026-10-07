import { render, screen, fireEvent } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { usePlannerHandoff } from '../src/products/writer/services/usePlannerHandoff.js';
import { commercialContext } from '../src/shared/services/commercialContext.js';
import { Button } from '../src/design-system/components/index.js';
function Harness({ order, change }) {
  const handoff = usePlannerHandoff();
  return (
    <>
      <Button onClick={() => handoff.apply({ name: 'Client Excel', room: 'B', phone: '111' }, order, change, () => {})}>Associar</Button>
      <Button onClick={handoff.exported}>Exportar</Button>
      <Button onClick={handoff.reset}>Limpar vínculo</Button>
    </>
  );
}
afterEach(() => commercialContext.clear());
it('maps only an explicit workbook client and exports only the linked context', () => {
  const context = commercialContext.begin({ customerId: 'planner-id', customerName: 'Client Planner' });
  const change = vi.fn();
  render(<Harness order={{ room: 'A', student: 'Student' }} change={change} />);
  fireEvent.click(screen.getByText('Exportar'));
  expect(commercialContext.get().orderStatus).toBe('pending');
  fireEvent.click(screen.getByText('Associar'));
  expect(change).toHaveBeenCalledWith({ client: 'Client Excel', room: 'B', student: '', phone: '111', cpfOverride: undefined });
  fireEvent.click(screen.getByText('Exportar'));
  expect(commercialContext.get()).toMatchObject({ id: context.id, orderStatus: 'exported' });
  commercialContext.begin({ customerId: 'another' });
  fireEvent.click(screen.getByText('Limpar vínculo'));
  fireEvent.click(screen.getByText('Exportar'));
  expect(commercialContext.get().orderStatus).toBe('pending');
});
