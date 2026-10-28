import { render, fireEvent, screen } from '@testing-library/preact';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { usePressFeedback } from '../src/design-system/behaviors/usePressFeedback.js';
function Example({ onClick }) {
  usePressFeedback();
  return (
    <>
      <button onClick={onClick}>Ação</button>
      <button disabled>Bloqueado</button>
    </>
  );
}
beforeEach(() => {
  document.documentElement.dataset.performanceMode = 'fabulous';
});
afterEach(() => {
  delete document.documentElement.dataset.performanceMode;
  delete Element.prototype.animate;
  delete document.documentElement.dataset.reducedMotion;
  vi.unstubAllGlobals();
});
function setup() {
  const animations = [];
  const animate = vi.fn(() => {
    const animation = { cancel: vi.fn() };
    animations.push(animation);
    return animation;
  });
  Element.prototype.animate = animate;
  return { animate, animations };
}
it('compresses and springs back without delaying the click; cancels on unmount', () => {
  const { animate, animations } = setup();
  const click = vi.fn();
  const view = render(<Example onClick={click} />);
  const button = screen.getByText('Ação');
  fireEvent.keyDown(button, { key: 'Enter' });
  expect(animate.mock.calls[0][0].at(-1).scale).toBe('0.97');
  fireEvent.keyUp(button, { key: 'Enter' });
  fireEvent.click(button);
  expect(click).toHaveBeenCalledOnce();
  expect(animations[0].cancel).toHaveBeenCalled();
  expect(animate.mock.calls[1][0][1].scale).toBe('1.018');
  expect(animate.mock.calls[1][0].at(-1).scale).toBe('1');
  view.unmount();
  expect(animations[1].cancel).toHaveBeenCalled();
});
it('ignores disabled controls, repeated keys and reduced motion', () => {
  const { animate } = setup();
  render(<Example />);
  fireEvent.keyDown(screen.getByText('Bloqueado'), { key: 'Enter' });
  fireEvent.keyDown(screen.getByText('Ação'), { key: 'Enter', repeat: true });
  document.documentElement.dataset.reducedMotion = 'true';
  fireEvent.keyDown(screen.getByText('Ação'), { key: 'Enter' });
  expect(animate).not.toHaveBeenCalled();
});
it('releases on blur and does not replay after cancellation', () => {
  const { animate, animations } = setup();
  render(<Example />);
  fireEvent.keyDown(screen.getByText('Ação'), { key: ' ' });
  fireEvent.blur(window);
  fireEvent.keyUp(screen.getByText('Ação'), { key: ' ' });
  expect(animations[0].cancel).toHaveBeenCalled();
  expect(animate).toHaveBeenCalledOnce();
});
it('cancels touch pressure when the gesture becomes scrolling', () => {
  const { animate, animations } = setup();
  render(<Example />);
  const button = screen.getByText('Ação');
  const pointer = (name, x, y) => {
    const event = new Event(name, { bubbles: true });
    Object.assign(event, { button: 0, pointerId: 7, isPrimary: true, clientX: x, clientY: y });
    fireEvent(button, event);
  };
  pointer('pointerdown', 40, 40);
  pointer('pointermove', 40, 80);
  pointer('pointerup', 40, 80);
  expect(animate).toHaveBeenCalledOnce();
  expect(animations[0].cancel).toHaveBeenCalled();
});
it('does not animate a surrounding card when typing in a field', () => {
  const { animate } = setup();
  function Field() {
    usePressFeedback();
    return (
      <article data-dialog-origin>
        <input aria-label="Nome" />
      </article>
    );
  }
  render(<Field />);
  fireEvent.keyDown(screen.getByLabelText('Nome'), { key: ' ' });
  expect(animate).not.toHaveBeenCalled();
});
it('cancels a held key when its control loses focus', () => {
  const { animate, animations } = setup();
  render(<Example />);
  const button = screen.getByText('Ação');
  button.focus();
  fireEvent.keyDown(button, { key: ' ' });
  button.blur();
  fireEvent.keyUp(document.body, { key: ' ' });
  expect(animations[0].cancel).toHaveBeenCalled();
  expect(animate).toHaveBeenCalledOnce();
});
it('cancels active feedback as soon as the in-app motion preference changes', async () => {
  const { animations } = setup();
  render(<Example />);
  fireEvent.keyDown(screen.getByText('Ação'), { key: 'Enter' });
  document.documentElement.dataset.reducedMotion = 'true';
  await Promise.resolve();
  expect(animations[0].cancel).toHaveBeenCalled();
});
