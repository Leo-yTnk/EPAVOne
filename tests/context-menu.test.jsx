import { fireEvent, render, screen, act } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContextMenu } from '../src/design-system/components/ContextMenu.jsx';
// jsdom lacks the pointer event properties used by Preact's event-name detection.
for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
  Object.defineProperty(HTMLElement.prototype, 'on' + type, { configurable: true, writable: true, value: null });
}
const items = [
  { label: 'Minha semana', href: '#/planner/semana' },
  { label: 'Bloqueado', disabled: true }
];
function setup() {
  return render(
    <ContextMenu items={items}>
      <p>Área livre</p>
      <input aria-label="Editar" />
      <a href="#/writer">Pedido</a>
    </ContextMenu>
  );
}
function pointer(target, type, fields = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerType: 'touch', isPrimary: true, clientX: 40, clientY: 50, ...fields });
  fireEvent(target, event);
}
afterEach(() => vi.useRealTimers());
describe('Context shortcuts', () => {
  it('opens at right click in a portal, supports keyboard and returns focus on Escape', async () => {
    setup();
    fireEvent.contextMenu(screen.getByText('Área livre'), { clientX: 100, clientY: 150 });
    const menu = screen.getByRole('menu');
    const initialPosition = menu.style.getPropertyValue('--layer-left');
    fireEvent.contextMenu(screen.getByText('Área livre'), { clientX: 250, clientY: 150 });
    expect(menu.style.getPropertyValue('--layer-left')).not.toBe(initialPosition);
    expect(menu.parentElement).toBe(document.body);
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Minha semana' }));
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement.textContent).toBe('Minha semana');
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Atalhos desta página' }));
  });
  it('keeps native context actions for inputs and links, with a visible menu alternative', () => {
    setup();
    expect(fireEvent.contextMenu(screen.getByLabelText('Editar'))).toBe(true);
    expect(fireEvent.contextMenu(screen.getByText('Pedido'))).toBe(true);
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByText('Atalhos'));
    expect(screen.getByRole('menuitem', { name: 'Minha semana' }).getAttribute('href')).toBe('#/planner/semana');
  });
  it('opens after holding and cancels gestures when moving, scrolling or releasing early', async () => {
    vi.useFakeTimers();
    setup();
    const target = screen.getByText('Área livre');
    for (const cancel of [
      () => pointer(target, 'pointermove', { clientX: 80 }),
      () => fireEvent.scroll(window),
      () => pointer(target, 'pointerup'),
      () => pointer(target, 'pointercancel')
    ]) {
      pointer(target, 'pointerdown');
      cancel();
      act(() => vi.advanceTimersByTime(600));
      expect(screen.queryByRole('menu')).toBeNull();
    }
    pointer(target, 'pointerdown');
    await act(async () => {
      vi.advanceTimersByTime(550);
    });
    expect(screen.getByRole('menu')).toBeTruthy();
    pointer(target, 'pointerup');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Minha semana' }));
    expect(screen.queryByRole('menu')).toBeNull();
  });
  it('gives nested contexts priority and closes on navigation and outside click', async () => {
    render(
      <ContextMenu items={items}>
        <ContextMenu label="Cliente" items={[{ label: 'Preparar', href: '#/planner/clientes/1' }]}>
          <p>Cliente específico</p>
        </ContextMenu>
        <p>Fora</p>
      </ContextMenu>
    );
    fireEvent.contextMenu(screen.getByText('Cliente específico'));
    await act(async () => {});
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(screen.getByRole('menuitem', { name: 'Preparar' })).toBeTruthy();
    fireEvent.pointerDown(screen.getByText('Fora'));
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cliente' }));
    fireEvent(window, new Event('hashchange'));
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
