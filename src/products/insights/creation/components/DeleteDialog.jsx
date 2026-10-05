import { useState } from 'preact/hooks';
import { Alert, Button, Checkbox, Dialog, ErrorState, Spinner } from '../../../../design-system/components/index.js';
import { creationService } from '../services/creationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
export function DeleteDialog({ type, item, onClose, onSaved }) {
  const resource = useCreationResource(() => creationService.impact(type, item.id), item.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revokeShares, setRevoke] = useState(false);
  const [cancelPendingRequests, setCancel] = useState(false);
  const impact = resource.data || {};
  const references =
    Number(impact.total_ingredient_rows || 0) +
    Number(impact.required_ref_count || 0) +
    Number(impact.optional_ref_count || 0) +
    Number(impact.foreign_personal_ref_count || 0);
  async function remove() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await creationService.remove(type, item.id, type === 'recipes' ? { revokeShares, cancelPendingRequests } : {});
      onSaved();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      title={`Excluir ${item.name}`}
      onClose={() => !busy && onClose()}
      actions={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={busy} disabled={resource.loading || Boolean(resource.error) || references > 0} onClick={remove}>
            Confirmar exclusão
          </Button>
        </>
      }
    >
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : (
        <div className="creation-fields">
          <p>A exclusão é permanente. O servidor confere novamente as referências antes de concluir.</p>
          {references > 0 && (
            <Alert tone="warning" title="Este item ainda está em uso">
              Edite os produtos ou receitas que usam este item para substituir ou remover a referência antes de excluir. Você também pode
              desativar o item.
            </Alert>
          )}
          {type === 'recipes' && (
            <>
              <Checkbox checked={revokeShares} onChange={(e) => setRevoke(e.currentTarget.checked)}>
                Revogar os compartilhamentos desta receita
              </Checkbox>
              <Checkbox checked={cancelPendingRequests} onChange={(e) => setCancel(e.currentTarget.checked)}>
                Cancelar solicitações pendentes desta receita
              </Checkbox>
            </>
          )}
          {Object.entries(impact).filter(([key, value]) => key.endsWith('_count') && typeof value === 'number' && value > 0).length > 0 && (
            <p>Há vínculos associados a este item. A exclusão poderá exigir resolução das dependências.</p>
          )}
          {error && (
            <Alert tone="danger" title="Exclusão não concluída">
              {error}
            </Alert>
          )}
        </div>
      )}
    </Dialog>
  );
}
