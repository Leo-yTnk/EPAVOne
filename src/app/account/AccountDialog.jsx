import { useRef, useState } from 'preact/hooks';
import { Alert, Button, Dialog, Input } from '../../design-system/components/index.js';
import { accountService } from '../../shared/services/accountService.js';
import { Turnstile } from './Turnstile.jsx';
import './account.css';

export function AccountDialog({ account, onClose }) {
  const [signup, setSignup] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [result, setResult] = useState(null);
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
    run(async () => {
      if (signup) setResult(await accountService.signUp(displayName, password, confirmation, token));
      else await accountService.signIn(credential, password, token);
    });
  }
  return (
    <Dialog
      open
      title={result ? 'Sua credencial' : account.session ? 'Sua conta' : signup ? 'Criar conta no EPAVOne' : 'Entrar no EPAVOne'}
      onClose={onClose}
    >
      <div className="account-content">
        {error && (
          <Alert tone="danger" title="Não foi possível concluir">
            {error}
          </Alert>
        )}
        {result ? (
          <>
            <Alert tone="success" title="Conta criada">
              <p>Guarde sua credencial e senha para acessar sua conta.</p>
              <strong>{result.credential}</strong>
            </Alert>
            {!result.session && (
              <Alert tone="warning" title="Ativação pendente">
                O serviço não iniciou uma sessão. O administrador precisa revisar a confirmação de email técnico no Supabase; não há caixa
                de email para esta credencial.
              </Alert>
            )}
            <Button onClick={onClose}>Guardei minha credencial</Button>
          </>
        ) : account.initializing ? (
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
          </>
        ) : (
          <form className="account-content" onSubmit={submit}>
            <p>{signup ? 'Crie sua conta para organizar a biblioteca e o planejamento.' : 'Use sua credencial YCP e senha.'}</p>
            {signup && (
              <Input
                label="Nome"
                value={displayName}
                required
                maxLength={80}
                disabled={busy}
                autoComplete="name"
                onInput={(event) => setDisplayName(event.currentTarget.value)}
              />
            )}
            {!signup && (
              <>
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
              </>
            )}
            <Input
              id="account-password"
              label="Senha"
              type="password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              required
              value={password}
              disabled={busy}
              onInput={(event) => setPassword(event.currentTarget.value)}
            />
            {signup && (
              <Input
                label="Confirmar senha"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                required
                disabled={busy}
                onInput={(event) => setConfirmation(event.currentTarget.value)}
              />
            )}
            <Turnstile attempt={attempt} onToken={setToken} />
            <Button type="submit" loading={busy} disabled={!token}>
              {signup ? 'Criar conta' : 'Entrar'}
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setSignup(!signup);
                setPassword('');
                setConfirmation('');
                setToken('');
                setError('');
                setAttempt((value) => value + 1);
              }}
            >
              {signup ? 'Já tenho credencial' : 'Criar uma conta'}
            </Button>
          </form>
        )}
      </div>
    </Dialog>
  );
}
