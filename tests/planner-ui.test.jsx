import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlannerRoutes } from '../src/products/planner/PlannerRoutes.jsx';
import { demoData } from '../src/products/planner/repositories/demoData.js';
import { createPlannerService } from '../src/products/planner/services/plannerService.js';
import { Attendance } from '../src/products/planner/components/Attendance.jsx';
import { commercialContext, insightsProductLink } from '../src/shared/services/commercialContext.js';
import { PlannerHandoff } from '../src/products/writer/components/PlannerHandoff.jsx';
import { OfferList } from '../src/products/planner/components/OfferList.jsx';
import { weekStart } from '../src/products/planner/models/planner.js';
const NOW = '2026-10-07';
function serviceFor(current = demoData(NOW)) {
  return createPlannerService({
    load: async () => ({ state: current, volatile: false }),
    save: async (state) => {
      current = state;
      return { state, volatile: false };
    }
  });
}
afterEach(() => {
  commercialContext.clear();
  sessionStorage.clear();
  vi.useRealTimers();
});
describe('Planner flow', () => {
  it('renders loading, error and retry then the complete overview', async () => {
    let resolve;
    const service = {
      load: vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockImplementation(
          () =>
            new Promise((done) => {
              resolve = done;
            })
        )
    };
    render(<PlannerRoutes service={service} />);
    expect(screen.getByLabelText('Carregando planejamento')).toBeTruthy();
    await screen.findByText('offline');
    fireEvent.click(screen.getByText('Tentar novamente'));
    await waitFor(() => expect(resolve).toBeTruthy());
    resolve({ state: demoData(NOW), volatile: false });
    await screen.findByText('O próximo passo tem nome.');
    expect(screen.getByText('Modo demonstração')).toBeTruthy();
  });
  it('searches accent-insensitively, shows empty and resets filters', async () => {
    render(<PlannerRoutes route={{ segments: ['clientes'] }} service={serviceFor()} />);
    await screen.findByText('Bruna (exemplo)');
    fireEvent.input(screen.getByLabelText('Buscar na carteira'), { target: { value: 'nao existe' } });
    expect(screen.getByText('Nenhum cliente com esses filtros')).toBeTruthy();
    fireEvent.click(screen.getByText('Limpar filtros'));
    expect(screen.getByText('Bruna (exemplo)')).toBeTruthy();
  });
  it('preserves client search when returning from a profile', async () => {
    const service = serviceFor();
    const { rerender } = render(<PlannerRoutes route={{ segments: ['clientes'] }} service={service} />);
    await screen.findByText('Bruna (exemplo)');
    fireEvent.input(screen.getByLabelText('Buscar na carteira'), { target: { value: 'Erika' } });
    rerender(<PlannerRoutes route={{ segments: ['clientes', 'demo-4'] }} service={service} />);
    await screen.findByText('Preparar a conversa');
    rerender(<PlannerRoutes route={{ segments: ['clientes'] }} service={service} />);
    expect(screen.getByLabelText('Buscar na carteira').value).toBe('Erika');
    expect(screen.queryByText('Bruna (exemplo)')).toBeNull();
  });
  it('creates a customer from the empty portfolio', async () => {
    const current = demoData(NOW);
    current.customers = [];
    current.interactions = [];
    current.commitments = [];
    current.weeks.forEach((week) => {
      week.queue = [];
    });
    render(<PlannerRoutes route={{ segments: ['clientes'] }} service={serviceFor(current)} />);
    await screen.findByText('Sua carteira começa aqui');
    fireEvent.click(screen.getAllByText('Novo cliente')[0]);
    fireEvent.input(screen.getByLabelText('Nome'), { target: { value: 'Cliente cadastrado' } });
    fireEvent.click(screen.getByText('Salvar perfil'));
    await screen.findByText('Cliente cadastrado');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('shows missing customers and unknown routes with actionable recovery', async () => {
    const { rerender } = render(<PlannerRoutes route={{ segments: ['clientes', 'missing'] }} service={serviceFor()} />);
    await screen.findByText('Cliente não encontrado');
    rerender(<PlannerRoutes route={{ segments: ['unknown'] }} service={serviceFor()} />);
    expect(screen.getByText('Essa área não existe.')).toBeTruthy();
  });
  it('records outcome and advances to the next pending customer', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(NOW + 'T15:00:00Z'));
    const current = demoData(NOW);
    const act = vi.fn().mockResolvedValue(true);
    render(<Attendance state={current} week={current.weeks[0]} customerId="demo-1" act={act} busy={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Resultado do atendimento/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Interessado' }));
    fireEvent.click(screen.getByText('Salvar e próximo cliente'));
    await waitFor(() => expect(window.location.hash).toBe('#/planner/atendimento/demo-2'));
    expect(act.mock.calls[0][0]).toMatchObject({ outcome: 'interested', customerId: 'demo-1' });
  });
  it('preserves the attendance when saving fails', async () => {
    const current = demoData(NOW);
    current.weeks[0].id = weekStart();
    window.location.hash = '#/planner/atendimento/demo-1';
    render(<Attendance state={current} week={current.weeks[0]} customerId="demo-1" act={vi.fn().mockResolvedValue(false)} busy={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Resultado do atendimento/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Indisponível' }));
    fireEvent.click(screen.getByText('Salvar e próximo cliente'));
    await waitFor(() => expect(window.location.hash).toBe('#/planner/atendimento/demo-1'));
  });
  it('links Insights query without identity in URL and retains return context', () => {
    const current = demoData(NOW);
    render(<OfferList customer={current.customers[0]} state={current} weekId={current.weeks[0].id} returnTo="#/planner/clientes/demo-1" />);
    const link = screen.getAllByText('Consultar no Insights')[0].closest('a');
    fireEvent.click(link);
    expect(link.getAttribute('href')).toBe(insightsProductLink('frango'));
    expect(commercialContext.get()).toMatchObject({ customerId: 'demo-1', returnTo: '#/planner/clientes/demo-1' });
  });
});
describe('Writer association contract', () => {
  it('requires explicit Excel mapping and confirmation, and allows cancel', () => {
    const apply = vi.fn();
    const clients = [{ name: 'Maria do Excel', room: 'A', phone: '111' }];
    render(<PlannerHandoff context={{ customerName: 'Maria Planner' }} template={{ clients }} onApply={apply} />);
    fireEvent.click(screen.getByText('Usar este cliente'));
    expect(screen.getByText('Confirmar cliente').closest('button').disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Cadastro do cliente no Excel/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Maria do Excel · A' }));
    fireEvent.click(screen.getByText('Confirmar cliente'));
    expect(apply).toHaveBeenCalledWith(clients[0]);
    fireEvent.click(screen.getByText('Usar este cliente'));
    fireEvent.click(screen.getByText('Manter pedido atual'));
    expect(apply).toHaveBeenCalledTimes(1);
  });
  it('does not mark generated orders as bought, ignores outdated contexts', () => {
    const first = commercialContext.begin({ customerId: '1' });
    commercialContext.exported(first.id);
    expect(commercialContext.get().orderStatus).toBe('exported');
    const second = commercialContext.begin({ customerId: '2' });
    commercialContext.exported(first.id);
    expect(commercialContext.get()).toEqual(second);
  });
});
