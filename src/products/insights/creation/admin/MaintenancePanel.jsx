import { useState } from 'preact/hooks';
import { Alert, Button, Card, Checkbox, Icon, Input } from '../../../../design-system/components/index.js';
import { adminService } from '../services/adminService.js';
import { SwiftMetadataReview } from './SwiftMetadataReview.jsx';
export function MaintenancePanel() {
  const [syncPending, setSyncPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedbackScope, setFeedbackScope] = useState('sync');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [mode, setMode] = useState('');
  const [password, setPassword] = useState('');
  const [text, setText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  async function sync() {
    if (busy) return;
    setBusy(true);
    setFeedbackScope('sync');
    setError('');
    setMessage('');
    try {
      const data = await adminService.sync();
      setSyncPending(data.pending ? data : null);
      if (data.pending) return;
      setMessage(
        `Consulta concluída: ${data.products_updated || 0} atualizado(s), ${data.products_unchanged || 0} mantido(s), ${data.products_failed || 0} falha(s).`
      );
      setRevision((value) => value + 1);
    } catch (failure) {
      setSyncPending(null);
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function cleanup(e) {
    e.preventDefault();
    if (busy || !confirmed || text !== 'EXCLUIR') return;
    setBusy(true);
    setFeedbackScope('cleanup');
    setMessage('');
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
      <Card as="section" className="creation-fields creation-operation">
        <div className="creation-section-heading">
          <h3 className="creation-section-title">
            <Icon name="product" /> Preços Swift
          </h3>
          <p>Consulte preços e acompanhe a execução sem iniciar lotes repetidos.</p>
        </div>
        <p>O último preço confirmado é preservado se a consulta falhar. Confira o resultado antes de repetir.</p>
        <Button loading={busy} onClick={sync}>
          {syncPending ? 'Verificar andamento' : 'Atualizar preços públicos'}
        </Button>
        {syncPending && (
          <Alert title="Sincronização em andamento">
            Execução {syncPending.run_id}. O serviço continua processando. Verifique o andamento para consultar o resultado.
          </Alert>
        )}
        {feedbackScope === 'sync' && error && (
          <Alert tone="danger" title="Operação não concluída">
            {error}
          </Alert>
        )}
        {feedbackScope === 'sync' && message && <p role="status">{message}</p>}
      </Card>
      <SwiftMetadataReview key={revision} />
      <Card as="section" className="creation-fields creation-operation">
        <div className="creation-section-heading">
          <h3 className="creation-section-title">Manutenção permanente</h3>
          <p>Faça um backup antes de excluir. Estas ações afetam o catálogo público e seus vínculos.</p>
        </div>
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
              <Button type="submit" variant="danger" loading={busy} disabled={!confirmed || text !== 'EXCLUIR' || !password}>
                Confirmar exclusão permanente
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => choose('')}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
        {feedbackScope === 'cleanup' && error && (
          <Alert tone="danger" title="Manutenção não concluída">
            {error}
          </Alert>
        )}
        {feedbackScope === 'cleanup' && message && <p role="status">{message}</p>}
      </Card>
    </section>
  );
}
