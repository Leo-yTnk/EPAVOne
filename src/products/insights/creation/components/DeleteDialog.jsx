import { useState } from 'preact/hooks';
import { Alert, Button, Checkbox, Dialog, ErrorState, Spinner } from '../../../../design-system/components/index.js';
import { creationService } from '../services/creationService.js';
import { deletionContext, deleteResolution } from '../services/deletionService.js';
import { DeleteReferences } from './DeleteReferences.jsx';
import { useCreationResource } from '../hooks/useCreationResource.js';
export function DeleteDialog({ type, item, onClose, onSaved }) {
  const resource = useCreationResource(() => deletionContext(type, item), item.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revokeShares, setRevoke] = useState(false);
  const [cancelPendingRequests, setCancel] = useState(false);
  const [choices, setChoices] = useState({});
  const impact = resource.data?.impact || {};
  const groups = resource.data?.groups || {};
  const unresolved = Object.entries(groups).some(([group, rows]) => rows.some((row, i) => !choices[`${group}:${i}`]));
  const blocked = Number(impact.foreign_personal_ref_count || impact.foreign_personal_recipe_count || 0) > 0;
  async function remove() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await creationService.remove(
        type,
        item.id,
        type === 'recipes' ? { revokeShares, cancelPendingRequests } : deleteResolution(type, groups, choices)
      );
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
          <Button loading={busy} disabled={resource.loading || Boolean(resource.error) || blocked || unresolved} onClick={remove}>
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
          {blocked && (
            <Alert tone="warning" title="Este item ainda está em uso">
              Há referências pessoais de outras contas. Desative o item ou peça que os autores removam os vínculos antes de excluir.
            </Alert>
          )}
          {type !== 'recipes' && (
            <DeleteReferences
              type={type}
              item={item}
              data={resource.data}
              choices={choices}
              onChange={setChoices}
              disabled={busy || blocked}
            />
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
