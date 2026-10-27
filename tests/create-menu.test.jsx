import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';
import { CreateMenu } from '../src/app/CreateMenu.jsx';

it('provides keyboard-accessible shortcuts to the real workflows in a portal', () => {
  const view = render(<CreateMenu />);
  const trigger = screen.getByRole('button', { name: 'Criar' });
  fireEvent.click(trigger);
  const menu = screen.getByRole('menu', { name: 'Criar' });
  expect(view.container.contains(menu)).toBe(false);
  const links = [
    ['Preparar pedido', '#/writer'],
    ['Cadastrar cliente', '#/planner/clientes/novo'],
    ['Registrar venda', '#/planner/resultados/pedidos/novo'],
    ['Criar receita', '#/insights/criacao/receitas/novo'],
    ['Criar produto', '#/insights/criacao/produtos/novo'],
    ['Criar categoria', '#/insights/criacao/categorias/novo']
  ];
  for (const [label, href] of links) expect(screen.getByRole('menuitem', { name: label }).getAttribute('href')).toBe(href);
  fireEvent.keyDown(menu, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Cadastrar cliente' }));
  fireEvent.keyDown(menu, { key: 'Escape' });
  expect(screen.queryByRole('menu')).toBeNull();
});
