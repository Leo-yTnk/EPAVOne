import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { Overview } from '../src/products/planner/components/Overview.jsx';
import { demoData } from '../src/products/planner/repositories/demoData.js';
import { weekStart, shiftDay } from '../src/products/planner/models/planner.js';

describe('Planner contextual guidance', () => {
  it('guides new users without a permanent tutorial', () => {
    const state = { ...demoData(), customers: [], commitments: [] };
    render(<Overview state={state} week={{ id: weekStart(), goal: 7, queue: [] }} />);
    expect(screen.getByRole('link', { name: 'Cadastrar primeiro cliente' }).getAttribute('href')).toBe('#/planner/clientes');
    expect(screen.queryByText('Por onde começar')).toBeNull();
  });
  it('offers week review instead of starting attendance in a future week', () => {
    const state = demoData();
    const week = { ...state.weeks[0], id: shiftDay(weekStart(), 7) };
    render(<Overview state={state} week={week} />);
    expect(screen.queryByRole('link', { name: 'Iniciar atendimento' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Revisar semana' }).getAttribute('href')).toBe('#/planner/semana');
  });
});
