import { render, screen, fireEvent } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { FileInput, Select, Dialog } from '../src/design-system/components/index.js';
const options = [
  { value: '', label: 'Selecione…' },
  { value: 'a', label: 'Retirada' }
];
function Workspace({ step, dialog = false }) {
  return (
    <>
      <FileInput label="Formulário da semana" onFile={() => {}} />
      <Select label="Preferência permanente" options={options} onChange={() => {}} />
      <div key={step}>
        <Select label={step === 0 ? 'Cliente' : 'Entrega'} options={options} onChange={() => {}} />
      </div>
      {dialog && (
        <Dialog open title="Conferir" onClose={() => {}}>
          <Select label="Opção no diálogo" options={options} onChange={() => {}} />
        </Dialog>
      )}
    </>
  );
}
describe('Control label and portal identities', () => {
  it('keeps names and label references unique after keyed steps and dialogs remount', () => {
    const view = render(<Workspace step={0} />);
    view.rerender(<Workspace step={1} />);
    fireEvent.click(screen.getByRole('button', { name: /Entrega/ }));
    expect(screen.getByRole('listbox', { name: 'Entrega' })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    view.rerender(<Workspace step={0} dialog />);
    expect(screen.getByRole('dialog', { name: 'Conferir' })).toBeTruthy();
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const element of document.querySelectorAll('[aria-labelledby]')) {
      for (const id of element.getAttribute('aria-labelledby').split(' ')) expect(document.getElementById(id)).toBeTruthy();
    }
    view.rerender(<Workspace step={1} dialog />);
    expect(screen.getByRole('button', { name: /Entrega/ })).toBeTruthy();
    expect(screen.getByLabelText('Formulário da semana')).toBeTruthy();
  });
});
