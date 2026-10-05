import { useState } from 'preact/hooks';
import { Alert, Button, Dialog, ErrorState, Icon, Spinner } from '../../../../design-system/components/index.js';
import { collaborationService } from '../services/collaborationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
export function ShareDialog({ recipe, onClose }) {
  const resource = useCreationResource(() => collaborationService.sharing(recipe.id), recipe.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  async function run(action) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await collaborationService.shareAction(recipe.id, action);
      setConfirm('');
      resource.reload();
      setMessage('Compartilhamento atualizado.');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(resource.data.share.share_code);
      setMessage('Código copiado.');
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione e copie o código abaixo.');
    }
  }
  return (
    <Dialog open title={`Compartilhar ${recipe.name}`} onClose={() => !busy && onClose()}>
      <div className="creation-fields">
        {resource.loading ? (
          <Spinner />
        ) : resource.error ? (
          <ErrorState description={resource.error} onAction={resource.reload} />
        ) : (
          <>
            <p>O código permite consultar a receita. Quem receber pode criar uma cópia própria.</p>
            {resource.data.share?.active ? (
              <>
                <code className="creation-code">{resource.data.share.share_code}</code>
                <Button variant="secondary" onClick={copy}>
                  <Icon name="copy" /> Copiar código
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => setConfirm('regenerate')}>
                  Gerar outro código
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => setConfirm('deactivate')}>
                  Desativar código
                </Button>
              </>
            ) : (
              <Button loading={busy} onClick={() => run('activate')}>
                <Icon name="share" /> Ativar compartilhamento
              </Button>
            )}
            <p>{resource.data.count} acesso(s) ativo(s). Desativar ou trocar o código não revoga acessos já concedidos.</p>
            {resource.data.count > 0 && (
              <Button variant="secondary" disabled={busy} onClick={() => setConfirm('revoke')}>
                Revogar todos os acessos
              </Button>
            )}
          </>
        )}
        {confirm && (
          <Alert tone="warning" title="Confirmar alteração">
            <p>
              {confirm === 'revoke'
                ? 'Quem já recebeu acesso deixará de consultar esta receita. Cópias próprias continuam disponíveis.'
                : 'O código atual deixará de permitir novos acessos.'}
            </p>
            <Button loading={busy} onClick={() => run(confirm)}>
              Confirmar
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setConfirm('')}>
              Cancelar
            </Button>
          </Alert>
        )}
        {message && <p role="status">{message}</p>}
        {error && (
          <Alert tone="danger" title="Não foi possível concluir">
            {error}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
