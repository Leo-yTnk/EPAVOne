import { useState } from 'preact/hooks';
import { Alert, Button, Checkbox, Input } from '../../../../design-system/components/index.js';
import { adminService } from '../services/adminService.js';
export function MaintenancePanel() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('');
  const [password, setPassword] = useState('');
  const [text, setText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  async function sync() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await adminService.sync();
      setMessage(`Sincronização concluída: ${data.products_updated ?? data.products_checked ?? 0} produto(s) processado(s).`);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function cleanup(e) {
    e.preventDefault();
    if (busy || !confirmed || text !== 'EXCLUIR') return;
    setBusy(true);
    setError('');
    try {
      await adminService.cleanup(mode, password);
      setMode('');
      setPassword('');
      setMessage('Manutenção concluída. Recarregue o catálogo para consultar os resultados.');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPassword('');
      setBusy(false);
    }
  }
  function choose(value) {
    setMode(value);
    setPassword('');
    setText('');
    setConfirmed(false);
    setError('');
    setMessage('');
  }
  return (
    <section className="creation-fields">
      <h3>Preços Swift</h3>
      <p>Usa o sincronizador já instalado no banco do catálogo. Pode haver falhas parciais; verifique o resultado antes de repetir.</p>
      <Button loading={busy} onClick={sync}>
        Atualizar preços públicos
      </Button>
      <h3>Manutenção permanente</h3>
      <p>Faça um backup do catálogo antes de excluir. Estas ações afetam o catálogo público, incluindo seus vínculos.</p>
      <div className="creation-toolbar">
        <Button variant="secondary" disabled={busy} onClick={() => choose('inactive')}>
          Excluir itens públicos inativos
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => choose('all')}>
          Excluir todas as receitas e produtos públicos
        </Button>
      </div>
      {mode && (
        <form className="creation-fields" onSubmit={cleanup}>
          <Alert tone="danger" title="Confirmar exclusão permanente">
            {mode === 'all' ? 'Todas as receitas e produtos públicos serão excluídos.' : 'Os itens públicos inativos serão excluídos.'} O
            servidor confere sua função e senha novamente.
          </Alert>
          <Input label="Digite EXCLUIR" value={text} onInput={(e) => setText(e.currentTarget.value)} disabled={busy} />
          <Input
            label="Sua senha de administrador"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onInput={(e) => setPassword(e.currentTarget.value)}
            disabled={busy}
          />
          <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.currentTarget.checked)} disabled={busy}>
            Tenho um backup e entendo que a exclusão é permanente.
          </Checkbox>
          <div className="creation-toolbar">
            <Button type="submit" loading={busy} disabled={!confirmed || text !== 'EXCLUIR' || !password}>
              Confirmar exclusão permanente
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => choose('')}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
      {error && (
        <Alert tone="danger" title="Operação não concluída">
          {error}
        </Alert>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
