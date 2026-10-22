import { fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '../src/app/AppShell.jsx';
import { SettingsPage } from '../src/app/settings/SettingsPage.jsx';
import { DEFAULT_PREFERENCES, applyPreferences, normalizePreferences, readPreferences } from '../src/app/settings/preferences.js';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function renderSidebar() {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  return render(
    <AppShell route={{ product: 'planner', segments: ['semana'] }} preferences={{ mobileNavigation: 'vertical' }} onOpenAccount={vi.fn()}>
      Página
    </AppShell>
  );
}

describe('Mobile and tablet sidebar', () => {
  it('opens a left portal drawer, closes with Escape and returns focus', async () => {
    const { container } = renderSidebar();
    const trigger = screen.getByRole('button', { name: 'Navegação' });
    expect(screen.queryByRole('tablist')).toBeNull();
    trigger.focus();
    fireEvent.click(trigger);
    const drawer = await screen.findByRole('dialog', { name: 'Seus apps' });
    expect(container.contains(drawer)).toBe(false);
    expect(drawer.classList.contains('is-start')).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('ds-layer-open')).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.classList.contains('ds-layer-open')).toBe(false);
  });

  it('marks the current app/page and closes after choosing a destination', async () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Navegação' }));
    const drawer = await screen.findByRole('dialog');
    const pages = within(drawer).getByRole('navigation', { name: 'Páginas do Planner' });
    expect(within(pages).getByRole('link', { name: 'Semana' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(within(drawer).getByRole('link', { name: /Insights/ }));
    expect(window.location.hash).toBe('#/insights');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('saves the mobile choice independently from desktop and exposes it in Settings', () => {
    const preferences = { ...DEFAULT_PREFERENCES, mobileNavigation: 'vertical' };
    expect(applyPreferences(preferences)).toBe(true);
    expect(readPreferences()).toEqual(preferences);
    expect(normalizePreferences({ mobileNavigation: 'invalid' }).mobileNavigation).toBe('horizontal');
    const change = vi.fn();
    render(
      <SettingsPage
        theme="light"
        preferences={DEFAULT_PREFERENCES}
        onPreferencesChange={change}
        onToggleTheme={vi.fn()}
        onOpenAccount={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Navegação no celular e tablet/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Painel lateral', exact: true }));
    expect(change).toHaveBeenLastCalledWith(preferences);
  });
});
