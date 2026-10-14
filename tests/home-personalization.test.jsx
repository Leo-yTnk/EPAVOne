import { fireEvent, render, screen, act } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { HomePage } from '../src/products/home/HomePage.jsx';
import { getDayPeriod } from '../src/products/home/dayPeriod.js';
import { SettingsPage } from '../src/app/settings/SettingsPage.jsx';
import { DEFAULT_PREFERENCES, applyPreferences, normalizePreferences, readPreferences } from '../src/app/settings/preferences.js';

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

it.each([
  [0, 'night'],
  [4, 'night'],
  [5, 'dawn'],
  [7, 'dawn'],
  [8, 'morning'],
  [11, 'morning'],
  [12, 'afternoon'],
  [17, 'afternoon'],
  [18, 'evening'],
  [23, 'evening']
])('uses the local period at %s hours', (hour, key) => {
  expect(getDayPeriod(new Date(2026, 9, 14, hour)).key).toBe(key);
});

it('updates the greeting and scenario when an open page crosses a period boundary', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 14, 11, 59, 50));
  const view = render(<HomePage preferences={{ ...DEFAULT_PREFERENCES, displayName: 'Leo', homeAction: 'writer' }} />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Bom dia, Leo.');
  expect(view.container.querySelector('.one-home').dataset.period).toBe('morning');
  expect(view.container.querySelector('.one-welcome-actions a').getAttribute('href')).toBe('#/writer');
  act(() => vi.advanceTimersByTime(30_000));
  expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Boa tarde, Leo.');
  expect(view.container.querySelector('.one-home').dataset.period).toBe('afternoon');
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('honors optional home content, neutral background and the live Planner', () => {
  const view = render(<HomePage preferences={{ homeBackground: 'neutral', showInspiration: false, showWeeklyReminder: false }} />);
  expect(view.container.querySelector('.one-inspiration')).toBeNull();
  expect(view.container.querySelector('.one-week-note')).toBeNull();
  expect(view.container.querySelector('.one-home').dataset.background).toBe('neutral');
  expect(screen.queryByText(/em construção|Em desenvolvimento/)).toBeNull();
  expect(screen.getByRole('link', { name: 'Minha semana' }).getAttribute('href')).toBe('#/planner/semana');
});

it('persists personalization, migrates old data and rejects invalid values', () => {
  const preferences = {
    ...DEFAULT_PREFERENCES,
    displayName: 'Leo',
    textSize: 'large',
    showGrid: false,
    showWeeklyReminder: false,
    homeAction: 'writer'
  };
  expect(applyPreferences(preferences)).toBe(true);
  expect(readPreferences()).toEqual(preferences);
  expect(document.documentElement.dataset.textSize).toBe('large');
  expect(document.documentElement.dataset.showGrid).toBe('false');
  expect(normalizePreferences({ density: 'compact' })).toEqual({ ...DEFAULT_PREFERENCES, density: 'compact' });
  expect(normalizePreferences({ showGrid: 'false', textSize: 'bad', homeAction: 'bad', displayName: 42 })).toEqual(DEFAULT_PREFERENCES);
  expect(normalizePreferences({ displayName: 'x'.repeat(80) }).displayName).toHaveLength(40);
  applyPreferences(DEFAULT_PREFERENCES);
});

it('connects the new settings to actual preference updates', () => {
  const change = vi.fn();
  render(
    <SettingsPage
      theme="light"
      preferences={DEFAULT_PREFERENCES}
      onPreferencesChange={change}
      onToggleTheme={() => {}}
      onOpenAccount={() => {}}
    />
  );
  fireEvent.input(screen.getByRole('textbox', { name: /Como podemos chamar você/ }), { target: { value: 'Leo' } });
  expect(change).toHaveBeenLastCalledWith({ ...DEFAULT_PREFERENCES, displayName: 'Leo' });
  for (const [label, key] of [
    ['Fundo quadriculado', 'showGrid'],
    ['Mostrar mensagem de inspiração', 'showInspiration'],
    ['Mostrar lembrete do formulário semanal', 'showWeeklyReminder']
  ]) {
    fireEvent.click(screen.getByRole('checkbox', { name: label }));
    expect(change).toHaveBeenLastCalledWith({ ...DEFAULT_PREFERENCES, [key]: false });
  }
  fireEvent.click(screen.getByRole('button', { name: /Tamanho de leitura/ }));
  fireEvent.click(screen.getByRole('option', { name: 'Ampliado' }));
  expect(change).toHaveBeenLastCalledWith({ ...DEFAULT_PREFERENCES, textSize: 'large' });
});
