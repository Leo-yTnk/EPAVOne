import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { useRef } from 'preact/hooks';
import { DeferredItem } from '../src/design-system/components/DeferredItem.jsx';
import { useContentMotion } from '../src/design-system/behaviors/useContentMotion.js';
import { useDebouncedValue } from '../src/design-system/behaviors/useDebouncedValue.js';
import { PerformanceModeContext } from '../src/design-system/behaviors/performanceMode.js';
import { CatalogSection } from '../src/products/insights/components/CatalogSection.jsx';
import { CatalogImage } from '../src/products/insights/components/CatalogImage.jsx';
import { normalizePreferences, applyPreferences, readPreferences } from '../src/app/settings/preferences.js';
import { publicResource, refreshPublicResource, invalidatePublicCatalog } from '../src/products/insights/services/publicResourceCache.js';

afterEach(() => {
  delete document.documentElement.dataset.performanceMode;
  delete document.documentElement.dataset.reducedMotion;
  delete Element.prototype.animate;
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it('defaults to balanced, persists each mode and keeps accessibility override independent', () => {
  expect(normalizePreferences({ performanceMode: 'unknown' }).performanceMode).toBe('balanced');
  for (const performanceMode of ['performance', 'balanced', 'fabulous']) {
    applyPreferences({ performanceMode });
    expect(readPreferences().performanceMode).toBe(performanceMode);
    expect(document.documentElement.dataset.reducedMotion).toBe(String(performanceMode === 'performance'));
  }
  applyPreferences({ performanceMode: 'fabulous', reducedMotion: true });
  expect(document.documentElement.dataset.reducedMotion).toBe('true');
  applyPreferences({ performanceMode: 'performance', reducedMotion: false });
  applyPreferences({ performanceMode: 'balanced', reducedMotion: false });
  expect(document.documentElement.dataset.reducedMotion).toBe('false');
});
it('mounts nearby cards, releases distant content and preserves a focused control', async () => {
  let update;
  const disconnect = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb) {
        update = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {
        disconnect();
      }
    }
  );
  const next = render(<DeferredItem label="Produto">{() => <button>Detalhes</button>}</DeferredItem>);
  const node = next.container.firstElementChild;
  expect(screen.queryByText('Detalhes')).toBeNull();
  await act(() => update([{ target: node, isIntersecting: true }]));
  expect(screen.getByText('Detalhes')).toBeTruthy();
  await act(() => screen.getByText('Detalhes').focus());
  await act(() => update([{ target: node, isIntersecting: false }]));
  expect(document.activeElement.textContent).toBe('Detalhes');
  fireEvent.blur(screen.getByText('Detalhes'), { relatedTarget: document.body });
  await waitFor(() => expect(screen.queryByText('Detalhes')).toBeNull());
  await act(() => screen.getByRole('group', { name: 'Mostrar Produto' }).focus());
  expect(document.activeElement.textContent).toBe('Detalhes');
  next.unmount();
  expect(disconnect).toHaveBeenCalled();
});
it('keeps all records addressable in a shelf and only eagerly renders them in fabulous', () => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  const group = { id: 'large', name: 'Catálogo', items: Array.from({ length: 1002 }, (_, i) => ({ id: String(i), name: `Produto ${i}` })) };
  const item = (p) => <button key={p.id}>{p.name}</button>;
  const view = render(
    <PerformanceModeContext.Provider value="performance">
      <CatalogSection group={group} renderItem={item} />
    </PerformanceModeContext.Provider>
  );
  expect(screen.getAllByRole('button', { name: /^Produto / }).length).toBeLessThan(10);
  fireEvent.click(screen.getByRole('button', { name: 'Ver todos de Catálogo' }));
  expect(screen.getByRole('button', { name: 'Recolher Catálogo' }).getAttribute('aria-expanded')).toBe('true');
  expect(screen.getAllByRole('group', { name: /^Mostrar Produto/ })).toHaveLength(1002);
  view.rerender(
    <PerformanceModeContext.Provider value="fabulous">
      <CatalogSection group={group} renderItem={item} />
    </PerformanceModeContext.Provider>
  );
  expect(screen.getAllByRole('button', { name: /^Produto / })).toHaveLength(1002);
});
it('loads images on demand in balanced and eagerly in fabulous', () => {
  const view = render(<CatalogImage url="https://example.com/photo.jpg" name="Produto" />);
  expect(screen.getByAltText('Produto').loading || screen.getByAltText('Produto').getAttribute('loading')).toBe('lazy');
  view.rerender(
    <PerformanceModeContext.Provider value="fabulous">
      <CatalogImage url="https://example.com/photo.jpg" name="Produto" />
    </PerformanceModeContext.Provider>
  );
  expect(screen.getByAltText('Produto').getAttribute('loading')).toBe('eager');
});
it('suppresses optional content motion in balanced and performance but enables it in fabulous', () => {
  const animate = vi.fn(() => ({ cancel: vi.fn() }));
  Element.prototype.animate = animate;
  function Example({ value }) {
    const ref = useRef();
    useContentMotion(ref, value);
    return <div ref={ref}>{value}</div>;
  }
  for (const mode of ['performance', 'balanced', 'fabulous']) {
    applyPreferences({ performanceMode: mode });
    const view = render(<Example value="a" />);
    view.rerender(<Example value="b" />);
    view.unmount();
  }
  expect(animate).toHaveBeenCalledTimes(1);
});
it('debounces typing and cancels stale text when cleared or unmounted', async () => {
  vi.useFakeTimers();
  function Example({ value }) {
    return <span>{useDebouncedValue(value)}</span>;
  }
  const view = render(<Example value="" />);
  view.rerender(<Example value="fr" />);
  view.rerender(<Example value="frango" />);
  expect(view.container.textContent).toBe('');
  await act(() => vi.advanceTimersByTimeAsync(150));
  expect(view.container.textContent).toBe('frango');
  view.rerender(<Example value="carne" />);
  view.rerender(<Example value="" />);
  await act(() => vi.advanceTimersByTimeAsync(200));
  expect(view.container.textContent).toBe('');
});
it('deduplicates anonymous reads, serves warm data and revalidates stale data without hiding it', async () => {
  const loader = vi.fn().mockResolvedValue(['old']);
  const entry = publicResource(loader, 'public');
  refreshPublicResource(entry, loader, 'public');
  refreshPublicResource(entry, loader, 'public');
  await entry.pending;
  expect(loader).toHaveBeenCalledTimes(1);
  refreshPublicResource(entry, loader, 'public');
  expect(entry.pending).toBeNull();
  invalidatePublicCatalog();
  loader.mockResolvedValueOnce(['invalidated']);
  refreshPublicResource(entry, loader, 'public');
  await entry.pending;
  expect(entry.state.data).toEqual(['invalidated']);
  entry.updated = Date.now() - 61000;
  loader.mockResolvedValueOnce(['new']);
  refreshPublicResource(entry, loader, 'public');
  expect(entry.state.data).toEqual(['invalidated']);
  expect(entry.state.loading).toBe(false);
  await entry.pending;
  expect(entry.state.data).toEqual(['new']);
  loader.mockRejectedValueOnce(new Error('offline'));
  refreshPublicResource(entry, loader, 'public', true);
  await entry.pending;
  expect(entry.state.data).toEqual(['new']);
  expect(entry.state.refreshError).toBe('offline');
});

it('reaches distant horizontal items by scrolling and keyboard without mounting the entire collection', async () => {
  const group = { id: 'keyboard', name: 'Coleção', items: Array.from({ length: 1002 }, (_, i) => ({ id: String(i), name: `Item ${i}` })) };
  const view = render(<CatalogSection group={group} renderItem={(item) => <button key={item.id}>{item.name}</button>} />);
  const track = view.container.querySelector('.ds-carousel-track');
  Object.defineProperty(track, 'clientWidth', { configurable: true, value: 600 });
  track.scrollLeft = 240 * 1001;
  fireEvent.scroll(track);
  await screen.findByRole('button', { name: 'Item 1001', exact: true });
  expect(screen.getAllByRole('button', { name: /^Item / }).length).toBeLessThan(15);
  await act(() => screen.getByRole('group', { name: 'Mostrar itens anteriores' }).focus());
  await waitFor(() => expect(document.activeElement.textContent).toMatch(/^Item \d+$/));
  expect(screen.getAllByRole('button', { name: /^Item / }).length).toBeLessThan(15);
});
