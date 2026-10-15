import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { Menu } from '../src/design-system/components/Menu.jsx';

describe('Menu', () => {
  it('opens in a portal and focuses its first enabled item', () => {
    render(
      <Menu
        label="Conta"
        items={[
          { label: 'Perfil', icon: 'user', group: 'Conta', href: '#/insights/perfil' },
          { label: 'Indisponível', disabled: true }
        ]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conta' }));

    const menu = screen.getByRole('menu');
    const item = screen.getByRole('menuitem', { name: 'Perfil' });
    expect(menu.parentElement).toBe(document.body);
    expect(item.querySelector('.ds-icon')).toBeTruthy();
    expect(item.querySelector('.ds-menu-item-label').textContent).toBe('Perfil');
    expect(screen.getByText('Conta', { selector: '.ds-menu-group' })).toBeTruthy();
    expect(document.activeElement).toBe(item);
  });
  it('keeps the full item name accessible with a compact visible trigger', () => {
    render(<Menu label="Ações de uma receita com nome longo" triggerLabel="Ações" items={[{ label: 'Editar' }]} />);
    const trigger = screen.getByRole('button', { name: 'Ações de uma receita com nome longo' });
    expect(trigger.textContent).toBe('Ações');
    fireEvent.click(trigger);
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeTruthy();
  });
});
