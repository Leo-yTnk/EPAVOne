import { useRef, useState } from 'preact/hooks';
import { Alert, Button, Dialog, Input } from '../../design-system/components/index.js';
import { accountService } from '../../shared/services/accountService.js';
import { YOURCIPE_URL } from '../../shared/config/catalog.js';
import { Turnstile } from './Turnstile.jsx';
import './account.css';

export function AccountDialog({ account, onClose }) {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  async function run(action) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      setPassword('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      pending.current = false;
      setBusy(false);
      setToken('');
      setAttempt((value) => value + 1);
    }
  }
  function submit(event) {
    event.preventDefault();
    if (!token) return;
    run(() => accountService.signIn(credential, password, token));
  }
  return (
    <Dialog open title={account.session ? 'Sua conta' : 'Entrar no EPAVOne'} onClose={onClose}>
      <div className="account-content">
        {error && (
          <Alert tone="danger" title="Não foi possível concluir">
            {error}
          </Alert>
        )}
        {account.initializing ? (
          <p role="status">Verificando sua sessão…</p>
        ) : account.session ? (
          <>
            <p>{account.profile?.displayName || 'Você está conectado.'}</p>
            {account.profile && <p>{account.profile.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>}
            {account.error && (
              <>
                <Alert tone="danger" title="Perfil indisponível">
                  {account.error}
                </Alert>
                <Button variant="secondary" onClick={account.retryProfile}>
                  Tentar carregar perfil
                </Button>
              </>
            )}
            {!account.profile && !account.error && <p role="status">Carregando perfil…</p>}
            <Button loading={busy} onClick={() => run(() => accountService.signOut())}>
              Sair desta sessão
            </Button>
            <Button as="a" variant="ghost" href={YOURCIPE_URL}>
              Abrir recursos do Yourcipe ↗
            </Button>
          </>
        ) : (
          <form className="account-content" onSubmit={submit}>
            <p>Use a mesma credencial e senha do Yourcipe.</p>
            <Input
              id="account-credential"
              label="Credencial"
              placeholder="YCP-XXXX-XXXX"
              autoComplete="username"
              required
              value={credential}
              disabled={busy}
              onInput={(event) => setCredential(event.currentTarget.value)}
            />
            <Input
              id="account-password"
              label="Senha"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={busy}
              onInput={(event) => setPassword(event.currentTarget.value)}
            />
            <Turnstile attempt={attempt} onToken={setToken} />
            <Button type="submit" loading={busy} disabled={!token}>
              Entrar
            </Button>
            <Button as="a" variant="ghost" href={YOURCIPE_URL}>
              Ainda não tem credencial? Cadastre-se no Yourcipe ↗
            </Button>
          </form>
        )}
      </div>
    </Dialog>
  );
}
