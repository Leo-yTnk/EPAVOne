import { useEffect, useState } from 'preact/hooks';
import { accountService } from '../../shared/services/accountService.js';

export function useAccount() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const subscription = accountService.subscribe((next) => {
      setProfile(null);
      setError('');
      setSession(next);
      setInitializing(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    // Runs outside the Auth callback to avoid SDK lock reentrancy.
    accountService
      .profile(userId, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setProfile(value);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason.message);
      });
    return () => controller.abort();
  }, [session, revision]);
  return {
    session,
    profile,
    initializing,
    error,
    retryProfile: () => {
      setError('');
      setRevision((value) => value + 1);
    }
  };
}
