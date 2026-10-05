import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { SettingsPage } from '../src/app/settings/SettingsPage.jsx';
import { AppShell } from '../src/app/AppShell.jsx';
import { DEFAULT_PREFERENCES, readPreferences, applyPreferences } from '../src/app/settings/preferences.js';
import { Tabs } from '../src/design-system/components/Tabs.jsx';

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});
it('persists and validates workspace preferences, including unavailable storage', () => {
  applyPreferences({ navigation: 'vertical', density: 'compact', reducedMotion: true });
  expect(readPreferences()).toEqual({ navigation: 'vertical', density: 'compact', reducedMotion: true });
  localStorage.setItem('epavone-preferences', '{broken');
  expect(readPreferences()).toEqual(DEFAULT_PREFERENCES);
  localStorage.setItem('epavone-preferences', JSON.stringify({ navigation: 'invalid', density: 'invalid' }));
  expect(readPreferences()).toEqual(DEFAULT_PREFERENCES);
  const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(readPreferences()).toEqual(DEFAULT_PREFERENCES);
  spy.mockRestore();
});
it('changes navigation and motion, opens the account and resets only preferences', () => {
  const change = vi.fn(),
    toggle = vi.fn(),
    open = vi.fn();
  render(
    <SettingsPage
      theme="dark"
      onToggleTheme={toggle}
      preferences={DEFAULT_PREFERENCES}
      onPreferencesChange={change}
      account={{}}
      onOpenAccount={open}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /Posição da navegação/ }));
  fireEvent.click(screen.getByRole('option', { name: 'Vertical · painel lateral' }));
  expect(change).toHaveBeenLastCalledWith({ ...DEFAULT_PREFERENCES, navigation: 'vertical' });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Reduzir animações' }));
  expect(change).toHaveBeenLastCalledWith({ ...DEFAULT_PREFERENCES, reducedMotion: true });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar na conta' }));
  expect(open).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Restaurar preferências' }));
  expect(change).toHaveBeenLastCalledWith(DEFAULT_PREFERENCES);
  expect(toggle).toHaveBeenCalledOnce();
});
it('uses vertical arrows and switches to horizontal tabs on small screens', () => {
  const change = vi.fn();
  const view = render(
    <Tabs
      orientation="vertical"
      items={[
        { label: 'One', value: 'home' },
        { label: 'Insights', value: 'insights' }
      ]}
      value="home"
      onChange={change}
    />
  );
  fireEvent.keyDown(screen.getByRole('tab', { name: 'One' }), { key: 'ArrowDown' });
  expect(change).toHaveBeenCalledWith('insights');
  expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Insights' }));
  view.unmount();
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  render(
    <AppShell route={{ product: 'settings', segments: [] }} preferences={{ navigation: 'vertical' }} onOpenAccount={() => {}}>
      Settings content
    </AppShell>
  );
  expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('horizontal');
  expect(screen.getByRole('tab', { name: 'Configurações' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByRole('tabpanel', { name: 'Configurações' })).toBeTruthy();
  expect(screen.queryByText('Component Lab')).toBeNull();
});
