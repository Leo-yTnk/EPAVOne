import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { Carousel } from '../src/design-system/components/Carousel.jsx';
afterEach(() => {
  delete document.documentElement.dataset.reducedMotion;
  delete Element.prototype.animate;
});
it('keeps the same items and focus when expanding and cancels motion on a rapid collapse', () => {
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }));
  Element.prototype.animate = animate;
  const items = [<button key="a">Produto A</button>, <button key="b">Produto B</button>];
  const view = render(<Carousel label="Coleção">{items}</Carousel>);
  const button = screen.getByRole('button', { name: 'Produto A' });
  button.focus();
  view.rerender(
    <Carousel label="Coleção" expanded>
      {items}
    </Carousel>
  );
  expect(animate).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(button);
  view.rerender(<Carousel label="Coleção">{items}</Carousel>);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Produto A' })).toBe(button);
  document.documentElement.dataset.reducedMotion = 'true';
  view.rerender(
    <Carousel label="Coleção" expanded>
      {items}
    </Carousel>
  );
  expect(animate).toHaveBeenCalledTimes(2);
});
it('uses native scroll, exposes correct edges, supports keyboard and respects reduced motion', async () => {
  render(
    <Carousel label="Receitas">
      {[1, 2, 3].map((id) => (
        <button key={id}>Receita {id}</button>
      ))}
    </Carousel>
  );
  const track = screen.getByRole('region', { name: 'Receitas' });
  Object.defineProperties(track, { clientWidth: { value: 200 }, scrollWidth: { value: 600 } });
  track.scrollBy = vi.fn();
  track.scrollTo = vi.fn();
  fireEvent.scroll(track);
  const next = await screen.findByRole('button', { name: 'Próximos itens de Receitas' });
  expect(screen.getByRole('button', { name: 'Itens anteriores de Receitas' }).disabled).toBe(true);
  fireEvent.click(next);
  expect(track.scrollBy).toHaveBeenLastCalledWith({ left: 170, behavior: 'smooth' });
  document.documentElement.dataset.reducedMotion = 'true';
  fireEvent.keyDown(track, { key: 'ArrowRight' });
  expect(track.scrollBy).toHaveBeenLastCalledWith({ left: 170, behavior: 'instant' });
  fireEvent.keyDown(track, { key: 'End' });
  expect(track.scrollTo).toHaveBeenLastCalledWith({ left: 600, behavior: 'instant' });
  track.scrollLeft = 400;
  fireEvent.scroll(track);
  await waitFor(() => expect(next.disabled).toBe(true));
  expect(screen.getByRole('button', { name: 'Itens anteriores de Receitas' }).disabled).toBe(false);
  const calls = track.scrollBy.mock.calls.length;
  fireEvent.keyDown(screen.getByRole('button', { name: 'Receita 1' }), { key: 'ArrowLeft' });
  expect(track.scrollBy).toHaveBeenCalledTimes(calls);
});
it('keeps content unmodified and does not trap keys in expanded collections', () => {
  render(
    <Carousel label="Produtos" expanded>
      {[1, 2].map((id) => (
        <article key={id}>Produto {id}</article>
      ))}
    </Carousel>
  );
  const track = screen.getByRole('region', { name: 'Produtos' });
  expect(screen.getAllByRole('article')).toHaveLength(2);
  expect(track.hasAttribute('tabindex')).toBe(false);
  expect(screen.queryByRole('button')).toBeNull();
  expect(fireEvent.keyDown(track, { key: 'ArrowRight' })).toBe(true);
});
