import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
describe('account dialog', () => {
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
