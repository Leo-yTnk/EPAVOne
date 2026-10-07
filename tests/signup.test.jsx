import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { AccountDialog } from '../src/app/account/AccountDialog.jsx';
import { createAccountService, accountService } from '../src/shared/services/accountService.js';
vi.mock('../src/app/account/Turnstile.jsx', () => ({
  Turnstile: ({ onToken }) => (
    <button type="button" onClick={() => onToken('fresh')}>
      CAPTCHA
    </button>
  )
}));
describe('EPAVOne signup', () => {
  it('validates name and matching passwords before making requests', async () => {
    const signUp = vi.fn();
    const service = createAccountService({ auth: { signUp } });
    await expect(service.signUp('A', 'secret', 'secret', 'fresh')).rejects.toThrow('nome');
    await expect(service.signUp('Leonardo', 'secret', 'other', 'fresh')).rejects.toThrow('iguais');
    expect(signUp).not.toHaveBeenCalled();
  });
  it('normalizes metadata, keeps technical domain, and never retries single-use CAPTCHA', async () => {
    const signUp = vi.fn().mockResolvedValue({ data: { user: { id: 'a', identities: [{}] }, session: { user: { id: 'a' } } } });
    const service = createAccountService({ auth: { signUp } });
    const result = await service.signUp('  Leo   Tanaka ', 'secret', 'secret', 'fresh');
    expect(result.credential).toMatch(/^YCP-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(signUp.mock.calls[0][0]).toMatchObject({
      options: { captchaToken: 'fresh', data: { display_name: 'Leo Tanaka', credential: result.credential } }
    });
    expect(signUp.mock.calls[0][0].email).toContain('@credential.yourcipe.local');
    signUp.mockResolvedValue({ data: { user: { identities: [] } } });
    await expect(service.signUp('Leonardo', 'secret', 'secret', 'fresh')).rejects.toThrow('já existe');
    expect(signUp).toHaveBeenCalledTimes(2);
  });
  it('displays credential even when Auth switches into a signed-in session', async () => {
    vi.spyOn(accountService, 'signUp').mockResolvedValue({ credential: 'YCP-7K9M-W2Q8', session: { user: { id: 'a' } } });
    const { rerender } = render(<AccountDialog account={{}} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Criar uma conta'));
    fireEvent.input(screen.getByLabelText('Nome'), { target: { value: 'Leonardo' } });
    fireEvent.input(screen.getByLabelText('Senha'), { target: { value: 'secret' } });
    fireEvent.input(screen.getByLabelText('Confirmar senha'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('CAPTCHA'));
    fireEvent.click(screen.getByText('Criar conta'));
    await waitFor(() => expect(screen.getByText('YCP-7K9M-W2Q8')).toBeTruthy());
    rerender(<AccountDialog account={{ session: { user: { id: 'a' } } }} onClose={() => {}} />);
    expect(screen.getByText('YCP-7K9M-W2Q8')).toBeTruthy();
    vi.restoreAllMocks();
  });
});
