import { useEffect, useState } from 'preact/hooks';
import { Alert, Button, Card, Checkbox, Icon, Input, Progress, SectionHeader } from '../../../../design-system/components/index.js';
import { adminService, catalogPriceSync } from '../services/adminService.js';
import { formatSyncRemaining } from '../services/formatSyncRemaining.js';
import { SwiftMetadataReview } from './SwiftMetadataReview.jsx';
export function MaintenancePanel() {
  const [progress, setProgress] = useState(catalogPriceSync.snapshot);
  useEffect(() => catalogPriceSync.subscribe(setProgress), []);
  const syncing = progress.phase === 'running';
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
      await catalogPriceSync.start();
      setRevision((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }

  async function cleanup(e) {
    e.preventDefault();
    if (busy || syncing || !confirmed || text !== 'EXCLUIR') return;
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
        <SectionHeader
          as="h3"
          size="sm"
          title={
            <>
              <Icon name="product" /> Preços Swift
            </>
          }
          description={<>Consulte preços e acompanhe a execução sem iniciar lotes repetidos.</>}
        />
        <p>O último preço confirmado é preservado se a consulta falhar. Confira o resultado antes de repetir.</p>
        <Button loading={syncing} disabled={busy || syncing} onClick={sync}>
          {progress.phase === 'paused' ? 'Retomar atualização' : 'Atualizar preços públicos'}
        </Button>
        {progress.phase !== 'idle' && (
          <div className="creation-fields" aria-live="polite">
            <Progress
              label="Produtos conferidos"
              value={progress.processed}
              max={progress.total || 1}
              formatValue={() =>
                `${progress.processed} de ${progress.total} · ${progress.total ? Math.round((progress.processed / progress.total) * 100) : 0}%`
              }
            />
            {syncing && (
              <p>
                {progress.waiting ? 'Aguardando confirmação do serviço' : 'Consultando'}: {progress.currentName || 'carregando catálogo…'}
              </p>
            )}
            {syncing && <p>{formatSyncRemaining(progress.remainingMs, progress.waiting)}</p>}
            <p>
              {progress.updated} atualizado(s) · {progress.unchanged} mantido(s) · {progress.failed} falha(s)
            </p>
            {progress.phase === 'paused' && (
              <Alert tone="danger" title="Atualização pausada">
                {progress.error} Os itens já conferidos foram preservados.
              </Alert>
            )}
            {progress.phase === 'completed' && (
              <Alert
                tone={progress.failed ? 'warning' : 'success'}
                title={progress.failed ? 'Consulta concluída com falhas' : 'Consulta concluída'}
              >
                Confira o resultado antes de usar os preços no atendimento.
              </Alert>
            )}
            {!!progress.failures.length && (
              <details>
                <summary>Ver produtos com falha ({progress.failures.length})</summary>
                <ul>
                  {progress.failures.map((failure, index) => (
                    <li key={index}>
                      {failure.product_name || failure.product_id}: {failure.code}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
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
        <SectionHeader
          as="h3"
          size="sm"
          title={<>Manutenção permanente</>}
          description={<>Faça um backup antes de excluir. Estas ações afetam o catálogo público e seus vínculos.</>}
        />
        <div className="creation-toolbar">
          <Button variant="secondary" disabled={busy || syncing} onClick={() => choose('inactive')}>
            Excluir itens públicos inativos
          </Button>
          <Button variant="secondary" disabled={busy || syncing} onClick={() => choose('all')}>
            Excluir todas as receitas e produtos públicos
          </Button>
        </div>
        {mode && (
          <form className="creation-fields" onSubmit={cleanup}>
            <Alert tone="danger" title="Confirmar exclusão permanente">
              {mode === 'all' ? 'Todas as receitas e produtos públicos serão excluídos.' : 'Os itens públicos inativos serão excluídos.'} O
              servidor confere sua função e senha novamente.
            </Alert>
            <Input label="Digite EXCLUIR" value={text} onInput={(e) => setText(e.currentTarget.value)} disabled={busy || syncing} />
            <Input
              label="Sua senha de administrador"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onInput={(e) => setPassword(e.currentTarget.value)}
              disabled={busy || syncing}
            />
            <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.currentTarget.checked)} disabled={busy || syncing}>
              Tenho um backup e entendo que a exclusão é permanente.
            </Checkbox>
            <div className="creation-toolbar">
              <Button type="submit" variant="danger" loading={busy} disabled={!confirmed || text !== 'EXCLUIR' || !password}>
                Confirmar exclusão permanente
              </Button>
              <Button variant="ghost" disabled={busy || syncing} onClick={() => choose('')}>
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
