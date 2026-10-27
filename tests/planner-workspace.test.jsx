import { render, screen, fireEvent, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseHash } from '../src/app/routes.js';
import { useHashRoute } from '../src/app/useHashRoute.js';
import { demoData } from '../src/products/planner/repositories/demoData.js';
import { attendanceLink, nextAction, selectClients } from '../src/products/planner/models/workspace.js';
import { today, weekStart } from '../src/products/planner/models/planner.js';
import { WeekPlan } from '../src/products/planner/components/WeekPlan.jsx';
import { Performance } from '../src/products/planner/components/Performance.jsx';
import { ClientList } from '../src/products/planner/components/ClientList.jsx';
import { PlannerRoutes } from '../src/products/planner/PlannerRoutes.jsx';
import { createPlannerService } from '../src/products/planner/services/plannerService.js';
import { commercialContext } from '../src/shared/services/commercialContext.js';

function routedService() {
  let state = demoData();
  return createPlannerService({ load: async () => ({ state }), save: async (next) => ({ state: (state = next) }) });
}
afterEach(() => {
  sessionStorage.clear();
  commercialContext.clear();
});
describe('Planner workspace', () => {
  it.each([
    ['#/planner/oportunidades', ['clientes', 'oportunidades']],
    ['#/planner/desempenho', ['resultados']],
    ['#/planner/atendimento/demo-1', ['semana', 'atender', 'demo-1']],
    ['#/planner/pedidos', ['pedidos']]
  ])('keeps the old URL %s usable', (hash, segments) => expect(parseHash(hash).segments).toEqual(segments));
  it('replaces the old URL without adding a history entry', () => {
    function Harness() {
      const route = useHashRoute();
      return <span>{route.raw}</span>;
    }
    window.location.hash = '#/planner/atendimento/demo-1';
    const replace = vi.spyOn(window.history, 'replaceState');
    render(<Harness />);
    expect(window.location.hash).toBe(attendanceLink('demo-1'));
    expect(replace).toHaveBeenCalledOnce();
    replace.mockRestore();
  });
  it('chooses an actionable next step for each stage and never attends a future week', () => {
    const state = demoData(),
      week = state.weeks[0];
    expect(nextAction({ ...state, customers: [] }, { ...week, queue: [] }).label).toBe('Cadastrar primeiro cliente');
    expect(nextAction(state, { ...week, queue: [] }).label).toBe('Escolher clientes da semana');
    expect(nextAction(state, week).href).toBe(attendanceLink('demo-1'));
    state.customers[0].preparation = '';
    expect(nextAction(state, week).href).toBe('#/planner/semana/preparar/demo-1');
    expect(nextAction(state, { ...week, id: '2030-01-07' }).href).toBe('#/planner/semana');
  });
  it('combines search, segmentation, due commitments and compatible opportunities without mutating records', () => {
    const state = demoData(),
      week = state.weeks[0],
      before = structuredClone(state);
    state.commitments[0].due = today();
    expect(selectClients(state, week, { filter: 'due' }).map((c) => c.id)).toEqual(['demo-1']);
    expect(selectClients(state, week, { opportunities: true, campaign: 'fish' }).some((c) => c.id === 'demo-5')).toBe(false);
    expect(selectClients(state, week, { query: 'ErIkA', segment: 'Exploração' }).map((c) => c.id)).toEqual(['demo-4']);
    expect(selectClients(state, week, { filter: 'unplanned' }).every((c) => !week.queue.some((e) => e.customerId === c.id))).toBe(true);
    expect(state.customers).toEqual(before.customers);
  });
  it('paginates a large portfolio and exposes opportunities progressively', () => {
    const state = demoData(),
      week = state.weeks[0];
    state.customers = Array.from({ length: 200 }, (_, i) => ({ ...state.customers[i % 12], id: 'large-' + i, name: 'Cliente ' + i }));
    const { container, rerender } = render(<ClientList state={state} week={week} opportunities act={vi.fn()} onCreate={vi.fn()} />);
    expect(container.querySelectorAll('.planner-client')).toHaveLength(8);
    expect(screen.queryByText('Consultar no Insights')).toBeNull();
    fireEvent.click(screen.getAllByText('Ver sugestões compatíveis')[0]);
    expect(screen.getAllByText('Consultar no Insights').length).toBeGreaterThan(0);
    rerender(<ClientList state={state} week={week} act={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.queryByText('Consultar no Insights')).toBeNull();
  });
  it('can add, prepare and organize without leaving the week', async () => {
    const service = routedService();
    const { rerender } = render(<PlannerRoutes route={{ segments: ['semana'] }} service={service} />);
    await screen.findByText('Sua fila de atendimento');
    fireEvent.click(screen.getByText('Escolher clientes'));
    fireEvent.click(screen.getByText('Adicionar Pedro (exemplo)'));
    await screen.findByText('Cliente adicionado à semana.');
    expect(screen.getByText('8. Pedro (exemplo)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Organizar Pedro (exemplo)' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Tornar reserva' }));
    await screen.findByText('Papel atualizado.');
    rerender(<PlannerRoutes route={{ segments: ['semana', 'preparar', 'demo-8'] }} service={service} />);
    fireEvent.input(screen.getByLabelText('Sua abordagem'), { target: { value: 'Perguntar sobre a rotina.' } });
    fireEvent.click(screen.getByText('Salvar preparação'));
    await screen.findByText('Abordagem salva.');
    fireEvent.click(screen.getByRole('button', { name: 'Organizar Pedro (exemplo)' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover da semana' }));
    await screen.findByText('Cliente removido da fila.');
    expect(screen.queryByText('8. Pedro (exemplo)')).toBeNull();
  });
  it('moves a queue entry with its menu and disables changes to recorded outcomes', () => {
    const state = demoData(),
      week = state.weeks[0],
      act = vi.fn();
    render(<WeekPlan state={state} week={week} act={act} />);
    fireEvent.click(screen.getByRole('button', { name: 'Organizar Denis (exemplo)' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Subir na fila' }));
    expect(act.mock.calls[0][0]).toMatchObject({ type: 'move', direction: -1, customerId: 'demo-2' });
  });
  it('records a contextual attendance once and advances within the week', async () => {
    const service = routedService();
    render(<PlannerRoutes route={{ segments: ['semana', 'atender', 'demo-1'] }} service={service} />);
    await screen.findByText('Registrar e seguir');
    fireEvent.click(screen.getByRole('button', { name: /Resultado do atendimento/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Falar depois' }));
    fireEvent.input(screen.getByLabelText('O que aprender com a conversa?'), { target: { value: 'Confirmar a lista.' } });
    fireEvent.click(screen.getByText('Salvar e próximo cliente'));
    await waitFor(() => expect(window.location.hash).toBe(attendanceLink('demo-2')));
    const { state } = await service.load();
    expect(state.interactions.filter((i) => i.weekId === weekStart())).toHaveLength(1);
    expect(state.commitments.some((i) => i.text === 'Confirmar a lista.')).toBe(true);
  });
  it('keeps Writer handoff contextual without registering a sale', async () => {
    const service = routedService();
    render(<PlannerRoutes route={{ segments: ['semana', 'atender', 'demo-1'] }} service={service} />);
    fireEvent.click(await screen.findByText('Criar pedido no Writer'));
    expect(commercialContext.get()).toMatchObject({ customerId: 'demo-1', returnTo: attendanceLink('demo-1'), orderStatus: 'pending' });
    const { state } = await service.load();
    expect(state.interactions.filter((i) => i.weekId === weekStart())).toHaveLength(0);
  });
  it('shows results without financial duplicates and distinguishes missing conversion', () => {
    const state = demoData();
    render(<Performance state={state} week={state.weeks[0]} />);
    expect(screen.getByText('Conversão de atendimento').parentElement.textContent).toContain('—');
    expect(screen.queryByText('Ticket médio')).toBeNull();
    expect(within(screen.getByRole('table')).queryByText('Vendas')).toBeNull();
    expect(screen.getByText('Sem conversas registradas nesta semana')).toBeTruthy();
  });
});
