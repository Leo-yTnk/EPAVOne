import { useState } from 'preact/hooks';
import { Alert, Button, Dialog, ErrorState, Spinner, Textarea } from '../../../../design-system/components/index.js';
import { creationService } from '../services/creationService.js';
import { collaborationService } from '../services/collaborationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
export function SubmitDialog({ type, item, onClose }) {
  const resource = useCreationResource(
    () => (type === 'recipes' ? collaborationService.dependencies(item.id) : Promise.resolve({ blocked: false })),
    item.id
  );
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await creationService.submit(type, item.id, reason);
      setSuccess(true);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      title={`Solicitar publicação: ${item.name}`}
      onClose={() => !busy && onClose()}
      actions={
        <Button loading={busy} disabled={success || resource.loading || Boolean(resource.error) || resource.data?.blocked} onClick={submit}>
          Enviar solicitação
        </Button>
      }
    >
      <div className="creation-fields">
        {resource.loading ? (
          <Spinner />
        ) : resource.error ? (
          <ErrorState description={resource.error} onAction={resource.reload} />
        ) : success ? (
          <Alert tone="success" title="Solicitação enviada">
            Acompanhe a revisão em Minhas solicitações.
          </Alert>
        ) : (
          <>
            <p>O conteúdo será enviado para revisão antes de aparecer no catálogo público.</p>
            {resource.data.blocked && (
              <Alert tone="warning" title="Publique as dependências primeiro">
                <p>Solicite a publicação destes itens e, depois da aprovação, vincule os itens públicos à receita:</p>
                <ul>
                  {[...resource.data.product_refs, ...resource.data.category_refs].map((ref, i) => (
                    <li key={i}>{ref.name}</li>
                  ))}
                </ul>
              </Alert>
            )}
            <Textarea
              label="Mensagem para o administrador"
              rows={3}
              value={reason}
              onInput={(e) => setReason(e.currentTarget.value)}
              disabled={busy}
            />
          </>
        )}
        {error && (
          <Alert tone="danger" title="Solicitação não enviada">
            {error}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
