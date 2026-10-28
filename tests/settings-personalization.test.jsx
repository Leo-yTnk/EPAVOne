import { act, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { SettingsPage } from '../src/app/settings/SettingsPage.jsx';
import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
  applyPreferences,
  readPreferences,
  initialRouteHash
} from '../src/app/settings/preferences.js';
import { useHashRoute } from '../src/app/useHashRoute.js';

afterEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '#/');
  vi.restoreAllMocks();
});
it('migrates older preferences and validates the new appearance choices', () => {
  const old = normalizePreferences({ displayName: 'Leo', density: 'compact', performanceMode: 'performance' });
  expect(old).toEqual({ ...DEFAULT_PREFERENCES, displayName: 'Leo', density: 'compact', performanceMode: 'performance' });
  const choice = {
    ...old,
    startPage: 'writer',
    contentWidth: 'wide',
    stitchStyle: 'subtle',
    contrast: 'high',
    showBreadcrumbs: false,
    homeBackground: 'night'
  };
  applyPreferences(choice);
  expect(readPreferences()).toEqual(choice);
  expect(document.documentElement.dataset).toMatchObject({
    contentWidth: 'wide',
    stitchStyle: 'subtle',
    contrast: 'high',
    showBreadcrumbs: 'false'
  });
  expect(
    normalizePreferences({
      startPage: 'javascript:alert(1)',
      contentWidth: 'huge',
      contrast: 'blue',
      stitchStyle: 'solid',
      homeBackground: 'unknown'
    })
  ).toEqual(DEFAULT_PREFERENCES);
});
it('uses the chosen initial page only for a bare entry, preserving Home and deep links', () => {
  const prefs = { ...DEFAULT_PREFERENCES, startPage: 'planner' };
  expect(initialRouteHash('', prefs)).toBe('#/planner');
  for (const hash of ['#/', '#/welcome', '#/settings', '#/insights/receitas', '#/writer']) expect(initialRouteHash(hash, prefs)).toBe(hash);
  localStorage.setItem('epavone-preferences', JSON.stringify(prefs));
  window.history.replaceState(null, '', window.location.pathname);
  function Probe() {
    const route = useHashRoute();
    return <p>{route.product}</p>;
  }
  const view = render(<Probe />);
  expect(screen.getByText('planner')).toBeTruthy();
  expect(window.location.hash).toBe('#/planner');
  view.unmount();
});
it('changes each new setting while preserving the remaining user preferences', () => {
  const change = vi.fn();
  const prefs = { ...DEFAULT_PREFERENCES, displayName: 'Leo', reducedMotion: true };
  render(<SettingsPage theme="light" preferences={prefs} onPreferencesChange={change} />);
  for (const [label, option, patch] of [
    ['Ao abrir o EPAVOne', 'EPAVWriter', { startPage: 'writer' }],
    ['Largura do conteúdo', 'Ampla · aproveitar a tela', { contentWidth: 'wide' }],
    ['Costuras dos cards', 'Discretas', { stitchStyle: 'subtle' }],
    ['Contraste de leitura', 'Reforçado · textos e contornos', { contrast: 'high' }],
    ['Fundo da home', 'Noite · índigo', { homeBackground: 'night' }]
  ]) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
    fireEvent.click(screen.getByRole('option', { name: option, exact: true }));
    expect(change).toHaveBeenLastCalledWith({ ...prefs, ...patch });
  }
  fireEvent.click(screen.getByRole('checkbox', { name: 'Mostrar caminho de navegação' }));
  expect(change).toHaveBeenLastCalledWith({ ...prefs, showBreadcrumbs: false });
});
it('navigates inside settings without replacing the app route and transfers focus', async () => {
  applyPreferences({ ...DEFAULT_PREFERENCES, reducedMotion: true });
  window.history.replaceState(null, '', '#/settings');
  render(<SettingsPage theme="light" preferences={DEFAULT_PREFERENCES} onPreferencesChange={vi.fn()} />);
  const target = screen.getByRole('region', { name: 'Aparência' });
  target.scrollIntoView = vi.fn();
  await act(() => fireEvent.click(screen.getByRole('link', { name: 'Aparência', exact: true })));
  expect(window.location.hash).toBe('#/settings');
  expect(document.activeElement).toBe(target);
  expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
});
