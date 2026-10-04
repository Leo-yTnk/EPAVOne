import { describe, expect, it, vi } from 'vitest';
import { credentialEmail, createAccountService } from '../src/shared/services/accountService.js';

describe('existing Yourcipe accounts', () => {
  it('preserves technical email and accepts credential formatting', () => {
    for (const value of ['YCP-7K9M-W2Q8', '7k9m w2q8', 'ycp7k9mw2q8'])
      expect(credentialEmail(value)).toBe('ycp-7k9m-w2q8@credential.yourcipe.local');
    expect(credentialEmail('YCP-0000-1111')).toBeNull();
  });
  it('requires valid credential and captcha without making a request', async () => {
    const signInWithPassword = vi.fn();
    const service = createAccountService({ auth: { signInWithPassword } });
    await expect(service.signIn('bad', 'secret', 'token')).rejects.toThrow('credencial');
    await expect(service.signIn('7K9MW2Q8', 'secret', '')).rejects.toThrow('verificação');
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
  it('passes password and single-use captcha to the SDK', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'a' } } } });
    const service = createAccountService({ auth: { signInWithPassword } });
    expect(await service.signIn('7K9MW2Q8', 'secret', 'token')).toEqual({ user: { id: 'a' } });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'ycp-7k9m-w2q8@credential.yourcipe.local',
      password: 'secret',
      options: { captchaToken: 'token' }
    });
  });
  it('uses safe messages and reports logout failures', async () => {
    const service = createAccountService({
      auth: {
        signInWithPassword: async () => ({ error: { message: 'internal sensitive message' } }),
        signOut: vi.fn().mockResolvedValue({ error: {} })
      }
    });
    await expect(service.signIn('7K9MW2Q8', 'secret', 'token')).rejects.toThrow('Confira');
    await expect(service.signOut()).rejects.toThrow('sair');
  });
});
