import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientPreparation } from '../src/products/planner/components/ClientPreparation.jsx';
import { WeekPlan } from '../src/products/planner/components/WeekPlan.jsx';
import { ClientList } from '../src/products/planner/components/ClientList.jsx';
import { demoData } from '../src/products/planner/repositories/demoData.js';

afterEach(() => sessionStorage.clear());
describe('Planner critical review regressions', () => {
  it('updates clean preparation after editing the same client in its profile', () => {
    const state = demoData(),
      customer = state.customers[0],
      props = { week: state.weeks[0], act: vi.fn() };
    const { rerender } = render(<ClientPreparation customer={customer} {...props} />);
    rerender(<ClientPreparation customer={{ ...customer, preparation: 'Nova abordagem salva pelo perfil.' }} {...props} />);
    expect(screen.getByLabelText('Sua abordagem').value).toBe('Nova abordagem salva pelo perfil.');
    expect(screen.getByRole('button', { name: 'Salvar preparação' }).disabled).toBe(true);
    expect(props.act).not.toHaveBeenCalled();
  });
  it('preserves an unsaved preparation on refresh and allows recovery of the saved version', () => {
    const state = demoData(),
      customer = state.customers[0],
      props = { week: state.weeks[0], act: vi.fn() };
    const { rerender } = render(<ClientPreparation customer={customer} {...props} />);
    fireEvent.input(screen.getByLabelText('Sua abordagem'), { target: { value: 'Rascunho em andamento' } });
    rerender(<ClientPreparation customer={{ ...customer, preparation: 'Versão de outro dispositivo' }} {...props} />);
    expect(screen.getByLabelText('Sua abordagem').value).toBe('Rascunho em andamento');
    expect(screen.getByText('A preparação salva foi atualizada')).toBeTruthy();
    fireEvent.click(screen.getByText('Usar preparação salva'));
    expect(screen.getByLabelText('Sua abordagem').value).toBe('Versão de outro dispositivo');
    expect(screen.queryByText('A preparação salva foi atualizada')).toBeNull();
    expect(props.act).not.toHaveBeenCalled();
  });
  it('keeps the draft after a failed save and clears the conflict once that draft is saved', async () => {
    const state = demoData(),
      customer = state.customers[0],
      act = vi.fn().mockResolvedValue(false);
    const props = { week: state.weeks[0], act };
    const { rerender } = render(<ClientPreparation customer={customer} {...props} />);
    fireEvent.input(screen.getByLabelText('Sua abordagem'), { target: { value: 'Minha preparação' } });
    rerender(<ClientPreparation customer={{ ...customer, preparation: 'Atualização recebida' }} {...props} />);
    fireEvent.click(screen.getByText('Salvar preparação'));
    await waitFor(() => expect(act).toHaveBeenCalledOnce());
    expect(screen.getByLabelText('Sua abordagem').value).toBe('Minha preparação');
    rerender(<ClientPreparation customer={{ ...customer, preparation: 'Minha preparação' }} {...props} />);
    expect(screen.queryByText('A preparação salva foi atualizada')).toBeNull();
    expect(screen.getByRole('button', { name: 'Salvar preparação' }).disabled).toBe(true);
  });
  it('refreshes a clean weekly goal and preserves a local goal being edited', () => {
    const state = demoData(),
      week = state.weeks[0],
      props = { state, act: vi.fn() };
    const { rerender } = render(<WeekPlan week={week} {...props} />);
    rerender(<WeekPlan week={{ ...week, goal: 10 }} {...props} />);
    expect(screen.getByLabelText('Meta de atendimentos').value).toBe('10');
    fireEvent.input(screen.getByLabelText('Meta de atendimentos'), { target: { value: '12' } });
    rerender(<WeekPlan week={{ ...week, goal: 11 }} {...props} />);
    expect(screen.getByLabelText('Meta de atendimentos').value).toBe('12');
    fireEvent.click(screen.getByText('Usar meta salva'));
    expect(screen.getByLabelText('Meta de atendimentos').value).toBe('11');
  });
  it('does not silently prepare another customer when a deep link points outside the queue', () => {
    const state = demoData(),
      act = vi.fn();
    render(<WeekPlan state={state} week={state.weeks[0]} mode="preparar" customerId="demo-12" act={act} />);
    expect(screen.getByText('Cliente fora desta semana')).toBeTruthy();
    expect(screen.queryByLabelText('Sua abordagem')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Atender Bruna (exemplo)' })).toBeNull();
    expect(act).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Ver fila da semana'));
    expect(window.location.hash).toBe('#/planner/semana');
  });
  it('collapses active filters without clearing the selected filter or lying about its expanded state', () => {
    const state = demoData();
    render(<ClientList state={state} week={state.weeks[0]} act={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    fireEvent.click(screen.getByRole('button', { name: /Situação/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Intenção de compra' }));
    const toggle = screen.getByRole('button', { name: 'Filtros · ativos' });
    expect(screen.getAllByText('Quer comprar')).toHaveLength(2);
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: /Situação/ })).toBeNull();
    expect(screen.getAllByText('Quer comprar')).toHaveLength(2);
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /Situação/ }).textContent).toContain('Intenção de compra');
  });
  it('does not render an empty stitched queue surface before the first customer is selected', () => {
    const state = demoData();
    const { container } = render(<WeekPlan state={state} week={{ ...state.weeks[0], queue: [] }} act={vi.fn()} />);
    expect(screen.getByText('Planeje sua primeira conversa')).toBeTruthy();
    expect(container.querySelector('.planner-queue')).toBeNull();
  });
});
