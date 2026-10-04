import { act, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAccount } from '../src/app/account/useAccount.js';
import { accountService } from '../src/shared/services/accountService.js';
vi.mock('../src/shared/services/accountService.js', () => ({ accountService: { subscribe: vi.fn(), profile: vi.fn() } }));
let notify;
let unsubscribe;
function Probe() {
  const account = useAccount();
  return <p>{account.initializing ? 'loading' : account.session ? account.profile?.displayName || 'profile pending' : 'signed out'}</p>;
}
beforeEach(() => {
  vi.clearAllMocks();
  unsubscribe = vi.fn();
  accountService.subscribe.mockImplementation((callback) => {
    notify = callback;
    return { unsubscribe };
  });
});
describe('session lifecycle', () => {
  it('restores session, refreshes profile and unsubscribes on unmount', async () => {
    accountService.profile.mockResolvedValue({ displayName: 'Leonardo' });
    const view = render(<Probe />);
    expect(screen.getByText('loading')).toBeTruthy();
    act(() => notify({ user: { id: 'a' } }));
    await waitFor(() => expect(screen.getByText('Leonardo')).toBeTruthy());
    act(() => notify({ user: { id: 'a' } }));
    await waitFor(() => expect(accountService.profile).toHaveBeenCalledTimes(2));
    act(() => notify(null));
    await waitFor(() => expect(screen.getByText('signed out')).toBeTruthy());
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
  it('ignores a late profile response after logout', async () => {
    let resolve;
    accountService.profile.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    render(<Probe />);
    act(() => notify({ user: { id: 'a' } }));
    await waitFor(() => expect(resolve).toBeTruthy());
    act(() => notify(null));
    await act(async () => resolve({ displayName: 'Old user' }));
    expect(screen.getByText('signed out')).toBeTruthy();
    expect(screen.queryByText('Old user')).toBeNull();
  });
});
