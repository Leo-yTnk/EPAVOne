import { describe,expect,it,vi } from 'vitest';
import { fireEvent,render,screen } from '@testing-library/preact';
import { Dialog } from '../src/design-system/components/Dialog.jsx';

describe('Dialog',()=>{
  it('uses a portal, locks scroll and handles Escape',()=>{
    const onClose=vi.fn();
    render(<Dialog open title="Confirmar" onClose={onClose}>Conteúdo</Dialog>);

    const dialog=screen.getByRole('dialog');
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(document.body.classList.contains('ds-layer-open')).toBe(true);

    fireEvent.keyDown(document,{key:'Escape'});
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
