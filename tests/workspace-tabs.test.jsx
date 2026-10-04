import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '../src/app/AppShell.jsx';
import { Tabs } from '../src/design-system/components/Tabs.jsx';
import { HomePage } from '../src/products/home/HomePage.jsx';

const shell = (route) => (
  <AppShell route={route} theme="light" onToggleTheme={vi.fn()}>
    Conteúdo
  </AppShell>
);
describe('App workspace tabs', () => {
  it('remembers the last deep page in each app and connects the selected tab to its panel', () => {
    const { rerender } = render(shell({ product: 'insights', segments: ['produtos', 'categoria', 'aves'] }));
    expect(screen.getByRole('tab', { name: 'Insights' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'Insights' }).id).toBe('workspace-panel');
    fireEvent.click(screen.getByRole('tab', { name: 'Writer' }));
    expect(window.location.hash).toBe('#/writer');
    rerender(shell({ product: 'writer', segments: [] }));
    fireEvent.click(screen.getByRole('tab', { name: 'Insights' }));
    expect(window.location.hash).toBe('#/insights/produtos/categoria/aves');
    rerender(shell({ product: 'insights', segments: ['receitas'] }));
    rerender(shell({ product: 'home', segments: [] }));
    fireEvent.click(screen.getByRole('tab', { name: 'Insights' }));
    expect(window.location.hash).toBe('#/insights/receitas');
    fireEvent.click(screen.getByRole('tab', { name: 'Planner' }));
    expect(window.location.hash).toBe('#/planner');
  });

  it('supports arrows, Home and End with roving focus and skips disabled tabs', () => {
    const onChange = vi.fn();
    const items = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b', disabled: true },
      { label: 'C', value: 'c' }
    ];
    const { rerender } = render(<Tabs items={items} value="a" onChange={onChange} />);
    const a = screen.getByRole('tab', { name: 'A' });
    const c = screen.getByRole('tab', { name: 'C' });
    expect(a.tabIndex).toBe(0);
    expect(c.tabIndex).toBe(-1);
    a.focus();
    fireEvent.keyDown(a, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('c');
    expect(document.activeElement).toBe(c);
    rerender(<Tabs items={items} value="c" onChange={onChange} />);
    fireEvent.keyDown(c, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('a');
    expect(document.activeElement).toBe(a);
    fireEvent.keyDown(c, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith('a');
    fireEvent.keyDown(a, { key: 'End' });
    expect(document.activeElement).toBe(c);
    fireEvent.keyDown(c, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(a);
  });

  it('presents working task shortcuts and identifies the unfinished Planner', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: 'Preparar um pedido ↗' }).getAttribute('href')).toBe('#/writer');
    expect(screen.getByRole('link', { name: 'Receitas' }).getAttribute('href')).toBe('#/insights/receitas');
    expect(screen.getByRole('link', { name: 'Produtos' }).getAttribute('href')).toBe('#/insights/produtos');
    expect(screen.getByText('Em desenvolvimento')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Ver Component Lab' })).toBeNull();
  });
});
