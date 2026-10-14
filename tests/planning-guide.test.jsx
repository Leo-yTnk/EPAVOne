import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { PlanningGuide } from '../src/products/planner/components/PlanningGuide.jsx';
import { Overview } from '../src/products/planner/components/Overview.jsx';
import { demoData } from '../src/products/planner/repositories/demoData.js';
import { weekStart, shiftDay } from '../src/products/planner/models/planner.js';
describe('Planner next steps', () => {
  it('guides an empty portfolio, an empty week and unprepared conversations', () => {
    const state = demoData();
    const week = { id: weekStart(), goal: 7, queue: [] };
    const { rerender } = render(<PlanningGuide state={{ ...state, customers: [] }} week={week} />);
    expect(screen.getByRole('link', { name: 'Cadastrar primeiro cliente' }).getAttribute('href')).toBe('#/planner/clientes');
    rerender(<PlanningGuide state={state} week={week} />);
    expect(screen.getByRole('link', { name: 'Escolher clientes da semana' })).toBeTruthy();
    const customer = { ...state.customers[0], preparation: '' };
    rerender(
      <PlanningGuide
        state={{ ...state, customers: [customer] }}
        week={{ ...week, queue: [{ customerId: customer.id, role: 'primary' }] }}
      />
    );
    expect(screen.getByRole('link', { name: 'Preparar próxima conversa' }).getAttribute('href')).toBe(`#/planner/clientes/${customer.id}`);
  });
  it('offers week review instead of starting attendance in a future week', () => {
    const state = demoData();
    const week = { ...state.weeks[0], id: shiftDay(weekStart(), 7) };
    render(<Overview state={state} week={week} />);
    expect(screen.queryByRole('link', { name: 'Iniciar atendimento' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Revisar semana' }).getAttribute('href')).toBe('#/planner/semana');
  });
});
