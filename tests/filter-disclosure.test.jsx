import { render, screen, fireEvent } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import { FilterDisclosure } from '../src/design-system/components/FilterDisclosure.jsx';
import { Icon } from '../src/design-system/components/Icon.jsx';
describe('Compact filters and icons', () => {
  it('announces active filters and toggles without clearing their controls', () => {
    render(<FilterDisclosure count={2}><p>Categoria selecionada</p></FilterDisclosure>);
    const trigger = screen.getByRole('button', { name: 'Filtros (2)' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(trigger.getAttribute('aria-controls')).textContent).toBe('Categoria selecionada');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
  it('renders labelled SVGs and keeps decorative icons out of accessible names', () => {
    const { container } = render(<><Icon name="writer" label="Editar" /><Icon name="search" /></>);
    expect(screen.getByRole('img', { name: 'Editar' }).querySelector('path')).toBeTruthy();
    expect(container.querySelector('[aria-hidden="true"]').getAttribute('viewBox')).not.toBe('0 0 24 24');
  });
});
