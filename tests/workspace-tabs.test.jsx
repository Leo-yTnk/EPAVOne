import { fireEvent, render, screen, within } from '@testing-library/preact';
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

  it('uses the same shell navigation for Planner and Insights, including deep routes', () => {
    const { rerender } = render(shell({ product: 'planner', segments: ['clientes', 'demo-1'] }));
    const nav = screen.getByRole('navigation', { name: 'Navegação do Planner' });
    expect(within(nav).getAllByRole('link')).toHaveLength(4);
    expect(within(nav).queryByRole('link', { name: 'Pedidos' })).toBeNull();
    for (const link of within(nav).getAllByRole('link')) expect(link.querySelector('svg[aria-hidden="true"] path')).not.toBeNull();
    expect(within(nav).getByRole('link', { name: 'Clientes' }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: 'Resultados' }).getAttribute('href')).toBe('#/planner/resultados');
    expect(within(nav).queryByRole('link', { name: 'Oportunidades' })).toBeNull();
    rerender(shell({ product: 'planner', segments: ['atendimento', 'demo-1'] }));
    expect(within(nav).getByRole('link', { name: 'Semana' }).getAttribute('aria-current')).toBe('page');
    rerender(shell({ product: 'planner', segments: [] }));
    expect(within(nav).getByRole('link', { name: 'Início' }).getAttribute('aria-current')).toBe('page');
    rerender(shell({ product: 'insights', segments: ['produtos'] }));
    const insights = screen.getByRole('navigation', { name: 'Navegação do Insights' });
    for (const link of within(insights).getAllByRole('link')) expect(link.querySelector('svg[aria-hidden="true"] path')).not.toBeNull();
    expect(insights).toBe(nav);
    expect(insights.className).toBe('product-section-nav');
    expect(within(insights).getByRole('link', { name: 'Produtos' }).getAttribute('aria-current')).toBe('page');
  });

  it('keeps stitched app and section thumbs mounted while navigating within the shared island', () => {
    const { container, rerender } = render(shell({ product: 'planner', segments: ['semana'] }));
    const island = container.querySelector('.workspace-navigation');
    const tabs = screen.getByRole('tablist', { name: 'Apps do EPAVOne' });
    const nav = screen.getByRole('navigation', { name: 'Navegação do Planner' });
    expect(island.contains(tabs)).toBe(true);
    expect(island.contains(nav)).toBe(true);
    const thumbs = [...island.querySelectorAll('.ds-selection-indicator')];
    expect(thumbs).toHaveLength(2);
    expect(thumbs.every((thumb) => thumb.classList.contains('ds-stitched-card'))).toBe(true);
    expect(thumbs.every((thumb) => thumb.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(screen.getByRole('tab', { name: 'Planner' }).getAttribute('aria-selected')).toBe('true');
    rerender(shell({ product: 'planner', segments: ['clientes'] }));
    expect([...island.querySelectorAll('.ds-selection-indicator')]).toEqual(thumbs);
    expect(within(nav).getByRole('link', { name: 'Clientes' }).getAttribute('aria-current')).toBe('page');
  });

  it('keeps settings beside account and leaves app tabs reachable on the settings page', () => {
    const { container, rerender } = render(shell({ product: 'planner', segments: [] }));
    const settings = screen.getByRole('link', { name: 'Configurações' });
    expect(settings.closest('.workspace-utilities')).not.toBeNull();
    expect(settings.closest('.workspace-utilities').querySelector('[aria-label="Novo"]')).not.toBeNull();
    expect(screen.queryByRole('tab', { name: 'Configurações' })).toBeNull();
    rerender(shell({ product: 'settings', segments: [] }));
    expect(settings.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('region', { name: 'Configurações' })).not.toBeNull();
    expect(screen.getByRole('tab', { name: 'One' }).tabIndex).toBe(0);
    expect(container.querySelector('.app-tabs .ds-selection-indicator').dataset.ready).toBe('false');
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

  it('presents working task shortcuts for the available apps', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: 'Ver o Planner' }).getAttribute('href')).toBe('#/planner');
    expect(screen.getByRole('link', { name: 'Receitas' }).getAttribute('href')).toBe('#/insights/receitas');
    expect(screen.getByRole('link', { name: 'Produtos' }).getAttribute('href')).toBe('#/insights/produtos');
    expect(screen.queryByText('Em desenvolvimento')).toBeNull();
    expect(screen.getByRole('link', { name: 'Minha semana' }).getAttribute('href')).toBe('#/planner/semana');
    expect(screen.queryByRole('link', { name: 'Ver Component Lab' })).toBeNull();
  });
});
it('remeasures the section thumb when switching apps on their default section', () => {
  const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.matches('.product-section-nav')) return { left: 100, top: 20, width: 500, height: 44 };
    if (this.matches('.section-tab'))
      return { left: 100, top: 20, width: this.getAttribute('href').includes('insights') ? 80 : 110, height: 44 };
    return { left: 0, top: 0, width: 0, height: 0 };
  });
  try {
    const { container, rerender } = render(shell({ product: 'planner', segments: [] }));
    const thumb = container.querySelector('.product-section-nav .ds-selection-indicator');
    expect(thumb.style.getPropertyValue('--selection-width')).toBe('110px');
    rerender(shell({ product: 'insights', segments: [] }));
    expect(container.querySelector('.product-section-nav .ds-selection-indicator')).toBe(thumb);
    expect(thumb.style.getPropertyValue('--selection-width')).toBe('80px');
  } finally {
    rect.mockRestore();
  }
});
