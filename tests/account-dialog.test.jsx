import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountDialog } from '../src/app/account/AccountDialog.jsx';
import { accountService } from '../src/shared/services/accountService.js';
vi.mock('../src/shared/services/accountService.js', () => ({ accountService: { signIn: vi.fn(), signOut: vi.fn() } }));
vi.mock('../src/app/account/Turnstile.jsx', () => ({
  Turnstile: ({ onToken }) => (
    <button type="button" onClick={() => onToken('token')}>
      Verify test captcha
    </button>
  )
}));
beforeEach(() => vi.clearAllMocks());
beforeEach(() => {
  document.documentElement.dataset.performanceMode = 'fabulous';
});
afterEach(() => {
  delete document.documentElement.dataset.performanceMode;
  delete Element.prototype.animate;
});
describe('account dialog', () => {
  it('switches forms immediately, preserves entered identity and animates back in the reverse direction', () => {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel }));
    Element.prototype.animate = animate;
    render(<AccountDialog account={{ initializing: false }} onClose={() => {}} />);
    fireEvent.input(screen.getByLabelText('Credencial'), { target: { value: 'YCP-TEST-TEST' } });
    expect(screen.getByRole('button', { name: 'Criar uma conta' }).type).toBe('button');
    fireEvent.click(screen.getByRole('button', { name: 'Criar uma conta' }));
    expect(screen.getByLabelText('Confirmar senha')).toBeTruthy();
    expect(animate.mock.calls.at(-1)[0][0].transform).toBe('translateX(6px)');
    expect(screen.getByRole('button', { name: 'Já tenho credencial' }).type).toBe('button');
    fireEvent.click(screen.getByRole('button', { name: 'Já tenho credencial' }));
    expect(screen.queryByLabelText('Confirmar senha')).toBeNull();
    expect(screen.getByLabelText('Credencial').value).toBe('YCP-TEST-TEST');
    expect(cancel).toHaveBeenCalled();
    expect(animate.mock.calls.at(-1)[0][0].transform).toBe('translateX(-6px)');
  });
  it('gates submission, handles failure and requires a fresh captcha after each attempt', async () => {
    accountService.signIn.mockRejectedValue(new Error('Confira sua credencial e senha.'));
    render(<AccountDialog account={{ initializing: false }} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Entrar' }).disabled).toBe(true);
    fireEvent.input(screen.getByLabelText('Credencial'), { target: { value: '7K9MW2Q8' } });
    fireEvent.input(screen.getByLabelText('Senha'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Verify test captcha'));
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Confira'));
    expect(accountService.signIn).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Entrar' }).disabled).toBe(true);
  });
  it('shows the server profile and allows signout', async () => {
    accountService.signOut.mockResolvedValue();
    render(
      <AccountDialog account={{ session: { user: { id: 'a' } }, profile: { displayName: 'Leonardo', role: 'admin' } }} onClose={() => {}} />
    );
    expect(screen.getByText('Leonardo')).toBeTruthy();
    expect(screen.getByText('Administrador')).toBeTruthy();
    fireEvent.click(screen.getByText('Sair desta sessão'));
    await waitFor(() => expect(accountService.signOut).toHaveBeenCalledTimes(1));
  });
});
